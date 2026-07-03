import {
  Home,
  CalendarDays,
  ClipboardList,
  History,
  Settings,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

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
    name: 'ตั้งค่า',
    path: '/user/other',
    icon: Settings,
  },
]

export default function BottomNavbar() {
  const location = useLocation()

  const isActivePath = (path) => {
    if (path === '/user') {
      return location.pathname === '/user'
    }

    return location.pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[9999] md:hidden">
      <div className="mx-auto max-w-md px-3 pb-[calc(env(safe-area-inset-bottom)+8px)]">
        <div className="rounded-[1.7rem] border border-white/80 bg-white/95 px-2 py-2 shadow-[0_-10px_30px_rgba(15,23,42,0.10)] backdrop-blur-xl">
          <div className="flex h-[64px] items-center justify-between">
            {menus.map((item) => {
              const Icon = item.icon
              const isActive = isActivePath(item.path)

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="flex flex-1 flex-col items-center justify-center"
                >
                  <div
                    className={`flex h-9 min-w-9 items-center justify-center rounded-2xl px-3 transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)]'
                        : 'bg-transparent text-slate-400'
                    }`}
                  >
                    <Icon
                      size={21}
                      strokeWidth={isActive ? 2.8 : 2.3}
                    />
                  </div>

                  <span
                    className={`mt-1 text-[11px] font-black leading-none transition-all ${
                      isActive ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  >
                    {item.name}
                  </span>
                </NavLink>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}