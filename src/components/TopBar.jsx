import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, User } from 'lucide-react'

import API_URL from '../utils/api'
import useAuthStore from '../store/auth-store'

function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const dropdownRef = useRef(null)

  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore(
    (state) =>
      state.actionLogout ||
      state.logout ||
      state.clearAuth ||
      state.actionClearAuth
  )

  const [profile, setProfile] = useState(user || {})
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    if (!token) return

    fetchProfile()
    fetchUnreadNotifications()
  }, [token])

  useEffect(() => {
    if (!token) return

    fetchUnreadNotifications()
  }, [token, location.pathname])

  useEffect(() => {
    if (!token) return

    const handleRefresh = () => {
      fetchUnreadNotifications()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadNotifications()
      }
    }

    window.addEventListener('focus', handleRefresh)
    window.addEventListener('pageshow', handleRefresh)
    window.addEventListener('notifications-updated', handleRefresh)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleRefresh)
      window.removeEventListener('pageshow', handleRefresh)
      window.removeEventListener('notifications-updated', handleRefresh)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [token])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!dropdownRef.current) return

      if (!dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/myProfile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const nextProfile = res.data.result || res.data.data || res.data || {}
      setProfile(nextProfile)
    } catch (error) {
      console.log(error)
    }
  }

  const fetchUnreadNotifications = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/user/notifications?limit=1&unreadOnly=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const nextUnreadCount =
        res.data.unreadCount !== undefined
          ? Number(res.data.unreadCount || 0)
          : (res.data.data || []).filter((item) => !item.isRead).length

      setUnreadNotificationCount(nextUnreadCount)
    } catch (error) {
      console.log(error)
      setUnreadNotificationCount(0)
    }
  }

  const handleGoNotifications = () => {
    fetchUnreadNotifications()
    navigate('/user/notifications')
  }

  const handleLogout = () => {
    if (logout) {
      logout()
    }

    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('auth-storage')
    localStorage.removeItem('time-storage')
    localStorage.removeItem('salary-storage')

    navigate('/')
  }

  const fullName = useMemo(() => {
    return (
      [profile?.firstname, profile?.lastname].filter(Boolean).join(' ') ||
      profile?.name ||
      user?.firstname ||
      'ผู้ใช้งาน'
    )
  }, [profile, user])

  const initials = useMemo(() => {
    const first = profile?.firstname || profile?.name || user?.firstname || 'U'
    const last = profile?.lastname || user?.lastname || ''

    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
  }, [profile, user])

  const positionText =
    profile?.position?.name || profile?.role || user?.role || 'Employee'

  const hasUnreadNotification = unreadNotificationCount > 0

  return (
    <header className="sticky top-0 z-40 hidden h-[78px] items-center justify-end border-b border-slate-100 bg-white/95 px-7 shadow-[0_8px_28px_rgba(15,23,42,0.035)] backdrop-blur-xl md:flex">
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={handleGoNotifications}
          className="relative flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-50 hover:text-blue-600 active:scale-95"
        >
          <Bell size={22} strokeWidth={2.4} />

          {hasUnreadNotification && (
            <span className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full bg-red-500 shadow-lg" />
          )}
        </button>

        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-2xl px-2 py-1.5 transition hover:bg-slate-50 active:scale-[0.98]"
          >
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]">
              {profile?.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt="profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-black">
                  {initials}
                </div>
              )}
            </div>

            <p className="max-w-[170px] truncate text-sm font-black text-slate-950">
              {fullName}
            </p>

            <ChevronDown
              size={18}
              strokeWidth={2.7}
              className={`text-slate-500 transition ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] w-[250px] overflow-hidden rounded-[1.3rem] border border-slate-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.14)]">
              <div className="flex items-center gap-3 border-b border-slate-100 p-3.5">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-blue-600 text-white">
                  {profile?.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt="profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-black">
                      {initials}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-950">
                    {fullName}
                  </p>

                  <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                    {positionText}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false)
                  navigate('/user/profile')
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
              >
                <User size={18} strokeWidth={2.5} />
                โปรไฟล์ของฉัน
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-red-500 transition hover:bg-red-50"
              >
                <LogOut size={18} strokeWidth={2.5} />
                ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default TopBar