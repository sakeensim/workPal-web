import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import moment from 'moment/min/moment-with-locales'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Clock,
  MapPin,
  User,
  Wallet,
  LogIn,
  LogOut,
  Umbrella,
  BriefcaseBusiness,
  Timer,
  XCircle,
  CalendarCheck2,
  CalendarDays,
  Eye,
  EyeOff,
} from 'lucide-react'

import useAuthStore from '../store/auth-store'
import timeStore from '../store/time-store'
import API_URL from '../utils/api'
import { createAlert } from '../utils/createAlert'

moment.locale('th')

function Home() {
  const navigate = useNavigate()

  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const { time, actionCheckIn, actionCheckOut } = timeStore()

  const [now, setNow] = useState(new Date())
  const [profile, setProfile] = useState({})
  const [summary, setSummary] = useState({})
  const [requests, setRequests] = useState([])
  const [historyLogs, setHistoryLogs] = useState({})
  const [shifts, setShifts] = useState([])
  const [selectedShiftId, setSelectedShiftId] = useState('')
  const [canUseOT, setCanUseOT] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeNormal, setActiveNormal] = useState(null)
  const [activeOT, setActiveOT] = useState(null)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [showRemainingSalary, setShowRemainingSalary] = useState(false)

  const monthLabel = moment(now).locale('th').format('MMMM')
  const remainingDayOffs = Number(profile?.remainingDayOffs || 0)

  const isNormalExpired = activeNormal
    ? checkNormalExpired(activeNormal, now)
    : false

  const isOTExpired = activeOT ? checkOTExpired(activeOT, profile, now) : false

  const hasWorkingNormal =
    activeNormal?.status === 'ACTIVE' &&
    activeNormal?.checkIn &&
    !activeNormal?.checkOut &&
    !isNormalExpired

  const hasWorkingOT =
    activeOT?.status === 'ACTIVE' &&
    activeOT?.checkIn &&
    !activeOT?.checkOut &&
    !isOTExpired

  const isCheckedIn = hasWorkingNormal || hasWorkingOT

  const activeRecord = hasWorkingNormal
    ? activeNormal
    : hasWorkingOT
      ? activeOT
      : null

  const activeType = hasWorkingNormal ? 'NORMAL' : hasWorkingOT ? 'OT' : null

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (token) fetchHomeData()
  }, [token])

  useEffect(() => {
    if (!token) return

    const handleFocus = () => {
      fetchUnreadNotifications()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [token])

  const fetchHomeData = async () => {
    await Promise.allSettled([
      fetchUserHistory(),
      fetchMyShifts(),
      fetchApprovedRequests(),
      getProfile(),
      fetchUnreadNotifications(),
    ])
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
    }
  }

  const getProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/myProfile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setProfile(res.data.result || {})
    } catch (error) {
      console.log(error)
    }
  }

  const fetchApprovedRequests = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/approved-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setRequests(res.data.data || res.data.result || [])
    } catch (error) {
      console.log(error)
    }
  }

  const fetchMyShifts = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/my-shifts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const shiftData = res.data.result || res.data.data || []

      setShifts(shiftData)
      setCanUseOT(Boolean(res.data.allowOT))

      if (shiftData.length === 1) {
        setSelectedShiftId(String(shiftData[0].id))
      }
    } catch (error) {
      console.log(error)
    }
  }

  const fetchUserHistory = async () => {
    try {
      const month = moment(now).month() + 1
      const year = moment(now).year()

      const res = await axios.get(
        `${API_URL}/user/history?month=${month}&year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const logs = res.data.logs || {}

      setSummary(res.data.summary || {})
      setHistoryLogs(logs)

      if (res.data.profile) {
        setProfile((prev) => ({
          ...prev,
          ...res.data.profile,
        }))
      }

      const normalLogs = [
        ...getArray(logs.timetracking),
        ...getArray(logs.timeTrackings),
        ...getArray(logs.attendanceLogs),
      ]

      const normal = normalLogs.find((item) => {
        const status = getEffectiveAttendanceStatus(item)

        return (
          item.checkIn &&
          !item.checkOut &&
          status !== 'PRESENT' &&
          status !== 'COMPLETED' &&
          status !== 'EXPIRED' &&
          status !== 'CANCELLED' &&
          status !== 'CANCELED' &&
          status !== 'ABSENT' &&
          status !== 'DAY_OFF' &&
          status !== 'DAYOFF' &&
          status !== 'LEAVE' &&
          status !== 'HOLIDAY' &&
          status !== 'STORE_HOLIDAY'
        )
      })

      const ot =
        logs.activeOvertime ||
        getArray(logs.overtimeLogs).find(
          (item) => item.status === 'ACTIVE' && item.checkIn && !item.checkOut
        ) ||
        getArray(logs.otLogs).find(
          (item) => item.status === 'ACTIVE' && item.checkIn && !item.checkOut
        )

      setActiveNormal(normal || null)
      setActiveOT(ot || null)
    } catch (error) {
      console.log(error)
    }
  }

  const totalSalaryAdvance = useMemo(() => {
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return requests
      .filter((request) => {
        const isAdvance =
          request.type === 'salary' ||
          request.type === 'advanceSalary' ||
          request.type === 'salaryAdvance' ||
          request.type === 'advance' ||
          request.amount !== undefined

        const requestDate = new Date(
          request.requestDate || request.date || request.createdAt
        )

        return (
          isAdvance &&
          requestDate.getMonth() === currentMonth &&
          requestDate.getFullYear() === currentYear
        )
      })
      .reduce((sum, request) => sum + Number(request.amount || 0), 0)
  }, [requests, now])

  const dayOffUsed = useMemo(() => {
    if (summary.dayOffs !== undefined) return Number(summary.dayOffs || 0)
    if (summary.dayOffUsed !== undefined) return Number(summary.dayOffUsed || 0)

    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return requests.filter((request) => {
      const type = String(request.type || request.requestType || '').toLowerCase()

      const isDayOff =
        type === 'dayoff' ||
        type === 'dayOff' ||
        type.includes('leave') ||
        type.includes('dayoff')

      const requestDate = new Date(
        request.date || request.requestDate || request.createdAt
      )

      return (
        isDayOff &&
        requestDate.getMonth() === currentMonth &&
        requestDate.getFullYear() === currentYear
      )
    }).length
  }, [requests, summary, now])

  const displayAbsentDays = useMemo(() => {
    const rawAbsentDays = Number(summary.absentDays || 0)
    const shouldHideTodayAbsent = shouldHideTodayAbsentFromSummary(
      historyLogs,
      now
    )

    return Math.max(0, rawAbsentDays - (shouldHideTodayAbsent ? 1 : 0))
  }, [summary.absentDays, historyLogs, now])

  const latestItems = useMemo(() => {
    const normalLogs = uniqueRawLogs([
      ...getArray(historyLogs.timetracking),
      ...getArray(historyLogs.timeTrackings),
      ...getArray(historyLogs.attendanceLogs),
      activeNormal,
    ].filter(Boolean))

    const otLogs = uniqueRawLogs([
      ...getArray(historyLogs.overtimeLogs),
      ...getArray(historyLogs.overtimeTrackings),
      ...getArray(historyLogs.otLogs),
      activeOT,
    ].filter(Boolean))

    const storeHolidayLogs = [
      ...getArray(historyLogs.storeHoliday),
      ...getArray(historyLogs.storeHolidays),
      ...getArray(historyLogs.holidays),
      ...getArray(historyLogs.holidayLogs),
      ...getArray(historyLogs.storeHolidayLogs),
    ].filter(Boolean)

    const dayOffSources = [
      ...getArray(historyLogs.dayOff),
      ...getArray(historyLogs.dayOffs),
      ...getArray(historyLogs.leaveRequests),
      ...requests.filter((item) => getRequestType(item) === 'DAY_OFF'),
    ].filter(Boolean)

    const requestSources = [
      ...getArray(historyLogs.dayOff),
      ...getArray(historyLogs.dayOffs),
      ...getArray(historyLogs.leaveRequests),
      ...getArray(historyLogs.advanceSalary),
      ...getArray(historyLogs.advanceSalaries),
      ...getArray(historyLogs.salaryRequests),
      ...getArray(historyLogs.advanceRequests),
      ...requests,
    ].filter(Boolean)

    const existingDayOffDates = new Set(
      normalLogs
        .filter((item) => {
          const status = getEffectiveAttendanceStatus(item)

          return status === 'DAY_OFF'
        })
        .map((item) => formatDayKey(item.date || item.checkIn || item.createdAt))
        .filter(Boolean)
    )

    const existingHolidayDates = new Set(
      normalLogs
        .filter((item) => {
          const status = getEffectiveAttendanceStatus(item)

          return status === 'HOLIDAY'
        })
        .map((item) => formatDayKey(item.date || item.checkIn || item.createdAt))
        .filter(Boolean)
    )

    const workItems = [
      ...normalLogs.map((item) =>
        normalizeWorkLatestItem(item, 'NORMAL', profile, now)
      ),
      ...otLogs.map((item) =>
        normalizeWorkLatestItem(item, 'OT', profile, now)
      ),
    ].filter(Boolean)

    const leaveWorkItems = dayOffSources
      .filter((item) => normalizeRequestStatus(item.status) === 'APPROVED')
      .filter((item) => {
        const dateKey = formatDayKey(item.date || item.requestDate || item.createdAt)

        return dateKey && !existingDayOffDates.has(dateKey)
      })
      .map((item) => normalizeDayOffLatestItem(item, now))
      .filter(Boolean)

    const holidayItems = storeHolidayLogs
      .filter((item) => {
        const dateKey = formatDayKey(item.date || item.holidayDate || item.createdAt)

        return dateKey && !existingHolidayDates.has(dateKey)
      })
      .map((item) => normalizeStoreHolidayLatestItem(item))
      .filter(Boolean)

    const requestItems = requestSources
      .map((item) => normalizeRequestLatestItem(item))
      .filter(Boolean)
      .filter((item) => {
        const isApprovedDayOff =
          item.requestType === 'DAY_OFF' && item.statusCode === 'APPROVED'

        return !isApprovedDayOff
      })

    return uniqueLatestItems(
      uniqueByKey([
        ...workItems,
        ...leaveWorkItems,
        ...holidayItems,
        ...requestItems,
      ])
    )
      .sort((a, b) => getDateTime(b.sortDate) - getDateTime(a.sortDate))
      .slice(0, 3)
  }, [historyLogs, requests, activeNormal, activeOT, profile, now])

  const baseSalary = Number(profile?.baseSalary || 0)

  const remainingSalary =
    summary.finalSalary !== undefined
      ? Math.max(Number(summary.finalSalary || 0), 0)
      : Math.max(baseSalary - totalSalaryAdvance, 0)

  const remainingSalaryDisplay = showRemainingSalary
    ? `${remainingSalary.toLocaleString()} บาท`
    : '...'

  const toggleRemainingSalary = (event) => {
    event.stopPropagation()
    setShowRemainingSalary((prev) => !prev)
  }

  const totalOtHours = Number(summary.totalOtMinutes || 0) / 60

  const selectedShift = shifts.find(
    (shift) => String(shift.id) === String(selectedShiftId)
  )

  const currentShift = activeNormal?.shift || time?.shift || selectedShift || null

  const syncExpiredIfNeeded = async (latitude, longitude) => {
    if (activeNormal && isNormalExpired) {
      try {
        await actionCheckOut(token, latitude, longitude, 'auto-expired')
      } catch (error) {
        if (error.response?.data?.status !== 'EXPIRED') {
          throw error
        }
      }
    }

    if (activeOT && isOTExpired) {
      try {
        await axios.patch(
          `${API_URL}/user/overtime/end`,
          {
            latitude,
            longitude,
            noteOut: 'auto-expired',
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      } catch (error) {
        if (error.response?.data?.status !== 'EXPIRED') {
          console.log('OT expire sync failed:', error)
        }
      }
    }
  }

  const handleAttendance = () => {
    if (submitting) return

    if (!navigator.geolocation) {
      createAlert('error', 'อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง')
      return
    }

    if (!isCheckedIn && !selectedShiftId) {
      createAlert('error', 'กรุณาเลือกกะทำงานก่อน Check-in')
      return
    }

    setSubmitting(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          await syncExpiredIfNeeded(latitude, longitude)

          if (isCheckedIn) {
            if (activeType === 'OT') {
              await axios.patch(
                `${API_URL}/user/overtime/end`,
                {
                  latitude,
                  longitude,
                  noteOut: '',
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              )

              createAlert('success', 'จบ OT สำเร็จ')
            } else {
              await actionCheckOut(token, latitude, longitude, '')
              createAlert('success', 'Check-out สำเร็จ')
            }
          } else if (selectedShiftId === 'OT') {
            await axios.post(
              `${API_URL}/user/overtime/start`,
              {
                latitude,
                longitude,
                noteIn: '',
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            )

            createAlert('success', 'เริ่ม OT สำเร็จ')
          } else {
            await actionCheckIn(token, latitude, longitude, '', selectedShiftId)
            createAlert('success', 'Check-in สำเร็จ')
          }

          await fetchHomeData()
        } catch (error) {
          createAlert(
            'error',
            error.response?.data?.message || 'บันทึกเวลาไม่สำเร็จ'
          )

          await fetchHomeData()
        } finally {
          setSubmitting(false)
        }
      },
      () => {
        createAlert('error', 'กรุณาอนุญาตให้เข้าถึงตำแหน่ง')
        setSubmitting(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  return (
    <>
      <div className="min-h-dvh bg-[#F5F8FD] text-[#0F172A] lg:hidden">
        <div className="relative overflow-hidden rounded-b-[1.75rem] bg-gradient-to-br from-[#0057E7] via-[#0052D9] to-[#003BB5] px-4 pb-[96px] pt-6 text-white">
          <div className="absolute -right-24 top-14 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-24 bottom-[-110px] h-56 w-56 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-[54px] w-[54px] shrink-0 overflow-hidden rounded-full bg-white/20 ring-4 ring-white/25">
                {profile?.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt="profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/20">
                    <User size={24} />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-[20px] font-black leading-tight">
                  สวัสดี {profile?.firstname || user?.firstname || 'User'} 👋
                </h1>

                <p className="mt-0.5 truncate text-xs font-semibold text-white/90">
                  {profile?.position?.name || user?.role || 'Employee'}
                </p>

                <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-semibold text-white/80">
                  <MapPin size={11} />
                  {profile?.branch?.name || 'ยังไม่ได้กำหนดสาขา'}
                </p>

                <p className="mt-0.5 truncate text-[10px] font-medium text-white/60">
                  {profile?.branch?.address || 'ยังไม่มีที่อยู่สาขา'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/user/notifications')}
              className="relative -mt-2 shrink-0 rounded-full p-1 active:scale-95 lg:mt-0"
            >
              <Bell size={25} />

              {unreadNotificationCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-red-500 shadow-lg" />
              )}
            </button>
          </div>
        </div>

        <main className="relative z-10 -mt-[72px] space-y-3 px-3 pb-5">
          <section className="rounded-[1.6rem] bg-white p-3.5 shadow-[0_12px_30px_rgba(15,23,42,0.10)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-black">
                  {isCheckedIn ? 'กำลังทำงานอยู่' : 'เช็กอินเข้างาน'}
                </h2>

                <p className="mt-0.5 text-xs font-bold text-slate-600">
                  {isCheckedIn
                    ? activeType === 'OT'
                      ? 'กำลังทำ OT'
                      : currentShift
                        ? `${currentShift.name || 'กะทำงาน'} ${currentShift.checkInTime || ''} - ${currentShift.checkOutTime || ''}`
                        : 'กำลังอยู่ในรอบการทำงาน'
                    : 'เลือกกะทำงานวันนี้'}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-600">
                {isCheckedIn ? 'Checked In' : 'Ready'}
              </span>
            </div>

            {!isCheckedIn && (
              <div className="mt-3 rounded-2xl bg-slate-50 p-2.5">
                <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {shifts.map((shift) => (
                    <button
                      key={shift.id}
                      type="button"
                      onClick={() => setSelectedShiftId(String(shift.id))}
                      className={`min-w-[138px] shrink-0 rounded-xl border p-2.5 text-left transition ${
                        String(selectedShiftId) === String(shift.id)
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <p className="truncate text-sm font-black">
                        {shift.name || 'กะทำงาน'}
                      </p>

                      <p className="mt-1 whitespace-nowrap text-[11px] font-bold text-slate-500">
                        {shift.checkInTime} - {shift.checkOutTime}
                      </p>
                    </button>
                  ))}

                  {canUseOT && (
                    <button
                      type="button"
                      onClick={() => setSelectedShiftId('OT')}
                      className={`min-w-[138px] shrink-0 rounded-xl border p-2.5 text-left transition ${
                        selectedShiftId === 'OT'
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <p className="text-sm font-black text-slate-950">OT</p>

                      <p className="mt-1 whitespace-nowrap text-[11px] font-bold text-slate-500">
                        ทำงานล่วงเวลา
                      </p>
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="my-3 h-px bg-slate-200" />

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2.5 lg:gap-3">
                <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full border-4 border-blue-500 text-blue-500">
                  <Clock size={28} />
                </div>

                <div>
                  <p className="text-[28px] font-black leading-none">
                    {moment(now).format('HH:mm')}
                  </p>

                  <p className="mt-1 text-[11px] font-bold text-slate-500">
                    {moment(now).locale('th').format('D MMMM YYYY')}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAttendance}
              disabled={submitting}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#006BFF] to-[#0040C8] text-base font-black text-white shadow-lg disabled:opacity-60"
            >
              {isCheckedIn ? <LogOut size={24} /> : <LogIn size={24} />}

              {submitting
                ? 'กำลังบันทึก...'
                : isCheckedIn
                  ? activeType === 'OT'
                    ? 'จบ OT'
                    : 'เช็กเอาท์ออกงาน'
                  : 'เช็กอินเข้างาน'}
            </button>
          </section>

          <Card title="ภาพรวมของฉัน" subtitle={`ในเดือน ${monthLabel}`}>
            <div className="grid grid-cols-4 gap-2">
              <OverviewBox
                icon={<Umbrella size={14} />}
                label="วันลาเหลือ"
                value={`${remainingDayOffs} วัน`}
                color="green"
              />

              <OverviewBox
                icon={<Wallet size={14} />}
                label="เงินเหลือ"
                value={remainingSalaryDisplay}
                color="blue"
                canToggleValue
                isValueVisible={showRemainingSalary}
                onToggleValue={toggleRemainingSalary}
              />

              <OverviewBox
                icon={<BriefcaseBusiness size={14} />}
                label="ทำงาน"
                value={`${Number(summary.workingDays || 0)} วัน`}
                color="blue"
              />

              <OverviewBox
                icon={<Clock size={14} />}
                label="สาย"
                value={`${Number(summary.lateDays || 0)} วัน`}
                color="orange"
              />

              <OverviewBox
                icon={<XCircle size={14} />}
                label="ขาด"
                value={`${displayAbsentDays} วัน`}
                color="red"
              />

              <OverviewBox
                icon={<Timer size={14} />}
                label="OT"
                value={`${totalOtHours.toFixed(1)} ชม.`}
                color="blue"
              />

              <OverviewBox
                icon={<CalendarCheck2 size={14} />}
                label="ลาไปแล้ว"
                value={`${dayOffUsed} วัน`}
                color="green"
              />

              <OverviewBox
                icon={<Wallet size={14} />}
                label="เบิกแล้ว"
                value={`${totalSalaryAdvance.toLocaleString()} บาท`}
                color="blue"
              />
            </div>
          </Card>

          <Card
            title="รายการล่าสุด"
            action="ดูทั้งหมด"
            onAction={() => navigate('/user/history')}
          >
            {latestItems.length > 0 ? (
              latestItems.map((item, index) => (
                <React.Fragment key={item.key}>
                  <LatestActivityRow item={item} />

                  {index < latestItems.length - 1 && (
                    <div className="my-2 h-px bg-slate-200" />
                  )}
                </React.Fragment>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-400">
                ยังไม่มีรายการล่าสุด
              </p>
            )}
          </Card>
        </main>
      </div>

      <main className="hidden min-h-dvh bg-[#F5F8FD] px-3 py-3 text-[#0F172A] lg:block xl:px-4">
        <div className="mx-auto w-full max-w-none space-y-3">
          <section className="rounded-[1.15rem] bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.055)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-950">
                  {isCheckedIn ? 'กำลังทำงานอยู่' : 'เช็กอินเข้างาน'}
                </h1>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {isCheckedIn
                    ? activeType === 'OT'
                      ? 'กำลังทำ OT'
                      : currentShift
                        ? `${currentShift.name || 'กะทำงาน'} ${currentShift.checkInTime || ''} - ${currentShift.checkOutTime || ''}`
                        : 'กำลังอยู่ในรอบการทำงาน'
                    : 'เลือกกะทำงานวันนี้'}
                </p>
              </div>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-600">
                {isCheckedIn ? 'Checked In' : 'Ready'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-[minmax(0,1.35fr)_1px_minmax(220px,0.65fr)_1px_minmax(270px,0.75fr)] items-center gap-4">
              <div>
                {!isCheckedIn ? (
                  <div className="grid grid-cols-2 gap-2">
                    {shifts.map((shift) => (
                      <button
                        key={shift.id}
                        type="button"
                        onClick={() => setSelectedShiftId(String(shift.id))}
                        className={`flex min-h-[54px] items-center justify-between gap-2 rounded-[0.85rem] border px-2.5 py-2 text-left transition active:scale-[0.99] ${
                          String(selectedShiftId) === String(shift.id)
                            ? 'border-blue-500 bg-blue-50 shadow-[0_8px_20px_rgba(37,99,235,0.08)]'
                            : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-black text-slate-950">
                            {shift.name || 'กะทำงาน'}
                          </p>
                          <p className="mt-0.5 text-[11px] font-bold text-slate-500">
                            {shift.checkInTime} - {shift.checkOutTime}
                          </p>
                        </div>

                        {String(selectedShiftId) === String(shift.id) && (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                            <LogIn size={12} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    ))}

                    {canUseOT && (
                      <button
                        type="button"
                        onClick={() => setSelectedShiftId('OT')}
                        className={`min-h-[54px] rounded-[0.85rem] border px-2.5 py-2 text-left transition active:scale-[0.99] ${
                          selectedShiftId === 'OT'
                            ? 'border-blue-500 bg-blue-50 shadow-[0_8px_20px_rgba(37,99,235,0.08)]'
                            : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-xs font-black text-slate-950">OT</p>
                        <p className="mt-0.5 text-[11px] font-bold text-slate-500">
                          ทำงานล่วงเวลา
                        </p>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-[1rem] bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-black text-slate-500">
                      กะที่กำลังทำงาน
                    </p>
                    <p className="mt-0.5 text-base font-black text-slate-950">
                      {activeType === 'OT'
                        ? 'OT'
                        : currentShift?.name || 'กะทำงาน'}
                    </p>
                    <p className="mt-0.5 text-[11px] font-bold text-slate-500">
                      {activeType === 'OT'
                        ? 'ทำงานล่วงเวลา'
                        : `${currentShift?.checkInTime || ''} - ${currentShift?.checkOutTime || ''}`}
                    </p>
                  </div>
                )}
              </div>

              <div className="h-full w-px bg-slate-200" />

              <div className="flex items-center justify-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] border-blue-500 text-blue-600">
                  <Clock size={20} />
                </div>

                <div>
                  <p className="text-xl font-black leading-none text-slate-950">
                    {moment(now).format('HH:mm')}
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-slate-500">
                    {moment(now).locale('th').format('D MMMM YYYY')}
                  </p>
                </div>
              </div>

              <div className="h-full w-px bg-slate-200" />

              <div className="flex flex-col items-end justify-center">
                <button
                  type="button"
                  onClick={handleAttendance}
                  disabled={submitting}
                  className="mt-2.5 flex h-9 w-full min-w-[210px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#006BFF] to-[#0040C8] text-xs font-black text-white shadow-[0_7px_16px_rgba(37,99,235,0.16)] transition active:scale-[0.99] disabled:opacity-60"
                >
                  {isCheckedIn ? <LogOut size={17} /> : <LogIn size={17} />}
                  {submitting
                    ? 'กำลังบันทึก...'
                    : isCheckedIn
                      ? activeType === 'OT'
                        ? 'จบ OT'
                        : 'เช็กเอาท์ออกงาน'
                      : 'เช็กอินเข้างาน'}
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[1.15rem] bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
            <div className="mb-2.5">
              <h2 className="text-base font-black text-slate-950">
                ภาพรวมของฉัน
              </h2>
              <p className="mt-0.5 text-[11px] font-bold text-slate-400">
                ในเดือน {monthLabel}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2 lg:grid-cols-8 lg:gap-2">
              <OverviewBox
                icon={<Umbrella size={14} />}
                label="วันลาเหลือ"
                value={`${remainingDayOffs} วัน`}
                color="green"
              />
              <OverviewBox
                icon={<Wallet size={14} />}
                label="เงินเหลือ"
                value={remainingSalaryDisplay}
                color="blue"
                canToggleValue
                isValueVisible={showRemainingSalary}
                onToggleValue={toggleRemainingSalary}
              />
              <OverviewBox
                icon={<BriefcaseBusiness size={14} />}
                label="ทำงาน"
                value={`${Number(summary.workingDays || 0)} วัน`}
                color="blue"
              />
              <OverviewBox
                icon={<Clock size={14} />}
                label="สาย"
                value={`${Number(summary.lateDays || 0)} วัน`}
                color="orange"
              />
              <OverviewBox
                icon={<XCircle size={14} />}
                label="ขาด"
                value={`${displayAbsentDays} วัน`}
                color="red"
              />
              <OverviewBox
                icon={<Timer size={14} />}
                label="OT"
                value={`${totalOtHours.toFixed(1)} ชม.`}
                color="blue"
              />
              <OverviewBox
                icon={<CalendarCheck2 size={14} />}
                label="ลาไปแล้ว"
                value={`${dayOffUsed} วัน`}
                color="green"
              />
              <OverviewBox
                icon={<Wallet size={14} />}
                label="เบิกแล้ว"
                value={`${totalSalaryAdvance.toLocaleString()} บาท`}
                color="blue"
              />
            </div>
          </section>

          <section className="rounded-[1.15rem] bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-base font-black text-slate-950">
                รายการล่าสุด
              </h2>
              <button
                type="button"
                onClick={() => navigate('/user/history')}
                className="text-xs font-black text-blue-600"
              >
                ดูทั้งหมด ›
              </button>
            </div>

            {latestItems.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {latestItems.map((item) => (
                  <div key={item.key} className="py-1.5">
                    <LatestActivityRow item={item} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-slate-50 p-2.5 text-xs font-bold text-slate-400">
                ยังไม่มีรายการล่าสุด
              </p>
            )}
          </section>
        </div>
      </main>
    </>
  )
}

function checkNormalExpired(record, now) {
  const status = String(record?.status || '').toUpperCase()

  if (record?.checkOut) return false
  if (status === 'EXPIRED') return true
  if (status === 'ABSENT') return false
  if (status === 'DAY_OFF' || status === 'DAYOFF' || status === 'LEAVE') {
    return false
  }
  if (status === 'HOLIDAY' || status === 'STORE_HOLIDAY') return false
  if (record?.expiredAt) return moment(now).isAfter(moment(record.expiredAt))
  if (!record?.shift?.checkInTime || !record?.checkIn) return false

  const checkIn = moment(record.checkIn)
  const expiredAt = checkIn.clone().add(23.5, 'hours')

  return moment(now).isAfter(expiredAt)
}

function checkOTExpired(record, profile, now) {
  const status = String(record?.status || '').toUpperCase()

  if (record?.checkOut) return false
  if (status === 'EXPIRED') return true
  if (record?.expiredAt) return moment(now).isAfter(moment(record.expiredAt))
  if (!record?.checkIn) return false

  const cap = Number(profile?.position?.otCapMinutes || 0)

  if (!cap) return false

  const expiredAt = moment(record.checkIn).add(cap, 'minutes')

  return moment(now).isAfter(expiredAt)
}

function Card({ title, subtitle, action, onAction, children }) {
  return (
    <section className="rounded-[1.3rem] bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.08)] lg:rounded-[1.35rem] lg:p-4 lg:shadow-[0_10px_28px_rgba(15,23,42,0.055)]">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-black lg:text-lg">{title}</h2>

          {subtitle && (
            <p className="mt-0.5 text-xs font-bold text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        {action && (
          <button
            type="button"
            onClick={onAction}
            className="text-xs font-black text-blue-600"
          >
            {action} ›
          </button>
        )}
      </div>

      {children}
    </section>
  )
}

function OverviewBox({
  icon,
  label,
  value,
  color,
  canToggleValue = false,
  isValueVisible = true,
  onToggleValue,
}) {
  const iconColor = getStatIconColor(color)
  const EyeIcon = isValueVisible ? EyeOff : Eye

  return (
    <div className="relative rounded-[0.85rem] border border-slate-200 bg-white p-2 shadow-[0_6px_14px_rgba(15,23,42,0.035)] lg:rounded-[0.85rem] lg:p-2">
      <div
        className={`mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white ${iconColor}`}
      >
        {icon}
      </div>

      {canToggleValue && (
        <button
          type="button"
          onClick={onToggleValue}
          className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-50 text-slate-400 active:scale-95 lg:right-1.5 lg:top-1.5 lg:h-5 lg:w-5"
          aria-label={isValueVisible ? 'ซ่อนเงินเหลือ' : 'แสดงเงินเหลือ'}
        >
          <EyeIcon size={12} strokeWidth={2.7} className="lg:h-3 lg:w-3" />
        </button>
      )}

      <p className="truncate text-[8px] font-bold leading-tight text-slate-700 lg:text-[9px]">
        {label}
      </p>

      <p className="mt-0.5 truncate pr-4 text-[10px] font-black text-slate-950 lg:text-[11px]">
        {value}
      </p>
    </div>
  )
}

function getStatIconColor(color) {
  const styles = {
    blue: 'text-blue-600',
    green: 'text-emerald-600',
    orange: 'text-orange-500',
    red: 'text-red-500',
    purple: 'text-purple-600',
    yellow: 'text-yellow-600',
  }

  return styles[color] || styles.blue
}

function LatestActivityRow({ item }) {
  const iconStyles = getActivityColorStyles(item.color)
  const statusStyles = getStatusColorStyles(item.statusColor)

  return (
    <div className="flex items-center gap-2.5 lg:gap-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl lg:h-8 lg:w-8 ${iconStyles.icon}`}
      >
        {item.icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-950 lg:text-[12px]">
          {item.title}
        </p>

        <p className="mt-0.5 truncate text-xs font-bold text-slate-500 lg:text-[11px]">
          {item.meta}
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${statusStyles.badge}`}
      >
        {item.statusLabel}
      </span>
    </div>
  )
}

function getActivityColorStyles(color) {
  const styles = {
    blue: {
      icon: 'bg-blue-50 text-blue-600',
    },
    green: {
      icon: 'bg-emerald-50 text-emerald-600',
    },
    orange: {
      icon: 'bg-orange-50 text-orange-500',
    },
    red: {
      icon: 'bg-red-50 text-red-500',
    },
    purple: {
      icon: 'bg-blue-50 text-blue-600',
    },
    yellow: {
      icon: 'bg-blue-50 text-blue-600',
    },
  }

  return styles[color] || styles.blue
}

function getStatusColorStyles(color) {
  const styles = {
    green: {
      badge: 'bg-emerald-50 text-emerald-600',
    },
    red: {
      badge: 'bg-red-50 text-red-500',
    },
    orange: {
      badge: 'bg-blue-50 text-blue-600',
    },
    blue: {
      badge: 'bg-blue-50 text-blue-600',
    },
    yellow: {
      badge: 'bg-blue-50 text-blue-600',
    },
    slate: {
      badge: 'bg-slate-100 text-slate-500',
    },
  }

  return styles[color] || styles.slate
}

function normalizeWorkLatestItem(record, workType, profile, now) {
  if (!record) return null

  const rawStatus = getEffectiveAttendanceStatus(record)

  const checkIn = record.checkIn || record.startTime || null
  const checkOut = record.checkOut || record.endTime || null
  const date = checkOut || checkIn || record.date || record.createdAt

  if (!date) return null

  if (rawStatus === 'ABSENT') {
    if (shouldHideTodayAbsentRecord(record, now)) return null

    return {
      key: `WORK-ABSENT-${record.id || date}`,
      kind: 'WORK',
      workType: 'NORMAL',
      title: 'ขาดงาน',
      meta: formatLatestDay(date),
      statusCode: 'ABSENT',
      statusLabel: 'ขาดงาน',
      statusColor: 'red',
      color: 'red',
      icon: <XCircle size={20} />,
      sortDate: date,
      raw: record,
    }
  }

  if (rawStatus === 'DAY_OFF') {
    if (isFutureDay(date, now)) return null

    return {
      key: `WORK-DAY_OFF-${record.id || formatDayKey(date)}`,
      kind: 'WORK',
      workType: 'NORMAL',
      title: 'วันลา',
      meta: formatLatestDay(date),
      statusCode: 'DAY_OFF',
      statusLabel: 'ลา',
      statusColor: 'green',
      color: 'green',
      icon: <Umbrella size={20} />,
      sortDate: date,
      raw: record,
    }
  }

  if (rawStatus === 'HOLIDAY') {
    return {
      key: `WORK-HOLIDAY-${record.id || formatDayKey(date)}`,
      kind: 'WORK',
      workType: 'NORMAL',
      title: record.title || record.name || 'วันหยุดร้าน',
      meta: formatLatestDay(date),
      statusCode: 'HOLIDAY',
      statusLabel: 'วันหยุดร้าน',
      statusColor: 'blue',
      color: 'blue',
      icon: <CalendarDays size={20} />,
      sortDate: date,
      raw: record,
    }
  }

  const expired =
    workType === 'OT'
      ? checkOTExpired(record, profile, now)
      : checkNormalExpired(record, now)

  const hasEnded = Boolean(checkOut) || rawStatus === 'PRESENT'

  let statusCode = 'ACTIVE'
  let statusLabel = 'กำลังทำงาน'
  let statusColor = 'blue'
  let color = 'blue'
  let icon = workType === 'OT' ? <Timer size={20} /> : <LogIn size={20} />

  if (expired) {
    statusCode = 'EXPIRED'
    statusLabel = 'ลืมเช็คเอาท์'
    statusColor = 'blue'
    color = 'blue'
    icon = <XCircle size={20} />
  } else if (hasEnded) {
    statusCode = 'DONE'
    statusLabel = 'เช็คเอาท์แล้ว'
    statusColor = 'green'
    color = 'blue'
    icon = workType === 'OT' ? <Timer size={20} /> : <LogOut size={20} />
  }

  const title =
    workType === 'OT'
      ? checkOut
        ? 'จบ OT'
        : 'เริ่ม OT'
      : checkOut
        ? 'เช็กเอาท์ออกงาน'
        : 'เช็กอินเข้างาน'

  return {
    key: `WORK-${workType}-${record.id || date}`,
    kind: 'WORK',
    workType,
    title,
    meta: formatLatestDate(date),
    statusCode,
    statusLabel,
    statusColor,
    color,
    icon,
    sortDate: date,
    raw: record,
  }
}

function normalizeDayOffLatestItem(item, now) {
  const date = item.date || item.requestDate || item.createdAt
  const reason = item.reason || item.note || ''
  const leaveType = extractLeaveType(reason)

  if (!date) return null
  if (isFutureDay(date, now)) return null

  return {
    key: `WORK-DAY_OFF-${item.id || item.requestId || formatDayKey(date)}`,
    kind: 'WORK',
    workType: 'NORMAL',
    title: leaveType ? `วันลา (${leaveType})` : 'วันลา',
    meta: `${formatLatestDay(date)} · ${item.days || item.totalDays || 1} วัน`,
    statusCode: 'DAY_OFF',
    statusLabel: 'ลา',
    statusColor: 'green',
    color: 'green',
    icon: <Umbrella size={20} />,
    sortDate: date,
    raw: item,
  }
}

function normalizeStoreHolidayLatestItem(item) {
  const date = item.date || item.holidayDate || item.createdAt
  const title = item.title || item.name || item.reason || 'วันหยุดร้าน'

  if (!date) return null

  return {
    key: `WORK-HOLIDAY-${item.id || item.holidayId || formatDayKey(date)}`,
    kind: 'WORK',
    workType: 'NORMAL',
    title: 'วันหยุดร้าน',
    meta: `${formatLatestDay(date)} · ${title}`,
    statusCode: 'HOLIDAY',
    statusLabel: 'วันหยุดร้าน',
    statusColor: 'blue',
    color: 'blue',
    icon: <CalendarDays size={20} />,
    sortDate: date,
    raw: item,
  }
}

function normalizeRequestLatestItem(item) {
  if (!item) return null

  const requestType = getRequestType(item)
  const date = item.createdAt || item.requestDate || item.date || new Date()
  const status = normalizeRequestStatus(item.status)
  const title = requestType === 'ADVANCE' ? 'เบิกเงินล่วงหน้า' : 'ขอวันลา'
  const amount = Number(item.amount || item.advanceTaken || 0)

  const meta =
    requestType === 'ADVANCE' && amount > 0
      ? `${formatLatestDate(date)} · ${formatMoneyShort(amount)} บาท`
      : formatLatestDate(date)

  return {
    key: `REQUEST-${requestType}-${item.id || item.requestId || date}`,
    kind: 'REQUEST',
    requestType,
    title,
    meta,
    statusCode: status,
    statusLabel: getRequestStatusLabel(status),
    statusColor: getRequestStatusColor(status),
    color: requestType === 'ADVANCE' ? 'blue' : 'green',
    icon:
      requestType === 'ADVANCE' ? (
        <Wallet size={20} />
      ) : (
        <Umbrella size={20} />
      ),
    sortDate: date,
    raw: item,
  }
}

function getEffectiveAttendanceStatus(record) {
  const baseStatus = normalizeAttendanceStatus(record?.status)
  const timeStatus = normalizeAttendanceStatus(record?.timeStatus)

  if (
    baseStatus === 'PRESENT' &&
    ['ACTIVE', 'EXPIRED', 'CANCELLED'].includes(timeStatus)
  ) {
    return timeStatus
  }

  return baseStatus
}

function normalizeAttendanceStatus(status) {
  const value = String(status || '').toUpperCase()

  if (value === 'PRESENT' || value === 'COMPLETED') return 'PRESENT'
  if (value === 'ABSENT') return 'ABSENT'
  if (value === 'DAY_OFF' || value === 'DAYOFF' || value === 'LEAVE') {
    return 'DAY_OFF'
  }
  if (value === 'HOLIDAY' || value === 'STORE_HOLIDAY') return 'HOLIDAY'
  if (value === 'ACTIVE') return 'ACTIVE'
  if (value === 'EXPIRED') return 'EXPIRED'
  if (value === 'CANCELLED' || value === 'CANCELED') return 'CANCELLED'

  return value || 'UNKNOWN'
}

function shouldHideTodayAbsentFromSummary(historyLogs, now) {
  const normalLogs = [
    ...getArray(historyLogs.timetracking),
    ...getArray(historyLogs.timeTrackings),
    ...getArray(historyLogs.attendanceLogs),
  ].filter(Boolean)

  return normalLogs.some((record) => shouldHideTodayAbsentRecord(record, now))
}

function shouldHideTodayAbsentRecord(record, now) {
  if (!record) return false

  const status = getEffectiveAttendanceStatus(record)

  if (status !== 'ABSENT') return false

  const date = record.date || record.checkIn || record.createdAt

  if (!date) return false
  if (!moment(date).isSame(moment(now), 'day')) return false

  return moment(now).isBefore(moment(now).endOf('day'))
}

function isFutureDay(date, now) {
  if (!date) return false

  const targetDay = moment(date).startOf('day')
  const today = moment(now).startOf('day')

  return targetDay.isAfter(today)
}

function getRequestType(item) {
  const type = String(item.type || item.requestType || '').toLowerCase()

  if (
    type.includes('salary') ||
    type.includes('advance') ||
    item.amount !== undefined
  ) {
    return 'ADVANCE'
  }

  return 'DAY_OFF'
}

function normalizeRequestStatus(status) {
  const value = String(status || 'PENDING').toUpperCase()

  if (value === 'APPROVED') return 'APPROVED'
  if (value === 'REJECTED') return 'REJECTED'
  if (value === 'CANCELLED' || value === 'CANCELED') return 'REJECTED'

  return 'PENDING'
}

function getRequestStatusLabel(status) {
  if (status === 'APPROVED') return 'อนุมัติแล้ว'
  if (status === 'REJECTED') return 'ปฏิเสธ'

  return 'รออนุมัติ'
}

function getRequestStatusColor(status) {
  if (status === 'APPROVED') return 'green'
  if (status === 'REJECTED') return 'red'

  return 'blue'
}

function uniqueRawLogs(items) {
  const map = new Map()

  items.forEach((item) => {
    if (!item) return

    const type = item.checkIn || item.startTime ? 'WORK' : 'OTHER'
    const id =
      item.id ||
      item.timetrackingId ||
      item.timeTrackingId ||
      item.overtimeId ||
      ''
    const checkIn = item.checkIn || item.startTime || ''
    const checkOut = item.checkOut || item.endTime || ''
    const dateKey = formatDayKey(item.date || checkIn || item.createdAt)
    const fallback = `${type}-${dateKey}-${checkIn}-${checkOut}-${item.status || ''}`
    const key = id ? `${type}-${id}` : fallback

    if (!map.has(key)) {
      map.set(key, item)
    }
  })

  return Array.from(map.values())
}

function uniqueLatestItems(items) {
  const map = new Map()

  items.forEach((item) => {
    if (!item) return

    const date = moment(item.sortDate)
    const minuteKey = date.isValid() ? date.format('YYYY-MM-DD-HH:mm') : ''
    const smartKey =
      item.kind === 'WORK'
        ? `${item.kind}-${item.workType}-${item.statusCode}-${minuteKey}`
        : item.key

    if (!map.has(smartKey)) {
      map.set(smartKey, item)
    }
  })

  return Array.from(map.values())
}

function uniqueByKey(items) {
  const map = new Map()

  items.forEach((item) => {
    if (!item?.key) return

    map.set(item.key, item)
  })

  return Array.from(map.values())
}

function getArray(value) {
  return Array.isArray(value) ? value : []
}

function formatLatestDate(date) {
  const parsedDate = moment(date)

  if (!parsedDate.isValid()) return '-'

  if (parsedDate.isSame(moment(), 'day')) {
    return `วันนี้ · ${parsedDate.format('HH:mm')}`
  }

  return parsedDate.locale('th').format('D MMM · HH:mm')
}

function formatLatestDay(date) {
  const parsedDate = moment(date)

  if (!parsedDate.isValid()) return '-'

  if (parsedDate.isSame(moment(), 'day')) {
    return 'วันนี้'
  }

  return parsedDate.locale('th').format('D MMM YYYY')
}

function formatMoneyShort(amount) {
  return Number(amount || 0).toLocaleString('th-TH', {
    maximumFractionDigits: 0,
  })
}

function getDateTime(date) {
  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) return 0

  return parsedDate.getTime()
}

function formatDayKey(date) {
  if (!date) return ''

  const parsedDate = moment(date)

  if (!parsedDate.isValid()) return ''

  return parsedDate.format('YYYY-MM-DD')
}

function extractLeaveType(reason) {
  if (!reason) return ''

  const [maybeType] = String(reason).split(':')

  if (['ลาป่วย', 'ลากิจ', 'ลาพักร้อน', 'อื่น ๆ'].includes(maybeType)) {
    return maybeType
  }

  return ''
}

export default Home