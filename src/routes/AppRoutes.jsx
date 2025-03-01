import React from 'react'
import { Route, Routes } from 'react-router'
import Layout from '../layouts/Layout'
import Login from '../pages/Login'
import Register from '../pages/Register'

function AppRoutes() {
    return (
        <>
            <Routes>
                {/* Public */}

                <Route path='/' element={<Login/>} />
                <Route path='register' element={<Register/>} />


                {/* Private [USER]*/}
                <Route path='user' element={<Layout />}>
                    <Route index element={<h1>Profile</h1>} />
                    <Route path='check-in' element={<h1>Check-in</h1>} />
                    <Route path='check-out' element={<h1>Check-out</h1>} />
                    <Route path='day-off' element={<h1>Day-0ff</h1>} />
                    <Route path='advancd-salary' element={<h1>Advance- Salary</h1>} />
                </Route>

                {/* Private [ADMIN] */}
                <Route path='admin' element={<Layout />}>
                <Route path='approved' element={<h1>Approved</h1>} />
                </Route>

            </Routes>
        </>
    )
}

export default AppRoutes