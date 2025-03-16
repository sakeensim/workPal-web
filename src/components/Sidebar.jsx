import React from 'react'
import { Link} from 'react-router'
import useAuthStore from '../store/auth-store'; // Import your auth store
import { ApprovedIcon, CheckinIcon, CheckoutIcon, DashboardIcon, DayoffIcon, ProfileIcon, SalaryIcon } from '../icon/icon';


function Sidebar() {
  const user = useAuthStore((state) => state.user); // Access user from store

  return (
    <nav className="w-50 bg-white h-screen fixed top-0 left-0">
    <ul className="flex flex-col w-full">
      <li className="w-full">
        <Link
          to="/user"
          className="block py-2 px-4 hover:bg-blue-500 hover:text-white"
        >
          <div className="flex gap-2">
            <ProfileIcon className="w-6"/>
          Profile
          </div>
        </Link>
      </li>
      <li>
        <Link
          to="/user/check-in"
          className="block py-2 px-4 hover:bg-blue-500 hover:text-white"
        >
          <div className="flex gap-2">
            <CheckinIcon className='w-6'/>
          Check-In
          </div>
        </Link>
      </li>
      <li>
        <Link
          to="/user/check-out"
          className="block py-2 px-4 hover:bg-blue-500 hover:text-white"
        >
          <div className="flex gap-2">
            <CheckoutIcon className='w-6'/>
          Check-Out
          </div>
        </Link>
      </li>
      <li>
        <Link
          to="/user/day-off"
          className="block py-2 px-4 hover:bg-blue-600 hover:text-white"
        >
          <div className="flex gap-2">
            <DayoffIcon className="w-6"/>
          Day-Off
          </div>
        </Link>
      </li>
      <li>
        <Link
          to="/user/advancd-salary"
          className="block py-2 px-4 hover:bg-blue-600 hover:text-white"
        >
          <div className="flex gap-2">
            <SalaryIcon className="w-6"/>
          Advanced Salary
          </div>
        </Link>
      </li>
      {user && user.role === 'ADMIN' && (
          <>
      <li>
        <Link
          to="/admin"
          className="block py-2 px-4 hover:bg-blue-600 hover:text-white"
        >
          <div className="flex gap-2">
            <ApprovedIcon className="w-6"/>
          Approved
          </div>
        </Link>
      </li>
      <li className="w-full">
        <Link
          to="/admin/dashboard"
          className="block py-2 px-4 hover:bg-blue-500 hover:text-white"
        >
          <div className="flex gap-2">
          <DashboardIcon className="w-6"/>
          Dashboard
          </div>
        </Link>
      </li>
      </>
        )}
    </ul>
  </nav>
  )
}

export default Sidebar