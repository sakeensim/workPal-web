import React, { useState } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/auth-store";
import {
  ApprovedIcon,
  CheckinIcon,
  CheckoutIcon,
  DashboardIcon,
  DayoffIcon,
  ProfileIcon,
  SalaryIcon,
  UserManageIcon,
} from "../icon/icon";
import { FileCheck } from "lucide-react";

function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const [isExpanded, setIsExpanded] = useState(false); // Controls sidebar expansion

  return (
    <nav
      className={`h-screen fixed top-0 left-0 transition-all duration-300
        ${isExpanded ? "w-52" : "w-16"} 
        md:w-52 md:bg-white md:shadow-lg bg-transparent`} // Removed bg color on mobile
    >
      {/* Toggle Button for Mobile */}
      <button
        className="p-2 w-full flex justify-center md:hidden"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        ☰
      </button>

      {/* Sidebar Links */}
      <ul className="flex flex-col items-start w-full">
        <li className="w-full">
          <Link
            to="/user"
            className="flex items-center gap-2 p-2 hover:bg-blue-500 hover:text-white"
          >
            <ProfileIcon className="w-6" />
            {isExpanded && (
              <span className="ml-2 hidden md:inline">Profile</span>
            )}
          </Link>
        </li>
        <li className="w-full">
          <Link
            to="/user/check-in"
            className="flex items-center gap-2 p-2 hover:bg-blue-500 hover:text-white"
          >
            <CheckinIcon className="w-6" />
            {isExpanded && (
              <span className="ml-2 hidden md:inline">Check-In</span>
            )}
          </Link>
        </li>
        <li className="w-full">
          <Link
            to="/user/check-out"
            className="flex items-center gap-2 p-2 hover:bg-blue-500 hover:text-white"
          >
            <CheckoutIcon className="w-6" />
            {isExpanded && (
              <span className="ml-2 hidden md:inline">Check-Out</span>
            )}
          </Link>
        </li>
        <li className="w-full">
          <Link
            to="/user/day-off"
            className="flex items-center gap-2 p-2 hover:bg-blue-500 hover:text-white"
          >
            <DayoffIcon className="w-6" />
            {isExpanded && (
              <span className="ml-2 hidden md:inline">Day-Off</span>
            )}
          </Link>
        </li>

        {/* Admin Links */}
        {user && user.role === "ADMIN" && (
          <>
            <li className="w-full">
              <Link
                to="/admin"
                className="flex items-center gap-2 p-2 hover:bg-blue-500 hover:text-white"
              >
                <ApprovedIcon className="w-6" />
                {isExpanded && (
                  <span className="ml-2 hidden md:inline">Approved</span>
                )}
              </Link>
            </li>
            <li className="w-full">
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-2 p-2 hover:bg-blue-500 hover:text-white"
              >
                <DashboardIcon className="w-6" />
                {isExpanded && (
                  <span className="ml-2 hidden md:inline">Dashboard</span>
                )}
              </Link>
            </li>
            <li className="w-full">
              <Link
                to="/admin/user-management"
                className="flex items-center gap-2 p-2 hover:bg-blue-500 hover:text-white"
              >
                <UserManageIcon className="w-6" />
                {isExpanded && (
                  <span className="ml-2 hidden md:inline">User Management</span>
                )}
              </Link>
            </li>
            <li className="w-full">
              <Link
                to="/admin/Work-time-record"
                className="flex items-center gap-2 p-2 hover:bg-blue-500 hover:text-white"
              >
                <FileCheck className="w-6" />
                {isExpanded && (
                  <span className="ml-2 hidden md:inline">Worktime Record</span>
                )}
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Sidebar;
