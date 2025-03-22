import React, { useEffect, useState } from 'react';
import useAuthStore from '../store/auth-store';
import axios from 'axios';
import { createAlert } from '../utils/createAlert';

function UserManagement() {
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [editingSalaryId, setEditingSalaryId] = useState(null);
    const [newSalary, setNewSalary] = useState('');
    
    const enableSalaryEdit = (id, currentSalary) => {
        setEditingSalaryId(id);
        setNewSalary(currentSalary || '');
    };
    

    // Check if user is admin
    useEffect(() => {
        if (user.role !== 'ADMIN') {
            // Redirect non-admin users
            window.location.href = '/profile';
        } else {
            fetchEmployees();
        }
    }, [user]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:9191/user/list', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmployees(res.data.result);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching employees:', error);
            createAlert('error', 'Failed to fetch employees');
            setLoading(false);
        }
    };
   
    const updateSalary = async (id) => {
        try {
            await axios.patch('http://localhost:9191/admin/update-salary',  
                { id, baseSalary: newSalary },  // Send ID and new salary in the request body
                { headers: { Authorization: `Bearer ${token}` } } // Correctly place headers here
            );
            createAlert('success', 'Salary updated successfully');
            fetchEmployees(); // Refresh the employee list
            setEditingSalaryId(null);
        } catch (error) {
            console.error('Error updating salary:', error);
            createAlert('error', 'Failed to update salary');
        }
    };

    const handleRoleChange = async (id, newRole) => {
        try {
            await axios.post('http://localhost:9191/user/update-role',
                { id, role: newRole },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            createAlert('success', 'Role updated successfully');
            fetchEmployees(); // Refresh the list
        } catch (error) {
            console.error('Error updating role:', error);
            createAlert('error', 'Failed to update role');
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:9191/user/delete/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            createAlert('success', 'User deleted successfully');
            fetchEmployees(); // Refresh the list
            setConfirmDelete(null); // Close confirmation
        } catch (error) {
            console.error('Error deleting user:', error);
            createAlert('error', 'Failed to delete user');
        }
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('th-TH');
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
        <div className="min-h-screen lg:ml-50 ml-0">
            <h1 className="text-2xl font-bold mb-6 text-white">Employee Management Dashboard</h1>

            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Profile</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Emergency Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Base Salary</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {employees.map((employee) => (
                                <tr key={employee.id} className="hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-600">
                                            {employee.profileImage ? (
                                                <img
                                                    src={employee.profileImage}
                                                    alt={`${employee.firstname} profile`}
                                                    className="h-full w-full object-cover"
                                                    onError={(e) => {
                                                        e.target.src = "https://via.placeholder.com/40";
                                                    }}
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-white">
                                                    {employee.firstname.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {employee.firstname} {employee.lastname}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                        {employee.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                        {employee.phone || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                        {employee.emergencyContact || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                        {editingSalaryId === employee.id ? (
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="string"
                                                    className="bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 w-24"
                                                    value={newSalary}
                                                    onChange={(e) => setNewSalary(e.target.value)}
                                                />
                                                <button
                                                    onClick={() => updateSalary(employee.id)}
                                                    className="text-xs bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingSalaryId(null)}
                                                    className="text-xs bg-gray-600 hover:bg-gray-700 text-white py-1 px-2 rounded"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <span onClick={() => enableSalaryEdit(employee.id, employee.baseSalary)} className="cursor-pointer hover:text-white">
                                                {employee.baseSalary ? `${Number(employee.baseSalary).toLocaleString()} บาท` : '-'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                        {formatDate(employee.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {user.id !== employee.id ? (
                                            <select
                                                className="bg-gray-700 border border-gray-600 text-white rounded px-2 py-1"
                                                value={employee.role}
                                                onChange={(e) => handleRoleChange(employee.id, e.target.value)}
                                            >
                                                <option value="USER">USER</option>
                                                <option value="ADMIN">ADMIN</option>
                                            </select>
                                        ) : (
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-500 text-white">
                                                {employee.role} (You)
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {user.id !== employee.id ? (
                                            confirmDelete === employee.id ? (
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleDelete(employee.id)}
                                                        className="text-xs bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDelete(null)}
                                                        className="text-xs bg-gray-600 hover:bg-gray-700 text-white py-1 px-2 rounded"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmDelete(employee.id)}
                                                    className="text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded"
                                                >
                                                    Delete
                                                </button>
                                            )
                                        ) : (
                                            <span className="text-xs text-gray-500">Cannot Delete</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default UserManagement