import { useState, useEffect, useMemo } from 'react';
import { Users, FolderPlus, UserPlus, Trash2, Edit2, X, Check, Building2, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Search, CheckCircle } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser, getProjects, createProject, assignProjectToUser, removeProjectFromUser, getCurrentUser, getApiBase } from '../utils/api';

function AdminPanel({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showAssignProject, setShowAssignProject] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const currentUser = getCurrentUser();

  // DataTable state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', email: '', role: 'user' });
  const [newProject, setNewProject] = useState({ name: '', budget: '2500000', assignToUser: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersList, projectsList] = await Promise.all([
        getUsers(),
        getProjects()
      ]);
      setUsers(usersList);
      setProjects(projectsList);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    let filtered = users;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = users.filter(u => 
        u.name?.toLowerCase().includes(search) ||
        u.username?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search)
      );
    }
    return filtered;
  }, [users, searchTerm]);

  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers];
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredUsers, sortConfig]);

  const totalPages = Math.ceil(sortedUsers.length / pageSize);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [sortedUsers, currentPage, pageSize]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="text-gray-400" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />;
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.name) {
      alert('Please fill all required fields');
      return;
    }
    try {
      await createUser(newUser);
      setNewUser({ username: '', password: '', name: '', email: '', role: 'user' });
      setShowAddUser(false);
      loadData();
    } catch (error) {
      alert('Error creating user: ' + error.message);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      await updateUser(editingUser.id, editingUser);
      setEditingUser(null);
      loadData();
    } catch (error) {
      alert('Error updating user: ' + error.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (id === currentUser?.id) {
      alert('Cannot delete yourself');
      return;
    }
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(id);
      loadData();
    } catch (error) {
      alert('Error deleting user: ' + error.message);
    }
  };

  const handleAddProject = async () => {
    if (!newProject.name) {
      alert('Please enter project name');
      return;
    }
    try {
      await createProject(newProject.name, parseFloat(newProject.budget) || 2500000, newProject.assignToUser || null);
      setNewProject({ name: '', budget: '2500000', assignToUser: '' });
      setShowAddProject(false);
      loadData();
    } catch (error) {
      alert('Error creating project: ' + error.message);
    }
  };

  const loadUserProjects = async (userId) => {
    try {
      const token = localStorage.getItem('rojmel_token');
      const res = await fetch(`${getApiBase()}/users/${userId}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUserProjects(data || []);
    } catch (error) {
      console.error('Error loading user projects:', error);
      setUserProjects([]);
    }
  };

  const openAssignModal = async (user) => {
    setShowAssignProject(user);
    await loadUserProjects(user.id);
  };

  const handleAssignProject = async (userId, projectId) => {
    try {
      await assignProjectToUser(userId, projectId, 'editor');
      await loadUserProjects(userId);
      alert('Project assigned successfully!');
    } catch (error) {
      alert('Error assigning project: ' + error.message);
    }
  };

  const handleUnassignProject = async (userId, projectId) => {
    try {
      await removeProjectFromUser(userId, projectId);
      await loadUserProjects(userId);
      alert('Project removed successfully!');
    } catch (error) {
      alert('Error removing project: ' + error.message);
    }
  };

  const handleRemoveProject = async (userId, projectId) => {
    if (!confirm('Remove this project from user?')) return;
    try {
      await removeProjectFromUser(userId, projectId);
      loadData();
    } catch (error) {
      alert('Error removing project: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <Users size={18} className="inline mr-2" />Users
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'projects' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <Building2 size={18} className="inline mr-2" />Projects
          </button>
        </div>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowAddUser(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <UserPlus size={18} />Add User
            </button>
          </div>

          {/* DataTable Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-lg p-3 shadow">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-600">entries</span>
            </div>
            <div className="text-sm text-gray-600">
              Showing {sortedUsers.length === 0 ? 0 : ((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedUsers.length)} of {sortedUsers.length} users
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th onClick={() => handleSort('name')} className="px-4 py-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-200">
                      <div className="flex items-center gap-1">Name <SortIcon columnKey="name" /></div>
                    </th>
                    <th onClick={() => handleSort('username')} className="px-4 py-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-200">
                      <div className="flex items-center gap-1">Username <SortIcon columnKey="username" /></div>
                    </th>
                    <th onClick={() => handleSort('role')} className="px-4 py-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-200">
                      <div className="flex items-center gap-1">Role <SortIcon columnKey="role" /></div>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email || '-'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{user.username}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openAssignModal(user)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Assign Projects"
                          >
                            <FolderPlus size={16} />
                          </button>
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          {user.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-lg p-3 shadow">
              <div className="text-sm text-gray-600">Page {currentPage} of {totalPages}</div>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-50">First</button>
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1 border rounded hover:bg-gray-50 disabled:opacity-50"><ChevronLeft size={18} /></button>
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-1 border rounded hover:bg-gray-50 disabled:opacity-50"><ChevronRight size={18} /></button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-50">Last</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddProject(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FolderPlus size={18} />New Project
            </button>
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Project Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Budget</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {projects.map(proj => (
                  <tr key={proj.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{proj.name}</td>
                    <td className="px-4 py-3 text-gray-600">₹{(proj.budget / 100000).toFixed(1)}L</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(proj.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Add New User</h3>
              <button onClick={() => setShowAddUser(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Enter name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input type="text" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Enter username" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Enter password" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Enter email" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="user">User</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              <button onClick={handleAddUser} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create User</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Edit User</h3>
              <button onClick={() => setEditingUser(null)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={editingUser.email || ''} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="user">User</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={editingUser.is_active} onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })} />
                <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
              </div>
              <button onClick={handleUpdateUser} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Create New Project</h3>
              <button onClick={() => setShowAddProject(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                <input type="text" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Enter project name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget (₹)</label>
                <input type="number" value={newProject.budget} onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to User</label>
                <select value={newProject.assignToUser} onChange={(e) => setNewProject({ ...newProject, assignToUser: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">-- Select User --</option>
                  {users.filter(u => u.role !== 'superadmin').map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.username})</option>
                  ))}
                </select>
              </div>
              <button onClick={handleAddProject} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Project</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Project Modal */}
      {showAssignProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Manage Projects for {showAssignProject.name}</h3>
              <button onClick={() => setShowAssignProject(null)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {projects.map(proj => {
                const isAssigned = userProjects.some(up => up.id === proj.id);
                return (
                  <div key={proj.id} className={`flex items-center justify-between p-3 border rounded-lg ${isAssigned ? 'bg-green-50 border-green-200' : ''}`}>
                    <div className="flex items-center gap-2">
                      {isAssigned && <CheckCircle size={16} className="text-green-600" />}
                      <span className="font-medium">{proj.name}</span>
                    </div>
                    {isAssigned ? (
                      <button
                        onClick={() => handleUnassignProject(showAssignProject.id, proj.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAssignProject(showAssignProject.id, proj.id)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                      >
                        Assign
                      </button>
                    )}
                  </div>
                );
              })}
              {projects.length === 0 && (
                <p className="text-center text-gray-500 py-4">No projects available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
