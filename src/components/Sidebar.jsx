import React from 'react'
import { NavLink } from 'react-router'

function Sidebar() {
  return (
   <div className="w-64 bg-white h-screen fixed top-0 left-0">
      <ul className="flex flex-col w-full">
        <li className="w-full"> 
          <NavLink
            to="/user"
            className="block py-2 px-4 hover:bg-blue-500 hover:text-white"
            activeClassName="bg-blue-500 text-white"
          >
            Profile
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/user/check-in"
            className="block py-2 px-4 hover:bg-blue-500 hover:text-white"
            activeClassName="bg-blue-600 text-white"
          >
            Check-In
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/user/check-out"
            className="block py-2 px-4 hover:bg-blue-500 hover:text-white"
            activeClassName="bg-blue-600 text-white"
          >
            Check-Out
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/user/day-off"
            className="block py-2 px-4 hover:bg-blue-600 hover:text-white"
            activeClassName="bg-blue-700 text-white"
          >
            Day-Off
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/user/advancd-salary"
            className="block py-2 px-4 hover:bg-blue-600 hover:text-white"
            activeClassName="bg-blue-700 text-white"
          >
            Advanced Salary
          </NavLink>
        </li>
       
        <li>
          <NavLink
            to="/admin/approved"
            className="block py-2 px-4 hover:bg-blue-600  hover:text-white "
            activeClassName="bg-blue-800 text-white"
          >
            Approved
          </NavLink>
        </li>
      </ul>
    </div>
  )
}

export default Sidebar