import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import moment from 'moment/min/moment-with-locales'
import { useLocation } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Wallet,
  CalendarCheck2,
  ClipboardList,
  XCircle,
  Clock,
  Timer,
  Loader2,
  BriefcaseBusiness,
  Umbrella,
  LogIn,
  LogOut,
  CalendarDays,
  AlertCircle,
  UserRound,
} from 'lucide-react'

import API_URL from '../utils/api'
import useAuthStore from '../store/auth-store'

moment.locale('th')

const TABS = {
  ATTENDANCE: 'ATTENDANCE',
  REQUESTS: 'REQUESTS',
  ADMIN_REQUESTS: 'ADMIN_REQUESTS',
}

function UserHistoryPage() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()
  const historyListRef = useRef(null)

  const [month, setMonth] = useState(new Date())
  const [now, setNow] = useState(new Date())
  const [data, setData] = useState(null)
  const [adminRequests, setAdminRequests] = useState([])
  const [activeTab, setActiveTab] = useState(TABS.ATTENDANCE)
  const [loading, setLoading] = useState(true)
  const [adminLoading, setAdminLoading] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(true)

  const profile = data?.profile || {}
  const logs = data?.logs || {}
  const summary = data?.summary || {}

  const role = String(profile?.role || user?.role || '').toUpperCase()
  const canViewAdminRequests = role === 'ADMIN' || role === 'OWNER'

  const shouldOpenRequests = useMemo(() => {
    const params = new URLSearchParams(location.search)

    return (
      params.get('tab') === 'requests' ||
      location.hash === '#requests' ||
      location.state?.activeTab === TABS.REQUESTS ||
      location.state?.scrollTo === 'requests'
    )
  }, [location.search, location.hash, location.state])

  const shouldOpenAdminRequests = useMemo(() => {
    const params = new URLSearchParams(location.search)

    return (
      params.get('tab') === 'admin-requests' ||
      location.hash === '#admin-requests' ||
      location.state?.activeTab === TABS.ADMIN_REQUESTS ||
      location.state?.scrollTo === 'admin-requests'
    )
  }, [location.search, location.hash, location.state])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (shouldOpenRequests) {
      setActiveTab(TABS.REQUESTS)
    }
  }, [shouldOpenRequests])

  useEffect(() => {
    if (shouldOpenAdminRequests && canViewAdminRequests) {
      setActiveTab(TABS.ADMIN_REQUESTS)
    }
  }, [shouldOpenAdminRequests, canViewAdminRequests])

  useEffect(() => {
    if (!canViewAdminRequests && activeTab === TABS.ADMIN_REQUESTS) {
      setActiveTab(TABS.ATTENDANCE)
    }
  }, [canViewAdminRequests, activeTab])

  useEffect(() => {
    if (!loading && (shouldOpenRequests || shouldOpenAdminRequests)) {
      const timer = setTimeout(() => {
        historyListRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 120)

      return () => clearTimeout(timer)
    }
  }, [loading, shouldOpenRequests, shouldOpenAdminRequests])

  useEffect(() => {
    if (token) fetchHistory()
  }, [token, month])

  useEffect(() => {
    if (token && canViewAdminRequests) {
      fetchAdminRequestHistory()
    } else {
      setAdminRequests([])
    }
  }, [token, month, canViewAdminRequests])

  const fetchHistory = async () => {
    try {
      setLoading(true)

      const res = await axios.get(`${API_URL}/user/history`, {
        params: {
          month: month.getMonth() + 1,
          year: month.getFullYear(),
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setData(res.data)
    } catch (error) {
      console.log(error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchAdminRequestHistory = async () => {
    try {
      setAdminLoading(true)

      const res = await axios.get(`${API_URL}/admin/request-history`, {
        params: {
          month: month.getMonth() + 1,
          year: month.getFullYear(),
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const payload = res.data.data || res.data.result || res.data || {}
      setAdminRequests(extractAdminRequestList(payload))
    } catch (error) {
      console.log(error)
      setAdminRequests([])
    } finally {
      setAdminLoading(false)
    }
  }

  const changeMonth = (value) => {
    const newDate = new Date(month)
    newDate.setMonth(newDate.getMonth() + value)
    setMonth(newDate)
  }

  const goThisMonth = () => {
    setMonth(new Date())
  }

  const safeBranch = useMemo(() => {
    if (!profile?.branch) return null
    if (profile.branch.isActive === false) return null
    if (profile.branch.isDeleted === true) return null

    return profile.branch
  }, [profile])

  const safePosition = useMemo(() => {
    if (!profile?.position) return null
    if (profile.position.isActive === false) return null
    if (profile.position.isDeleted === true) return null

    if (
      profile?.branch?.id &&
      profile.position.branchId &&
      Number(profile.position.branchId) !== Number(profile.branch.id)
    ) {
      return null
    }

    return profile.position
  }, [profile])

  const organizationWarning = useMemo(() => {
    if (!profile?.id) return ''

    if (profile.branch && !safeBranch) {
      return 'สาขาของบัญชีนี้ถูกปิดใช้งานหรือถูกลบแล้ว'
    }

    if (profile.position && !safePosition) {
      return 'ตำแหน่งของบัญชีนี้ไม่ตรงกับสาขา หรือถูกปิดใช้งานแล้ว'
    }

    if (!profile.branch) {
      return 'บัญชีนี้ยังไม่ได้ถูกกำหนดสาขา'
    }

    if (!profile.position) {
      return 'บัญชีนี้ยังไม่ได้ถูกกำหนดตำแหน่ง'
    }

    return ''
  }, [profile, safeBranch, safePosition])

  const attendanceLogs =
    logs.attendanceLogs ||
    logs.timeTrackings ||
    logs.timetracking ||
    []

  const overtimeLogs =
    logs.overtimeLogs || logs.overtimeTrackings || logs.otLogs || []

  const dayOffWorkLogs = logs.dayOff || logs.dayOffs || logs.leaveRequests || []

  const dayOffRequestLogs =
    logs.dayOffRequests ||
    logs.dayOffRequestsByCreatedAt ||
    logs.leaveRequestByCreatedAt ||
    dayOffWorkLogs

  const storeHolidayLogs =
    logs.storeHoliday ||
    logs.storeHolidays ||
    logs.holidays ||
    logs.holidayLogs ||
    logs.storeHolidayLogs ||
    []

  const advanceSalaryLogs =
    logs.advanceSalary ||
    logs.advanceSalaries ||
    logs.salaryRequests ||
    logs.advanceRequests ||
    []

  const workHistory = useMemo(() => {
    const existingDayOffDates = new Set(
      attendanceLogs
        .filter((item) => {
          const status = normalizeWorkStatusWithTimeStatus(item)
          return status === 'DAY_OFF'
        })
        .map((item) =>
          formatDayKey(item.date || item.checkIn || item.createdAt)
        )
        .filter(Boolean)
    )

    const existingHolidayDates = new Set(
      attendanceLogs
        .filter((item) => {
          const status = normalizeWorkStatusWithTimeStatus(item)
          return status === 'HOLIDAY'
        })
        .map((item) =>
          formatDayKey(item.date || item.checkIn || item.createdAt)
        )
        .filter(Boolean)
    )

    const workLogs = attendanceLogs
      .map((log) => normalizeWorkLog(log, now))
      .filter(Boolean)

    const otLogs = overtimeLogs.map((ot) => normalizeOTLog(ot)).filter(Boolean)

    const leaveWorkLogs = dayOffWorkLogs
      .filter((item) => normalizeRequestStatus(item.status) === 'APPROVED')
      .filter((item) => {
        const dateKey = formatDayKey(
          item.date || item.requestDate || item.createdAt
        )
        return dateKey && !existingDayOffDates.has(dateKey)
      })
      .map((item) => normalizeDayOffAsWork(item, now))
      .filter(Boolean)

    const holidayWorkLogs = storeHolidayLogs
      .filter((item) => {
        const dateKey = formatDayKey(
          item.date || item.holidayDate || item.createdAt
        )
        return dateKey && !existingHolidayDates.has(dateKey)
      })
      .map((item) => normalizeStoreHolidayAsWork(item))
      .filter(Boolean)

    return mergeWorkHistory([
      ...workLogs,
      ...otLogs,
      ...leaveWorkLogs,
      ...holidayWorkLogs,
    ]).sort((a, b) => getDateTime(b.sortDate) - getDateTime(a.sortDate))
  }, [attendanceLogs, overtimeLogs, dayOffWorkLogs, storeHolidayLogs, now])

  const requestHistory = useMemo(() => {
    const leaveRequests = dayOffRequestLogs.map((item) => normalizeDayOffRequest(item))
    const salaryRequests = advanceSalaryLogs.map((item) =>
      normalizeAdvanceRequest(item)
    )

    return [...leaveRequests, ...salaryRequests].sort((a, b) => {
      return getDateTime(b.sortDate) - getDateTime(a.sortDate)
    })
  }, [dayOffRequestLogs, advanceSalaryLogs])

  const adminRequestHistory = useMemo(() => {
    return adminRequests
      .map((item) => normalizeAdminRequest(item))
      .filter(Boolean)
      .sort((a, b) => getDateTime(b.sortDate) - getDateTime(a.sortDate))
  }, [adminRequests])

  const totalOTMinutes = useMemo(() => {
    if (summary.totalOtMinutes !== undefined && summary.totalOtMinutes !== null) {
      return Number(summary.totalOtMinutes || 0)
    }

    return overtimeLogs
      .filter(isCountableOT)
      .reduce((sum, item) => sum + Number(item.otMinutes || 0), 0)
  }, [summary.totalOtMinutes, overtimeLogs])

  const statData = useMemo(() => {
    const workingDays =
      summary.workingDays ??
      attendanceLogs.filter((item) => {
        const status = normalizeWorkStatusWithTimeStatus(item)
        return status === 'PRESENT' || status === 'COMPLETED' || status === 'ACTIVE'
      }).length

    const lateDays =
      summary.lateDays ??
      attendanceLogs.filter((item) => Number(item.lateMinutes || 0) > 0).length

    const hiddenTodayAbsentCount = getHiddenTodayAbsentCount(attendanceLogs, now)

    const rawAbsentDays =
      summary.absentDays ??
      attendanceLogs.filter((item) => {
        const status = normalizeWorkStatusWithTimeStatus(item)
        return status === 'ABSENT'
      }).length

    const absentDays = Math.max(
      0,
      Number(rawAbsentDays || 0) - hiddenTodayAbsentCount
    )

    const dayOffUsed =
      summary.dayOffs ??
      summary.dayOffUsed ??
      dayOffWorkLogs.filter(
        (item) => normalizeRequestStatus(item.status) === 'APPROVED'
      ).length

    const advanceTaken =
      getNumberOrNull(summary.advanceTaken) ??
      advanceSalaryLogs
        .filter((item) => normalizeRequestStatus(item.status) === 'APPROVED')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0)

    const baseSalary =
      getNumberOrNull(summary.baseSalary) ??
      getNumberOrNull(summary.baseSlary) ??
      getNumberOrNull(profile.baseSalary) ??
      getNumberOrNull(profile.salary) ??
      0

    const salaryLeft =
      getNumberOrNull(summary.remainingSalary) ??
      getNumberOrNull(summary.finalSalary) ??
      Math.max(baseSalary - Number(advanceTaken || 0), 0)

    const remainingDayOffs =
      getNumberOrNull(summary.remainingDayOffs) ??
      getNumberOrNull(profile.remainingDayOffs) ??
      getNumberOrNull(profile.remainingDayOff) ??
      getNumberOrNull(profile.dayOffRemaining) ??
      0

    return {
      remainingDayOffs,
      salaryLeft,
      workingDays,
      lateDays,
      absentDays,
      totalOTMinutes,
      dayOffUsed,
      advanceTaken,
    }
  }, [
    summary,
    profile,
    attendanceLogs,
    advanceSalaryLogs,
    dayOffWorkLogs,
    totalOTMinutes,
    now,
  ])

  const availableTabs = useMemo(() => {
    return [
      {
        key: TABS.ATTENDANCE,
        label: 'เข้างาน / OT',
        count: workHistory.length,
      },
      {
        key: TABS.REQUESTS,
        label: 'คำขอ',
        count: requestHistory.length,
      },
      canViewAdminRequests
        ? {
            key: TABS.ADMIN_REQUESTS,
            label: 'อนุมัติคำขอ',
            count: adminRequestHistory.length,
          }
        : null,
    ].filter(Boolean)
  }, [
    workHistory.length,
    requestHistory.length,
    adminRequestHistory.length,
    canViewAdminRequests,
  ])

  const activeListCount =
    activeTab === TABS.ATTENDANCE
      ? workHistory.length
      : activeTab === TABS.REQUESTS
        ? requestHistory.length
        : adminRequestHistory.length

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F5F8FD]">
        <Loader2 className="animate-spin text-blue-600" size={30} />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#F5F8FD] px-3.5 pb-32 pt-4 text-[#0F172A] sm:px-6 lg:px-4 lg:pb-8 xl:px-5">
      <div className="mx-auto w-full max-w-md space-y-4 lg:mx-0 lg:w-full lg:max-w-none lg:space-y-4">
        {organizationWarning && (
          <section className="flex items-start gap-2 rounded-2xl bg-orange-50 px-3.5 py-3 text-orange-600 lg:rounded-[1.2rem] lg:px-3.5 lg:py-2.5">
            <AlertCircle
              size={19}
              strokeWidth={2.6}
              className="mt-0.5 lg:h-4 lg:w-4"
            />

            <div>
              <p className="text-sm font-black lg:text-xs">
                ข้อมูลบัญชียังไม่สมบูรณ์
              </p>
              <p className="mt-0.5 text-xs font-bold leading-5 lg:text-[10px] lg:leading-4">
                {organizationWarning}
              </p>
            </div>
          </section>
        )}

        <MonthSwitcher
          month={month}
          onPrev={() => changeMonth(-1)}
          onNext={() => changeMonth(1)}
          onThisMonth={goThisMonth}
        />

        <section className="rounded-[1.45rem] bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.05)] lg:rounded-[1.15rem] lg:p-3 lg:shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
          <div className="mb-2.5 flex items-center justify-between lg:mb-2">
            <div>
              <h2 className="text-sm font-black text-slate-950 lg:text-xs">
                ภาพรวมของฉัน
              </h2>

              <p className="text-[11px] font-semibold text-slate-400 lg:text-[10px]">
                เดือน {formatMonth(month)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSummaryOpen((prev) => !prev)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F8FD] text-slate-500 transition-all active:scale-95 lg:h-8 lg:w-8 lg:border lg:border-blue-100 lg:bg-white lg:text-blue-600"
            >
              <ChevronDown
                size={18}
                strokeWidth={3}
                className={`transition-transform duration-300 lg:h-4 lg:w-4 ${
                  summaryOpen ? 'rotate-180' : 'rotate-0'
                }`}
              />
            </button>
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              summaryOpen
                ? 'max-h-[420px] opacity-100 lg:max-h-[150px]'
                : 'max-h-0 opacity-0'
            }`}
          >
            <div className="grid grid-cols-4 gap-2 lg:grid-cols-8 lg:gap-2">
              <MiniStat
                title="วันลาเหลือ"
                value={`${statData.remainingDayOffs} วัน`}
                icon={<Umbrella size={14} />}
                color="green"
              />

              <MiniStat
                title="เงินเหลือ"
                value={`${formatMoneyShort(statData.salaryLeft)} บาท`}
                icon={<Wallet size={14} />}
                color="blue"
              />

              <MiniStat
                title="ทำงาน"
                value={`${statData.workingDays} วัน`}
                icon={<BriefcaseBusiness size={14} />}
                color="blue"
              />

              <MiniStat
                title="สาย"
                value={`${statData.lateDays} วัน`}
                icon={<Clock size={14} />}
                color="orange"
              />

              <MiniStat
                title="ขาด"
                value={`${statData.absentDays} วัน`}
                icon={<XCircle size={14} />}
                color="red"
              />

              <MiniStat
                title="OT"
                value={formatOTHours(statData.totalOTMinutes)}
                icon={<Timer size={14} />}
                color="blue"
              />

              <MiniStat
                title="ลาไปแล้ว"
                value={`${statData.dayOffUsed} วัน`}
                icon={<CalendarCheck2 size={14} />}
                color="green"
              />

              <MiniStat
                title="เบิกแล้ว"
                value={`${formatMoneyShort(statData.advanceTaken)} บาท`}
                icon={<Wallet size={14} />}
                color="blue"
              />
            </div>
          </div>
        </section>

        <section
          id="requests"
          ref={historyListRef}
          className="scroll-mt-4 space-y-4 lg:space-y-3"
        >
          <section
            className="grid items-center gap-2 rounded-[1.4rem] bg-white p-1 shadow-[0_8px_22px_rgba(15,23,42,0.05)] lg:rounded-[1.1rem]"
            style={{
              gridTemplateColumns: `repeat(${availableTabs.length}, minmax(0, 1fr))`,
            }}
          >
            {availableTabs.map((tab) => (
              <TabButton
                key={tab.key}
                active={activeTab === tab.key}
                label={tab.label}
                count={tab.count}
                onClick={() => setActiveTab(tab.key)}
              />
            ))}
          </section>

          <section className="rounded-[1.5rem] bg-white p-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.06)] lg:rounded-[1.15rem] lg:p-3 lg:shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
            <div className="mb-3 flex items-center justify-between gap-3 lg:mb-2.5">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-black text-slate-950 lg:text-base">
                  {activeTab === TABS.ATTENDANCE
                    ? 'รายการเข้างาน'
                    : activeTab === TABS.REQUESTS
                      ? 'รายการคำขอ'
                      : 'ประวัติอนุมัติคำขอ'}
                </h2>

                <p className="text-xs font-semibold text-slate-400 lg:text-[10px]">
                  {activeTab === TABS.ATTENDANCE
                    ? 'รวมเข้างานปกติ OT วันลา และวันหยุดร้าน'
                    : activeTab === TABS.REQUESTS
                      ? 'รวมเบิกเงินและวันลา'
                      : 'รวมประวัติคำขอของพนักงานที่ส่งเข้าระบบ'}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-[#F5F8FD] px-3 py-1 text-xs font-black text-slate-500 lg:px-3 lg:py-1 lg:text-[10px]">
                {activeListCount} รายการ
              </span>
            </div>

            <div className="max-h-[520px] space-y-2.5 overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch] lg:max-h-[500px] lg:space-y-2">
              {activeTab === TABS.ATTENDANCE ? (
                workHistory.length > 0 ? (
                  workHistory.map((item, index) => (
                    <WorkHistoryCard
                      key={`${item.type}-${item.id}-${index}`}
                      item={item}
                    />
                  ))
                ) : (
                  <EmptyState
                    title="ยังไม่มีประวัติเข้างาน"
                    subtitle="เดือนนี้ยังไม่มีรายการเข้างาน OT วันลา หรือวันหยุดร้าน"
                  />
                )
              ) : activeTab === TABS.REQUESTS ? (
                requestHistory.length > 0 ? (
                  requestHistory.map((item, index) => (
                    <RequestHistoryCard
                      key={`${item.type}-${item.id}-${index}`}
                      item={item}
                    />
                  ))
                ) : (
                  <EmptyState
                    title="ยังไม่มีประวัติคำขอ"
                    subtitle="เดือนนี้ยังไม่มีคำขอเบิกเงินหรือวันลา"
                  />
                )
              ) : adminLoading ? (
                <div className="flex min-h-[240px] items-center justify-center">
                  <Loader2 className="animate-spin text-blue-600" size={28} />
                </div>
              ) : adminRequestHistory.length > 0 ? (
                adminRequestHistory.map((item, index) => (
                  <AdminRequestHistoryCard
                    key={`${item.type}-${item.id}-${index}`}
                    item={item}
                  />
                ))
              ) : (
                <EmptyState
                  title="ยังไม่มีประวัติอนุมัติคำขอ"
                  subtitle="เดือนนี้ยังไม่มีคำขอของพนักงาน หรือ backend ยังไม่ได้ส่งข้อมูลส่วนนี้"
                />
              )}
            </div>
          </section>
        </section>
      </div>
    </div>
  )
}

function MonthSwitcher({ month, onPrev, onNext, onThisMonth }) {
  return (
    <section className="flex items-center justify-between rounded-[1.4rem] bg-white p-2.5 shadow-[0_8px_22px_rgba(15,23,42,0.05)] lg:rounded-[1.15rem] lg:px-3 lg:py-2.5 lg:shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
      <button
        type="button"
        onClick={onPrev}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F8FD] text-slate-500 active:scale-95 lg:h-8 lg:w-8"
      >
        <ChevronLeft size={19} className="lg:h-4 lg:w-4" />
      </button>

      <div className="text-center">
        <h2 className="text-base font-black text-slate-950 lg:text-base">
          {formatMonth(month)}
        </h2>

        <button
          type="button"
          onClick={onThisMonth}
          className="mt-0.5 text-[11px] font-black text-blue-600 lg:text-[10px]"
        >
          เดือนนี้
        </button>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F8FD] text-slate-500 active:scale-95 lg:h-8 lg:w-8"
      >
        <ChevronRight size={19} className="lg:h-4 lg:w-4" />
      </button>
    </section>
  )
}

function MiniStat({ title, value, icon, color }) {
  const styles = getColorStyles(color)

  return (
    <div className="rounded-[1rem] border border-slate-200 bg-white p-2 shadow-[0_6px_14px_rgba(15,23,42,0.035)] lg:rounded-xl lg:p-2.5">
      <div
        className={`mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white ${styles.icon} lg:mb-1.5 lg:h-7 lg:w-7 lg:rounded-lg`}
      >
        {icon}
      </div>

      <p className="truncate text-[9px] font-bold leading-tight text-slate-700 lg:text-[10px]">
        {title}
      </p>

      <p className="mt-0.5 truncate text-[12px] font-black text-slate-950 lg:text-[11px]">
        {value}
      </p>
    </div>
  )
}

function TabButton({ active, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 min-w-0 items-center justify-center gap-1 rounded-[1.05rem] px-1 text-xs font-black transition-all active:scale-[0.98] sm:text-sm lg:h-9 lg:rounded-xl lg:text-xs ${
        active
          ? 'bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]'
          : 'text-slate-400'
      }`}
    >
      <span className="truncate">{label}</span>

      {count !== undefined && (
        <span
          className={`hidden rounded-full px-1.5 py-0.5 text-[10px] sm:inline lg:text-[9px] ${
            active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function WorkHistoryCard({ item }) {
  const iconConfig = getWorkIconConfig(item)
  const title = getWorkTitle(item)

  const isNonWorkDay = item.status === 'DAY_OFF' || item.status === 'HOLIDAY'
  const lateMinutes = Number(item.lateMinutes || 0)
  const earlyLeaveMinutes = Number(item.earlyLeaveMinutes || 0)
  const hasTimeIssue =
    !item.isOT && !isNonWorkDay && (lateMinutes > 0 || earlyLeaveMinutes > 0)

  const timeText = isNonWorkDay
    ? item.detail || 'ไม่ต้องบันทึกเวลา'
    : item.checkIn || item.checkOut
      ? `${formatTime(item.checkIn)} - ${formatTime(item.checkOut)}`
      : 'ไม่มีการบันทึกเวลา'

  return (
    <div className="rounded-[1.25rem] border border-slate-100 bg-[#F8FAFC] p-3 lg:rounded-[1.05rem] lg:px-3 lg:py-2.5">
      <div className="flex items-center gap-3 lg:gap-2.5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconConfig.className} lg:h-9 lg:w-9 lg:rounded-xl`}
        >
          {iconConfig.icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-slate-950 lg:text-xs">
            {title}
          </p>

          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500 lg:text-[11px]">
            {formatDate(item.date)} · {timeText}
            {!isNonWorkDay && item.duration && item.duration !== '-'
              ? ` · ${item.duration}`
              : ''}
          </p>
        </div>

        {hasTimeIssue && (
          <div className="hidden shrink-0 items-center gap-1.5 lg:flex">
            {lateMinutes > 0 && (
              <SmallPill
                label={`สาย ${lateMinutes} นาที`}
                className="bg-orange-50 text-orange-500"
              />
            )}

            {earlyLeaveMinutes > 0 && (
              <SmallPill
                label={`ออกก่อน ${earlyLeaveMinutes} นาที`}
                className="bg-red-50 text-red-500"
              />
            )}
          </div>
        )}
      </div>

      {hasTimeIssue && (
        <div className="mt-2 flex gap-2 lg:hidden">
          {lateMinutes > 0 && (
            <SmallPill
              label={`สาย ${lateMinutes} นาที`}
              className="bg-orange-50 text-orange-500"
            />
          )}

          {earlyLeaveMinutes > 0 && (
            <SmallPill
              label={`ออกก่อน ${earlyLeaveMinutes} นาที`}
              className="bg-red-50 text-red-500"
            />
          )}
        </div>
      )}

      {item.note && item.note !== '-' && (
        <p className="mt-2 line-clamp-2 text-xs font-semibold leading-relaxed text-slate-500 lg:text-[11px]">
          {item.note}
        </p>
      )}
    </div>
  )
}

function RequestHistoryCard({ item }) {
  const isAdvance = item.type === 'ADVANCE'
  const statusConfig = getRequestStatusConfig(item.status)

  const iconConfig = isAdvance
    ? {
        icon: <Wallet size={20} className="lg:h-4 lg:w-4" />,
        className: 'bg-blue-50 text-blue-600',
      }
    : {
        icon: <Umbrella size={20} className="lg:h-4 lg:w-4" />,
        className: 'bg-emerald-50 text-emerald-600',
      }

  return (
    <div className="rounded-[1.25rem] border border-slate-100 bg-[#F8FAFC] p-3 lg:rounded-[1.05rem] lg:px-3 lg:py-2.5">
      <div className="flex items-center gap-3 lg:gap-2.5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconConfig.className} lg:h-9 lg:w-9 lg:rounded-xl`}
        >
          {iconConfig.icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-slate-950 lg:text-xs">
            {item.title}
          </p>

          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500 lg:text-[11px]">
            {item.meta}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black lg:px-2 lg:py-0.5 lg:text-[10px] ${statusConfig.className}`}
        >
          {statusConfig.label}
        </span>
      </div>

      {item.note && item.note !== '-' && (
        <p className="mt-2 line-clamp-2 text-xs font-semibold leading-relaxed text-slate-500 lg:text-[11px]">
          {item.note}
        </p>
      )}
    </div>
  )
}

function AdminRequestHistoryCard({ item }) {
  const statusConfig = getRequestStatusConfig(item.status)

  const iconConfig =
    item.type === 'ADVANCE'
      ? {
          icon: <Wallet size={20} className="lg:h-4 lg:w-4" />,
          className: 'bg-blue-50 text-blue-600',
        }
      : {
          icon: <Umbrella size={20} className="lg:h-4 lg:w-4" />,
          className: 'bg-emerald-50 text-emerald-600',
        }

  return (
    <div className="rounded-[1.25rem] border border-slate-100 bg-[#F8FAFC] p-3 lg:rounded-[1.05rem] lg:px-3 lg:py-2.5">
      <div className="flex items-center gap-3 lg:gap-2.5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconConfig.className} lg:h-9 lg:w-9 lg:rounded-xl`}
        >
          {iconConfig.icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-slate-950 lg:text-xs">
            {item.title}
          </p>

          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500 lg:text-[11px]">
            {item.meta}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black lg:px-2 lg:py-0.5 lg:text-[10px] ${statusConfig.className}`}
        >
          {statusConfig.label}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 lg:rounded-xl lg:px-2.5 lg:py-1.5">
        <UserRound size={15} className="shrink-0 text-slate-400 lg:h-3.5 lg:w-3.5" />

        <p className="min-w-0 truncate text-xs font-bold text-slate-500 lg:text-[11px]">
          ผู้ขอ: {item.employeeName || '-'}
          {item.branchName ? ` · ${item.branchName}` : ''}
        </p>
      </div>

      {item.note && item.note !== '-' && (
        <p className="mt-2 line-clamp-2 text-xs font-semibold leading-relaxed text-slate-500 lg:text-[11px]">
          {item.note}
        </p>
      )}
    </div>
  )
}

function SmallPill({ label, className }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-black lg:px-2 lg:py-0.5 lg:text-[10px] ${className}`}
    >
      {label}
    </span>
  )
}

function EmptyState({ title, subtitle }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-[1.25rem] bg-[#F5F8FD] px-5 py-8 text-center lg:min-h-[170px] lg:rounded-xl">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm lg:h-10 lg:w-10">
        <ClipboardList size={21} className="text-slate-400 lg:h-5 lg:w-5" />
      </div>

      <p className="font-black text-slate-700 lg:text-sm">{title}</p>
      <p className="mt-1 text-sm font-semibold text-slate-400 lg:text-xs">
        {subtitle}
      </p>
    </div>
  )
}

function getColorStyles(color) {
  const styles = {
    blue: {
      icon: 'text-blue-600',
    },
    green: {
      icon: 'text-emerald-600',
    },
    orange: {
      icon: 'text-orange-500',
    },
    red: {
      icon: 'text-red-500',
    },
    purple: {
      icon: 'text-purple-600',
    },
    yellow: {
      icon: 'text-yellow-600',
    },
  }

  return styles[color] || styles.blue
}

function getWorkIconConfig(item) {
  if (item.status === 'ABSENT') {
    return {
      icon: <XCircle size={20} className="lg:h-4 lg:w-4" />,
      className: 'bg-red-50 text-red-500',
    }
  }

  if (item.status === 'EXPIRED') {
    return {
      icon: <XCircle size={20} className="lg:h-4 lg:w-4" />,
      className: 'bg-yellow-50 text-yellow-600',
    }
  }

  if (item.status === 'CANCELLED') {
    return {
      icon: <XCircle size={20} className="lg:h-4 lg:w-4" />,
      className: 'bg-red-50 text-red-500',
    }
  }

  if (item.status === 'DAY_OFF') {
    return {
      icon: <Umbrella size={20} className="lg:h-4 lg:w-4" />,
      className: 'bg-emerald-50 text-emerald-600',
    }
  }

  if (item.status === 'HOLIDAY') {
    return {
      icon: <CalendarDays size={20} className="lg:h-4 lg:w-4" />,
      className: 'bg-orange-50 text-orange-500',
    }
  }

  if (item.type === 'OT') {
    return {
      icon: <Timer size={20} className="lg:h-4 lg:w-4" />,
      className: 'bg-purple-50 text-purple-600',
    }
  }

  if (item.checkOut || item.status === 'PRESENT' || item.status === 'COMPLETED') {
    return {
      icon: <LogOut size={20} className="lg:h-4 lg:w-4" />,
      className: 'bg-blue-50 text-blue-600',
    }
  }

  return {
    icon: <LogIn size={20} className="lg:h-4 lg:w-4" />,
    className: 'bg-blue-50 text-blue-600',
  }
}

function getWorkTitle(item) {
  if (item.status === 'ABSENT') return 'ขาดงาน'
  if (item.status === 'EXPIRED') return 'ลืมเช็กเอาท์'
  if (item.status === 'CANCELLED') return 'ยกเลิก'
  if (item.status === 'DAY_OFF') return item.title || 'วันลา'
  if (item.status === 'HOLIDAY') return item.title || 'วันหยุดร้าน'

  if (item.type === 'OT') {
    if (item.checkOut || item.status === 'COMPLETED') return 'จบ OT'
    return 'เริ่ม OT'
  }

  if (item.checkOut || item.status === 'PRESENT' || item.status === 'COMPLETED') {
    return 'เช็กเอาท์ออกงาน'
  }

  return 'เช็กอินเข้างาน'
}

function normalizeWorkStatusWithTimeStatus(log) {
  const baseStatus = normalizeAttendanceStatus(log.status, 'WORK')
  const timeStatus = normalizeAttendanceStatus(log.timeStatus, 'WORK')

  if (
    baseStatus === 'PRESENT' &&
    ['ACTIVE', 'EXPIRED', 'CANCELLED'].includes(timeStatus)
  ) {
    return timeStatus
  }

  return baseStatus
}

function normalizeWorkLog(log, now) {
  const date = log.date || log.checkIn || log.createdAt
  const checkIn = log.checkIn || null
  const checkOut = log.checkOut || null
  const status = normalizeWorkStatusWithTimeStatus(log)

  if (!date) return null

  if (status === 'ABSENT' && shouldHideTodayAbsentRecord(log, now)) {
    return null
  }

  if (status === 'DAY_OFF' && isFutureDay(date, now)) {
    return null
  }

  return {
    id: log.id || date || cryptoRandomId(),
    type: 'WORK',
    isOT: false,
    date,
    sortDate: checkOut || checkIn || date,
    status,
    title:
      status === 'DAY_OFF'
        ? 'วันลา'
        : status === 'HOLIDAY'
          ? 'วันหยุดร้าน'
          : '',
    detail:
      status === 'DAY_OFF'
        ? log.reason || 'อนุมัติวันลา'
        : status === 'HOLIDAY'
          ? log.reason || log.title || log.name || 'ร้านหยุด'
          : '',
    shiftName:
      log.shiftNameSnapshot ||
      log.shiftName ||
      log.shift?.name ||
      log.shift?.shiftName ||
      '',
    checkIn,
    checkOut,
    lateMinutes: Number(log.lateMinutes || 0),
    earlyLeaveMinutes: Number(log.earlyLeaveMinutes || 0),
    duration: calculateDuration(checkIn, checkOut),
    note:
      log.checkInNote ||
      log.checkOutNote ||
      log.reason ||
      log.note ||
      (status === 'HOLIDAY' ? log.title || log.name || 'Store holiday' : ''),
    uniqueKey: `${status}-${formatDayKey(date)}-${log.id || ''}`,
    raw: log,
  }
}

function normalizeOTLog(ot) {
  const date = ot.date || ot.checkIn || ot.createdAt
  const checkIn = ot.checkIn || null
  const checkOut = ot.checkOut || null

  if (!date) return null

  const otMinutes = Number(
    ot.otMinutes || calculateDurationMinutes(checkIn, checkOut) || 0
  )

  return {
    id: ot.id || date || cryptoRandomId(),
    type: 'OT',
    isOT: true,
    date,
    sortDate: checkOut || checkIn || date,
    status: normalizeAttendanceStatus(ot.status, 'OT'),
    checkIn,
    checkOut,
    otMinutes,
    duration: formatMinutes(otMinutes),
    note: ot.noteIn || ot.noteOut || ot.note || '',
    uniqueKey: `OT-${ot.id || formatDayKey(date)}`,
    raw: ot,
  }
}

function normalizeDayOffAsWork(item, now) {
  const date = item.date || item.requestDate || item.createdAt
  const reason = item.reason || item.note || ''
  const leaveType = extractLeaveType(reason)

  if (!date) return null
  if (isFutureDay(date, now)) return null

  return {
    id: item.id || item.requestId || cryptoRandomId(),
    type: 'WORK',
    isOT: false,
    date,
    sortDate: date || item.createdAt || new Date(),
    status: 'DAY_OFF',
    title: leaveType ? `วันลา (${leaveType})` : 'วันลา',
    detail: `${item.days || item.totalDays || 1} วัน`,
    checkIn: null,
    checkOut: null,
    lateMinutes: 0,
    earlyLeaveMinutes: 0,
    duration: '-',
    note: removeLeaveTypePrefix(reason),
    uniqueKey: `DAY_OFF-${item.id || formatDayKey(date)}`,
    raw: item,
  }
}

function normalizeStoreHolidayAsWork(item) {
  const date = item.date || item.holidayDate || item.createdAt
  const title = item.title || item.name || item.reason || 'วันหยุดร้าน'

  if (!date) return null

  return {
    id: item.id || item.holidayId || cryptoRandomId(),
    type: 'WORK',
    isOT: false,
    date,
    sortDate: date || item.createdAt || new Date(),
    status: 'HOLIDAY',
    title: 'วันหยุดร้าน',
    detail: title,
    checkIn: null,
    checkOut: null,
    lateMinutes: 0,
    earlyLeaveMinutes: 0,
    duration: '-',
    note: item.description || item.note || '',
    uniqueKey: `HOLIDAY-${item.id || formatDayKey(date)}`,
    raw: item,
  }
}

function normalizeAdvanceRequest(item) {
  const requestCreatedAt = getRequestCreatedAt(item)
  const requestDate = item.requestDate || item.date || requestCreatedAt
  const amount = Number(item.amount ?? item.advanceTaken ?? 0)

  return {
    id: item.id || item.requestId || cryptoRandomId(),
    type: 'ADVANCE',
    title: 'เบิกเงินล่วงหน้า',
    meta: `ส่งเมื่อ ${formatDate(requestCreatedAt)} · ${formatMoneyShort(
      amount
    )} บาท`,
    status: normalizeRequestStatus(item.status),
    sortDate: requestCreatedAt || requestDate || new Date(),
    note: item.reason || item.note || '',
    raw: item,
  }
}

function normalizeDayOffRequest(item) {
  const requestCreatedAt = getRequestCreatedAt(item)
  const leaveDate = getDayOffDate(item)
  const reason = item.reason || item.newValue?.reason || item.note || ''
  const leaveType = extractLeaveType(reason)

  return {
    id: item.id || item.requestId || cryptoRandomId(),
    type: 'DAY_OFF',
    title: leaveType ? `ขอวันลา (${leaveType})` : 'ขอวันลา',
    meta: `ส่งเมื่อ ${formatDate(requestCreatedAt)} · ลาวันที่ ${formatDate(
      leaveDate
    )} · ${item.days || item.totalDays || item.newValue?.totalDays || 1} วัน`,
    status: normalizeRequestStatus(item.status),
    sortDate: requestCreatedAt || new Date(),
    note: removeLeaveTypePrefix(reason),
    raw: item,
  }
}

function normalizeAdminRequest(item) {
  if (!item) return null

  const requestKind = getRequestKind(item)
  const isAdvance = requestKind === 'ADVANCE'

  const employee =
    item.employee ||
    item.employees ||
    item.user ||
    item.requester ||
    item.targetEmployee ||
    {}

  const employeeName =
    [employee.firstname, employee.lastname].filter(Boolean).join(' ') ||
    employee.name ||
    employee.email ||
    item.employeeName ||
    item.requesterName ||
    '-'

  const branchName =
    item.branch?.name ||
    employee.branch?.name ||
    item.branchName ||
    item.branch?.code ||
    ''

  const actionDate =
    item.reviewedAt ||
    item.approvedAt ||
    item.rejectedAt ||
    item.updatedAt ||
    item.createdAt ||
    item.newValue?.createdAt ||
    item.oldValue?.createdAt

  const leaveDate = getDayOffDate(item)
  const amount = Number(item.amount ?? item.newValue?.amount ?? item.advanceTaken ?? 0)
  const reason = item.reason || item.newValue?.reason || ''
  const leaveType = extractLeaveType(reason)
  const dayCount = item.days || item.totalDays || item.newValue?.totalDays || 1

  return {
    id: item.id || item.auditLogId || item.requestId || cryptoRandomId(),
    type: isAdvance ? 'ADVANCE' : 'DAY_OFF',
    title: isAdvance
      ? 'คำขอเบิกเงินล่วงหน้า'
      : leaveType
        ? `คำขอวันลา (${leaveType})`
        : 'คำขอวันลา',
    meta: isAdvance
      ? `ตรวจเมื่อ ${formatDate(actionDate)} · ${formatMoneyShort(amount)} บาท`
      : `ตรวจเมื่อ ${formatDate(actionDate)} · ลาวันที่ ${formatDate(
          leaveDate
        )} · ${dayCount} วัน`,
    status: normalizeRequestStatus(item.status),
    sortDate: actionDate || item.createdAt || leaveDate || new Date(),
    note: removeLeaveTypePrefix(reason),
    employeeName,
    branchName,
    raw: item,
  }
}

function getRequestCreatedAt(item) {
  return (
    item.createdAt ||
    item.requestCreatedAt ||
    item.submittedAt ||
    item.created_at ||
    item.requestDate ||
    item.date
  )
}

function getDayOffDate(item) {
  return (
    item.date ||
    item.leaveDate ||
    item.dayOffDate ||
    item.newValue?.date ||
    item.oldValue?.date ||
    item.requestDate ||
    item.createdAt
  )
}

function hasMeaningfulAmount(value) {
  return value !== undefined && value !== null && value !== ''
}

function getRequestKind(item) {
  const rawText = [
    item.type,
    item.requestType,
    item.entity,
    item.entityName,
    item.newValue?.requestType,
  ]
    .filter(Boolean)
    .join(' ')
    .toUpperCase()

  if (
    rawText.includes('DAY_OFF') ||
    rawText.includes('DAYOFF') ||
    rawText.includes('LEAVE') ||
    rawText.includes('DAY OFF')
  ) {
    return 'DAY_OFF'
  }

  if (rawText.includes('ADVANCE') || rawText.includes('SALARY')) {
    return 'ADVANCE'
  }

  if (
    item.date ||
    item.leaveDate ||
    item.dayOffDate ||
    item.newValue?.date ||
    item.reason ||
    item.newValue?.reason
  ) {
    return 'DAY_OFF'
  }

  if (hasMeaningfulAmount(item.amount ?? item.newValue?.amount ?? item.advanceTaken)) {
    return 'ADVANCE'
  }

  return 'DAY_OFF'
}

function extractAdminRequestList(payload) {
  if (Array.isArray(payload)) return payload

  return [
    ...(payload.requests || []),
    ...(payload.data || []),
    ...(payload.dayOffRequests || []),
    ...(payload.dayOff || []),
    ...(payload.dayOffs || []),
    ...(payload.leaveRequests || []),
    ...(payload.advanceSalaryRequests || []),
    ...(payload.advanceSalary || []),
    ...(payload.advanceSalaries || []),
    ...(payload.salaryRequests || []),
    ...(payload.advanceRequests || []),
  ]
}

function normalizeAttendanceStatus(status, type) {
  const value = String(status || '').toUpperCase()

  if (type === 'OT') {
    if (value === 'COMPLETED') return 'COMPLETED'
    if (value === 'ACTIVE') return 'ACTIVE'
    if (value === 'EXPIRED') return 'EXPIRED'
    if (value === 'CANCELLED' || value === 'CANCELED') return 'CANCELLED'

    return value || 'PENDING'
  }

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

function normalizeRequestStatus(status) {
  const value = String(status || 'PENDING').toUpperCase()

  if (value === 'APPROVED') return 'APPROVED'
  if (value === 'REJECTED') return 'REJECTED'
  if (value === 'CANCELLED' || value === 'CANCELED') return 'CANCELED'

  return 'PENDING'
}

function getRequestStatusConfig(status) {
  if (status === 'APPROVED') {
    return {
      label: 'อนุมัติแล้ว',
      className: 'bg-emerald-50 text-emerald-600',
    }
  }

  if (status === 'REJECTED') {
    return {
      label: 'ปฏิเสธ',
      className: 'bg-red-50 text-red-500',
    }
  }

  if (status === 'CANCELED') {
    return {
      label: 'ยกเลิก',
      className: 'bg-slate-100 text-slate-500',
    }
  }

  return {
    label: 'รออนุมัติ',
    className: 'bg-orange-50 text-orange-500',
  }
}

function mergeWorkHistory(items) {
  const map = new Map()

  items.forEach((item) => {
    if (!item) return

    const key =
      item.uniqueKey ||
      `${item.type}-${item.status}-${item.id || ''}-${formatDayKey(item.date)}`

    map.set(key, item)
  })

  return Array.from(map.values())
}

function isCountableOT(ot) {
  const status = String(ot?.status || '').toUpperCase()

  return ot?.checkIn && ot?.checkOut && status === 'COMPLETED'
}

function getHiddenTodayAbsentCount(attendanceLogs, now) {
  return attendanceLogs.filter((record) =>
    shouldHideTodayAbsentRecord(record, now)
  ).length
}

function shouldHideTodayAbsentRecord(record, now) {
  if (!record) return false

  const status = normalizeWorkStatusWithTimeStatus(record)

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

function calculateDuration(checkIn, checkOut) {
  const minutes = calculateDurationMinutes(checkIn, checkOut)

  if (!minutes || minutes <= 0) return '-'

  return formatMinutes(minutes)
}

function calculateDurationMinutes(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0

  const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime()

  if (diffMs <= 0) return 0

  return Math.floor(diffMs / (1000 * 60))
}

function getNumberOrNull(value) {
  if (value === undefined || value === null || value === '') return null

  const number = Number(value)

  if (Number.isNaN(number)) return null

  return number
}

function formatMonth(date) {
  return moment(date).locale('th').format('MMMM YYYY')
}

function formatDate(date) {
  if (!date) return '-'

  const parsedDate = moment(date)

  if (!parsedDate.isValid()) return '-'

  return parsedDate.locale('th').format('ddd D MMM YYYY')
}

function formatTime(date) {
  if (!date) return '-'

  const parsedDate = moment(date)

  if (!parsedDate.isValid()) return '-'

  return parsedDate.locale('th').format('HH:mm')
}

function formatMoneyShort(amount) {
  const number = Number(amount || 0)

  return number.toLocaleString('th-TH', {
    maximumFractionDigits: 0,
  })
}

function formatOTHours(minutes) {
  const total = Number(minutes || 0)
  const hours = total / 60

  if (hours <= 0) return '0 ชม.'

  return `${hours.toFixed(hours % 1 === 0 ? 0 : 1)} ชม.`
}

function formatMinutes(minutes) {
  const total = Number(minutes || 0)

  if (total <= 0) return '0 นาที'

  const hours = Math.floor(total / 60)
  const mins = total % 60

  if (hours <= 0) return `${mins} นาที`
  if (mins <= 0) return `${hours} ชม.`

  return `${hours} ชม. ${mins} นาที`
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

function removeLeaveTypePrefix(reason) {
  if (!reason) return ''

  const leaveType = extractLeaveType(reason)

  if (!leaveType) return reason

  return String(reason).replace(`${leaveType}:`, '').trim()
}

function cryptoRandomId() {
  return Math.random().toString(36).slice(2, 10)
}

export default UserHistoryPage