import React from 'react'
import { Link} from 'react-router'

function Sidebar() {
  return (
    <nav className="w-50 bg-white h-screen fixed top-0 left-0">
    <ul className="flex flex-col w-full">
      <li className="w-full">
        <Link
          to="/user"
          className="block py-2 px-4 hover:bg-blue-500 hover:text-white"
        >
          Profile
        </Link>
      </li>
      <li>
        <Link
          to="/user/check-in"
          className="block py-2 px-4 hover:bg-blue-500 hover:text-white"
        >
          Check-In
        </Link>
      </li>
      <li>
        <Link
          to="/user/check-out"
          className="block py-2 px-4 hover:bg-blue-500 hover:text-white"
        >
          Check-Out
        </Link>
      </li>
      <li>
        <Link
          to="/user/day-off"
          className="block py-2 px-4 hover:bg-blue-600 hover:text-white"
        >
          Day-Off
        </Link>
      </li>
      <li>
        <Link
          to="/user/advancd-salary"
          className="block py-2 px-4 hover:bg-blue-600 hover:text-white"
        >
          Advanced Salary
        </Link>
      </li>
      <li>
        <Link
          to="/admin"
          className="block py-2 px-4 hover:bg-blue-600 hover:text-white"
        >
          Approved
        </Link>
      </li>
    </ul>
  </nav>
  )
}

export default Sidebar