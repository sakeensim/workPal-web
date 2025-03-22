import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/auth-store';

function AdminApprovalPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((state) => state.token);

  // Fetch all pending requests on component mount
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:9191/admin/pending-requests', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setRequests(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (id, type) => {
    try {
      await axios.patch(`http://localhost:9191/admin/${type}-approve/${id}`, 
        { status: 'APPROVED' },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      // Refresh the requests list
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (id, type) => {
    try {
      await axios.patch(`http://localhost:9191/admin/${type}-reject/${id}`, 
        { status: 'REJECTED' },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      // Refresh the requests list
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  return (
    <div className="min-h-screen sm:ml-50">
      {/* Adjust the margin based on your sidebar implementation */}
      <div className="max-w-7xl mx-auto pl-16 md:pl-16 lg:pl-16">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6 mt-2">Approval Requests</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-600 text-base sm:text-lg">No pending requests found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {requests.map((request) => (
              <div 
                key={`${request.type}-${request.id}`}
                className={`rounded-lg shadow-md overflow-hidden ${
                  request.type === 'salary' ? 'bg-yellow-50' : 'bg-pink-50'
                }`}
              >
                <div className="p-3 sm:p-6">
                  {/* Profile section */}
                  <div className="flex flex-col items-center mb-3 sm:mb-4">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gray-300 overflow-hidden border-4 border-white shadow-md mb-2">
                      {request.employee?.profileImage ? (
                        <img 
                          src={request.employee.profileImage} 
                          alt={`${request.employee.firstName} profile`} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white text-lg sm:text-xl font-bold">
                          {request.employee?.firstName?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 text-center">
                      {request.employee?.firstName} {request.employee?.lastName}
                    </h3>
                  </div>
                  
                  {/* Request Type section */}
                  <div className="mb-3 sm:mb-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Request Type</p>
                    <p className="text-sm sm:text-base font-semibold">
                      {request.type === 'salary' ? 'Advance Salary' : 'Day Off'}
                    </p>
                  </div>
                  
                  {/* Salary request details */}
                  {request.type === 'salary' && (
                    <div className="mb-3 sm:mb-4">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Amount</p>
                      <p className="text-sm sm:text-base font-semibold">{request.amount} ฿</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mt-2 mb-1">Date</p>
                      <p className="text-sm sm:text-base">{new Date(request.requestDate).toLocaleDateString('th-TH')}</p>
                    </div>
                  )}
                  
                  {/* Day off request details */}
                  {request.type === 'dayoff' && (
                    <div className="mb-3 sm:mb-4">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Reason</p>
                      <p className="text-sm sm:text-base">{request.reason || 'No reason provided'}</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mt-2 mb-1">Date</p>
                      <p className="text-sm sm:text-base">
                        {request.startDate ? new Date(request.startDate).toLocaleDateString('th-TH') : 'No date specified'}
                        {request.endDate && request.startDate && 
                          new Date(request.endDate).getTime() !== new Date(request.startDate).getTime() ? 
                          ` - ${new Date(request.endDate).toLocaleDateString('th-TH')}` : 
                          ' (1 day)'}
                      </p>
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex justify-between gap-2 mt-4 sm:mt-6">
                    <button 
                      onClick={() => handleApprove(request.id, request.type === 'salary' ? 'salary' : 'dayoff')}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1 sm:py-2 px-2 sm:px-4 rounded-md text-sm sm:text-base font-medium transition duration-200"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleReject(request.id, request.type === 'salary' ? 'salary' : 'dayoff')}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1 sm:py-2 px-2 sm:px-4 rounded-md text-sm sm:text-base font-medium transition duration-200"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminApprovalPage;