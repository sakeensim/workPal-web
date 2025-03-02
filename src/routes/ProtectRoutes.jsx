import React, { useEffect } from 'react'
import useAuthStore from '../store/auth-store';

function ProtectRoutes({el}) {
    console.log("ProtectRoutes")
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token); // Trigger re-render when token updates
  
    console.log("User in ProtectRoutes:", user);
    console.log("Token in ProtectRoutes:", token);

    // useEffect(()=>{
    //     checkPermission()
    // },[])
    // const checkPermission = () => {
    //     console.log('Check permission')
    //     try {
    //         const getMe = async (token) => {

    //         }
    //     } catch (error) {
    //         console.log(error)
            
    //     }
    // }

  return el;
}

export default ProtectRoutes