import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  CalendarDays,
  ClipboardList,
  History,
  Ellipsis,
} from 'lucide-react'

import workPalIcon from '/icons/logo.png'

const menus = [
  {
    name: 'หน้าหลัก',
    path: '/user',
    icon: Home,
  },
  {
    name: 'ตารางงาน',
    path: '/user/calendar',
    icon: CalendarDays,
  },
  {
    name: 'คำขอ',
    path: '/user/request',
    icon: ClipboardList,
  },
  {
    name: 'ประวัติ',
    path: '/user/history',
    icon: History,
  },
  {
    name: 'อื่นๆ',
    path: '/user/other',
    icon: Ellipsis,
  },
]

function Sidebar() {
  const location = useLocation()

  const isActivePath = (path) => {
    if (path === '/user') {
      return location.pathname === '/user'
    }

    return location.pathname.startsWith(path)
  }

  return (
    <aside className="sticky top-0 hidden h-dvh max-h-dvh w-[260px] shrink-0 flex-col border-r border-slate-100 bg-white text-[#0F172A] shadow-[10px_0_30px_rgba(15,23,42,0.035)] md:flex">
      <div className="flex h-24 shrink-0 items-center px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-transparent">
            <img
              src={workPalIcon}
              alt="WorkPal icon"
              className="h-full w-full scale-[1.35] object-cover"
            />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black tracking-tight">
              <span className="text-blue-600">Work</span>
              <span className="text-slate-950">Pal</span>
            </h1>

            <p className="mt-0.5 truncate text-[11px] font-bold text-slate-400">
              Employee System
            </p>
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden px-4 pb-6">
        {menus.map((item) => {
          const Icon = item.icon
          const isActive = isActivePath(item.path)

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`group relative flex h-14 items-center gap-3 rounded-2xl px-4 transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)]'
                  : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-blue-600'
                }`}
              >
                <Icon size={21} strokeWidth={isActive ? 2.8 : 2.4} />
              </div>

              <span
                className={`text-sm font-black tracking-tight ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-500 group-hover:text-blue-600'
                }`}
              >
                {item.name}
              </span>
            </NavLink>
          )
        })}
      </nav>

      <div className="shrink-0 px-6 pb-6">
        <div className="rounded-2xl bg-[#F5F8FD] px-4 py-3">
          <p className="text-xs font-black text-slate-500">WorkPal v1.0</p>

          <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
            Attendance & Request
          </p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar