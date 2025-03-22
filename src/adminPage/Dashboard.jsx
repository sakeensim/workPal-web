import React, { useState, useEffect } from 'react';
import { DollarSign, User, Search } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../store/auth-store';

function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filter, setFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'lastname', direction: 'ascending' });
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    fetchEmployees();
  }, [currentMonth]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      const response = await axios.get('http://localhost:9191/admin/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.data;

      console.log('Fetched employees data:', data);
      data.forEach(emp => console.log(emp.dayOffsTaken));

      if (response.status === 200) {
        setEmployees(data);
      } else {
        console.error('Failed to fetch employees:', data.message);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getDaysOffForMonth = (dayOffs) => {
    if (!Array.isArray(dayOffs)) {
      console.warn("Invalid dayOffs data:", dayOffs);
      return 0; // Prevents filter error
    }
  
    return dayOffs.filter(dayOff => {
      if (!dayOff) return false;
      
      const dateStr = typeof dayOff === 'string' ? dayOff : dayOff.date;
      if (!dateStr) return false;
  
      const dayOffDate = new Date(dateStr);
      return (
        dayOffDate.getFullYear() === currentMonth.getFullYear() &&
        dayOffDate.getMonth() === currentMonth.getMonth()
      );
    }).length;
  };
  
  
  
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-TH', {
      style: 'currency',
      currency: 'BTH',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getMonthName = (date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const changeMonth = (increment) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentMonth(newDate);
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedEmployees = React.useMemo(() => {
    const sortableEmployees = [...employees];
    if (sortConfig.key) {
      sortableEmployees.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableEmployees;
  }, [employees, sortConfig]);

  const filteredEmployees = sortedEmployees.filter(
    employee =>
      employee.firstname.toLowerCase().includes(filter.toLowerCase()) ||
      employee.lastname.toLowerCase().includes(filter.toLowerCase()) ||
      employee.email.toLowerCase().includes(filter.toLowerCase())
  );

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  return (
    <div className=" min-h-screen sm:ml-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">

          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>

              <div className="flex items-center mt-4 sm:mt-0">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-2 bg-gray-100 rounded-l-md hover:bg-gray-200"
                >
                  &lt;
                </button>
                <div className="px-4 py-2 bg-gray-100 font-medium">
                  {getMonthName(currentMonth)}
                </div>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-2 bg-gray-100 rounded-r-md hover:bg-gray-200"
                >
                  &gt;
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div className="relative w-full sm:w-64 mb-4 sm:mb-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-2">
                <div className="flex items-center text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded">
                  <User size={16} className="mr-1" />
                  <span>{employees.length} Employees</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('firstname')}
                    >
                      <div className="flex items-center">
                        <span>Name</span>
                        <span className="ml-1">{getSortIndicator('firstname')}</span>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center">
                        <span>Base Salary</span>
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <span>Day Offs</span>
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <span>Advance Taken</span>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('finalSalary')}
                    >
                      <div className="flex items-center">
                        <span>Final Salary</span>
                        <span className="ml-1">{getSortIndicator('finalSalary')}</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {employee.profileImage ? (
                                <img className="h-10 w-10 rounded-full object-cover" src={employee.profileImage} alt="" />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                  <User size={20} />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {employee.firstname} {employee.lastname}
                              </div>
                              <div className="text-sm text-gray-500">{employee.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {formatCurrency(employee.baseSalary || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-2 text-sm text-gray-900">
                              <span className="font-medium">{getDaysOffForMonth(employee.dayOffsTaken)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(employee.advanceTaken || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(employee.finalSalary || 0)}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        No employees found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
