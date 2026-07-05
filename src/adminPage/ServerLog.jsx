import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  LogOut,
  Mail,
  Phone,
  ScrollText,
  UserRound,
  UsersRound,
} from 'lucide-react'

import API_URL from '../utils/api'
import useAuthStore from '../store/auth-store'

function Other() {
  const navigate = useNavigate()

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
  const [profileLoading, setProfileLoading] = useState(Boolean(token))

  useEffect(() => {
    if (token) {
      getProfile()
    } else {
      setProfileLoading(false)
    }
  }, [token])

  const clearLocalAuth = () => {
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

  const getProfile = async () => {
    try {
      setProfileLoading(true)

      const res = await axios.get(`${API_URL}/user/myProfile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const nextProfile = res.data.result || res.data.data || res.data || {}
      setProfile(nextProfile)
    } catch (error) {
      console.log(error)

      if (
        error.response?.status === 401 ||
        error.response?.status === 403 ||
        error.response?.status === 404
      ) {
        clearLocalAuth()
      }
    } finally {
      setProfileLoading(false)
    }
  }

  const handleLogout = () => {
    clearLocalAuth()
  }

  const safeBranch = useMemo(() => {
    if (!profile?.branchId) return null
    if (!profile?.branch) return null
    if (profile.branch.isActive === false) return null
    if (profile.branch.isDeleted === true) return null

    return profile.branch
  }, [profile])

  const safePosition = useMemo(() => {
    if (!profile?.positionId) return null
    if (!profile?.position) return null
    if (profile.position.isActive === false) return null
    if (profile.position.isDeleted === true) return null

    if (
      profile?.branchId &&
      profile.position.branchId &&
      Number(profile.position.branchId) !== Number(profile.branchId)
    ) {
      return null
    }

    return profile.position
  }, [profile])

  const fullName =
    [profile?.firstname, profile?.lastname].filter(Boolean).join(' ') ||
    profile?.name ||
    user?.firstname ||
    'ผู้ใช้งาน'

  const role = String(profile?.role || user?.role || '').toUpperCase()
  const verifiedRole = String(profileLoading ? '' : profile?.role || '').toUpperCase()

  const metaText = [safePosition?.name || role, safeBranch?.name]
    .filter(Boolean)
    .join(' · ')

  const canAccessAdmin = verifiedRole === 'ADMIN' || verifiedRole === 'OWNER'
  const canManageBranch = canAccessAdmin
  const canManageEmployees = canAccessAdmin
  const canApproveRequests = canAccessAdmin
  const canViewServerLog = verifiedRole === 'OWNER'

  const managementMenus = [
    {
      show: canApproveRequests,
      title: 'อนุมัติคำขอ',
      subtitle: 'ตรวจสอบและอนุมัติคำขอจากพนักงาน',
      path: '/admin',
      icon: CheckCircle2,
    },
    {
      show: canManageBranch,
      title: 'การจัดการสาขา',
      subtitle: 'จัดการข้อมูลสาขาและหน่วยงาน',
      path: '/admin/branch',
      icon: Building2,
    },
    {
      show: canManageEmployees,
      title: 'การจัดการพนักงาน',
      subtitle: 'จัดการข้อมูลพนักงานและสิทธิ์การใช้งาน',
      path: '/admin/user-management',
      icon: UsersRound,
    },
    {
      show: canViewServerLog,
      title: 'Server Log',
      subtitle: 'เฉพาะ Owner เท่านั้นที่ดูบันทึกระบบได้',
      path: '/admin/audit-logs',
      icon: ScrollText,
    },
  ].filter((item) => item.show)

  const canShowManagement = managementMenus.length > 0

  return (
    <div className="min-h-dvh bg-[#F5F8FD] px-3.5 pb-32 pt-4 text-[#0F172A] lg:px-6 lg:pb-8 lg:pt-6">
      <div className="mx-auto w-full max-w-md space-y-5 lg:max-w-5xl xl:max-w-6xl">
        <div className="lg:rounded-[1.55rem] lg:border lg:border-blue-100/70 lg:bg-white/45 lg:p-6 lg:shadow-[0_14px_42px_rgba(15,23,42,0.045)] xl:p-7">
          <header className="flex flex-col items-start justify-center lg:mb-5">
            <h1 className="text-2xl font-black tracking-tight text-slate-950 lg:text-3xl">
              อื่นๆ
            </h1>

            <p className="mt-0.5 text-sm font-semibold text-slate-400 lg:mt-1.5 lg:text-sm">
              จัดการโปรไฟล์ ระบบ และการใช้งานของคุณ
            </p>
          </header>

          <section className="rounded-[1.55rem] bg-white p-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.06)] lg:rounded-[1.45rem] lg:p-5 lg:shadow-[0_14px_34px_rgba(15,23,42,0.065)]">
            <div className="flex items-center gap-3.5 lg:gap-5">
              <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full bg-blue-50 lg:h-24 lg:w-24">
                {profile?.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt="profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-blue-600">
                    <UserRound
                      size={35}
                      strokeWidth={2.5}
                      className="lg:h-11 lg:w-11"
                    />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 lg:items-center lg:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-black text-slate-950 lg:text-xl">
                      {fullName}
                    </p>

                    <div className="lg:hidden">
                      {profile?.phone && (
                        <p className="mt-0.5 truncate text-xs font-bold text-slate-500">
                          {profile.phone}
                        </p>
                      )}

                      {profile?.email && (
                        <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">
                          {profile.email}
                        </p>
                      )}

                      {metaText && (
                        <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">
                          {metaText}
                        </p>
                      )}
                    </div>

                    <div className="hidden lg:mt-3 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-2">
                      {profile?.phone && (
                        <InfoLine icon={Phone} text={profile.phone} />
                      )}

                      {profile?.email && (
                        <InfoLine icon={Mail} text={profile.email} />
                      )}

                      {safePosition?.name || role ? (
                        <InfoLine
                          icon={UsersRound}
                          text={safePosition?.name || role}
                        />
                      ) : null}

                      {safeBranch?.name && (
                        <InfoLine icon={Building2} text={safeBranch.name} />
                      )}
                    </div>

                    <div className="mt-2 space-y-2 lg:mt-3">
                      {profile?.branchId && !safeBranch && (
                        <p className="rounded-full bg-orange-50 px-2 py-1 text-[11px] font-bold text-orange-500 lg:inline-flex lg:px-2.5 lg:py-1.5 lg:text-[11px]">
                          สาขาถูกปิดใช้งานหรือถูกลบแล้ว
                        </p>
                      )}

                      {profile?.positionId && !safePosition && (
                        <p className="rounded-full bg-orange-50 px-2 py-1 text-[11px] font-bold text-orange-500 lg:inline-flex lg:px-2.5 lg:py-1.5 lg:text-[11px]">
                          ตำแหน่งไม่ตรงกับสาขา หรือถูกปิดใช้งานแล้ว
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/user/profile')}
                    className="ml-auto flex shrink-0 items-center gap-1 self-center text-sm font-black text-blue-600 active:scale-95 lg:self-center lg:h-auto lg:bg-transparent lg:px-0 lg:text-sm lg:shadow-none"
                  >
                    ดูโปรไฟล์
                    <ChevronRight size={18} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {canShowManagement && (
            <section className="space-y-2 lg:mt-6">
              <p className="px-1 text-sm font-black text-slate-500 lg:text-base">
                จัดการระบบ
              </p>

              <div className="overflow-hidden rounded-[1.45rem] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] lg:grid lg:grid-cols-2 lg:gap-4 lg:overflow-visible lg:bg-transparent lg:shadow-none">
                {managementMenus.map((item, index) => {
                  const Icon = item.icon

                  return (
                    <React.Fragment key={item.path}>
                      {index > 0 && (
                        <div className="mx-3.5 h-px bg-slate-100 lg:hidden" />
                      )}

                      <button
                        type="button"
                        onClick={() => navigate(item.path)}
                        className="flex w-full items-center gap-3 p-3.5 text-left active:bg-blue-50 lg:min-h-[94px] lg:rounded-[1.25rem] lg:bg-white lg:p-4 lg:shadow-[0_10px_24px_rgba(15,23,42,0.055)] lg:transition lg:hover:-translate-y-0.5 lg:hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 lg:h-12 lg:w-12 lg:rounded-2xl">
                          <Icon
                            size={22}
                            strokeWidth={2.6}
                            className="lg:h-6 lg:w-6"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-slate-950 lg:text-base">
                            {item.title}
                          </p>

                          <p className="mt-0.5 hidden text-xs font-semibold leading-5 text-slate-400 lg:line-clamp-2">
                            {item.subtitle}
                          </p>
                        </div>

                        <ChevronRight
                          size={20}
                          strokeWidth={3}
                          className="shrink-0 text-slate-400 lg:h-5 lg:w-5"
                        />
                      </button>
                    </React.Fragment>
                  )
                })}
              </div>
            </section>
          )}

          <section className="space-y-2 lg:hidden">
            <p className="px-1 text-sm font-black text-slate-500">
              การใช้งาน
            </p>

            <div className="overflow-hidden rounded-[1.45rem] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 p-3.5 text-left active:bg-red-50"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                  <LogOut size={22} strokeWidth={2.6} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-950">
                    ออกจากระบบ
                  </p>
                </div>

                <ChevronRight
                  size={20}
                  strokeWidth={3}
                  className="shrink-0 text-slate-400"
                />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function InfoLine({ icon: Icon, text }) {
  if (!text) return null

  return (
    <p className="truncate font-semibold text-slate-500 lg:flex lg:items-center lg:gap-2 lg:text-xs">
      <Icon
        size={16}
        strokeWidth={2.4}
        className="hidden shrink-0 text-slate-400 lg:block lg:h-4 lg:w-4"
      />
      <span className="truncate">{text}</span>
    </p>
  )
}

export default Other