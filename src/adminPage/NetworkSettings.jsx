import React, { useState } from 'react';
import useIPConfigStore from '../store/IP-Config';
import useAuthStore from '../store/auth-store';
import { createAlert } from '../utils/createAlert';

function NetworkSettingsPage() {
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState('');
  
  const { allowedIPs, removeAllowedIP, setAllowedIPs } = useIPConfigStore();
  const token = useAuthStore((state) => state.token);
  
  // Validate IP address format
  const isValidIP = (ip) => {
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

  // Import multiple IPs
  const handleImport = (e) => {
    e.preventDefault();
    
    // Parse the IP addresses (accepting comma, space, or newline separated)
    const ips = importText
      .split(/[\s,]+/)
      .map(ip => ip.trim())
      .filter(ip => ip.length > 0);
    
    if (ips.length === 0) {
      createAlert("error", "No valid IPs found to import");
      return;
    }
    
    // Validate all IPs
    const invalidIPs = ips.filter(ip => !isValidIP(ip));
    
    if (invalidIPs.length > 0) {
      createAlert("error", `Found ${invalidIPs.length} invalid IP addresses`);
      return;
    }
    
    // Add all valid IPs that aren't already in the list
    const newIPs = ips.filter(ip => !allowedIPs.includes(ip));
    
    if (newIPs.length === 0) {
      createAlert("info", "All IPs are already in the allowed list");
      return;
    }
    
    // Update the store with all IPs (existing + new)
    setAllowedIPs([...allowedIPs, ...newIPs]);
    setImportText('');
    setIsImporting(false);
    createAlert("success", `Added ${newIPs.length} new IP addresses`);
  };

  // Clear all IPs with confirmation
  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to remove all allowed IPs? This will prevent all employees from checking in or out until new IPs are added.")) {
      setAllowedIPs([]);
      createAlert("success", "All IP addresses removed");
    }
  };

  // Export IPs to clipboard
  const handleExport = () => {
    navigator.clipboard.writeText(allowedIPs.join('\n'))
      .then(() => {
        createAlert("success", "IP addresses copied to clipboard");
      })
      .catch(err => {
        console.error('Failed to copy IPs to clipboard:', err);
        createAlert("error", "Failed to copy to clipboard");
      });
  };

  return (
    <div className="h-screen p-4 sm:ml-50">
      {/* Adjust the margin based on your sidebar implementation */}
      <div className="max-w-5xl mx-auto pl-16 md:pl-16 lg:pl-16">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Network Settings</h1>
          
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Export IPs
            </button>
            <button
              onClick={() => setIsImporting(!isImporting)}
              className="px-3 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700"
            >
              {isImporting ? 'Cancel Import' : 'Import IPs'}
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Allowed Office IP Addresses
              </h2>
              {allowedIPs.length > 0 && (
                <span className="text-sm text-blue-600 font-medium">
                  {allowedIPs.length} {allowedIPs.length === 1 ? 'IP' : 'IPs'} Configured
                </span>
              )}
            </div>
            
            <p className="text-gray-600 mb-6">
              Only employees connected to these IP addresses will be able to check in and check out.
              IP addresses can only be modified by importing a list or through the system administrator.
            </p>
            
            {/* Import IPs form */}
            {isImporting && (
              <div className="mb-6 p-4 border border-gray-200 bg-gray-50 rounded-md">
                <h3 className="font-medium mb-2">Import Multiple IP Addresses</h3>
                <form onSubmit={handleImport}>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                    rows={4}
                    placeholder="Enter multiple IP addresses separated by commas, spaces, or new lines"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsImporting(false)}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Import
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* IP list */}
            <div className="border border-gray-200 rounded-md overflow-hidden mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allowedIPs.length === 0 ? (
                    <tr>
                      <td colSpan="2" className="px-6 py-4 text-center text-sm text-gray-500">
                        No allowed IPs configured. Import IPs to allow check-ins.
                      </td>
                    </tr>
                  ) : (
                    allowedIPs.map((ip) => (
                      <tr key={ip}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ip}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => {
                              removeAllowedIP(ip);
                              createAlert("info", `Removed IP ${ip}`);
                            }}
                            className="text-red-600 hover:text-red-900 transition duration-200"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {allowedIPs.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={handleClearAll}
                  className="text-red-600 hover:text-red-900 transition duration-200 text-sm"
                >
                  Remove All IPs
                </button>
              </div>
            )}
            
            <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-md text-sm">
              <h3 className="font-semibold mb-1">How it works:</h3>
              <p>
                When employees try to check in or out, the system will compare their current IP address 
                with this list. If their IP is included, they will be allowed to proceed. Otherwise, 
                they will receive a message asking them to connect to the company network.
              </p>
              <p className="mt-2">
                IP changes take effect immediately for all users.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NetworkSettingsPage;