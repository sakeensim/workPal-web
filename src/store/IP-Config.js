import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useIPConfigStore = create(
  persist(
    (set) => ({
      allowedIPs: ['184.82.221.58'], // Default office IP
      
      // Add a new IP to the list
      addAllowedIP: (ip) => set((state) => ({
        allowedIPs: [...state.allowedIPs, ip]
      })),
      
      // Remove an IP from the list
      removeAllowedIP: (ip) => set((state) => ({
        allowedIPs: state.allowedIPs.filter(allowedIP => allowedIP !== ip)
      })),
      
      // Update the entire allowed IPs list
      setAllowedIPs: (ipArray) => set({
        allowedIPs: ipArray
      }),
    }),
    {
      name: 'ip-config-storage',
    }
  )
);

export default useIPConfigStore;