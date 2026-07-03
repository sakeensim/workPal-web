import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import BottomNavbar from '../components/BottomNavbar'
import TopBar from '../components/TopBar'

function Layout() {
  return (
    <div className="relative h-dvh overflow-hidden bg-[#F5F8FD] text-[#0F172A]">
      <div className="flex h-full min-h-0">
        <div className="hidden shrink-0 md:block">
          <Sidebar />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="hidden shrink-0 md:block">
            <TopBar />
          </div>

          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-28 md:pb-0">
            <Outlet />
          </main>
        </div>
      </div>

      <BottomNavbar />
    </div>
  )
}

export default Layout