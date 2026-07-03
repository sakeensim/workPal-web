import React from 'react'
import { Route, Routes } from 'react-router'

import Layout from '../layouts/Layout'
import Login from '../pages/Login'
import RequestPage from '../userPage/RequestPage'
import Profile from '../userPage/Profile'
import UserHistoryPage from '../userPage/UserHistoryPage'
import Home from '../userPage/Home'
import BranchPage from '../adminPage/BranchPage'
import AdminApprovalPage from '../adminPage/AdminApprovalPage'
import UserManagement from '../adminPage/UserManagement'
import ServerLog from '../adminPage/ServerLog'
import BranchSetting from '../adminPage/BranchSetting'
import ProtectRoutes from './ProtectRoutes'
import UserCalendarPage from '../userPage/UserCalendarPage'
import Other from '../userPage/Other'
import Notification from '../userPage/Notification'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="/user"
        element={
          <ProtectRoutes
            el={<Layout />}
            allows={['OWNER', 'ADMIN', 'USER']}
          />
        }
      >
        <Route index element={<Home />} />
        <Route path="profile" element={<Profile />} />
        <Route path="history" element={<UserHistoryPage />} />
        <Route path="calendar" element={<UserCalendarPage />} />
        <Route path="request" element={<RequestPage />} />
        <Route path="other" element={<Other />} />
        <Route path="notifications" element={<Notification />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectRoutes
            el={<Layout />}
            allows={['OWNER', 'ADMIN']}
          />
        }
      >
        <Route index element={<AdminApprovalPage />} />
        <Route path="user-management" element={<UserManagement />} />
        <Route path="branch" element={<BranchPage />} />
        <Route path="branch/:branchId/settings" element={<BranchSetting />} />
        {/* OWNER only */}
        <Route
          path="audit-logs"
          element={
            <ProtectRoutes
              el={<ServerLog />}
              allows={['OWNER']}
            />
          }
        />
      </Route>
    </Routes>
  )
}

export default AppRoutes