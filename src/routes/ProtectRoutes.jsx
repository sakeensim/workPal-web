import React, { useEffect, useState } from 'react'
import useAuthStore from '../store/auth-store';
import axios from 'axios';
import { useLocation } from 'react-router';

function ProtectRoutes({ el,allows }) {
  const [ok, setOk] = useState(null);
  const token = useAuthStore((state) => state.token); 
  console.log("OK state5555:",ok)
  

  const location = useLocation()


  useEffect(() => {
    console.log("OK state inside useEffect:",ok)
    checkPermission()

  }, [location.pathname])

  const checkPermission = async () => {
    console.log('Check permission')
    try {

      const res = await axios.get('http://localhost:9191/getme', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      console.log('allows', allows)

      const role = res.data.result.role

      console.log('role', role)

      console.log('allows.includes(role)', allows.includes(role))

      setOk(allows.includes(role))
      // if(allows.includes(role)){
      //   setOk(true)
      // }else{
      //   setOk(false)
      // }

      
    } catch (error) {
      console.log(error)
      setOk(false)
    }
  }

  console.log('ok', ok)


  if (ok === null) {
    console.log("step 1 in ok === null");
    return <h1>Loading...</h1>;
  }
  if (!ok) {
    return <h1>Unauthorize</h1>;
  }


  return el;
}

export default ProtectRoutes