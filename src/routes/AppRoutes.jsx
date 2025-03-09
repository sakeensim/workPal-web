import React from 'react'
import { Route, Routes } from 'react-router'
import Layout from '../layouts/Layout'
import Login from '../pages/Login'
import Register from '../pages/Register'
import { Outlet } from 'react-router'
import Profile from '../userPage/Profile'
import CheckIn from '../userPage/CheckIn'
import CheckOut from '../userPage/CheckOut'
import DayOff from '../userPage/DayOff'
import AdvanceSalary from '../userPage/AdvanceSalary'
import AdminApprovalPage from '../adminPage/AdminApprovalPage'
import ProtectRoutes from './ProtectRoutes'


function AppRoutes() {
    return (
        <>
            <Routes>
                {/* Public */}

                <Route path='/' element={<Login />} />
                <Route path='register' element={<Register />} />


                {/* Private [USER]*/}
                <Route path='user' element={<ProtectRoutes el={<Layout />} allows={['ADMIN','USER']} />}>
                    <Route index element={<Profile />} />
                    <Route path='check-in' element={<CheckIn />} />
                    <Route path='check-out' element={<CheckOut />} />
                    <Route path='day-off' element={<DayOff />} />
                    <Route path='advancd-salary' element={<AdvanceSalary />} />
                </Route>

                {/* Private [ADMIN] */}
                <Route path='admin' element={<ProtectRoutes el={<Layout />} allows={['ADMIN']} />}>
                    <Route index element={<AdminApprovalPage />} />
                </Route>

            </Routes>
        </>
    )
}

export default AppRoutes