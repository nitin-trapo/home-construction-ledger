// IndexedDB for storing images (localStorage has 5MB limit)
const DB_NAME = 'rojmel_images';
const DB_VERSION = 1;
const STORE_NAME = 'attachments';

let db = null;

// Initialize IndexedDB
export function initImageDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

// Save image attachment
export async function saveImage(transactionId, imageData) {
  await initImageDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const attachment = {
      id: transactionId,
      image: imageData,
      createdAt: new Date().toISOString()
    };
    
    const request = store.put(attachment);
    request.onsuccess = () => resolve(attachment);
    request.onerror = () => reject(request.error);
  });
}

// Get image attachment
export async function getImage(transactionId) {
  await initImageDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.get(transactionId);
    request.onsuccess = () => resolve(request.result?.image || null);
    request.onerror = () => reject(request.error);
  });
}

// Delete image attachment
export async function deleteImage(transactionId) {
  await initImageDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.delete(transactionId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Convert file to base64
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Compress image before storing
export async function compressImage(file, maxWidth = 1200, quality = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
