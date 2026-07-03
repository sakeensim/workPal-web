import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import {
  Banknote,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  CalendarDays,
  Filter,
  Loader2,
  Search,
  Umbrella,
  UserRound,
  UsersRound,
  Wallet,
  X,
  XCircle,
} from 'lucide-react'

import API_URL from '../utils/api'
import useAuthStore from '../store/auth-store'
import { createAlert } from '../utils/createAlert'

const TABS = [
  {
    key: 'pending',
    label: 'รออนุมัติ',
  },
  {
    key: 'approved',
    label: 'อนุมัติแล้ว',
  },
  {
    key: 'rejected',
    label: 'ปฏิเสธ',
  },
]

const THAI_TIME_ZONE = 'Asia/Bangkok'

function AdminApprovalPage() {
  const navigate = useNavigate()

  const token = useAuthStore((state) => state.token)

  const [requests, setRequests] = useState([])
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [activeTab, setActiveTab] = useState('pending')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [leavePeopleModal, setLeavePeopleModal] = useState(null)

  useEffect(() => {
    if (!token) return

    fetchRequests()
    fetchBranches()
  }, [token])

  const fetchRequests = async () => {
    try {
      setLoading(true)

      const response = await axios.get(
        `${API_URL}/admin/pending-requests?includeHistory=true&days=30`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const payload =
        response.data?.data ||
        response.data?.result ||
        response.data?.requests ||
        response.data ||
        []

      setRequests(normalizeRequests(payload))
    } catch (error) {
      console.error('Error fetching requests:', error)
      createAlert(
        'error',
        error.response?.data?.message || 'โหลดคำขอไม่สำเร็จ'
      )
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/branches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const branchData = response.data.data || response.data.result || []

      setBranches(
        branchData.filter((branch) => {
          return branch && branch.isDeleted !== true
        })
      )
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const baseRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    const thirtyDaysAgo = getBangkokStartDate(-30)

    return requests
      .filter((request) => {
        const status = normalizeStatus(request.status)

        if (status === 'PENDING') return true

        const resolvedDate = getRequestResolvedDate(request)
        if (!resolvedDate) return false

        return resolvedDate >= thirtyDaysAgo
      })
      .filter((request) => {
        if (selectedType === 'all') return true

        return request.type === selectedType
      })
      .filter((request) => {
        if (selectedBranch === 'all') return true

        const branchId = getRequestBranchId(request)

        return String(branchId) === String(selectedBranch)
      })
      .filter((request) => {
        if (!keyword) return true

        const employee = request.employee || {}
        const employeeName = getEmployeeName(employee).toLowerCase()
        const requestType = request.typeLabel.toLowerCase()
        const branchName = String(
          getSafeBranch(employee)?.name || request.branch?.name || ''
        ).toLowerCase()
        const positionName = String(
          getSafePosition(employee)?.name || employee.role || ''
        ).toLowerCase()

        return (
          employeeName.includes(keyword) ||
          requestType.includes(keyword) ||
          branchName.includes(keyword) ||
          positionName.includes(keyword)
        )
      })
      .sort((a, b) => {
        return getSortTime(b) - getSortTime(a)
      })
  }, [requests, selectedBranch, selectedType, search])

  const counts = useMemo(() => {
    const base = {
      pending: 0,
      approved: 0,
      rejected: 0,
    }

    baseRequests.forEach((request) => {
      const tabKey = getTabKeyFromStatus(request.status)

      if (base[tabKey] !== undefined) {
        base[tabKey] += 1
      }
    })

    return base
  }, [baseRequests])

  const visibleRequests = useMemo(() => {
    return baseRequests.filter((request) => {
      return getTabKeyFromStatus(request.status) === activeTab
    })
  }, [baseRequests, activeTab])

  const monthlyAdvanceMap = useMemo(() => {
    return buildMonthlyAdvanceMap(requests)
  }, [requests])

  const leavePeopleMap = useMemo(() => {
    return buildLeavePeopleMap(requests)
  }, [requests])

  const handleApprove = async (id, type) => {
    try {
      setActionLoading(`${type}-${id}`)

      await axios.patch(
        `${API_URL}/admin/${type}-approve/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      createAlert('success', 'อนุมัติคำขอสำเร็จ')
      await fetchRequests()
    } catch (error) {
      console.error('Error approving request:', error)
      createAlert('error', error.response?.data?.message || 'อนุมัติไม่สำเร็จ')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id, type) => {
    try {
      setActionLoading(`${type}-${id}`)

      await axios.patch(
        `${API_URL}/admin/${type}-reject/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      createAlert('success', 'ปฏิเสธคำขอสำเร็จ')
      await fetchRequests()
    } catch (error) {
      console.error('Error rejecting request:', error)
      createAlert('error', error.response?.data?.message || 'ปฏิเสธไม่สำเร็จ')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBack = () => {
    navigate('/user/other')
  }

  return (
    <>
      <div className="min-h-dvh bg-[#F5F8FD] px-3 pb-24 pt-3.5 text-[#0F172A] sm:px-6 sm:pb-8 lg:px-4 lg:pb-6 lg:pt-4 xl:px-5">
      <div className="mx-auto w-full max-w-6xl space-y-3 lg:max-w-5xl lg:space-y-2.5 xl:max-w-6xl">
        <header className="relative flex min-h-[44px] items-center justify-center">
          <button
            type="button"
            onClick={handleBack}
            className="absolute left-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-600 shadow-[0_8px_22px_rgba(15,23,42,0.06)] active:scale-95 lg:h-9 lg:w-9"
          >
            <ChevronLeft size={21} strokeWidth={3} className="lg:h-4.5 lg:w-4.5" />
          </button>

          <div className="min-w-0 px-12 text-center">
            <h1 className="truncate text-3xl font-black tracking-tight text-slate-950 lg:text-2xl">
              อนุมัติคำขอ
            </h1>

            <p className="mt-0.5 text-xs font-semibold text-slate-400">
              ตรวจสอบและอนุมัติคำขอของพนักงาน
            </p>
          </div>
        </header>

        <section className="rounded-[1.25rem] bg-white p-1.5 shadow-[0_8px_22px_rgba(15,23,42,0.05)] lg:rounded-[1.05rem] lg:p-1.5 lg:shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
          <div className="grid grid-cols-3 gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex h-12 items-center justify-center gap-1.5 rounded-[1.1rem] text-xs font-black transition active:scale-[0.98] sm:text-sm lg:h-9 lg:gap-1 lg:rounded-xl lg:text-xs ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]'
                    : 'text-slate-500'
                }`}
              >
                <span className="truncate">{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-black lg:px-1.5 lg:text-[9px] ${
                    activeTab === tab.key
                      ? 'bg-white/20 text-white'
                      : getTabCountClass(tab.key)
                  }`}
                >
                  {counts[tab.key] || 0}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-2 sm:grid-cols-[1fr_170px_170px] lg:grid-cols-[1fr_135px_135px] lg:gap-2">
          <div className="relative">
            <Search
              size={19}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 lg:left-3 lg:h-4 lg:w-4"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อพนักงาน ประเภทคำขอ หรือสาขา"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-bold text-slate-900 shadow-[0_8px_22px_rgba(15,23,42,0.04)] outline-none placeholder:text-slate-400 focus:border-blue-500 lg:h-10 lg:rounded-xl lg:pl-9 lg:pr-3 lg:text-xs"
            />
          </div>

          <SelectBox
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            icon={<Filter size={18} />}
          >
            <option value="all">ทุกประเภท</option>
            <option value="dayoff">วันลา</option>
            <option value="salary">เบิกเงิน</option>
          </SelectBox>

          <SelectBox
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            icon={<Filter size={18} />}
          >
            <option value="all">ทุกสาขา</option>

            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
                {branch.isActive === false ? ' (ปิดใช้งาน)' : ''}
              </option>
            ))}
          </SelectBox>
        </section>

        {loading ? (
          <div className="flex h-60 items-center justify-center rounded-[1.6rem] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)] lg:h-44 lg:rounded-[1.15rem]">
            <Loader2 className="animate-spin text-blue-600" size={30} />
          </div>
        ) : visibleRequests.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[1.6rem] bg-white px-5 text-center shadow-[0_10px_28px_rgba(15,23,42,0.06)] lg:min-h-[160px] lg:rounded-[1.15rem]">
            <CheckCircle2 size={38} className="text-slate-300 lg:h-7 lg:w-7" />
            <p className="mt-3 text-base font-black text-slate-700 lg:mt-2 lg:text-sm">
              ไม่มีคำขอในรายการนี้
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-400 lg:text-xs">
              คำขอที่อนุมัติแล้วหรือปฏิเสธจะแสดงเฉพาะ 30 วันล่าสุด
            </p>
          </div>
        ) : (
          <div className="max-h-[calc(100dvh-255px)] space-y-2 overflow-y-auto pr-1 lg:max-h-[calc(100dvh-220px)] lg:space-y-2">
            {visibleRequests.map((request) => {
              const status = normalizeStatus(request.status)
              const typeForApi = request.type === 'salary' ? 'salary' : 'dayoff'
              const actionKey = `${typeForApi}-${request.id}`
              const isActionLoading = actionLoading === actionKey
              const isPending = status === 'PENDING'

              const monthlyAdvanceTaken = getMonthlyAdvanceTaken(
                request,
                monthlyAdvanceMap
              )

              const leavePeople = getLeavePeopleForRequest(request, leavePeopleMap)

              return (
                <RequestCard
                  key={`${request.type}-${request.id}`}
                  request={request}
                  status={status}
                  isPending={isPending}
                  isActionLoading={isActionLoading}
                  monthlyAdvanceTaken={monthlyAdvanceTaken}
                  leavePeople={leavePeople}
                  onOpenLeavePeople={setLeavePeopleModal}
                  onApprove={() => handleApprove(request.id, typeForApi)}
                  onReject={() => handleReject(request.id, typeForApi)}
                />
              )
            })}
          </div>
        )}
      </div>
      </div>

      {leavePeopleModal && (
        <LeavePeopleModal
          data={leavePeopleModal}
          onClose={() => setLeavePeopleModal(null)}
        />
      )}
    </>
  )
}

function RequestCard({
  request,
  status,
  isPending,
  isActionLoading,
  monthlyAdvanceTaken,
  leavePeople,
  onOpenLeavePeople,
  onApprove,
  onReject,
}) {
  const isSalary = request.type === 'salary'
  const statusConfig = getStatusConfig(status)
  const TypeIcon = isSalary ? Wallet : Umbrella

  const employee = request.employee || {}
  const safeBranch = getSafeBranch(employee)
  const safePosition = getSafePosition(employee)

  const branchLabel =
    safeBranch?.name ||
    request.branch?.name ||
    request.branchName ||
    'ไม่ระบุสาขา'

  const positionLabel =
    safePosition?.name ||
    employee.positionName ||
    employee.role ||
    'พนักงาน'

  return (
    <article className="rounded-[1.25rem] bg-white p-2.5 shadow-[0_8px_22px_rgba(15,23,42,0.05)] sm:p-3 lg:rounded-[1.05rem] lg:p-2.5 lg:shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
      <div className="flex items-start gap-2.5">
        <Avatar employee={employee} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2 lg:gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-black text-slate-950 lg:text-sm">
                {getEmployeeName(employee)}
              </h3>

              <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400 lg:text-[10px]">
                {branchLabel} · {positionLabel}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${statusConfig.className}`}
            >
              {statusConfig.label}
            </span>
          </div>

          {employee.branchId && !safeBranch && (
            <p className="mt-2 rounded-xl bg-orange-50 px-2.5 py-1.5 text-xs font-bold text-orange-600 lg:mt-1.5 lg:rounded-lg lg:px-2 lg:py-1 lg:text-[10px]">
              สาขาของพนักงานถูกปิดใช้งานหรือถูกลบแล้ว
            </p>
          )}

          {employee.positionId && !safePosition && (
            <p className="mt-2 rounded-xl bg-orange-50 px-2.5 py-1.5 text-xs font-bold text-orange-600 lg:mt-1.5 lg:rounded-lg lg:px-2 lg:py-1 lg:text-[10px]">
              ตำแหน่งไม่ตรงกับสาขา หรือถูกปิดใช้งานแล้ว
            </p>
          )}

          <div className="mt-2 flex gap-2.5">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl lg:h-9 lg:w-9 lg:rounded-xl ${
                isSalary
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <TypeIcon
                size={24}
                strokeWidth={2.6}
                className="lg:h-4.5 lg:w-4.5"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-slate-950">
                {request.typeLabel}
              </p>

              <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                {isSalary
                  ? `วันที่ ${formatDate(request.requestDate || request.createdAt)}`
                  : `วันที่ ${formatDate(getDayOffRequestDate(request))}${
                      request.days ? ` (${request.days} วัน)` : ''
                    }`}
              </p>

              {isSalary ? (
                <SalaryRequestMeta
                  amount={request.amount}
                  monthlyAdvanceTaken={monthlyAdvanceTaken}
                />
              ) : (
                <DayOffRequestMeta
                  request={request}
                  leavePeople={leavePeople}
                  onOpenLeavePeople={onOpenLeavePeople}
                />
              )}
            </div>
          </div>

          {status !== 'PENDING' && (
            <div className="mt-2 rounded-xl bg-[#F8FAFC] px-2.5 py-1.5">
              <p className="text-[10px] font-semibold text-slate-400">
                {status === 'APPROVED'
                  ? 'อนุมัติเมื่อ'
                  : status === 'CANCELED'
                    ? 'ยกเลิกเมื่อ'
                    : 'ปฏิเสธเมื่อ'}{' '}
                {formatDateTime(
                  request.approvedAt ||
                    request.rejectedAt ||
                    request.canceledAt ||
                    request.cancelledAt ||
                    request.updatedAt ||
                    request.createdAt
                )}
              </p>
            </div>
          )}

          {isPending && (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <button
                type="button"
                disabled={isActionLoading}
                onClick={onReject}
                className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-red-200 bg-white text-sm font-black text-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 lg:h-9 lg:rounded-xl lg:text-xs"
              >
                <XCircle
                  size={17}
                  strokeWidth={2.7}
                  className="lg:h-4 lg:w-4"
                />
                ปฏิเสธ
              </button>

              <button
                type="button"
                disabled={isActionLoading}
                onClick={onApprove}
                className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 lg:h-9 lg:rounded-xl lg:text-xs"
              >
                {isActionLoading ? (
                  <Loader2 className="animate-spin lg:h-4 lg:w-4" size={17} />
                ) : (
                  <CheckCircle2
                    size={17}
                    strokeWidth={2.7}
                    className="lg:h-4 lg:w-4"
                  />
                )}
                อนุมัติ
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}


function SalaryRequestMeta({ amount, monthlyAdvanceTaken }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-1.5 lg:mt-1.5 lg:gap-1.5">
      <CompactInfoBox
        icon={<Banknote size={14} strokeWidth={2.5} />}
        label="ครั้งนี้"
        value={`${formatMoney(amount)} บาท`}
        colorClass="text-blue-600"
      />

      <CompactInfoBox
        icon={<Wallet size={14} strokeWidth={2.5} />}
        label="เดือนนี้เบิกแล้ว"
        value={`${formatMoney(monthlyAdvanceTaken)} บาท`}
        colorClass="text-slate-950"
      />
    </div>
  )
}

function DayOffRequestMeta({ request, leavePeople, onOpenLeavePeople }) {
  const leaveCount = Number(leavePeople?.count || 0)
  const canOpen = leaveCount > 0

  return (
    <div className="mt-1.5 space-y-1.5">
      <p className="line-clamp-1 text-[11px] font-semibold text-slate-500 lg:text-[10px]">
        เหตุผล: {request.reason || 'ไม่ได้ระบุ'}
      </p>

      <button
        type="button"
        disabled={!canOpen}
        onClick={() => {
          if (canOpen) {
            onOpenLeavePeople(leavePeople)
          }
        }}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-left transition active:scale-[0.99] lg:rounded-lg lg:px-2 lg:py-1.5 ${
          canOpen
            ? 'border-blue-100 bg-blue-50/70 text-blue-600'
            : 'border-slate-100 bg-[#F8FAFC] text-slate-400'
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <UsersRound size={13} strokeWidth={2.7} className="shrink-0" />
            <span className="truncate text-[10px] font-black">
              คนลาที่อนุมัติแล้วในวันนั้น
            </span>
          </div>

          <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[10px] font-bold opacity-80">
            <CalendarDays size={12} className="shrink-0" />
            <span className="truncate">
              {leavePeople?.dateLabel || formatDate(getDayOffRequestDate(request))} ·{' '}
              {leavePeople?.branchLabel || 'ไม่ระบุสาขา'}
            </span>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${
            canOpen ? 'bg-white text-blue-600' : 'bg-white text-slate-400'
          }`}
        >
          {leaveCount} คน
        </span>
      </button>
    </div>
  )
}

function CompactInfoBox({ icon, label, value, colorClass }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#F8FAFC] px-2.5 py-2 lg:rounded-lg lg:px-2 lg:py-1.5">
      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 lg:text-[9px]">
        <span className="shrink-0 text-blue-600">{icon}</span>
        <span className="truncate">{label}</span>
      </div>

      <p
        className={`mt-0.5 truncate text-xs font-black lg:text-[11px] ${colorClass}`}
      >
        {value}
      </p>
    </div>
  )
}

function LeavePeopleModal({ data, onClose }) {
  const people = data?.people || []

  return (
    <div
      role="button"
      tabIndex={-1}
      onClick={onClose}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-[2px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-[1.35rem] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="min-w-0">
            <p className="text-base font-black text-slate-950">
              รายชื่อคนลา
            </p>

            <p className="mt-0.5 truncate text-[11px] font-bold text-slate-400">
              {data?.dateLabel || '-'} · {data?.branchLabel || 'ไม่ระบุสาขา'} ·{' '}
              {people.length} คน
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F8FD] text-slate-500 active:scale-95"
          >
            <X size={17} strokeWidth={3} />
          </button>
        </div>

        <div className="max-h-[62dvh] space-y-2 overflow-y-auto p-3">
          {people.length > 0 ? (
            people.map((person) => {
              const statusConfig = getStatusConfig(person.status)

              return (
                <div
                  key={person.key}
                  className="flex items-center gap-2.5 rounded-2xl bg-[#F8FAFC] px-3 py-2.5"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-blue-50">
                    {person.profileImage ? (
                      <img
                        src={person.profileImage}
                        alt="profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-blue-600">
                        <UserRound size={19} strokeWidth={2.6} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-950">
                      {person.name}
                    </p>

                    <p className="mt-0.5 truncate text-xs font-bold text-slate-400">
                      {person.positionName}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${statusConfig.className}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>
              )
            })
          ) : (
            <div className="rounded-2xl bg-[#F8FAFC] px-4 py-8 text-center">
              <p className="text-sm font-black text-slate-600">
                ไม่พบรายชื่อคนลาที่อนุมัติแล้ว
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SelectBox({ children, value, onChange, icon }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 lg:left-3">
        {React.cloneElement(icon, {
          className: 'lg:h-4 lg:w-4',
        })}
      </div>

      <select
        value={value}
        onChange={onChange}
        className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs font-black text-slate-800 shadow-[0_6px_16px_rgba(15,23,42,0.035)] outline-none focus:border-blue-500"
      >
        {children}
      </select>

      <ChevronDown
        size={17}
        strokeWidth={3}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 lg:right-3 lg:h-3.5 lg:w-3.5"
      />
    </div>
  )
}

function Avatar({ employee }) {
  const name = getEmployeeName(employee)

  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[1rem] bg-blue-50 lg:h-10 lg:w-10 lg:rounded-xl">
      {employee?.profileImage ? (
        <img
          src={employee.profileImage}
          alt="profile"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-blue-600">
          <UserRound
            size={31}
            strokeWidth={2.5}
            className="lg:h-5 lg:w-5"
          />
          <span className="sr-only">{name}</span>
        </div>
      )}
    </div>
  )
}

function normalizeRequests(payload) {
  if (!payload) return []

  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeRequestItem(item)).filter(Boolean)
  }

  const salaryRequests =
    payload.salary ||
    payload.salaries ||
    payload.advanceSalary ||
    payload.advanceSalaries ||
    payload.salaryRequests ||
    payload.advanceRequests ||
    payload.pendingSalaryRequests ||
    payload.pendingAdvanceSalary ||
    payload.approvedSalaryRequests ||
    payload.rejectedSalaryRequests ||
    []

  const dayOffRequests =
    payload.dayoff ||
    payload.dayOff ||
    payload.dayOffs ||
    payload.dayOffRequests ||
    payload.leaveRequests ||
    payload.pendingDayOffRequests ||
    payload.approvedDayOffRequests ||
    payload.rejectedDayOffRequests ||
    []

  const mixedRequests =
    payload.requests || payload.all || payload.items || payload.data || []

  return [
    ...toArray(salaryRequests).map((item) =>
      normalizeRequestItem({ ...item, type: item.type || 'salary' })
    ),
    ...toArray(dayOffRequests).map((item) =>
      normalizeRequestItem({ ...item, type: item.type || 'dayoff' })
    ),
    ...toArray(mixedRequests).map((item) => normalizeRequestItem(item)),
  ]
    .filter(Boolean)
    .filter((item, index, array) => {
      return (
        array.findIndex(
          (target) => target.id === item.id && target.type === item.type
        ) === index
      )
    })
}

function normalizeRequestItem(item) {
  if (!item) return null

  const rawType = String(
    item.type || item.requestType || item.entity || ''
  ).toLowerCase()

  const type =
    rawType.includes('salary') ||
    rawType.includes('advance') ||
    item.amount !== undefined
      ? 'salary'
      : 'dayoff'

  const employee =
    item.employee ||
    item.employees ||
    item.user ||
    item.createdBy ||
    item.owner ||
    null

  return {
    ...item,
    employee,
    type,
    status: normalizeStatus(item.status),
    typeLabel: type === 'salary' ? 'เบิกเงินล่วงหน้า' : 'คำขอลา',
    requestDate:
      item.requestDate || item.date || item.startDate || item.createdAt,
    leaveDate: getDayOffRequestDate(item),
    days: item.days || item.totalDays || item.duration || item.leaveDays,
  }
}


function buildMonthlyAdvanceMap(requests) {
  const map = new Map()

  requests.forEach((request) => {
    if (!request || request.type !== 'salary') return
    if (normalizeStatus(request.status) !== 'APPROVED') return

    const employeeId = getRequestEmployeeId(request)
    const monthKey = getThaiMonthKey(request.requestDate || request.createdAt)

    if (!employeeId || !monthKey) return

    const key = `${employeeId}-${monthKey}`
    const amount = Number(request.amount || 0)

    map.set(key, (map.get(key) || 0) + amount)
  })

  return map
}

function getMonthlyAdvanceTaken(request, monthlyAdvanceMap) {
  if (!request || request.type !== 'salary') return 0

  const employeeId = getRequestEmployeeId(request)
  const monthKey = getThaiMonthKey(request.requestDate || request.createdAt)

  if (!employeeId || !monthKey) return 0

  return monthlyAdvanceMap.get(`${employeeId}-${monthKey}`) || 0
}

function buildLeavePeopleMap(requests) {
  const map = new Map()

  requests.forEach((request) => {
    if (!request || request.type !== 'dayoff') return

    const status = normalizeStatus(request.status)
    if (status !== 'APPROVED') return

    const branchId = getRequestBranchId(request)
    const date = getDayOffRequestDate(request)
    const dateKey = getThaiDateKey(date)

    if (!branchId || !dateKey) return

    const employee = request.employee || {}
    const safeBranch = getSafeBranch(employee)
    const safePosition = getSafePosition(employee)

    const branchLabel =
      safeBranch?.name ||
      request.branch?.name ||
      request.branchName ||
      'ไม่ระบุสาขา'

    const employeeId = getRequestEmployeeId(request)
    const personKey = employeeId || `${getEmployeeName(employee)}-${request.id}`
    const groupKey = `${branchId}-${dateKey}`

    if (!map.has(groupKey)) {
      map.set(groupKey, {
        key: groupKey,
        branchId,
        dateKey,
        date,
        dateLabel: formatDate(date),
        branchLabel,
        peopleMap: new Map(),
      })
    }

    const group = map.get(groupKey)

    if (!group.peopleMap.has(personKey)) {
      group.peopleMap.set(personKey, {
        key: personKey,
        name: getEmployeeName(employee),
        positionName:
          safePosition?.name ||
          employee.positionName ||
          employee.role ||
          'พนักงาน',
        profileImage: employee.profileImage || '',
        status,
      })
    }
  })

  const finalMap = new Map()

  map.forEach((group, key) => {
    const people = Array.from(group.peopleMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'th')
    )

    finalMap.set(key, {
      key: group.key,
      branchId: group.branchId,
      dateKey: group.dateKey,
      date: group.date,
      dateLabel: group.dateLabel,
      branchLabel: group.branchLabel,
      count: people.length,
      people,
    })
  })

  return finalMap
}

function getLeavePeopleForRequest(request, leavePeopleMap) {
  if (!request || request.type !== 'dayoff') {
    return {
      count: 0,
      people: [],
    }
  }

  const branchId = getRequestBranchId(request)
  const date = getDayOffRequestDate(request)
  const dateKey = getThaiDateKey(date)

  if (!branchId || !dateKey) {
    return {
      count: 0,
      people: [],
      dateLabel: formatDate(date),
      branchLabel: 'ไม่ระบุสาขา',
    }
  }

  return (
    leavePeopleMap.get(`${branchId}-${dateKey}`) || {
      count: 0,
      people: [],
      dateLabel: formatDate(date),
      branchLabel:
        getSafeBranch(request.employee)?.name ||
        request.branch?.name ||
        request.branchName ||
        'ไม่ระบุสาขา',
    }
  )
}

function getRequestEmployeeId(request) {
  return (
    request.employee?.id ||
    request.employeeId ||
    request.employeesId ||
    request.userId ||
    request.createdById ||
    null
  )
}

function getDayOffRequestDate(request) {
  return (
    request?.leaveDate ||
    request?.startDate ||
    request?.date ||
    request?.dayOffDate ||
    request?.requestDate ||
    request?.createdAt
  )
}

function getThaiDateParts(date) {
  if (!date) return null

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) return null

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: THAI_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(parsed)

  const value = {}

  parts.forEach((part) => {
    if (part.type !== 'literal') {
      value[part.type] = part.value
    }
  })

  if (!value.year || !value.month || !value.day) return null

  return value
}

function getThaiDateKey(date) {
  const parts = getThaiDateParts(date)

  if (!parts) return ''

  return `${parts.year}-${parts.month}-${parts.day}`
}

function getThaiMonthKey(date) {
  const parts = getThaiDateParts(date)

  if (!parts) return ''

  return `${parts.year}-${parts.month}`
}

function getBangkokStartDate(offsetDays = 0) {
  const parts = getThaiDateParts(new Date())

  if (!parts) return new Date()

  const bangkokOffsetMs = 7 * 60 * 60 * 1000
  const utcMs =
    Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)) -
    bangkokOffsetMs +
    offsetDays * 24 * 60 * 60 * 1000

  return new Date(utcMs)
}


function getEmployeeName(employee) {
  return (
    [
      employee?.firstname || employee?.firstName,
      employee?.lastname || employee?.lastName,
    ]
      .filter(Boolean)
      .join(' ') ||
    employee?.name ||
    employee?.email ||
    'ไม่ระบุชื่อ'
  )
}

function getSafeBranch(employee) {
  if (!employee) return null

  const branch = employee.branch || null
  const branchId = employee.branchId || branch?.id || null

  if (!branchId) return null
  if (!branch) return null
  if (branch.isActive === false) return null
  if (branch.isDeleted === true) return null

  return branch
}

function getSafePosition(employee) {
  if (!employee) return null

  const position = employee.position || null
  const positionId = employee.positionId || position?.id || null
  const branchId = employee.branchId || employee.branch?.id || null

  if (!positionId) return null
  if (!position) return null
  if (position.isActive === false) return null
  if (position.isDeleted === true) return null

  if (
    branchId &&
    position.branchId &&
    Number(position.branchId) !== Number(branchId)
  ) {
    return null
  }

  return position
}

function getRequestBranchId(request) {
  return (
    request.employee?.branchId ||
    request.employee?.branch?.id ||
    request.branchId ||
    request.branch?.id ||
    null
  )
}

function normalizeStatus(status) {
  const value = String(status || 'PENDING').toUpperCase()

  if (value === 'APPROVED') return 'APPROVED'
  if (value === 'REJECTED') return 'REJECTED'
  if (value === 'CANCELED' || value === 'CANCELLED') return 'CANCELED'

  return 'PENDING'
}

function getTabKeyFromStatus(status) {
  const value = normalizeStatus(status)

  if (value === 'APPROVED') return 'approved'
  if (value === 'REJECTED' || value === 'CANCELED') return 'rejected'

  return 'pending'
}

function getStatusConfig(status) {
  if (status === 'APPROVED') {
    return {
      label: 'อนุมัติแล้ว',
      className: 'bg-emerald-50 text-emerald-600',
    }
  }

  if (status === 'CANCELED') {
    return {
      label: 'ยกเลิก',
      className: 'bg-slate-100 text-slate-500',
    }
  }

  if (status === 'REJECTED') {
    return {
      label: 'ปฏิเสธ',
      className: 'bg-red-50 text-red-500',
    }
  }

  return {
    label: 'รออนุมัติ',
    className: 'bg-orange-50 text-orange-500',
  }
}

function getTabCountClass(key) {
  if (key === 'pending') return 'bg-orange-50 text-orange-500'
  if (key === 'approved') return 'bg-emerald-50 text-emerald-600'
  if (key === 'rejected') return 'bg-red-50 text-red-500'

  return 'bg-slate-100 text-slate-500'
}

function getRequestResolvedDate(request) {
  const date =
    request.approvedAt ||
    request.rejectedAt ||
    request.canceledAt ||
    request.cancelledAt ||
    request.updatedAt ||
    request.reviewedAt

  if (!date) return null

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) return null

  return parsed
}

function getSortTime(request) {
  const date =
    request.updatedAt ||
    request.approvedAt ||
    request.rejectedAt ||
    request.canceledAt ||
    request.cancelledAt ||
    request.requestDate ||
    request.date ||
    request.createdAt

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) return 0

  return parsed.getTime()
}

function formatDate(date) {
  if (!date) return '-'

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) return '-'

  return parsed.toLocaleDateString('th-TH', {
    timeZone: THAI_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(date) {
  if (!date) return '-'

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) return '-'

  return parsed.toLocaleString('th-TH', {
    timeZone: THAI_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatMoney(value) {
  const number = Number(value || 0)

  return number.toLocaleString('th-TH', {
    maximumFractionDigits: 0,
  })
}

function toArray(value) {
  return Array.isArray(value) ? value : []
}

export default AdminApprovalPage