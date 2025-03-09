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
    <div className="min-h-screen bg-gradient-to-t from-blue-800 to-blue-500 p-6">
      <div className="max-w-7xl mx-auto ml-55">
        <h1 className="text-3xl font-bold text-white mb-6">Approval Requests</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-40 ">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-600 text-lg">No pending requests found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <div 
                key={`${request.type}-${request.id}`}
                className={`rounded-lg shadow-md overflow-hidden ${
                  request.type === 'salary' ? 'bg-yellow-50' : 'bg-pink-50'
                }`}
              >
                <div className="p-6">
                  <div className="flex flex-col items-center mb-4">
                    <div className="h-20 w-20 rounded-full bg-gray-300 overflow-hidden border-4 border-white shadow-md mb-2">
                      {request.employee?.profileImage ? (
                        <img 
                          src={request.employee.profileImage} 
                          alt={`${request.employee.firstName} profile`} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white text-xl font-bold">
                          {request.employee?.firstName?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {request.employee?.firstName} {request.employee?.lastName}
                    </h3>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-500 mb-1">Request Type</p>
                    <p className="text-base font-semibold">
                      {request.type === 'salary' ? 'Advance Salary' : 'Day Off'}
                    </p>
                  </div>
                  
                  {request.type === 'salary' && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-500 mb-1">Amount</p>
                      <p className="text-base font-semibold">{request.amount} ฿</p>
                      <p className="text-sm font-medium text-gray-500 mt-2 mb-1">Date</p>
                      <p className="text-base">{new Date(request.requestDate).toLocaleDateString('th-TH')}</p>
                    </div>
                  )}
                  
                {request.type === 'dayoff' && (
                 <div className="mb-4">
                    <p className="text-sm font-medium text-gray-500 mb-1">Reason</p>
                    <p className="text-base">{request.reason || 'No reason provided'}</p>
                    <p className="text-sm font-medium text-gray-500 mt-2 mb-1">Date</p>
                    <p className="text-base">
                    {request.startDate ? new Date(request.startDate).toLocaleDateString('th-TH') : 'No date specified'}
                    {/* Since we're setting endDate equal to startDate for single days, this will just show (1 day) */}
                    {request.endDate && request.startDate && 
                        new Date(request.endDate).getTime() !== new Date(request.startDate).getTime() ? 
                        ` - ${new Date(request.endDate).toLocaleDateString('th-TH')}` : 
                        ' (1 day)'}
                    </p>
                 </div>
                )}
                  
                  <div className="flex justify-between gap-2 mt-6">
                    <button 
                      onClick={() => handleApprove(request.id, request.type === 'salary' ? 'salary' : 'dayoff')}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md font-medium transition duration-200"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleReject(request.id, request.type === 'salary' ? 'salary' : 'dayoff')}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md font-medium transition duration-200"
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