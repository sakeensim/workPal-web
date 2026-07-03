import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import moment from 'moment/min/moment-with-locales'
import { useNavigate } from 'react-router-dom'
import {
  Wallet,
  CalendarCheck2,
  Send,
  ChevronRight,
  CheckCircle2,
  Clock3,
  XCircle,
  Umbrella,
  Banknote,
  CalendarDays,
  Loader2,
  AlertCircle,
} from 'lucide-react'

import API_URL from '../utils/api'
import useAuthStore from '../store/auth-store'
import { createAlert } from '../utils/createAlert'

moment.locale('th')

const REQUEST_TYPES = {
  ADVANCE: 'ADVANCE',
  DAY_OFF: 'DAY_OFF',
}

const ADVANCE_PER_REQUEST = 1000

function RequestPage() {
  const navigate = useNavigate()

  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  const [activeType, setActiveType] = useState(REQUEST_TYPES.ADVANCE)

  const [amount, setAmount] = useState('')
  const [advanceReason, setAdvanceReason] = useState('')

  const [leaveDate, setLeaveDate] = useState('')
  const [leaveReason, setLeaveReason] = useState('')

  const [loading, setLoading] = useState(false)
  const [requestLoading, setRequestLoading] = useState(true)

  const [profile, setProfile] = useState(null)
  const [latestRequests, setLatestRequests] = useState([])
  const [availableAdvanceLimit, setAvailableAdvanceLimit] = useState(null)

  const isAdvance = activeType === REQUEST_TYPES.ADVANCE
  const todayInputValue = moment().format('YYYY-MM-DD')

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

  const organizationReady = Boolean(safeBranch && safePosition)

  const organizationMessage = useMemo(() => {
    if (!profile) return ''

    if (!profile.branchId) return 'บัญชีนี้ยังไม่ได้ถูกกำหนดสาขา'
    if (!safeBranch) return 'สาขาของบัญชีนี้ถูกปิดใช้งานหรือถูกลบแล้ว'
    if (!profile.positionId) return 'บัญชีนี้ยังไม่ได้ถูกกำหนดตำแหน่ง'
    if (!safePosition) return 'ตำแหน่งไม่ตรงกับสาขา หรือถูกปิดใช้งานแล้ว'

    return ''
  }, [profile, safeBranch, safePosition])

  const latestPreview = useMemo(() => {
    return latestRequests.slice(0, 3)
  }, [latestRequests])

  const goToRequestHistory = () => {
    navigate('/user/history?tab=requests#requests', {
      state: {
        activeTab: 'REQUESTS',
        scrollTo: 'requests',
      },
    })
  }

  const fetchRequestData = useCallback(async () => {
    if (!token) return

    try {
      setRequestLoading(true)

      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const month = moment().month() + 1
      const year = moment().year()

      const [profileResult, historyResult, approvedResult] =
        await Promise.allSettled([
          axios.get(`${API_URL}/user/myProfile`, { headers }),
          axios.get(`${API_URL}/user/history?month=${month}&year=${year}`, {
            headers,
          }),
          axios.get(`${API_URL}/user/approved-requests`, { headers }),
        ])

      const profileData =
        profileResult.status === 'fulfilled'
          ? profileResult.value.data?.result ||
            profileResult.value.data?.data ||
            profileResult.value.data
          : null

      const historyData =
        historyResult.status === 'fulfilled'
          ? historyResult.value.data || {}
          : {}

      const approvedData =
        approvedResult.status === 'fulfilled'
          ? approvedResult.value.data?.result ||
            approvedResult.value.data?.data ||
            approvedResult.value.data
          : null

      const profileFromHistory = historyData.profile || null
      const logs = historyData.logs || {}

      const resolvedProfile = {
        ...(profileData || {}),
        ...(profileFromHistory || {}),
      }

      setProfile(resolvedProfile || null)

      const requestsFromHistory = normalizeRequestsFromApi({
        advanceSalary:
          logs.advanceSalary ||
          logs.advanceSalaries ||
          logs.salaryRequests ||
          logs.advanceRequests,
        dayOff:
          logs.dayOff ||
          logs.dayOffs ||
          logs.leaveRequests ||
          logs.dayOffRequests,
      })

      const requestsFromProfile = normalizeRequestsFromApi({
        advanceSalary:
          profileData?.advanceSalary ||
          profileData?.advanceSalaries ||
          profileData?.salaryRequests,
        dayOff:
          profileData?.dayOff ||
          profileData?.dayOffs ||
          profileData?.leaveRequests,
      })

      const requestsFromApproved = normalizeRequestsFromApi(approvedData)

      const mergedRequests = mergeRequests([
        ...requestsFromHistory,
        ...requestsFromProfile,
        ...requestsFromApproved,
      ])

      const sortedRequests = mergedRequests.sort((a, b) => {
        return new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime()
      })

      setLatestRequests(sortedRequests)

      const resolvedLimit = resolveAvailableAdvanceLimit(
        resolvedProfile,
        sortedRequests
      )

      setAvailableAdvanceLimit(resolvedLimit)
    } catch (error) {
      console.error('Error fetching request data:', error)
      setLatestRequests([])
      setAvailableAdvanceLimit(null)
    } finally {
      setRequestLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchRequestData()
  }, [fetchRequestData])

  const hdlSubmit = async (e) => {
    e.preventDefault()

    if (!token) {
      createAlert('error', 'Please log in')
      return
    }

    if (!organizationReady) {
      createAlert('error', organizationMessage || 'บัญชียังไม่พร้อมใช้งาน')
      return
    }

    if (isAdvance) {
      await submitAdvanceSalary()
      return
    }

    await submitDayOff()
  }

  const submitAdvanceSalary = async () => {
    const requestedAmount = Number(amount)

    if (!amount || Number.isNaN(requestedAmount) || requestedAmount <= 0) {
      createAlert('error', 'กรุณากรอกจำนวนเงินให้ถูกต้อง')
      return
    }

    if (requestedAmount > ADVANCE_PER_REQUEST) {
      createAlert('error', `เบิกได้ไม่เกิน ${ADVANCE_PER_REQUEST} บาทต่อครั้ง`)
      return
    }

    if (
      availableAdvanceLimit !== null &&
      requestedAmount > Number(availableAdvanceLimit)
    ) {
      createAlert('error', 'จำนวนเงินเกินวงเงินคงเหลือที่เบิกได้')
      return
    }

    try {
      setLoading(true)

      await axios.post(
        `${API_URL}/user/advance-salary`,
        {
          date: moment().format('YYYY-MM-DD'),
          amount: requestedAmount,
          reason: advanceReason.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      createAlert('success', 'ส่งคำขอเบิกเงินล่วงหน้าสำเร็จ')

      setAmount('')
      setAdvanceReason('')

      await fetchRequestData()
    } catch (error) {
      console.error('Error submitting advance salary request:', error)

      createAlert(
        'error',
        error.response?.data?.message || 'ส่งคำขอเบิกเงินล่วงหน้าไม่สำเร็จ'
      )
    } finally {
      setLoading(false)
    }
  }

  const submitDayOff = async () => {
    if (!leaveDate) {
      createAlert('error', 'กรุณาเลือกวันที่ต้องการลา')
      return
    }

    const currentDate = moment().startOf('day')
    const requestDate = moment(`${leaveDate}T00:00:00.000+07:00`).startOf('day')

    if (requestDate.isBefore(currentDate)) {
      createAlert('error', 'โปรดเลือกวันที่วันนี้หรือในอนาคต')
      return
    }

    const remainingDayOffs = Number(profile?.remainingDayOffs || 0)


    try {
      setLoading(true)

      const res = await axios.post(
        `${API_URL}/user/day-off`,
        {
        date: leaveDate,
        reason: leaveReason.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      createAlert('success', res?.data?.message || 'ส่งคำขอลาสำเร็จ')

      setLeaveDate('')
      setLeaveReason('')

      await fetchRequestData()
    } catch (error) {
      console.error('Error submitting day off:', error)

      createAlert(
        'error',
        error.response?.data?.message || 'ส่งคำขอลาไม่สำเร็จ'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-[#F5F8FD] px-3.5 pb-32 pt-4 text-[#0F172A] lg:px-4 lg:pb-7 lg:pt-4 xl:px-5">
      <div className="mx-auto w-full max-w-md space-y-4 lg:mx-0 lg:w-full lg:max-w-none lg:space-y-3">
        <header className="lg:flex lg:items-end lg:justify-between lg:gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 lg:text-2xl">
              คำขอ
            </h1>

            <p className="mt-0.5 text-sm font-semibold text-slate-500 lg:mt-0.5 lg:text-xs">
              เลือกประเภทคำขอของคุณ
            </p>
          </div>

          <div className="mt-4 hidden rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-slate-500 shadow-[0_6px_16px_rgba(15,23,42,0.04)] lg:block">
            {safeBranch?.name || 'WorkPal'} · {safePosition?.name || 'Employee'}
          </div>
        </header>

        {organizationMessage && (
          <section
            className={`flex items-start gap-2 rounded-2xl px-3.5 py-3 lg:rounded-xl lg:px-3 lg:py-2 ${
              organizationReady
                ? 'bg-blue-50 text-blue-600'
                : 'bg-orange-50 text-orange-600'
            }`}
          >
            <AlertCircle
              size={19}
              strokeWidth={2.6}
              className="mt-0.5 lg:h-4 lg:w-4"
            />

            <div>
              <p className="text-sm font-black lg:text-xs">
                {organizationReady ? 'ข้อมูลพนักงานพร้อมใช้งาน' : 'ยังส่งคำขอไม่ได้'}
              </p>

              <p className="mt-0.5 text-xs font-bold leading-5 lg:text-[10px] lg:leading-4">
                {organizationReady
                  ? `${safeBranch?.name || ''} · ${safePosition?.name || ''}`
                  : organizationMessage}
              </p>
            </div>
          </section>
        )}

        <section className="grid grid-cols-2 gap-2 lg:gap-2.5">
          <RequestTypeCard
            active={isAdvance}
            icon={<Wallet size={24} strokeWidth={2.5} />}
            title="ขอเบิกเงินล่วงหน้า"
            color="blue"
            onClick={() => setActiveType(REQUEST_TYPES.ADVANCE)}
          />

          <RequestTypeCard
            active={!isAdvance}
            icon={<Umbrella size={24} strokeWidth={2.5} />}
            title="ขอวันลา"
            color="green"
            onClick={() => setActiveType(REQUEST_TYPES.DAY_OFF)}
          />
        </section>

        <form
          onSubmit={hdlSubmit}
          className="rounded-[1.5rem] bg-white p-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.07)] lg:rounded-[1.15rem] lg:p-3 lg:shadow-[0_10px_24px_rgba(15,23,42,0.055)]"
        >
          {isAdvance ? (
            <AdvanceForm
              amount={amount}
              setAmount={setAmount}
              reason={advanceReason}
              setReason={setAdvanceReason}
              loading={loading}
              requestLoading={requestLoading}
              availableAdvanceLimit={availableAdvanceLimit}
            />
          ) : (
            <DayOffForm
              leaveDate={leaveDate}
              setLeaveDate={setLeaveDate}
              leaveReason={leaveReason}
              setLeaveReason={setLeaveReason}
              todayInputValue={todayInputValue}
              loading={loading}
              profile={profile}
            />
          )}

          <button
            type="submit"
            disabled={loading || requestLoading || !organizationReady}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-[0_10px_24px_rgba(37,99,235,0.24)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 lg:mt-2.5 lg:h-10 lg:rounded-xl lg:text-xs"
          >
            <Send size={18} strokeWidth={2.7} className="lg:h-4 lg:w-4" />
            {loading ? 'กำลังส่งคำขอ...' : 'ส่งคำขอ'}
          </button>
        </form>

        <section className="rounded-[1.5rem] bg-white p-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] lg:rounded-[1.15rem] lg:p-3 lg:shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
          <div className="mb-2.5 flex items-center justify-between lg:mb-2.5">
            <div>
              <h2 className="text-lg font-black text-slate-950 lg:text-base">
                คำขอล่าสุด
              </h2>

              <p className="mt-0.5 hidden text-xs font-bold text-slate-400 lg:block lg:text-[10px]">
                รายการคำขอที่ส่งล่าสุดของคุณ
              </p>
            </div>

            <button
              type="button"
              onClick={goToRequestHistory}
              className="flex items-center gap-1 text-xs font-black text-blue-600 active:scale-95 lg:text-[11px]"
            >
              ดูทั้งหมด
              <ChevronRight size={15} strokeWidth={3} className="lg:h-3.5 lg:w-3.5" />
            </button>
          </div>

          {requestLoading ? (
            <div className="flex h-24 items-center justify-center lg:h-24">
              <Loader2 className="animate-spin text-blue-600" size={24} />
            </div>
          ) : latestPreview.length === 0 ? (
            <div className="rounded-2xl bg-[#F5F8FD] px-4 py-6 text-center lg:rounded-xl lg:py-7">
              <p className="text-sm font-black text-slate-700 lg:text-xs">
                ยังไม่มีคำขอ
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-400 lg:text-[10px]">
                เมื่อคุณส่งคำขอแล้ว รายการจะแสดงที่นี่
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {latestPreview.map((item) => (
                <RecentRequestItem key={item.key} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function RequestTypeCard({ active, icon, title, color, onClick }) {
  const isBlue = color === 'blue'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex min-h-[92px] flex-col items-center justify-center rounded-[1.15rem] border bg-white p-2 text-center transition-all active:scale-[0.98] lg:min-h-[74px] lg:flex-row lg:justify-start lg:gap-2.5 lg:rounded-xl lg:p-3 lg:text-left ${
        active
          ? 'border-blue-600 shadow-[0_8px_18px_rgba(37,99,235,0.10)] lg:shadow-[0_8px_18px_rgba(37,99,235,0.09)]'
          : 'border-slate-200 shadow-[0_6px_16px_rgba(15,23,42,0.04)]'
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full lg:h-9 lg:w-9 lg:rounded-xl ${
          isBlue
            ? 'bg-blue-100 text-blue-600'
            : 'bg-emerald-100 text-emerald-600'
        }`}
      >
        {React.cloneElement(icon, {
          className: 'lg:h-4.5 lg:w-4.5',
        })}
      </div>

      <h3
        className={`mt-1.5 text-xs font-black leading-tight lg:mt-0 lg:text-xs ${
          active ? 'text-blue-600' : 'text-slate-900'
        }`}
      >
        {title}
      </h3>

      <span
        className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border lg:right-2.5 lg:top-2.5 lg:h-4 lg:w-4 ${
          active
            ? 'border-blue-600 bg-blue-600 text-white'
            : 'border-slate-200 bg-white text-transparent'
        }`}
      >
        <CheckCircle2 size={13} strokeWidth={3} className="lg:h-3 lg:w-3" />
      </span>
    </button>
  )
}

function AdvanceForm({
  amount,
  setAmount,
  reason,
  setReason,
  loading,
  requestLoading,
  availableAdvanceLimit,
}) {
  const limitText =
    availableAdvanceLimit === null
      ? 'ยังไม่มีข้อมูล'
      : formatMoney(availableAdvanceLimit)

  return (
    <div className="space-y-4 lg:space-y-3">
      <InputBlock label="จำนวนเงิน" required>
        <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-white px-3.5 focus-within:border-blue-500 lg:h-10 lg:rounded-xl lg:px-3">
          <Banknote
            size={19}
            className="mr-2.5 shrink-0 text-slate-400 lg:h-4 lg:w-4"
          />

          <input
            value={amount}
            disabled={loading}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min="1"
            max={ADVANCE_PER_REQUEST}
            placeholder="ระบุจำนวนเงิน"
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60 lg:text-xs"
          />

          <span className="text-xs font-black text-slate-600 lg:text-[10px]">
            บาท
          </span>
        </div>

        <p className="mt-1.5 text-[11px] font-semibold text-slate-500 lg:text-[10px]">
          จำกัดต่อครั้ง{' '}
          <span className="font-black text-blue-600">
            {formatMoney(ADVANCE_PER_REQUEST)}
          </span>{' '}
          บาท · วงเงินคงเหลือ{' '}
          <span className="font-black text-blue-600">
            {requestLoading ? 'กำลังโหลด...' : limitText}
          </span>{' '}
          {availableAdvanceLimit !== null && 'บาท'}
        </p>
      </InputBlock>

      <InputBlock label="เหตุผล">
        <div className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-blue-500 lg:rounded-xl lg:px-3 lg:py-2">
          <textarea
            value={reason}
            disabled={loading}
            onChange={(e) => setReason(e.target.value.slice(0, 200))}
            rows={3}
            placeholder="ระบุเหตุผลเพิ่มเติม"
            className="w-full resize-none bg-transparent text-sm font-semibold leading-relaxed text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60 lg:min-h-[72px] lg:text-xs"
          />

          <p className="text-right text-[11px] font-bold text-slate-400 lg:text-[10px]">
            {reason.length}/200
          </p>
        </div>
      </InputBlock>
    </div>
  )
}

function DayOffForm({
  leaveDate,
  setLeaveDate,
  leaveReason,
  setLeaveReason,
  todayInputValue,
  loading,
  profile,
}) {
  const remainingDayOffs =
    profile?.remainingDayOffs ??
    profile?.remainingDayOff ??
    profile?.dayOffRemaining ??
    null

  return (
    <div className="space-y-4 lg:space-y-3">
      <InputBlock label="วันที่ลา" required>
        <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-white px-3.5 focus-within:border-blue-500 lg:h-10 lg:rounded-xl lg:px-3">
          <CalendarDays
            size={19}
            className="mr-2.5 shrink-0 text-slate-400 lg:h-4 lg:w-4"
          />

          <input
            value={leaveDate}
            min={todayInputValue}
            disabled={loading}
            onChange={(e) => setLeaveDate(e.target.value)}
            type="date"
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none disabled:opacity-60 lg:text-xs"
          />
        </div>

        <p className="mt-1.5 text-[11px] font-semibold text-blue-600 lg:text-[10px]">
          วันลาคงเหลือ{' '}
          {remainingDayOffs === null ? 'กำลังตรวจสอบ' : `${remainingDayOffs} วัน`}
        </p>
      </InputBlock>

      <InputBlock label="เหตุผล">
        <div className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-blue-500 lg:rounded-xl lg:px-3 lg:py-2">
          <textarea
            value={leaveReason}
            disabled={loading}
            onChange={(e) => setLeaveReason(e.target.value.slice(0, 200))}
            rows={3}
            placeholder="ระบุเหตุผลเพิ่มเติม"
            className="w-full resize-none bg-transparent text-sm font-semibold leading-relaxed text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60 lg:min-h-[72px] lg:text-xs"
          />

          <p className="text-right text-[11px] font-bold text-slate-400 lg:text-[10px]">
            {leaveReason.length}/200
          </p>
        </div>
      </InputBlock>
    </div>
  )
}

function InputBlock({ label, required, children }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-black text-slate-950 lg:mb-1 lg:text-xs">
        {label} {required && <span className="text-red-500">*</span>}
      </p>

      {children}
    </div>
  )
}

function RecentRequestItem({ item }) {
  const isAdvance = item.type === REQUEST_TYPES.ADVANCE
  const statusConfig = getStatusConfig(item.status)

  return (
    <div className="flex w-full items-center gap-2.5 py-2.5 text-left lg:gap-2.5 lg:py-2">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl lg:h-8 lg:w-8 lg:rounded-lg ${
          isAdvance
            ? 'bg-blue-100 text-blue-600'
            : 'bg-emerald-100 text-emerald-600'
        }`}
      >
        {isAdvance ? (
          <Wallet size={20} strokeWidth={2.5} className="lg:h-4 lg:w-4" />
        ) : (
          <CalendarCheck2 size={20} strokeWidth={2.5} className="lg:h-4 lg:w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-900 lg:text-xs">
          {item.title}
        </p>

        <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500 lg:text-[10px]">
          {item.meta}
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black lg:px-2 lg:py-0.5 lg:text-[10px] ${statusConfig.className}`}
      >
        {statusConfig.label}
      </span>
    </div>
  )
}

function normalizeRequestsFromApi(payload) {
  if (!payload) return []

  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeUnknownRequest(item)).filter(Boolean)
  }

  const advanceList =
    payload.advanceSalary ||
    payload.advanceSalaries ||
    payload.salaryRequests ||
    payload.advanceRequests ||
    []

  const dayOffList =
    payload.dayOff ||
    payload.dayOffs ||
    payload.leaveRequests ||
    payload.dayOffRequests ||
    []

  const mixedList = payload.requests || payload.result || payload.data || []

  const normalizedAdvance = Array.isArray(advanceList)
    ? advanceList.map((item) => normalizeAdvanceRequest(item))
    : []

  const normalizedDayOff = Array.isArray(dayOffList)
    ? dayOffList.map((item) => normalizeDayOffRequest(item))
    : []

  const normalizedMixed = Array.isArray(mixedList)
    ? mixedList.map((item) => normalizeUnknownRequest(item))
    : []

  return [...normalizedAdvance, ...normalizedDayOff, ...normalizedMixed].filter(
    Boolean
  )
}

function normalizeUnknownRequest(item) {
  if (!item) return null

  const rawType = String(item.type || item.requestType || '').toUpperCase()

  if (
    rawType.includes('ADVANCE') ||
    rawType.includes('SALARY') ||
    item.amount !== undefined
  ) {
    return normalizeAdvanceRequest(item)
  }

  return normalizeDayOffRequest(item)
}

function normalizeAdvanceRequest(item) {
  if (!item) return null

  const id = item.id || item.advanceId || item.requestId || cryptoRandomId()
  const date = item.requestDate || item.createdAt || item.date || new Date()
  const amount = Number(item.amount || item.advanceTaken || 0)
  const status = normalizeStatus(item.status)

  return {
    key: `ADVANCE-${id}`,
    id,
    type: REQUEST_TYPES.ADVANCE,
    title: 'ขอเบิกเงินล่วงหน้า',
    meta: `${formatThaiDate(date)} · ${formatMoney(amount)} บาท`,
    amount,
    status,
    sortDate: date,
    raw: item,
  }
}

function normalizeDayOffRequest(item) {
  if (!item) return null

  const id = item.id || item.dayOffId || item.leaveId || cryptoRandomId()
  const date = item.date || item.requestDate || item.createdAt || new Date()
  const status = normalizeStatus(item.status)

  return {
    key: `DAY_OFF-${id}`,
    id,
    type: REQUEST_TYPES.DAY_OFF,
    title: 'ขอวันลา',
    meta: `${formatThaiDate(date)} · 1 วัน`,
    status,
    sortDate: date,
    raw: item,
  }
}

function mergeRequests(requests) {
  const map = new Map()

  requests.forEach((item) => {
    if (!item) return
    map.set(item.key, item)
  })

  return Array.from(map.values())
}

function resolveAvailableAdvanceLimit(profile, requests) {
  if (!profile) return null

  const directValue =
    getNumberOrNull(profile.remainingAdvanceLimit) ??
    getNumberOrNull(profile.remainingAdvanceSalary) ??
    getNumberOrNull(profile.advanceRemaining) ??
    getNumberOrNull(profile.advanceBalance) ??
    getNumberOrNull(profile.availableAdvanceSalary)

  if (directValue !== null) {
    return Math.max(directValue, 0)
  }

  const baseSalary =
    getNumberOrNull(profile.baseSalary) ??
    getNumberOrNull(profile.salary) ??
    getNumberOrNull(profile.monthlySalary)

  if (baseSalary === null) return null

  const currentMonth = moment()

  const usedThisMonth = requests
    .filter((item) => item.type === REQUEST_TYPES.ADVANCE)
    .filter((item) => ['PENDING', 'APPROVED'].includes(item.status))
    .filter((item) => moment(item.sortDate).isSame(currentMonth, 'month'))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  return Math.max(baseSalary - usedThisMonth, 0)
}

function getNumberOrNull(value) {
  if (value === undefined || value === null || value === '') return null

  const number = Number(value)

  if (Number.isNaN(number)) return null

  return number
}

function normalizeStatus(status) {
  const value = String(status || 'PENDING').toUpperCase()

  if (value === 'APPROVED') return 'APPROVED'
  if (value === 'REJECTED') return 'REJECTED'
  if (value === 'CANCELED' || value === 'CANCELLED') return 'REJECTED'

  return 'PENDING'
}

function formatThaiDate(date) {
  if (!date) return '-'

  const parsedDate = moment(date)

  if (!parsedDate.isValid()) return '-'

  return parsedDate.locale('th').format('D MMM YYYY')
}

function formatMoney(value) {
  const number = Number(value || 0)

  return number.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function cryptoRandomId() {
  return Math.random().toString(36).slice(2, 10)
}

function getStatusConfig(status) {
  if (status === 'APPROVED') {
    return {
      label: 'อนุมัติแล้ว',
      icon: CheckCircle2,
      className: 'bg-emerald-100 text-emerald-600',
    }
  }

  if (status === 'REJECTED') {
    return {
      label: 'ปฏิเสธ',
      icon: XCircle,
      className: 'bg-red-100 text-red-500',
    }
  }

  return {
    label: 'รออนุมัติ',
    icon: Clock3,
    className: 'bg-orange-100 text-orange-500',
  }
}

export default RequestPage