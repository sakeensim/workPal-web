import React from 'react'
import { Outlet } from 'react-router'
import Sidebar from '../components/Sidebar'

function Layout() {
  return (
    <>
    <div className='bg-gradient-to-t from-blue-800 to-blue-500 h-screen'>
       
        <Outlet />

        <Sidebar />
    </div>
    </>
  )
}

export default Layout