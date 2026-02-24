import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { User, Users, Shield, Calendar, Activity, Search, Edit2, X, Check, Save, Lock, Trash2, UserPlus } from 'lucide-react';
import { ASSEMBLIES } from '@/data/assemblies';
import { DASHBOARD_PAGES } from '@/data/navigation';
import { ADMIN_SECTIONS } from '@/data/admin-navigation';
import { useAuth } from '@/context/AuthContext';

interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role: 'super_admin' | 'admin' | 'client';
    lastLogin?: string;
    loginCount?: number;
    accessibleAssemblies?: string[]; // Array of Assembly IDs
    accessiblePages?: string[]; // Array of Page IDs (Client)
    accessibleAdminSections?: string[]; // Array of Admin Section IDs (Admin)
    createdAt?: string;
}

export default function UserManagement() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [saving, setSaving] = useState(false);
    const [showAddUser, setShowAddUser] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    // Fetch Users
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef);
            const snapshot = await getDocs(q);

            const fetchedUsers: UserProfile[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                // Ensure role has a default value
                fetchedUsers.push({
                    uid: doc.id,
                    role: 'client', // default
                    ...data
                } as UserProfile);
            });

            // Client-side sort by lastLogin desc
            fetchedUsers.sort((a, b) => {
                const dateA = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
                const dateB = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
                return dateB - dateA;
            });

            setUsers(fetchedUsers);
        } catch (error: any) {
            console.error("Error fetching users:", error);
            setError(error.message || "Failed to load users");
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!editingUser) return;
        setSaving(true);
        try {
            const userRef = doc(db, 'users', editingUser.uid);
            await updateDoc(userRef, {
                role: editingUser.role,
                accessibleAssemblies: editingUser.accessibleAssemblies || [],
                accessiblePages: editingUser.accessiblePages || [],
                accessibleAdminSections: editingUser.accessibleAdminSections || []
            });

            // Update local state
            setUsers(users.map(u => u.uid === editingUser.uid ? editingUser : u));
            setEditingUser(null);
            alert("User updated successfully!");
        } catch (error) {
            console.error("Error updating user:", error);
            alert("Failed to update user.");
        }
        setSaving(false);
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        setDeletingUserId(userId);
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                deleted: true,
                deletedAt: new Date().toISOString(),
                deletedBy: currentUser?.uid
            });

            // Remove from local state
            setUsers(users.filter(u => u.uid !== userId));
            alert("User deleted successfully!");
        } catch (error: any) {
            console.error("Error deleting user:", error);
            alert(`Failed to delete user: ${error.message}`);
        }
        setDeletingUserId(null);
    };

    const toggleAssemblyAccess = (assemblyId: string) => {
        if (!editingUser) return;

        const currentAccess = editingUser.accessibleAssemblies || [];
        let newAccess;

        if (currentAccess.includes(assemblyId)) {
            newAccess = currentAccess.filter(id => id !== assemblyId);
        } else {
            newAccess = [...currentAccess, assemblyId];
        }

        setEditingUser({ ...editingUser, accessibleAssemblies: newAccess });
    };

    const toggleAllAssemblies = () => {
        if (!editingUser) return;

        const allIds = ASSEMBLIES.map(a => a.id);
        const currentAccess = editingUser.accessibleAssemblies || [];

        if (currentAccess.length === allIds.length) {
            // Deselect all
            setEditingUser({ ...editingUser, accessibleAssemblies: [] });
        } else {
            // Select all
            setEditingUser({ ...editingUser, accessibleAssemblies: allIds });
        }
    };

    const togglePageAccess = (pageId: string) => {
        if (!editingUser) return;

        const currentAccess = editingUser.accessiblePages || [];
        let newAccess;

        if (currentAccess.includes(pageId)) {
            newAccess = currentAccess.filter(id => id !== pageId);
        } else {
            newAccess = [...currentAccess, pageId];
        }

        setEditingUser({ ...editingUser, accessiblePages: newAccess });
    };

    const toggleAllPages = () => {
        if (!editingUser) return;

        const allIds = DASHBOARD_PAGES.map(p => p.id);
        const currentAccess = editingUser.accessiblePages || [];

        if (currentAccess.length === allIds.length) {
            setEditingUser({ ...editingUser, accessiblePages: [] });
        } else {
            setEditingUser({ ...editingUser, accessiblePages: allIds });
        }
    };

    const toggleAdminSectionAccess = (sectionId: string) => {
        if (!editingUser) return;

        const currentAccess = editingUser.accessibleAdminSections || [];
        let newAccess;

        if (currentAccess.includes(sectionId)) {
            newAccess = currentAccess.filter(id => id !== sectionId);
        } else {
            newAccess = [...currentAccess, sectionId];
        }

        setEditingUser({ ...editingUser, accessibleAdminSections: newAccess });
    };

    const toggleAllAdminSections = () => {
        if (!editingUser) return;

        const allIds = ADMIN_SECTIONS.map(s => s.id);
        const currentAccess = editingUser.accessibleAdminSections || [];

        if (currentAccess.length === allIds.length) {
            setEditingUser({ ...editingUser, accessibleAdminSections: [] });
        } else {
            setEditingUser({ ...editingUser, accessibleAdminSections: allIds });
        }
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (isoString?: string) => {
        if (!isoString) return 'Never';
        return new Date(isoString).toLocaleString();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="text-blue-600" /> User Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Manage user access and view activity logs</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Current User Display */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                            {currentUser?.displayName?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-medium text-gray-900">{currentUser?.displayName || 'User'}</div>
                            <div className="text-xs text-gray-500">{currentUser?.email}</div>
                        </div>
                    </div>

                    {/* Add User Button */}
                    <button
                        onClick={() => setShowAddUser(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                    >
                        <User size={18} />
                        Add User
                    </button>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-800 text-sm">
                        <strong>Error:</strong> {error}
                    </p>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600 text-sm">User</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Role</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Last Active</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm text-center">Logins</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Access</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map(user => (
                                <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900">{user.displayName || 'No Name'}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                            {(user.role === 'admin' || user.role === 'super_admin') ? <Shield size={12} className="mr-1" /> : <User size={12} className="mr-1" />}
                                            {user.role === 'super_admin' ? 'Super Admin' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} className="text-gray-400" />
                                            {formatDate(user.lastLogin)}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                                            <Activity size={12} className="text-gray-500" />
                                            {user.loginCount || 0}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        {(user.role === 'admin' || user.role === 'super_admin') ? (
                                            <span className="text-gray-400 italic">{user.role === 'super_admin' ? 'Full System Access' : 'Global Admin Access'}</span>
                                        ) : (
                                            <div className="flex flex-col gap-1">
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {(user.accessibleAssemblies?.length || 0) === 0 ? (
                                                        <span className="text-red-500 text-xs">No Assemblies</span>
                                                    ) : (
                                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                                                            {user.accessibleAssemblies?.length} Assemblies
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {(user.accessiblePages?.length || 0) === 0 ? (
                                                        <span className="text-red-500 text-xs">No Pages</span>
                                                    ) : (
                                                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                                                            {user.accessiblePages?.length} Pages
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit Access"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.uid)}
                                                disabled={deletingUserId === user.uid || user.uid === currentUser?.uid}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title={user.uid === currentUser?.uid ? "Cannot delete yourself" : "Delete User"}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        No users found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h2 className="text-xl font-bold text-gray-800">Edit User Access</h2>
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">User Info</label>
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="font-semibold text-gray-900">{editingUser.displayName}</div>
                                        <div className="text-sm text-gray-500">{editingUser.email}</div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select
                                        value={editingUser.role}
                                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        disabled={editingUser.uid === currentUser?.uid} // Cannot change own role
                                    >
                                        <option value="client">Client</option>
                                        <option value="admin">Admin</option>
                                        {currentUser?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {editingUser.role === 'admin' ? 'Admins can edit data for assigned Assemblies.' :
                                            editingUser.role === 'super_admin' ? 'Super Admins have full access.' :
                                                'Clients have read-only access.'}
                                    </p>
                                </div>
                            </div>

                            {/* Admin Access Control */}
                            {editingUser.role === 'admin' && (
                                <div className="space-y-6">
                                    {/* Admin Section Access */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="block text-sm font-medium text-gray-700">Admin Sections ({editingUser.accessibleAdminSections?.length || 0})</label>
                                            <button
                                                onClick={toggleAllAdminSections}
                                                className="text-xs text-blue-600 font-medium hover:underline"
                                            >
                                                {editingUser.accessibleAdminSections?.length === ADMIN_SECTIONS.length ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>

                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="max-h-40 overflow-y-auto bg-gray-50 p-2 grid grid-cols-2 gap-2">
                                                {ADMIN_SECTIONS.map(section => {
                                                    if (section.superAdminOnly) return null; // Skip super admin only sections for regular admins

                                                    const isSelected = editingUser.accessibleAdminSections?.includes(section.id);
                                                    return (
                                                        <label
                                                            key={section.id}
                                                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200 hover:border-indigo-200'
                                                                }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected || false}
                                                                onChange={() => toggleAdminSectionAccess(section.id)}
                                                                className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mr-3"
                                                            />
                                                            <span className={`text-sm ${isSelected ? 'font-semibold text-indigo-900' : 'text-gray-700'}`}>
                                                                {section.label}
                                                            </span>
                                                            {isSelected && <Check size={14} className="ml-auto text-indigo-600" />}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Admins will only see these tabs in their dashboard.
                                        </p>
                                    </div>

                                    {/* Assembly Scope for Admins */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="block text-sm font-medium text-gray-700">Assembly Scope ({editingUser.accessibleAssemblies?.length || 0})</label>
                                            <button
                                                onClick={toggleAllAssemblies}
                                                className="text-xs text-blue-600 font-medium hover:underline"
                                            >
                                                {editingUser.accessibleAssemblies?.length === ASSEMBLIES.length ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>

                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="max-h-40 overflow-y-auto bg-gray-50 p-2 grid grid-cols-2 gap-2">
                                                {ASSEMBLIES.map(assembly => {
                                                    const isSelected = editingUser.accessibleAssemblies?.includes(assembly.id);
                                                    return (
                                                        <label
                                                            key={assembly.id}
                                                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:border-blue-200'
                                                                }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected || false}
                                                                onChange={() => toggleAssemblyAccess(assembly.id)}
                                                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-3"
                                                            />
                                                            <span className={`text-sm ${isSelected ? 'font-semibold text-blue-900' : 'text-gray-700'}`}>
                                                                {assembly.name} <span className="text-xs text-gray-400">({assembly.id})</span>
                                                            </span>
                                                            {isSelected && <Check size={14} className="ml-auto text-blue-600" />}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Admins can only edit data for these assemblies.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {editingUser.role === 'client' && (
                                <div className="space-y-6">
                                    {/* Assembly Access */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="block text-sm font-medium text-gray-700">Assembly Access ({editingUser.accessibleAssemblies?.length || 0})</label>
                                            <button
                                                onClick={toggleAllAssemblies}
                                                className="text-xs text-blue-600 font-medium hover:underline"
                                            >
                                                {editingUser.accessibleAssemblies?.length === ASSEMBLIES.length ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>

                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="max-h-40 overflow-y-auto bg-gray-50 p-2 grid grid-cols-2 gap-2">
                                                {ASSEMBLIES.map(assembly => {
                                                    const isSelected = editingUser.accessibleAssemblies?.includes(assembly.id);
                                                    return (
                                                        <label
                                                            key={assembly.id}
                                                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:border-blue-200'
                                                                }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected || false}
                                                                onChange={() => toggleAssemblyAccess(assembly.id)}
                                                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-3"
                                                            />
                                                            <span className={`text-sm ${isSelected ? 'font-semibold text-blue-900' : 'text-gray-700'}`}>
                                                                {assembly.name} <span className="text-xs text-gray-400">({assembly.id})</span>
                                                            </span>
                                                            {isSelected && <Check size={14} className="ml-auto text-blue-600" />}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Page Access */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="block text-sm font-medium text-gray-700">Page/Section Access ({editingUser.accessiblePages?.length || 0})</label>
                                            <button
                                                onClick={toggleAllPages}
                                                className="text-xs text-blue-600 font-medium hover:underline"
                                            >
                                                {editingUser.accessiblePages?.length === DASHBOARD_PAGES.length ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>

                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="max-h-40 overflow-y-auto bg-gray-50 p-2 grid grid-cols-2 gap-2">
                                                {DASHBOARD_PAGES.map(page => {
                                                    const isSelected = editingUser.accessiblePages?.includes(page.id);
                                                    return (
                                                        <label
                                                            key={page.id}
                                                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-purple-50 border-purple-300' : 'bg-white border-gray-200 hover:border-purple-200'
                                                                }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected || false}
                                                                onChange={() => togglePageAccess(page.id)}
                                                                className="h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 mr-3"
                                                            />
                                                            <span className={`text-sm ${isSelected ? 'font-semibold text-purple-900' : 'text-gray-700'}`}>
                                                                {page.label}
                                                            </span>
                                                            {isSelected && <Check size={14} className="ml-auto text-purple-600" />}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Users will only see selected sections in their dashboard navigation.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                            >
                                {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {showAddUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <UserPlus className="text-blue-600" />
                                Add New User
                            </h2>
                            <button
                                onClick={() => setShowAddUser(false)}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="text-center py-8">
                            <p className="text-gray-600 mb-4">
                                To add a new user, please direct them to the setup page:
                            </p>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                                <code className="text-sm text-blue-600 font-mono break-all">
                                    {window.location.origin}/setup
                                </code>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                                New users must verify their phone number (from the whitelist) before creating an account.
                            </p>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/setup`);
                                    alert('Setup URL copied to clipboard!');
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Copy Setup URL
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
