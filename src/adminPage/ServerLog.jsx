import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  X,
} from 'lucide-react'

import API_URL from '../utils/api'
import useAuthStore from '../store/auth-store'

const ACTION_OPTIONS = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'ADD_USER', label: 'สร้างบัญชีพนักงาน' },
  { value: 'DELETE_USER', label: 'ลบบัญชีพนักงาน' },
  { value: 'UPDATE_USER', label: 'แก้ไขข้อมูลพนักงาน' },
  { value: 'CHANGE_BRANCH', label: 'เปลี่ยนสาขา' },
  { value: 'CHANGE_POSITION', label: 'เปลี่ยนตำแหน่ง' },
  { value: 'CHANGE_SALARY', label: 'เปลี่ยนเงินเดือน' },
  { value: 'ADD_BRANCH', label: 'สร้างสาขา' },
  { value: 'UPDATE_BRANCH', label: 'แก้ไขสาขา' },
  { value: 'DELETE_BRANCH', label: 'ลบสาขา' },
  { value: 'ADD_POSITION', label: 'สร้างตำแหน่ง' },
  { value: 'UPDATE_POSITION', label: 'แก้ไขตำแหน่ง' },
  { value: 'DELETE_POSITION', label: 'ลบตำแหน่ง' },
  { value: 'CREATE_SHIFT', label: 'สร้างกะงาน' },
  { value: 'UPDATE_SHIFT', label: 'แก้ไขกะงาน' },
  { value: 'DELETE_SHIFT', label: 'ลบกะงาน' },
  { value: 'APPROVE_REQUEST', label: 'อนุมัติคำขอ' },
  { value: 'REJECT_REQUEST', label: 'ปฏิเสธคำขอ' },
  { value: 'CANCEL_DAY_OFF', label: 'ยกเลิกวันลา' },
  { value: 'ADD_CALENDAR_NOTE', label: 'เพิ่มโน้ตปฏิทิน' },
  { value: 'UPDATE_CALENDAR_NOTE', label: 'แก้ไขโน้ตปฏิทิน' },
  { value: 'DELETE_CALENDAR_NOTE', label: 'ลบโน้ตปฏิทิน' },
  { value: 'SET_STORE_HOLIDAY', label: 'ตั้งวันหยุดสาขา' },
  { value: 'DELETE_STORE_HOLIDAY', label: 'ลบวันหยุดสาขา' },
  { value: 'MANUAL_TIME_EDIT', label: 'แก้ไขเวลาเอง' },
  { value: 'SYSTEM', label: 'ระบบ' },
]

const getActionLabel = (action) => {
  return ACTION_OPTIONS.find((item) => item.value === action)?.label || action
}

const getActionTone = (action) => {
  const value = String(action || '')

  if (value.includes('DELETE')) return 'bg-red-50 text-red-600'
  if (value.includes('CANCEL')) return 'bg-red-50 text-red-600'
  if (value.includes('REJECT')) return 'bg-orange-50 text-orange-600'
  if (value.includes('APPROVE')) return 'bg-emerald-50 text-emerald-600'

  if (
    value.includes('ADD') ||
    value.includes('CREATE') ||
    value.includes('SET')
  ) {
    return 'bg-blue-50 text-blue-600'
  }

  if (value.includes('UPDATE') || value.includes('CHANGE')) {
    return 'bg-purple-50 text-purple-600'
  }

  return 'bg-slate-100 text-slate-500'
}

const getFullName = (employee) => {
  if (!employee) return 'ไม่ทราบผู้ใช้'

  return (
    [employee.firstname, employee.lastname].filter(Boolean).join(' ') ||
    employee.email ||
    `User #${employee.id}`
  )
}

const formatDateTime = (date) => {
  if (!date) return '-'

  return new Intl.DateTimeFormat('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

const formatDateOnly = (date) => {
  if (!date) return ''

  return new Intl.DateTimeFormat('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString('th-TH')
}

const getInitials = (name) => {
  return String(name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

const buildAuditText = (log) => {
  const actor = getFullName(log.actor)
  const target = getFullName(log.targetEmployee)

  const oldValue = log.oldValue || {}
  const newValue = log.newValue || {}
  const entityIdText = log.entityId ? `#${log.entityId}` : ''

  switch (log.action) {
    case 'ADD_USER': {
      const createdName =
        [newValue.firstname, newValue.lastname].filter(Boolean).join(' ') ||
        newValue.email ||
        target ||
        `พนักงาน ${entityIdText}`

      return `${actor} สร้างบัญชีพนักงาน ${createdName}`
    }

    case 'DELETE_USER':
      return `${actor} ลบบัญชีพนักงาน ${target}`

    case 'UPDATE_USER':
      return `${actor} แก้ไขข้อมูลพนักงาน ${target}`

    case 'CHANGE_BRANCH': {
      const fromBranch = oldValue.branchName || oldValue.branch || 'สาขาเดิม'
      const toBranch = newValue.branchName || newValue.branch || 'สาขาใหม่'

      return `${actor} เปลี่ยนสาขาของ ${target} จาก ${fromBranch} เป็น ${toBranch}`
    }

    case 'CHANGE_POSITION': {
      const fromPosition =
        oldValue.positionName || oldValue.position || 'ตำแหน่งเดิม'
      const toPosition =
        newValue.positionName || newValue.position || 'ตำแหน่งใหม่'

      return `${actor} เปลี่ยนตำแหน่งของ ${target} จาก ${fromPosition} เป็น ${toPosition}`
    }

    case 'CHANGE_SALARY': {
      const oldSalary = oldValue.baseSalary ?? oldValue.salary ?? 0
      const newSalary = newValue.baseSalary ?? newValue.salary ?? 0

      return `${actor} เปลี่ยนเงินเดือนของ ${target} จาก ${formatMoney(
        oldSalary
      )} บาท เป็น ${formatMoney(newSalary)} บาท`
    }

    case 'ADD_BRANCH': {
      const branchName =
        newValue.name || newValue.branchName || log.branch?.name || entityIdText

      return `${actor} สร้างสาขา ${branchName}`
    }

    case 'UPDATE_BRANCH': {
      const branchName =
        newValue.name ||
        oldValue.name ||
        newValue.branchName ||
        log.branch?.name ||
        entityIdText

      return `${actor} แก้ไขข้อมูลสาขา ${branchName}`
    }

    case 'DELETE_BRANCH': {
      const branchName =
        oldValue.name || oldValue.branchName || log.branch?.name || entityIdText

      return `${actor} ลบสาขา ${branchName}`
    }

    case 'ADD_POSITION': {
      const positionName = newValue.name || newValue.positionName || entityIdText
      const branchName = newValue.branchName || log.branch?.name

      return branchName
        ? `${actor} สร้างตำแหน่ง ${positionName} ในสาขา ${branchName}`
        : `${actor} สร้างตำแหน่ง ${positionName}`
    }

    case 'UPDATE_POSITION': {
      const positionName = newValue.name || oldValue.name || entityIdText

      return `${actor} แก้ไขตำแหน่ง ${positionName}`
    }

    case 'DELETE_POSITION': {
      const positionName =
        oldValue.name || oldValue.positionName || entityIdText

      return `${actor} ลบตำแหน่ง ${positionName}`
    }

    case 'CREATE_SHIFT': {
      const shiftName = newValue.name || newValue.shiftName || entityIdText
      const positionName = newValue.positionName

      return positionName
        ? `${actor} สร้างกะ ${shiftName} สำหรับตำแหน่ง ${positionName}`
        : `${actor} สร้างกะ ${shiftName}`
    }

    case 'UPDATE_SHIFT': {
      const shiftName = newValue.name || oldValue.name || entityIdText

      return `${actor} แก้ไขกะ ${shiftName}`
    }

    case 'DELETE_SHIFT': {
      const shiftName = oldValue.name || oldValue.shiftName || entityIdText

      return `${actor} ลบกะ ${shiftName}`
    }

    case 'APPROVE_REQUEST': {
      const requestType =
        log.entity === 'AdvanceSalary'
          ? 'คำขอเบิกเงิน'
          : log.entity === 'DayOff'
            ? 'คำขอลา'
            : 'คำขอ'

      return `${actor} อนุมัติ${requestType}ของ ${target}`
    }

    case 'REJECT_REQUEST': {
      const requestType =
        log.entity === 'AdvanceSalary'
          ? 'คำขอเบิกเงิน'
          : log.entity === 'DayOff'
            ? 'คำขอลา'
            : 'คำขอ'

      return `${actor} ปฏิเสธ${requestType}ของ ${target}`
    }

    case 'CANCEL_DAY_OFF': {
      const requestOwner = log.targetEmployee ? target : actor
      const requestDate = newValue.date || oldValue.date
      const dateText = requestDate ? ` วันที่ ${formatDateOnly(requestDate)}` : ''
      const refundText =
        newValue.refundedDayOff === true
          ? ' และคืนวันลาคงเหลือแล้ว'
          : newValue.refundedDayOff === false
            ? ' โดยไม่มีการคืนวันลาคงเหลือ'
            : ''

      return `${actor} ยกเลิกคำขอลาของ ${requestOwner}${dateText}${refundText}`
    }

    case 'ADD_CALENDAR_NOTE': {
      const title = newValue.title || entityIdText
      const branchName = log.branch?.name || newValue.branchName

      return branchName
        ? `${actor} เพิ่มโน้ต "${title}" ให้สาขา ${branchName}`
        : `${actor} เพิ่มโน้ต "${title}"`
    }

    case 'UPDATE_CALENDAR_NOTE': {
      const title = newValue.title || oldValue.title || entityIdText

      return `${actor} แก้ไขโน้ต "${title}"`
    }

    case 'DELETE_CALENDAR_NOTE': {
      const title = oldValue.title || entityIdText

      return `${actor} ลบโน้ต "${title}"`
    }

    case 'SET_STORE_HOLIDAY': {
      const title = newValue.title || 'วันหยุด'
      const date = newValue.date ? formatDateOnly(newValue.date) : ''
      const branchName = log.branch?.name || newValue.branchName

      return branchName
        ? `${actor} ตั้ง${title} ${date} ให้สาขา ${branchName}`
        : `${actor} ตั้ง${title} ${date}`
    }

    case 'DELETE_STORE_HOLIDAY': {
      const title = oldValue.title || 'วันหยุด'
      const date = oldValue.date ? formatDateOnly(oldValue.date) : ''

      return `${actor} ลบ${title} ${date}`
    }

    case 'MANUAL_TIME_EDIT':
      return `${actor} แก้ไขข้อมูลเวลาเข้างานหรือ OT ของ ${target}`

    default:
      return (
        log.note ||
        `${actor} ทำรายการ ${getActionLabel(log.action)} กับ ${
          log.entity || 'ระบบ'
        } ${entityIdText}`
      )
  }
}

const buildSearchText = (log) => {
  const actorName = getFullName(log.actor)
  const targetName = getFullName(log.targetEmployee)

  return [
    actorName,
    log.actor?.email,
    log.actor?.role,
    targetName,
    log.targetEmployee?.email,
    log.targetEmployee?.role,
    buildAuditText(log),
    getActionLabel(log.action),
    log.action,
    log.entity,
    log.note,
    log.oldValue ? JSON.stringify(log.oldValue) : '',
    log.newValue ? JSON.stringify(log.newValue) : '',
    log.branch?.name,
    log.branch?.code,
    log.entityId,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function UserAvatar({ user, name }) {
  if (user?.profileImage) {
    return (
      <img
        src={user.profileImage}
        alt={name}
        className="h-8 w-8 shrink-0 rounded-full object-cover lg:h-7 lg:w-7"
      />
    )
  }

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-black text-slate-600 lg:h-7 lg:w-7 lg:text-[10px]">
      {getInitials(name)}
    </div>
  )
}

function ServerLog() {
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const [showDateModal, setShowDateModal] = useState(false)
  const [showActionDropdown, setShowActionDropdown] = useState(false)

  const [searchText, setSearchText] = useState('')

  const [filters, setFilters] = useState({
    action: 'all',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20,
  })

  const [dateDraft, setDateDraft] = useState({
    startDate: '',
    endDate: '',
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  })

  const activeActionLabel = useMemo(() => {
    return (
      ACTION_OPTIONS.find((item) => item.value === filters.action)?.label ||
      'ทั้งหมด'
    )
  }, [filters.action])

  const dateLabel = useMemo(() => {
    if (!filters.startDate && !filters.endDate) return 'ทุกช่วงเวลา'

    if (filters.startDate && filters.endDate) {
      return `${formatDateOnly(filters.startDate)} - ${formatDateOnly(
        filters.endDate
      )}`
    }

    if (filters.startDate) return `ตั้งแต่ ${formatDateOnly(filters.startDate)}`
    if (filters.endDate) return `ถึง ${formatDateOnly(filters.endDate)}`

    return 'ทุกช่วงเวลา'
  }, [filters.startDate, filters.endDate])

  const queryParams = useMemo(() => {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        params.append(key, value)
      }
    })

    return params.toString()
  }, [filters])

  const visibleLogs = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()

    if (!keyword) return logs

    return logs.filter((log) => buildSearchText(log).includes(keyword))
  }, [logs, searchText])

  useEffect(() => {
    if (token) {
      getAuditLogs()
    }
  }, [token, queryParams])

  const getAuditLogs = async () => {
    try {
      setLoading(true)

      const res = await axios.get(`${API_URL}/admin/audit-logs?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setLogs(res.data.data || [])
      setPagination(
        res.data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1,
        }
      )
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1,
    }))
  }

  const selectAction = (action) => {
    updateFilter('action', action)
    setShowActionDropdown(false)
  }

  const openDateModal = () => {
    setDateDraft({
      startDate: filters.startDate,
      endDate: filters.endDate,
    })
    setShowDateModal(true)
  }

  const applyDateFilter = () => {
    setFilters((prev) => ({
      ...prev,
      startDate: dateDraft.startDate,
      endDate: dateDraft.endDate,
      page: 1,
    }))

    setShowDateModal(false)
  }

  const clearDateFilter = () => {
    setDateDraft({
      startDate: '',
      endDate: '',
    })

    setFilters((prev) => ({
      ...prev,
      startDate: '',
      endDate: '',
      page: 1,
    }))

    setShowDateModal(false)
  }

  const resetAllFilters = () => {
    setFilters({
      action: 'all',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 20,
    })

    setSearchText('')
    setShowActionDropdown(false)
  }

  return (
    <div className="flex h-[calc(100dvh-0px)] min-h-dvh flex-col bg-[#F5F8FD] px-3.5 pb-10 pt-4 text-[#0F172A] lg:h-[calc(100dvh-78px)] lg:min-h-0 lg:overflow-hidden lg:px-5 lg:pb-5 lg:pt-4">
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col lg:max-w-none">
        <header className="mb-5 flex shrink-0 items-center justify-between gap-3 lg:mb-3">
          <button
            type="button"
            onClick={() => navigate('/user/other')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,0.06)] active:scale-95 lg:h-9 lg:w-9"
          >
            <ChevronLeft size={23} strokeWidth={3} className="lg:h-5 lg:w-5" />
          </button>
        </header>

        <section className="mb-4 flex shrink-0 flex-col gap-2 md:flex-row md:items-center lg:mb-3">
          <div className="flex h-12 w-full items-center gap-2 rounded-2xl bg-white px-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)] md:max-w-[300px] lg:h-10 lg:max-w-[230px] lg:rounded-xl">
            <Search
              size={18}
              strokeWidth={2.7}
              className="shrink-0 text-slate-400 lg:h-4 lg:w-4"
            />

            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="ค้นหา"
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-300 lg:text-xs"
            />

            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText('')}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 active:scale-95 lg:h-6 lg:w-6"
              >
                <X size={15} strokeWidth={3} className="lg:h-3.5 lg:w-3.5" />
              </button>
            )}
          </div>

          <div className="relative w-full md:max-w-[260px] lg:max-w-[220px]">
            <button
              type="button"
              onClick={() => setShowActionDropdown((prev) => !prev)}
              className="relative z-30 flex h-12 w-full items-center justify-between rounded-2xl bg-white px-4 text-left text-sm font-black text-slate-700 shadow-[0_10px_28px_rgba(15,23,42,0.05)] lg:h-10 lg:rounded-xl lg:px-3 lg:text-xs"
            >
              <span className="truncate">ประเภท: {activeActionLabel}</span>
              <ChevronDown
                size={18}
                strokeWidth={3}
                className={`text-slate-400 transition lg:h-4 lg:w-4 ${
                  showActionDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showActionDropdown && (
              <>
                <button
                  type="button"
                  aria-label="Close dropdown"
                  onClick={() => setShowActionDropdown(false)}
                  className="fixed inset-0 z-20 cursor-default bg-transparent"
                />

                <div className="absolute left-0 top-14 z-40 max-h-80 w-full overflow-y-auto rounded-2xl border border-slate-100 bg-white p-1.5 shadow-[0_16px_38px_rgba(15,23,42,0.14)] lg:top-12 lg:max-h-64 lg:rounded-xl">
                  {ACTION_OPTIONS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => selectAction(item.value)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-black lg:py-2 lg:text-[11px] ${
                        filters.action === item.value
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{item.label}</span>
                      {filters.action === item.value && (
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={openDateModal}
            className="flex h-12 w-full items-center justify-between rounded-2xl bg-white px-4 text-left text-sm font-black text-slate-700 shadow-[0_10px_28px_rgba(15,23,42,0.05)] md:max-w-[300px] lg:h-10 lg:max-w-[240px] lg:rounded-xl lg:px-3 lg:text-xs"
          >
            <span className="truncate">ช่วงเวลา: {dateLabel}</span>
            <CalendarDays
              size={18}
              strokeWidth={2.7}
              className="shrink-0 text-slate-400 lg:h-4 lg:w-4"
            />
          </button>

          {(filters.action !== 'all' ||
            filters.startDate ||
            filters.endDate ||
            searchText.trim()) && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="flex h-12 items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-500 active:scale-95 lg:h-10 lg:rounded-xl lg:px-3 lg:text-xs"
            >
              ล้างตัวกรอง
            </button>
          )}

          <div className="hidden flex-1 md:block" />

          <p className="px-1 text-xs font-bold text-slate-400 lg:text-[11px]">
            {searchText.trim()
              ? `พบ ${visibleLogs.length} รายการ`
              : `ทั้งหมด ${pagination.total || 0} รายการ`}
          </p>
        </section>

        <section className="min-h-0 flex-1 overflow-hidden">
          {loading ? (
            <div className="flex h-full min-h-[260px] items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={30} />
            </div>
          ) : visibleLogs.length === 0 ? (
            <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-[1.7rem] bg-white text-center shadow-[0_10px_28px_rgba(15,23,42,0.05)] lg:rounded-[1.2rem]">
              <p className="text-sm font-black text-slate-900">
                ไม่พบประวัติระบบ
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                ลองเปลี่ยนประเภท ช่วงเวลา หรือคำค้นหาใหม่
              </p>
            </div>
          ) : (
            <>
              <div className="hidden h-full overflow-auto rounded-[1.45rem] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] md:block lg:rounded-[1.15rem]">
                <table className="min-w-[1120px] w-full table-fixed border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-slate-50">
                    <tr className="text-[11px] font-black uppercase tracking-wide text-slate-400 lg:text-[10px]">
                      <th className="w-[170px] px-4 py-3 lg:w-[145px] lg:px-3 lg:py-2.5">
                        ผู้ใช้งาน
                      </th>
                      <th className="px-4 py-3 lg:px-3 lg:py-2.5">
                        เหตุการณ์
                      </th>
                      <th className="w-[150px] px-4 py-3 lg:w-[135px] lg:px-3 lg:py-2.5">
                        ประเภท
                      </th>
                      <th className="w-[120px] px-4 py-3 lg:w-[105px] lg:px-3 lg:py-2.5">
                        ข้อมูล
                      </th>
                      <th className="w-[130px] px-4 py-3 lg:w-[110px] lg:px-3 lg:py-2.5">
                        สาขา
                      </th>
                      <th className="w-[150px] px-4 py-3 lg:w-[135px] lg:px-3 lg:py-2.5">
                        เวลา
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {visibleLogs.map((log) => {
                      const actorName = getFullName(log.actor)

                      return (
                        <tr key={log.id} className="bg-white text-xs">
                          <td className="px-4 py-3 lg:px-3 lg:py-2.5">
                            <div className="flex min-w-0 items-center gap-2">
                              <UserAvatar user={log.actor} name={actorName} />

                              <div className="min-w-0">
                                <p className="truncate font-black text-slate-900 lg:text-[11px]">
                                  {actorName}
                                </p>
                                <p className="truncate text-[11px] font-semibold text-slate-400 lg:text-[10px]">
                                  {log.actor?.email || '-'}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 lg:px-3 lg:py-2.5">
                            <p className="line-clamp-2 font-semibold leading-5 text-slate-700 lg:text-[11px] lg:leading-4">
                              {buildAuditText(log)}
                            </p>
                            {log.note && (
                              <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400 lg:text-[10px]">
                                {log.note}
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-3 lg:px-3 lg:py-2.5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black lg:px-2 lg:py-0.5 lg:text-[10px] ${getActionTone(
                                log.action
                              )}`}
                            >
                              {getActionLabel(log.action)}
                            </span>
                          </td>

                          <td className="px-4 py-3 font-bold text-slate-500 lg:px-3 lg:py-2.5 lg:text-[11px]">
                            <span className="block truncate">
                              {log.entity || '-'}
                            </span>
                          </td>

                          <td className="px-4 py-3 font-bold text-slate-500 lg:px-3 lg:py-2.5 lg:text-[11px]">
                            <span className="block truncate">
                              {log.branch?.name || '-'}
                            </span>
                          </td>

                          <td className="px-4 py-3 font-semibold text-slate-400 lg:px-3 lg:py-2.5 lg:text-[10px]">
                            {formatDateTime(log.createdAt)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="h-full space-y-3 overflow-y-auto pr-1 md:hidden">
                {visibleLogs.map((log) => {
                  const actorName = getFullName(log.actor)

                  return (
                    <div
                      key={log.id}
                      className="w-full rounded-[1.45rem] bg-white p-4 text-left shadow-[0_10px_28px_rgba(15,23,42,0.05)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <UserAvatar user={log.actor} name={actorName} />

                            <div className="min-w-0">
                              <p className="truncate text-xs font-black text-slate-900">
                                {actorName}
                              </p>
                              <p className="truncate text-[11px] font-semibold text-slate-400">
                                ผู้ใช้งาน · {formatDateTime(log.createdAt)}
                              </p>
                            </div>
                          </div>

                          <p className="text-sm font-black leading-6 text-slate-950">
                            {buildAuditText(log)}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${getActionTone(
                            log.action
                          )}`}
                        >
                          {getActionLabel(log.action)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </section>

        <div className="mt-4 flex shrink-0 items-center justify-between border-t border-slate-100 pt-4 lg:mt-3 lg:pt-3">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => updateFilter('page', pagination.page - 1)}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-black text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.05)] disabled:opacity-40 lg:h-9 lg:px-2.5 lg:text-[11px]"
          >
            <ChevronLeft size={16} strokeWidth={3} className="lg:h-3.5 lg:w-3.5" />
            ก่อนหน้า
          </button>

          <p className="text-xs font-bold text-slate-400 lg:text-[11px]">
            หน้า {pagination.page || 1} / {pagination.totalPages || 1}
          </p>

          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => updateFilter('page', pagination.page + 1)}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-black text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.05)] disabled:opacity-40 lg:h-9 lg:px-2.5 lg:text-[11px]"
          >
            ถัดไป
            <ChevronRight size={16} strokeWidth={3} className="lg:h-3.5 lg:w-3.5" />
          </button>
        </div>
      </div>

      {showDateModal && (
        <DateRangeModal
          dateDraft={dateDraft}
          setDateDraft={setDateDraft}
          onClose={() => setShowDateModal(false)}
          onApply={applyDateFilter}
          onClear={clearDateFilter}
        />
      )}
    </div>
  )
}

function DateRangeModal({
  dateDraft,
  setDateDraft,
  onClose,
  onApply,
  onClear,
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/40 px-3 pt-20"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[1.4rem] bg-white p-4 shadow-2xl lg:max-w-sm lg:rounded-[1.2rem] lg:p-3.5"
      >
        <div className="mb-4 flex items-start justify-between gap-3 lg:mb-3">
          <div>
            <p className="text-base font-black text-slate-950 lg:text-sm">
              เลือกช่วงเวลา
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-400 lg:text-[11px]">
              เลือกวันที่เริ่มต้นและวันที่สิ้นสุดของประวัติระบบ
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:scale-95 lg:h-8 lg:w-8"
          >
            <X size={18} strokeWidth={3} className="lg:h-4 lg:w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-black text-slate-500 lg:text-[11px]">
              วันที่เริ่มต้น
            </label>
            <input
              type="date"
              value={dateDraft.startDate}
              onChange={(e) =>
                setDateDraft((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-300 lg:h-10 lg:text-xs"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-black text-slate-500 lg:text-[11px]">
              วันที่สิ้นสุด
            </label>
            <input
              type="date"
              value={dateDraft.endDate}
              onChange={(e) =>
                setDateDraft((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-300 lg:h-10 lg:text-xs"
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 lg:mt-4">
          <button
            type="button"
            onClick={onClear}
            className="flex h-11 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-600 active:scale-95 lg:h-10 lg:text-xs"
          >
            ล้างช่วงเวลา
          </button>

          <button
            type="button"
            onClick={onApply}
            className="flex h-11 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white active:scale-95 lg:h-10 lg:text-xs"
          >
            ใช้ตัวกรอง
          </button>
        </div>
      </div>
    </div>
  )
}

export default ServerLog