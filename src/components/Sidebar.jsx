import React, { useState, useEffect } from "react";
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
import { FileCheck, Menu } from "lucide-react";

function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  console.log('user', user)
  // Check if we're on mobile and update state when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener
    window.addEventListener("resize", checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  return (
    <div className="relative h-screen">
      {/* Toggle Button - Visible on all screens, positioned differently */}
      <button
        className={`z-10 fixed top-4 ${isExpanded ? "left-44 md:left-44" : "left-4"} 
          p-2 bg-blue-500 text-white rounded-full transition-all duration-300`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* {isExpanded ? "←" : "→"} */}
        <Menu className="w-6 h-6" />
      </button>
      <nav
        className={`h-screen fixed top-0 left-0 transition-all duration-300
          ${isExpanded 
            ? "w-52 bg-white shadow-lg" 
            : "w-16 bg-transparent md:bg-white md:shadow-md"}`}
      >
        {/* Sidebar Links */}
        <ul className="flex flex-col items-start w-full mt-16">
          <li className="w-full">
            <Link
              to={`/user`}
              className="flex items-center gap-2 p-2 hover:bg-blue-500 hover:text-white"
            >
              <ProfileIcon className="w-6" /> 
              {isExpanded && (
                <span className="ml-2">Profile</span>
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
                <span className="ml-2">Check-In</span>
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
                <span className="ml-2">Check-Out</span>
              )}
            </Link>
          </li>
          <li className="w-full">
            <Link
              to="/user/advancd-salary"
              className="flex items-center gap-2 p-2 hover:bg-blue-500 hover:text-white"
            >
              <SalaryIcon className="w-6" />
              {isExpanded && (
                <span className="ml-2">เบิกเงิน</span>
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
                <span className="ml-2">Day-Off</span>
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
                    <span className="ml-2">Approved</span>
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
                    <span className="ml-2">Dashboard</span>
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
                    <span className="ml-2">User Management</span>
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
                    <span className="ml-2">Worktime Record</span>
                  )}
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;