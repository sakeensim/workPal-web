import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Calendar, Clock, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import useAuthStore from '../store/auth-store';

const WorkTimeRecordPage = () => {
    const [records, setRecords] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [selectedEmployee, setSelectedEmployee] = useState('all');

    const { token } = useAuthStore();

    // Function to fetch employees
    const fetchEmployees = async () => {
        try {
            const res = await axios.get('http://localhost:9191/admin/getemployee', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log('Employees fetched:', res.data.result);
            setEmployees(res.data.result || []);
        } catch (err) {
            console.error('Error fetching employees:', err);
            setError('Failed to load employees');
        }
    };

    // Function to fetch time records for a specific month
    const fetchTimeRecords = async () => {
        setLoading(true);
        try {
            const month = format(selectedMonth, 'M');
            const year = format(selectedMonth, 'yyyy');

            // Build URL with the selectedEmployee
            let url = `http://localhost:9191/admin/Work-time-record?month=${month}&year=${year}&_=${new Date().getTime()}`;

            if (selectedEmployee !== 'all') {
                url += `&employeeId=${selectedEmployee}`;
            }

            console.log("Fetching records with URL:", url);

            const res = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("Full API response:", res.data);

            let recordsData = res.data.data || [];

            // Filter out records with invalid check-in or check-out times
            recordsData = recordsData.filter(record => {
                if (!record) return false;
                
                // Check if record has valid check-in AND check-out
                const hasValidCheckIn = record.checkIn && !isNaN(new Date(record.checkIn).getTime());
                const hasValidCheckOut = record.checkOut && !isNaN(new Date(record.checkOut).getTime());
                
                // Only keep records with both valid check-in and check-out
                return hasValidCheckIn && hasValidCheckOut;
            });

            // Process employee IDs
            recordsData = recordsData.map(record => {
                // Normalize employee ID field (handle different field names)
                const employeeId = record.employeeId || record.employeesId || record.employee_id;
                
                // Only include records that match the selected employee when filtering
                if (selectedEmployee !== 'all' && String(employeeId) !== String(selectedEmployee)) {
                    return null; // This will be filtered out below
                }
                
                return {
                    ...record,
                    normalizedEmployeeId: employeeId // Add a normalized field
                };
            }).filter(Boolean); // Remove null entries

            console.log(`After processing: ${recordsData.length} records`);

            setRecords(recordsData);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching time records:', err);
            setError('Failed to load time records');
            setLoading(false);
        }
    };

    // Initialize data
    useEffect(() => {
        fetchEmployees();
    }, []);

    // Fetch records when month or employee changes
    useEffect(() => {
        if (token) {
            fetchTimeRecords();
        }
    }, [selectedMonth, selectedEmployee, token]);

    // Function to navigate to previous month
    const prevMonth = () => {
        const newDate = new Date(selectedMonth);
        newDate.setMonth(newDate.getMonth() - 1);
        setSelectedMonth(newDate);
    };

    // Function to navigate to next month
    const nextMonth = () => {
        const newDate = new Date(selectedMonth);
        newDate.setMonth(newDate.getMonth() + 1);
        setSelectedMonth(newDate);
    };

    // Format time for display - improved validation
    const formatTime = (dateTimeStr) => {
        if (!dateTimeStr || typeof dateTimeStr !== 'string' || isNaN(Date.parse(dateTimeStr))) {
            return 'N/A';
        }
        return format(new Date(dateTimeStr), 'hh:mm a');
    };

    // Calculate duration between check-in and check-out - improved validation
    const calculateDuration = (checkIn, checkOut) => {
        if (!checkIn || !checkOut || isNaN(new Date(checkIn).getTime()) || isNaN(new Date(checkOut).getTime())) {
            return 'N/A';
        }

        const checkInTime = new Date(checkIn).getTime();
        const checkOutTime = new Date(checkOut).getTime();
        const diffMs = checkOutTime - checkInTime;

        if (diffMs <= 0) return 'N/A';

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m`;
    };

    // Handle employee selection change
    const handleEmployeeChange = (e) => {
        const value = e.target.value;
        console.log("Selected Employee changing to:", value);
        setSelectedEmployee(value);
    };

    // Find employee name by ID
    const getEmployeeName = (employeeId) => {
        if (!employeeId) return "Unknown";

        const employee = employees.find(e => String(e.id) === String(employeeId));
        return employee
            ? `${employee.firstname || ''} ${employee.lastname || ''}`
            : 'Unknown';
    };

    return (
        <div className="container mx-auto lg:ml-60 ml-0 p-4 lg:p-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold mb-6 flex items-center">
                    <Clock className="mr-2" size={24} />
                    Work Time Records
                </h1>

                {/* Controls */}
                <div className="flex flex-wrap gap-4 mb-6">
                    {/* Month selector */}
                    <div className="flex items-center bg-gray-100 rounded-md">
                        <button
                            onClick={prevMonth}
                            className="p-2 hover:bg-gray-200 rounded-l-md"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="px-4 flex items-center">
                            <Calendar className="mr-2" size={16} />
                            <span>{format(selectedMonth, 'MMMM yyyy')}</span>
                        </div>
                        <button
                            onClick={nextMonth}
                            className="p-2 hover:bg-gray-200 rounded-r-md"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Employee selector */}
                    <div className="flex items-center">
                        <Users className="mr-2" size={16} />
                        <select
                            value={selectedEmployee}
                            onChange={handleEmployeeChange}
                            className="bg-gray-100 border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="all">All Employees</option>
                            {employees && employees.length > 0 ? (
                                employees.map(employee => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee?.firstname || ''} {employee?.lastname || ''}
                                    </option>
                                ))
                            ) : (
                                <option disabled>No employees found</option>
                            )}
                        </select>
                    </div>
                </div>

                {/* Records Table */}
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="text-red-500 text-center py-8">{error}</div>
                ) : records.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">No time records found for the selected criteria</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="py-3 px-4 text-left border-b">Employee</th>
                                    <th className="py-3 px-4 text-left border-b">Date</th>
                                    <th className="py-3 px-4 text-left border-b">Check In</th>
                                    <th className="py-3 px-4 text-left border-b">Check Out</th>
                                    <th className="py-3 px-4 text-left border-b">Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((record, index) => {
                                    if (!record) return null;

                                    // Get the normalized employee ID
                                    const employeeId = record.normalizedEmployeeId;
                                    
                                    // Get employee name
                                    const employeeName = getEmployeeName(employeeId);

                                    // Generate a unique key
                                    const uniqueKey = `${employeeId || 'unknown'}-${record.date}-${record.checkIn}-${record.checkOut}-${index}`;

                                    return (
                                        <tr key={uniqueKey} className="hover:bg-gray-50 border-b">
                                            <td className="py-3 px-4">{employeeName}</td>
                                            <td className="py-3 px-4">
                                                {record.date ? format(new Date(record.date), 'MMM dd, yyyy') : 'N/A'}
                                            </td>
                                            <td className="py-3 px-4">
                                                {formatTime(record.checkIn)}
                                            </td>
                                            <td className="py-3 px-4">
                                                {formatTime(record.checkOut)}
                                            </td>
                                            <td className="py-3 px-4">
                                                {calculateDuration(record.checkIn, record.checkOut)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkTimeRecordPage;