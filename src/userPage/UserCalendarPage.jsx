import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import moment from 'moment'
import 'moment/locale/th'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  StickyNote,
  Umbrella,
  Building2,
  Loader2,
  AlertCircle,
  Trash2,
} from 'lucide-react'

import API_URL from '../utils/api'
import useAuthStore from '../store/auth-store'
import { createAlert } from '../utils/createAlert'

moment.locale('th')

const DEFAULT_NOTE_FORM = {
  date: '',
  title: '',
  note: '',
}

const WEEK_DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
]

const THAI_WEEK_DAYS_FULL = [
  'วันอาทิตย์',
  'วันจันทร์',
  'วันอังคาร',
  'วันพุธ',
  'วันพฤหัสบดี',
  'วันศุกร์',
  'วันเสาร์',
]

const getArray = (value) => {
  return Array.isArray(value) ? value : []
}

const formatThaiMonthYear = (date) => {
  const finalDate = moment(date)
  const monthName = THAI_MONTHS[finalDate.month()]
  const year = finalDate.year()

  return `${monthName} ${year}`
}

const formatThaiFullDate = (date) => {
  const finalDate = moment(date)
  const day = finalDate.date()
  const monthName = THAI_MONTHS[finalDate.month()]
  const year = finalDate.year()

  return `${day} ${monthName} ${year}`
}

const formatThaiWeekDay = (date) => {
  return THAI_WEEK_DAYS_FULL[moment(date).day()]
}

const isDayOffEvent = (event) => {
  const type = String(event?.type || '').toLowerCase()

  return type !== 'holiday' && type !== 'note'
}

const getDayOffId = (event) => {
  return event?.eventId || event?.raw?.id || event?.id || null
}

const getDayOffOwnerId = (event) => {
  return (
    event?.employeeId ||
    event?.employeesId ||
    event?.raw?.employeeId ||
    event?.raw?.employeesId ||
    event?.raw?.userId ||
    event?.raw?.employee?.id ||
    event?.raw?.employees?.id ||
    null
  )
}

const normalizeDayOffStatus = (status) => {
  const value = String(status || 'PENDING').toUpperCase()

  if (value === 'APPROVED') return 'APPROVED'
  if (value === 'REJECTED') return 'REJECTED'
  if (value === 'CANCELLED') return 'CANCELED'
  if (value === 'CANCELED') return 'CANCELED'

  return 'PENDING'
}

const getDayOffStatus = (event) => {
  return normalizeDayOffStatus(event?.status || event?.raw?.status || 'PENDING')
}

const isPastDayOffEvent = (event) => {
  if (!event?.date) return false

  return moment(event.date).startOf('day').isBefore(moment().startOf('day'))
}

const isCancelableDayOffEvent = (event, currentUserId, isAdminOrOwner) => {
  if (!isDayOffEvent(event)) return false

  const status = getDayOffStatus(event)

  if (status !== 'PENDING' && status !== 'APPROVED') return false
  if (isPastDayOffEvent(event)) return false

  const ownerId = getDayOffOwnerId(event)

  if (!ownerId) {
    return !isAdminOrOwner
  }

  return String(ownerId) === String(currentUserId)
}

const getCancelDayOffDisabledReason = (event, currentUserId, isAdminOrOwner) => {
  const status = getDayOffStatus(event)

  if (status !== 'PENDING' && status !== 'APPROVED') {
    return 'คำขอนี้ไม่สามารถยกเลิกได้'
  }

  if (isPastDayOffEvent(event)) {
    return 'ไม่สามารถยกเลิกวันลาที่ผ่านมาแล้ว'
  }

  const ownerId = getDayOffOwnerId(event)

  if (ownerId && String(ownerId) !== String(currentUserId)) {
    return 'ยกเลิกได้เฉพาะคำขอลาของตัวเอง'
  }

  if (!ownerId && isAdminOrOwner) {
    return 'ไม่พบข้อมูลเจ้าของคำขอ จึงไม่สามารถยกเลิกจากหน้านี้ได้'
  }

  return 'ไม่สามารถยกเลิกคำขอนี้ได้'
}

const getDayOffStatusConfig = (status) => {
  const value = normalizeDayOffStatus(status)

  if (value === 'APPROVED') {
    return {
      label: 'อนุมัติแล้ว',
      className: 'bg-emerald-50 text-emerald-600',
    }
  }

  if (value === 'REJECTED') {
    return {
      label: 'ปฏิเสธ',
      className: 'bg-red-50 text-red-500',
    }
  }

  if (value === 'CANCELED' || value === 'CANCELLED') {
    return {
      label: 'ยกเลิกแล้ว',
      className: 'bg-slate-100 text-slate-500',
    }
  }

  return {
    label: 'รออนุมัติ',
    className: 'bg-orange-50 text-orange-600',
  }
}

const getEmployeeDisplayName = (employee) => {
  return (
    [employee?.firstname, employee?.lastname].filter(Boolean).join(' ') ||
    employee?.name ||
    employee?.email ||
    'พนักงาน'
  )
}

const getHistoryDayOffItems = (payload) => {
  const logs = payload?.logs || {}
  const candidates = [
    ...getArray(logs.dayOff),
    ...getArray(logs.dayOffs),
    ...getArray(logs.leaveRequests),
    ...getArray(payload?.dayOff),
    ...getArray(payload?.dayOffs),
    ...getArray(payload?.leaveRequests),
    ...getArray(payload?.requests),
    ...getArray(payload?.data),
    ...getArray(payload?.result),
  ].filter(Boolean)

  const map = new Map()

  candidates.forEach((item) => {
    const type = String(item.type || item.requestType || '').toLowerCase()
    const looksLikeAdvance =
      type.includes('salary') ||
      type.includes('advance') ||
      item.amount !== undefined

    const looksLikeDayOff =
      type.includes('dayoff') ||
      type.includes('leave') ||
      item.reason !== undefined ||
      item.date !== undefined

    if (looksLikeAdvance && !looksLikeDayOff) return

    const status = normalizeDayOffStatus(item.status)
    const date = item.date || item.requestDate || item.startDate || item.createdAt

    if (!date) return
    if (status === 'CANCELED' || status === 'REJECTED') return

    const key =
      item.id ||
      item.dayOffId ||
      item.requestId ||
      `${moment(date).format('YYYY-MM-DD')}-${status}-${item.reason || ''}`

    map.set(String(key), item)
  })

  return Array.from(map.values())
}

const normalizeOwnDayOffEvent = ({
  item,
  profile,
  user,
  safeBranch,
  fallbackBranchId,
}) => {
  if (!item) return null

  const date = item.date || item.requestDate || item.startDate || item.createdAt

  if (!date) return null

  const status = normalizeDayOffStatus(item.status)

  if (status === 'CANCELED' || status === 'REJECTED') return null

  const currentUserId =
    profile?.id ||
    user?.id ||
    item.employeesId ||
    item.employeeId ||
    item.employee?.id ||
    item.employees?.id ||
    null

  const eventId =
    item.id ||
    item.dayOffId ||
    item.requestId ||
    `own-${moment(date).format('YYYY-MM-DD')}-${status}`

  const branchName =
    item.branchName ||
    item.branch?.name ||
    item.employee?.branch?.name ||
    item.employees?.branch?.name ||
    safeBranch?.name ||
    'สาขา'

  const employeeName =
    item.employeeName ||
    item.name ||
    getEmployeeDisplayName(item.employee || item.employees || profile || user)

  return {
    id: `dayoff-${eventId}`,
    eventId,
    title:
      status === 'PENDING'
        ? 'วันลาของฉัน (รออนุมัติ)'
        : status === 'APPROVED'
          ? 'วันลาของฉัน'
          : 'คำขอวันลาของฉัน',
    date: moment(date).format('YYYY-MM-DD'),
    type: 'dayoff',
    status,
    employeeId: currentUserId,
    employeesId: currentUserId,
    branchId:
      item.branchId ||
      item.branch?.id ||
      item.employee?.branchId ||
      item.employees?.branchId ||
      profile?.branchId ||
      user?.branchId ||
      safeBranch?.id ||
      fallbackBranchId ||
      null,
    branchName,
    raw: {
      ...item,
      employeeName,
    },
  }
}

const mergeOwnDayOffEvents = (fallbackEvents, historyEvents) => {
  const map = new Map()

  fallbackEvents.forEach((event) => {
    if (!event) return

    const key = getDayOffId(event) || `${event.date}-${getDayOffStatus(event)}`

    map.set(String(key), event)
  })

  historyEvents.forEach((event) => {
    if (!event) return

    const key = getDayOffId(event) || `${event.date}-${getDayOffStatus(event)}`

    map.set(String(key), event)
  })

  return Array.from(map.values())
    .filter((event) => {
      const status = getDayOffStatus(event)

      return status !== 'REJECTED' && status !== 'CANCELED'
    })
    .sort((a, b) => {
      return moment(a.date).valueOf() - moment(b.date).valueOf()
    })
}


function UserCalendarPage() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  const [profile, setProfile] = useState(null)
  const [events, setEvents] = useState([])
  const [ownDayOffEvents, setOwnDayOffEvents] = useState([])
  const [branches, setBranches] = useState([])
  const [selectedBranchId, setSelectedBranchId] = useState('all')
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const [dayModalOpen, setDayModalOpen] = useState(false)

  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)

  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [noteForm, setNoteForm] = useState(DEFAULT_NOTE_FORM)
  const [noteLoading, setNoteLoading] = useState(false)
  const [deleteNoteLoading, setDeleteNoteLoading] = useState(null)
  const [cancelDayOffTarget, setCancelDayOffTarget] = useState(null)
  const [cancelDayOffLoading, setCancelDayOffLoading] = useState(false)

  const role = String(profile?.role || user?.role || '').toUpperCase()
  const isAdminOrOwner = role === 'ADMIN' || role === 'OWNER'

  const safeBranch = useMemo(() => {
    const branch = profile?.branch || user?.branch || null
    const branchId = profile?.branchId || user?.branchId || null

    if (!branchId) return null
    if (!branch) return null
    if (branch.isActive === false) return null
    if (branch.isDeleted === true) return null

    return branch
  }, [profile, user])

  const safeBranchId =
    profile?.branchId || user?.branchId || safeBranch?.id || null

  const activeBranches = useMemo(() => {
    return branches.filter((branch) => {
      if (!branch) return false
      if (branch.isDeleted === true) return false
      if (branch.isActive === false) return false

      return true
    })
  }, [branches])

  const selectedBranchData = useMemo(() => {
    if (selectedBranchId === 'all') return null

    return (
      activeBranches.find((branch) => {
        return String(branch.id) === String(selectedBranchId)
      }) ||
      (String(safeBranchId) === String(selectedBranchId) ? safeBranch : null)
    )
  }, [activeBranches, selectedBranchId, safeBranchId, safeBranch])

  const selectedCalendarBranchId = isAdminOrOwner
    ? selectedBranchId === 'all'
      ? null
      : selectedBranchId
    : safeBranchId

  const canUseCalendar = isAdminOrOwner
    ? true
    : Boolean(safeBranchId && safeBranch)

  const canCreateNote = Boolean(isAdminOrOwner && selectedCalendarBranchId)
  const canDeleteNote = isAdminOrOwner

  useEffect(() => {
    if (!token) return
    fetchProfile()
  }, [token])

  useEffect(() => {
    if (!token || profileLoading || !isAdminOrOwner) return

    fetchBranches()
  }, [token, profileLoading, isAdminOrOwner])

  useEffect(() => {
    if (!token || profileLoading) return

    if (!canUseCalendar) {
      setEvents([])
      setLoading(false)
      return
    }

    fetchCalendar()
  }, [
    token,
    profileLoading,
    calendarDate,
    safeBranchId,
    selectedBranchId,
    isAdminOrOwner,
    canUseCalendar,
  ])

  const fetchProfile = async () => {
    try {
      setProfileLoading(true)

      const res = await axios.get(`${API_URL}/user/myProfile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const profileData = res.data.result || res.data.data || res.data || null
      setProfile(profileData)
    } catch (error) {
      console.log(error)
    } finally {
      setProfileLoading(false)
    }
  }

  const fetchBranches = async () => {
    if (!isAdminOrOwner) return

    try {
      const res = await axios.get(`${API_URL}/admin/branches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const branchData =
        res.data?.data || res.data?.result || res.data?.branches || []

      setBranches(
        branchData.filter((branch) => {
          return branch && branch.isDeleted !== true
        })
      )
    } catch (error) {
      console.log(error)

      createAlert(
        'error',
        error.response?.data?.message || 'โหลดรายชื่อสาขาไม่สำเร็จ'
      )
    }
  }

  const fetchCalendar = async () => {
    try {
      setLoading(true)

      const month = moment(calendarDate).month() + 1
      const year = moment(calendarDate).year()

      const params = new URLSearchParams({
        month: String(month),
        year: String(year),
      })

      let url = `${API_URL}/calendar/user?${params.toString()}`

      if (isAdminOrOwner) {
        if (selectedCalendarBranchId) {
          params.set('branchId', String(selectedCalendarBranchId))
        }

        url = `${API_URL}/calendar/admin?${params.toString()}`
      }

      const historyUrl = `${API_URL}/user/history?month=${month}&year=${year}`

      const [calendarResult, historyResult] = await Promise.allSettled([
        axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get(historyUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ])

      if (calendarResult.status === 'rejected') {
        throw calendarResult.reason
      }

      const rawEvents =
        calendarResult.value.data.data ||
        calendarResult.value.data.result ||
        []

      const mappedCalendarEvents = rawEvents
        .map((item) => {
          const date = item.date || item.startDate || item.start

          if (!date) return null

          const itemType = String(item.type || '').toLowerCase()
          const isCalendarDayOff = itemType !== 'holiday' && itemType !== 'note'

          const branchName =
            item.branchName ||
            item.branch?.name ||
            item.raw?.branchName ||
            selectedBranchData?.name ||
            safeBranch?.name ||
            'สาขา'

          let title = ''

          if (item.type === 'holiday') {
            title = item.title || `วันหยุด: ${branchName}`
          } else if (item.type === 'note') {
            title = item.title || 'Note'
          } else {
            title = 'วันลาของฉัน'
          }

          return {
            id: `${item.type || 'dayoff'}-${item.id}`,
            eventId: item.id,
            title,
            date: moment(date).format('YYYY-MM-DD'),
            type: item.type || 'dayoff',
            status: isCalendarDayOff
              ? normalizeDayOffStatus(item.status || item.raw?.status || 'APPROVED')
              : item.status || item.raw?.status || null,
            employeeId:
              item.employeeId ||
              item.employeesId ||
              item.userId ||
              item.employee?.id ||
              item.employees?.id ||
              item.raw?.employeeId ||
              item.raw?.employeesId ||
              null,
            employeesId:
              item.employeesId ||
              item.employeeId ||
              item.userId ||
              item.employee?.id ||
              item.employees?.id ||
              item.raw?.employeesId ||
              item.raw?.employeeId ||
              null,
            branchId:
              item.branchId ||
              selectedCalendarBranchId ||
              safeBranchId ||
              null,
            branchName,
            raw: item,
          }
        })
        .filter(Boolean)
        .filter((event) => {
          if (!isDayOffEvent(event)) return true

          const status = getDayOffStatus(event)

          return status !== 'REJECTED' && status !== 'CANCELED'
        })

      const calendarNonDayOffEvents = mappedCalendarEvents.filter((event) => {
        return !isDayOffEvent(event)
      })

      const calendarOwnDayOffFallback = mappedCalendarEvents
        .filter(isDayOffEvent)
        .filter((event) => {
          const ownerId = getDayOffOwnerId(event)

          if (ownerId) {
            return String(ownerId) === String(currentUserId)
          }

          return !isAdminOrOwner
        })

      const historyDayOffEvents =
        historyResult.status === 'fulfilled'
          ? getHistoryDayOffItems(historyResult.value.data)
              .map((item) =>
                normalizeOwnDayOffEvent({
                  item,
                  profile,
                  user,
                  safeBranch,
                  fallbackBranchId: selectedCalendarBranchId || safeBranchId,
                })
              )
              .filter(Boolean)
          : []

      const nextOwnDayOffEvents = mergeOwnDayOffEvents(
        calendarOwnDayOffFallback,
        historyDayOffEvents
      )

      setOwnDayOffEvents(nextOwnDayOffEvents)
      setEvents([...calendarNonDayOffEvents, ...nextOwnDayOffEvents])
    } catch (error) {
      console.log(error)
      createAlert(
        'error',
        error.response?.data?.message || 'โหลดปฏิทินไม่สำเร็จ'
      )
      setOwnDayOffEvents([])
    } finally {
      setLoading(false)
    }
  }

  const calendarDays = useMemo(() => {
    const startOfMonth = moment(calendarDate).startOf('month')
    const endOfMonth = moment(calendarDate).endOf('month')
    const startDay = startOfMonth.day()
    const totalDays = endOfMonth.date()

    const days = []

    const prevMonth = moment(calendarDate).subtract(1, 'month')
    const prevMonthDays = prevMonth.daysInMonth()

    for (let i = startDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i
      const date = prevMonth.date(day).format('YYYY-MM-DD')

      days.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: date === moment().format('YYYY-MM-DD'),
        isSelected: date === moment(selectedDate).format('YYYY-MM-DD'),
        events: events.filter((event) => event.date === date),
      })
    }

    for (let day = 1; day <= totalDays; day++) {
      const date = moment(calendarDate).date(day).format('YYYY-MM-DD')

      days.push({
        date,
        day,
        isCurrentMonth: true,
        isToday: date === moment().format('YYYY-MM-DD'),
        isSelected: date === moment(selectedDate).format('YYYY-MM-DD'),
        events: events.filter((event) => event.date === date),
      })
    }

    const nextMonth = moment(calendarDate).add(1, 'month')
    let nextDay = 1

    while (days.length % 7 !== 0) {
      const date = nextMonth.date(nextDay).format('YYYY-MM-DD')

      days.push({
        date,
        day: nextDay,
        isCurrentMonth: false,
        isToday: date === moment().format('YYYY-MM-DD'),
        isSelected: date === moment(selectedDate).format('YYYY-MM-DD'),
        events: events.filter((event) => event.date === date),
      })

      nextDay++
    }

    return days
  }, [calendarDate, events, selectedDate])

  const selectedDateKey = moment(selectedDate).format('YYYY-MM-DD')

  const selectedDayEvents = useMemo(() => {
    return events
      .filter((event) => event.date === selectedDateKey)
      .filter((event) => {
        if (!isDayOffEvent(event)) return true

        const status = getDayOffStatus(event)

        return status !== 'REJECTED' && status !== 'CANCELED'
      })
  }, [events, selectedDateKey])

  const currentUserId = profile?.id || user?.id || null

  const dayOffEvents = useMemo(() => {
    return ownDayOffEvents
      .filter((event) => {
        const status = getDayOffStatus(event)

        return status !== 'REJECTED' && status !== 'CANCELED'
      })
      .filter((event) => {
        const ownerId = getDayOffOwnerId(event)

        if (!ownerId || !currentUserId) return true

        return String(ownerId) === String(currentUserId)
      })
      .sort((a, b) => moment(a.date).valueOf() - moment(b.date).valueOf())
  }, [ownDayOffEvents, currentUserId])

  const cancelableDayOffCount = useMemo(() => {
    return dayOffEvents.filter((event) =>
      isCancelableDayOffEvent(event, currentUserId, isAdminOrOwner)
    ).length
  }, [dayOffEvents, currentUserId, isAdminOrOwner])

  const branchName = isAdminOrOwner
    ? selectedBranchId === 'all'
      ? 'ทุกสาขา'
      : selectedBranchData?.name || 'ยังไม่พบข้อมูลสาขา'
    : safeBranch?.name || 'ยังไม่พบข้อมูลสาขา'

  const branchAddress = isAdminOrOwner
    ? selectedBranchId === 'all'
      ? 'Admin/Owner สามารถดูปฏิทินรวมทุกสาขา'
      : selectedBranchData?.address || 'ปฏิทินประจำสาขา'
    : safeBranch?.address || 'ปฏิทินประจำสาขา'

  const noteBranchName =
    selectedBranchData?.name ||
    (String(safeBranchId) === String(selectedCalendarBranchId)
      ? safeBranch?.name
      : '') ||
    'กรุณาเลือกสาขา'

  const goPrevMonth = () => {
    setCalendarDate((prev) => moment(prev).subtract(1, 'month').toDate())
  }

  const goNextMonth = () => {
    setCalendarDate((prev) => moment(prev).add(1, 'month').toDate())
  }

  const goToday = () => {
    const today = new Date()
    setCalendarDate(today)
    setSelectedDate(today)
    setDayModalOpen(true)
  }

  const selectDate = (date) => {
    const nextDate = new Date(`${date}T00:00:00.000+07:00`)
    setSelectedDate(nextDate)

    if (!moment(date).isSame(calendarDate, 'month')) {
      setCalendarDate(nextDate)
    }

    setDayModalOpen(true)
  }

  const openAddNoteModal = (date = selectedDate) => {
    if (!canCreateNote) {
      createAlert(
        'error',
        isAdminOrOwner
          ? 'กรุณาเลือกสาขาก่อนเพิ่ม Note'
          : 'เฉพาะ Admin หรือ Owner เท่านั้นที่เพิ่ม Note ได้'
      )
      return
    }

    setNoteForm({
      date: moment(date || new Date()).format('YYYY-MM-DD'),
      title: '',
      note: '',
    })

    setNoteModalOpen(true)
  }

  const closeNoteModal = () => {
    setNoteModalOpen(false)
    setNoteForm(DEFAULT_NOTE_FORM)
  }

  const submitNote = async (e) => {
    e.preventDefault()

    if (!noteForm.date || !noteForm.title.trim()) {
      createAlert('error', 'กรุณากรอกวันที่และหัวข้อ')
      return
    }

    if (!canCreateNote) {
      createAlert('error', 'ไม่สามารถเพิ่ม Note ได้')
      return
    }

    try {
      setNoteLoading(true)

      const payload = {
        date: noteForm.date,
        title: noteForm.title.trim(),
        note: noteForm.note?.trim() || null,
        branchId: Number(selectedCalendarBranchId),
      }

      await axios.post(`${API_URL}/admin/calendar-note`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      createAlert('success', 'เพิ่ม Note สำเร็จ')
      closeNoteModal()
      await fetchCalendar()
    } catch (error) {
      console.log(error)

      createAlert(
        'error',
        error.response?.data?.message || 'บันทึก Note ไม่สำเร็จ'
      )
    } finally {
      setNoteLoading(false)
    }
  }

  const deleteNote = async (event) => {
    if (!canDeleteNote) {
      createAlert('error', 'เฉพาะ Admin หรือ Owner เท่านั้นที่ลบ Note ได้')
      return
    }

    if (!event || event.type !== 'note') {
      createAlert('error', 'ลบได้เฉพาะ Note เท่านั้น')
      return
    }

    const noteId = event.eventId || event.raw?.id

    if (!noteId) {
      createAlert('error', 'ไม่พบ id ของ Note')
      return
    }

    try {
      setDeleteNoteLoading(noteId)

      await axios.delete(`${API_URL}/admin/calendar-note/${noteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      createAlert('success', 'ลบ Note สำเร็จ')

      setEvents((prev) =>
        prev.filter((item) => {
          if (item.type !== 'note') return true
          return String(item.eventId) !== String(noteId)
        })
      )

      await fetchCalendar()
    } catch (error) {
      console.log(error)

      createAlert(
        'error',
        error.response?.data?.message || 'ลบ Note ไม่สำเร็จ'
      )
    } finally {
      setDeleteNoteLoading(null)
    }
  }

  const openCancelDayOffConfirm = (event) => {
    if (!isCancelableDayOffEvent(event, currentUserId, isAdminOrOwner)) {
      createAlert(
        'error',
        getCancelDayOffDisabledReason(event, currentUserId, isAdminOrOwner)
      )
      return
    }

    setCancelDayOffTarget(event)
  }

  const closeCancelDayOffConfirm = () => {
    if (cancelDayOffLoading) return

    setCancelDayOffTarget(null)
  }

  const cancelDayOff = async () => {
    if (!cancelDayOffTarget || cancelDayOffLoading) return

    const dayOffId = getDayOffId(cancelDayOffTarget)

    if (!dayOffId) {
      createAlert('error', 'ไม่พบ id ของคำขอลา')
      return
    }

    try {
      setCancelDayOffLoading(true)

      await axios.delete(`${API_URL}/user/cancel-dayoff/${dayOffId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      createAlert('success', 'ยกเลิกวันลาสำเร็จ')

      setEvents((prev) =>
        prev.filter((item) => {
          if (!isDayOffEvent(item)) return true

          return String(getDayOffId(item)) !== String(dayOffId)
        })
      )

      setOwnDayOffEvents((prev) =>
        prev.filter((item) => {
          return String(getDayOffId(item)) !== String(dayOffId)
        })
      )

      setDayModalOpen(false)
      setCancelDayOffTarget(null)

      await fetchCalendar()
    } catch (error) {
      console.log(error)

      createAlert(
        'error',
        error.response?.data?.message || 'ยกเลิกวันลาไม่สำเร็จ'
      )
    } finally {
      setCancelDayOffLoading(false)
    }
  }


  return (
    <div className="min-h-dvh bg-[#F5F8FD] px-4 pb-40 pt-5 text-[#0F172A] lg:px-5 lg:pb-8 lg:pt-4 xl:px-6">
      <div className="mx-auto w-full max-w-md space-y-4 lg:max-w-5xl lg:space-y-3 xl:max-w-6xl">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="mt-1 text-2xl font-black tracking-tight lg:text-2xl">
              ตารางงาน
            </h1>

            <p className="mt-1 text-sm font-semibold text-slate-500 lg:text-xs">
              ปฏิทินประจำสาขาของคุณ
            </p>
          </div>
        </header>

        <section className="rounded-[1.7rem] bg-gradient-to-br from-[#0057E7] via-[#0052D9] to-[#003BB5] p-4 text-white shadow-[0_14px_34px_rgba(37,99,235,0.28)] lg:rounded-[1.25rem] lg:p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
            <div className="flex min-w-0 items-center gap-3 lg:gap-2.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 lg:h-9 lg:w-9 lg:rounded-xl">
                <Building2 size={22} className="lg:h-[18px] lg:w-[18px]" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white/65 lg:text-[10px]">
                  {isAdminOrOwner ? 'มุมมองปฏิทิน' : 'สาขาของฉัน'}
                </p>

                <h2 className="truncate text-lg font-black lg:text-base">
                  {profileLoading ? 'กำลังโหลดข้อมูลสาขา...' : branchName}
                </h2>

                <p className="truncate text-xs font-semibold text-white/65 lg:text-[10px]">
                  {profileLoading ? 'กรุณารอสักครู่' : branchAddress}
                </p>
              </div>
            </div>

            {isAdminOrOwner && (
              <BranchFilterSelect
                value={selectedBranchId}
                onChange={setSelectedBranchId}
                branches={activeBranches}
                loading={profileLoading}
              />
            )}
          </div>
        </section>

        {!profileLoading && !canUseCalendar && (
          <section className="flex items-start gap-2 rounded-2xl bg-orange-50 px-3.5 py-3 text-orange-600 lg:rounded-xl lg:px-3 lg:py-2.5">
            <AlertCircle
              size={19}
              strokeWidth={2.6}
              className="mt-0.5 lg:h-4 lg:w-4"
            />

            <div>
              <p className="text-sm font-black lg:text-xs">
                ยังไม่สามารถใช้ปฏิทินได้
              </p>

              <p className="mt-0.5 text-xs font-bold leading-5 lg:text-[10px] lg:leading-4">
                บัญชีนี้ยังไม่มีสาขาที่ใช้งานได้ หรือสาขาถูกปิดใช้งานแล้ว
              </p>
            </div>
          </section>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-3 xl:grid-cols-[minmax(0,1fr)_370px]">
          <section className="pt-1 lg:max-h-[calc(100dvh-245px)] lg:overflow-y-auto lg:rounded-[1.25rem] lg:bg-white lg:p-3 lg:shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
            <CalendarHeader
              calendarDate={calendarDate}
              onPrev={goPrevMonth}
              onNext={goNextMonth}
              onToday={goToday}
            />

            {loading ? (
              <div className="flex h-[360px] items-center justify-center lg:h-[340px]">
                <Loader2 className="animate-spin text-blue-600" size={28} />
              </div>
            ) : (
              <CalendarGrid days={calendarDays} onDateClick={selectDate} />
            )}
          </section>

          <DayOffPanel
            events={dayOffEvents}
            loading={loading}
            currentUserId={currentUserId}
            isAdminOrOwner={isAdminOrOwner}
            cancelableCount={cancelableDayOffCount}
            onCancelDayOff={openCancelDayOffConfirm}
          />
        </div>
      </div>

      {dayModalOpen && (
        <DayDetailModal
          selectedDate={selectedDate}
          events={selectedDayEvents}
          canCreateNote={canCreateNote}
          canDeleteNote={canDeleteNote}
          deleteNoteLoading={deleteNoteLoading}
          onClose={() => setDayModalOpen(false)}
          onAddNote={() => openAddNoteModal(selectedDate)}
          onDeleteNote={deleteNote}
        />
      )}

      {noteModalOpen && (
        <NoteModal
          noteForm={noteForm}
          setNoteForm={setNoteForm}
          noteLoading={noteLoading}
          branchName={noteBranchName}
          onClose={closeNoteModal}
          onSubmit={submitNote}
        />
      )}

      {cancelDayOffTarget && (
        <CancelDayOffConfirmModal
          event={cancelDayOffTarget}
          loading={cancelDayOffLoading}
          onClose={closeCancelDayOffConfirm}
          onConfirm={cancelDayOff}
        />
      )}
    </div>
  )
}


function BranchFilterSelect({ value, onChange, branches, loading }) {
  return (
    <div className="min-w-0 lg:w-[240px]">
      <p className="mb-1 text-[10px] font-black text-white/60">
        เลือกสาขา
      </p>

      <div className="relative">
        <select
          value={value}
          disabled={loading}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-2xl border border-white/15 bg-white/15 px-3 pr-9 text-sm font-black text-white outline-none backdrop-blur-md active:scale-[0.99] disabled:opacity-60 lg:h-10 lg:rounded-xl lg:text-xs [&>option]:bg-white [&>option]:text-slate-900"
        >
          <option value="all">ทุกสาขา</option>

          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>

        <ChevronRight
          size={16}
          strokeWidth={3}
          className="pointer-events-none absolute right-3 top-1/2 rotate-90 -translate-y-1/2 text-white/70"
        />
      </div>
    </div>
  )
}


function CalendarHeader({ calendarDate, onPrev, onNext, onToday }) {
  return (
    <div className="mb-4 flex items-center justify-between lg:mb-3">
      <button
        type="button"
        onClick={onPrev}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-[0_6px_18px_rgba(15,23,42,0.08)] active:scale-95 lg:h-8 lg:w-8 lg:bg-slate-50"
      >
        <ChevronLeft size={20} className="lg:h-4 lg:w-4" />
      </button>

      <div className="text-center">
        <h2 className="text-xl font-black lg:text-lg">
          {formatThaiMonthYear(calendarDate)}
        </h2>

        <button
          type="button"
          onClick={onToday}
          className="mt-1 text-xs font-black text-blue-600 lg:text-[10px]"
        >
          วันนี้
        </button>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-[0_6px_18px_rgba(15,23,42,0.08)] active:scale-95 lg:h-8 lg:w-8 lg:bg-slate-50"
      >
        <ChevronRight size={20} className="lg:h-4 lg:w-4" />
      </button>
    </div>
  )
}

function CalendarGrid({ days, onDateClick }) {
  return (
    <div className="grid grid-cols-7 gap-x-1 gap-y-2 text-center lg:gap-x-1.5 lg:gap-y-1.5">
      {WEEK_DAYS.map((day) => (
        <div
          key={day}
          className={`pb-2 text-xs font-black lg:pb-1.5 lg:text-[10px] ${
            day === 'อา'
              ? 'text-red-500'
              : day === 'ส'
                ? 'text-blue-500'
                : 'text-slate-400'
          }`}
        >
          {day}
        </div>
      ))}

      {days.map((item) => (
        <CalendarCell
          key={item.date}
          item={item}
          onClick={() => onDateClick(item.date)}
        />
      ))}
    </div>
  )
}

function CalendarCell({ item, onClick }) {
  const visibleEvents = item.events.slice(0, 2)
  const extraCount = item.events.length - visibleEvents.length

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex h-[92px] flex-col items-center justify-start overflow-hidden border border-transparent px-0.5 py-1 transition-all active:scale-95 lg:h-[72px] lg:px-1 lg:py-1 ${
        item.isSelected
          ? 'rounded-[0.95rem] border-blue-500 bg-white text-slate-900 shadow-[0_8px_18px_rgba(37,99,235,0.16)] lg:rounded-xl'
          : item.isToday
            ? 'rounded-[0.95rem] bg-blue-50 text-blue-600 lg:rounded-xl'
            : item.isCurrentMonth
              ? 'rounded-[0.95rem] bg-white/75 text-slate-900 shadow-[0_4px_12px_rgba(15,23,42,0.04)] lg:rounded-xl lg:bg-slate-50/80'
              : 'rounded-[0.95rem] bg-transparent text-slate-300 lg:rounded-xl'
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black lg:h-6 lg:w-6 lg:text-[11px] ${
          item.isSelected ? 'bg-blue-600 text-white' : ''
        }`}
      >
        {item.day}
      </span>

      {visibleEvents.length > 0 && (
        <div className="mt-1 flex w-full min-w-0 flex-col items-center gap-0.5">
          {visibleEvents.map((event) => (
            <EventMiniBadge key={event.id} event={event} />
          ))}

          {extraCount > 0 && (
            <span
              className={`block w-full max-w-full truncate rounded px-1 py-[1px] text-left text-[7px] font-black leading-[10px] lg:text-[8px] lg:leading-[10px] ${
                item.isSelected
                  ? 'bg-slate-100 text-slate-700'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              +{extraCount}
            </span>
          )}
        </div>
      )}
    </button>
  )
}

function EventMiniBadge({ event }) {
  const config = getMiniEventConfig(event.type)
  const text = event.title || config.fallbackLabel

  return (
    <span
      className={`block w-full max-w-full truncate rounded px-1 py-[1px] text-left text-[7px] font-black leading-[10px] lg:text-[8px] lg:leading-[10px] ${config.className}`}
      title={text}
    >
      {text}
    </span>
  )
}

function DayOffPanel({
  events,
  loading,
  currentUserId,
  isAdminOrOwner,
  cancelableCount,
  onCancelDayOff,
}) {
  return (
    <section className="rounded-[1.45rem] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)] lg:sticky lg:top-4 lg:max-h-[calc(100dvh-245px)] lg:overflow-hidden lg:rounded-[1.25rem] lg:p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 lg:gap-2.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 lg:h-9 lg:w-9 lg:rounded-xl">
            <Umbrella size={20} className="lg:h-4 lg:w-4" />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-base font-black text-slate-950 lg:text-sm">
              วันลาของฉัน
            </h2>

            <p className="mt-0.5 truncate text-xs font-bold text-slate-400 lg:text-[10px]">
              {events.length} รายการ · ยกเลิกได้ {cancelableCount} รายการ
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-black text-orange-500 lg:text-[10px]">
          {events.length}
        </span>
      </div>

      {loading ? (
        <div className="mt-4 flex h-32 items-center justify-center rounded-2xl bg-[#F5F8FD] lg:h-28 lg:rounded-xl">
          <Loader2 className="animate-spin text-blue-600" size={24} />
        </div>
      ) : events.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-[#F5F8FD] px-4 py-8 text-center lg:mt-3 lg:rounded-xl lg:px-3 lg:py-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-300 lg:h-10 lg:w-10">
            <Umbrella size={22} className="lg:h-5 lg:w-5" />
          </div>

          <p className="text-sm font-black text-slate-700 lg:text-xs">
            ยังไม่มีวันลาในเดือนนี้
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-400 lg:text-[10px]">
            เมื่อคุณมีคำขอลา รายการจะแสดงตรงนี้
          </p>
        </div>
      ) : (
        <div className="mt-4 max-h-[360px] space-y-2 overflow-y-auto pr-1 lg:mt-3 lg:max-h-[calc(100dvh-360px)]">
          {events.map((event) => (
            <DayOffListItem
              key={event.id}
              event={event}
              currentUserId={currentUserId}
              isAdminOrOwner={isAdminOrOwner}
              onCancelDayOff={onCancelDayOff}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function DayOffListItem({
  event,
  currentUserId,
  isAdminOrOwner,
  onCancelDayOff,
}) {
  const status = getDayOffStatus(event)
  const statusConfig = getDayOffStatusConfig(status)
  const canCancel = isCancelableDayOffEvent(
    event,
    currentUserId,
    isAdminOrOwner
  )
  const disabledReason = getCancelDayOffDisabledReason(
    event,
    currentUserId,
    isAdminOrOwner
  )
  const employeeName = event.raw?.employeeName || 'ฉัน'

  return (
    <div className="rounded-[1.2rem] border border-orange-100 bg-orange-50/65 p-3 lg:rounded-xl lg:p-2.5">
      <div className="flex items-start gap-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-orange-500 lg:h-8 lg:w-8 lg:rounded-xl">
          <Umbrella size={18} className="lg:h-4 lg:w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950 lg:text-xs">
                {employeeName}
              </p>

              <p className="mt-0.5 truncate text-xs font-bold text-slate-500 lg:text-[10px]">
                {formatThaiWeekDay(event.date)} · {formatThaiFullDate(event.date)}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${statusConfig.className}`}
            >
              {statusConfig.label}
            </span>
          </div>

          {event.raw?.reason && (
            <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-500 lg:text-[10px] lg:leading-4">
              {event.raw.reason}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between gap-2 lg:mt-2">
            <p className="truncate text-[10px] font-bold text-slate-400">
              {event.branchName || 'สาขา'}
            </p>

            {canCancel ? (
              <button
                type="button"
                onClick={() => onCancelDayOff(event)}
                className="flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full bg-red-50 px-3 text-[11px] font-black text-red-500 active:scale-95 lg:h-7 lg:px-2.5 lg:text-[10px]"
              >
                <Trash2 size={13} strokeWidth={2.7} />
                ยกเลิก
              </button>
            ) : (
              <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-400" title={disabledReason}>
                ลบไม่ได้
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CancelDayOffConfirmModal({ event, loading, onClose, onConfirm }) {
  return (
    <div
      onClick={loading ? undefined : onClose}
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-[1.7rem] bg-white p-5 shadow-2xl lg:rounded-[1.35rem] lg:p-4"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500 lg:h-10 lg:w-10 lg:rounded-xl">
            <AlertCircle size={23} strokeWidth={2.8} className="lg:h-5 lg:w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black text-slate-950 lg:text-base">
              ยกเลิกวันลา?
            </h2>

            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500 lg:text-xs lg:leading-5">
              ต้องการยกเลิกวันลาวันที่{' '}
              <span className="font-black text-slate-700">
                {formatThaiFullDate(event.date)}
              </span>{' '}
              ใช่ไหม
            </p>

            <p className="mt-2 rounded-2xl bg-orange-50 px-3 py-2 text-xs font-bold leading-5 text-orange-600 lg:rounded-xl lg:text-[10px] lg:leading-4">
              ระบบจะคืนวันลาคงเหลือตามเงื่อนไขของเดือนที่ยกเลิกโดยอัตโนมัติ
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 lg:mt-4">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="h-11 rounded-2xl bg-slate-100 text-sm font-black text-slate-500 active:scale-[0.98] disabled:opacity-60 lg:h-10 lg:rounded-xl lg:text-xs"
          >
            ไม่ยกเลิก
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-500 text-sm font-black text-white active:scale-[0.98] disabled:opacity-60 lg:h-10 lg:rounded-xl lg:text-xs"
          >
            {loading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Trash2 size={16} strokeWidth={2.8} />
            )}
            {loading ? 'กำลังยกเลิก...' : 'ยืนยัน'}
          </button>
        </div>
      </div>
    </div>
  )
}


function DayDetailModal({
  selectedDate,
  events,
  canCreateNote,
  canDeleteNote,
  deleteNoteLoading,
  onClose,
  onAddNote,
  onDeleteNote,
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[1.8rem] bg-white p-5 shadow-2xl lg:max-w-sm lg:rounded-[1.35rem] lg:p-4"
      >
        <div className="mb-5 flex items-start justify-between gap-3 lg:mb-4">
          <div>
            <p className="text-sm font-black text-blue-600 lg:text-xs">
              {formatThaiWeekDay(selectedDate)}
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900 lg:text-xl">
              {formatThaiFullDate(selectedDate)}
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-400 lg:text-xs">
              {events.length} รายการในวันนี้
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 lg:h-8 lg:w-8"
          >
            <X size={20} className="lg:h-4 lg:w-4" />
          </button>
        </div>

        {canCreateNote && (
          <button
            type="button"
            onClick={onAddNote}
            className="mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-[0_10px_24px_rgba(37,99,235,0.26)] active:scale-[0.98] lg:h-10 lg:rounded-xl lg:text-xs"
          >
            <Plus size={18} strokeWidth={3} className="lg:h-4 lg:w-4" />
            เพิ่ม Note วันนี้
          </button>
        )}

        {events.length === 0 ? (
          <div className="py-8 text-center lg:py-6">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F8FD] lg:h-11 lg:w-11">
              <CalendarDays
                size={24}
                className="text-slate-400 lg:h-5 lg:w-5"
              />
            </div>

            <h3 className="font-black text-slate-700 lg:text-sm">
              ไม่มีรายการวันนี้
            </h3>

            <p className="mt-1 text-sm font-semibold text-slate-400 lg:text-xs">
              วันนี้ยังไม่มีวันหยุด วันลา หรือ Note
            </p>
          </div>
        ) : (
          <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1 lg:space-y-2">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                canDeleteNote={canDeleteNote}
                deleteNoteLoading={deleteNoteLoading}
                onDeleteNote={onDeleteNote}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function NoteModal({
  noteForm,
  setNoteForm,
  noteLoading,
  branchName,
  onClose,
  onSubmit,
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[1.8rem] bg-white p-5 shadow-2xl lg:max-w-sm lg:rounded-[1.35rem] lg:p-4"
      >
        <div className="mb-5 flex items-center justify-between lg:mb-4">
          <div>
            <p className="text-sm font-black text-blue-600 lg:text-xs">
              Calendar Note
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-900 lg:text-lg">
              เพิ่ม Note
            </h2>

            <p className="mt-1 text-xs font-bold text-slate-400 lg:text-[10px]">
              สาขา: {branchName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 lg:h-8 lg:w-8"
          >
            <X size={20} className="lg:h-4 lg:w-4" />
          </button>
        </div>

        <div className="space-y-4 lg:space-y-3">
          <div>
            <p className="mb-2 text-xs font-black text-slate-400 lg:mb-1.5 lg:text-[10px]">
              วันที่
            </p>

            <input
              type="date"
              value={noteForm.date}
              onChange={(e) =>
                setNoteForm({ ...noteForm, date: e.target.value })
              }
              className="h-12 w-full rounded-2xl border border-slate-200 bg-[#F5F8FD] px-4 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 lg:h-10 lg:rounded-xl lg:px-3 lg:text-xs"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-black text-slate-400 lg:mb-1.5 lg:text-[10px]">
              หัวข้อ
            </p>

            <input
              value={noteForm.title}
              onChange={(e) =>
                setNoteForm({ ...noteForm, title: e.target.value })
              }
              placeholder="เช่น ประชุมทีม / ทำความสะอาดร้าน"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-[#F5F8FD] px-4 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 lg:h-10 lg:rounded-xl lg:px-3 lg:text-xs"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-black text-slate-400 lg:mb-1.5 lg:text-[10px]">
              รายละเอียด
            </p>

            <textarea
              value={noteForm.note}
              onChange={(e) =>
                setNoteForm({ ...noteForm, note: e.target.value })
              }
              rows={4}
              placeholder="รายละเอียดเพิ่มเติม"
              className="w-full resize-none rounded-2xl border border-slate-200 bg-[#F5F8FD] px-4 py-3 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 lg:rounded-xl lg:px-3 lg:py-2.5 lg:text-xs"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3 lg:mt-4 lg:gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-500 lg:rounded-xl lg:px-3 lg:py-2.5 lg:text-xs"
          >
            ยกเลิก
          </button>

          <button
            type="submit"
            disabled={noteLoading}
            className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(37,99,235,0.26)] disabled:opacity-60 lg:rounded-xl lg:px-3 lg:py-2.5 lg:text-xs"
          >
            {noteLoading ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </form>
    </div>
  )
}

function EventCard({ event, canDeleteNote, deleteNoteLoading, onDeleteNote }) {
  const config = getEventConfig(event.type)
  const noteId = event.eventId || event.raw?.id
  const canShowDelete = canDeleteNote && event.type === 'note'
  const isDeleting = String(deleteNoteLoading) === String(noteId)

  return (
    <div
      className={`flex gap-3 rounded-[1.3rem] p-3 lg:gap-2.5 lg:rounded-xl lg:p-2.5 ${config.rowClass}`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl lg:h-9 lg:w-9 lg:rounded-xl ${config.iconClass}`}
      >
        {config.icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-900 lg:text-xs">
              {event.title}
            </p>

            <p className="mt-0.5 text-xs font-bold text-slate-500 lg:text-[10px]">
              {config.label} · {event.branchName || 'สาขา'}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {canShowDelete && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteNote(event)
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 active:scale-95 disabled:opacity-60 lg:h-7 lg:w-7"
              >
                {isDeleting ? (
                  <Loader2 size={15} className="animate-spin lg:h-3.5 lg:w-3.5" />
                ) : (
                  <Trash2 size={15} strokeWidth={2.7} className="lg:h-3.5 lg:w-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {event.type === 'note' && event.raw?.note && (
          <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-600 lg:text-xs">
            {event.raw.note}
          </p>
        )}
      </div>
    </div>
  )
}

function getMiniEventConfig(type) {
  if (type === 'holiday') {
    return {
      fallbackLabel: 'วันหยุด',
      className: 'bg-emerald-100 text-emerald-800',
    }
  }

  if (type === 'note') {
    return {
      fallbackLabel: 'Note',
      className: 'bg-sky-100 text-sky-700',
    }
  }

  return {
    fallbackLabel: 'ลางาน',
    className: 'bg-orange-100 text-orange-700',
  }
}

function getEventConfig(type) {
  if (type === 'holiday') {
    return {
      label: 'วันหยุดสาขา',
      shortLabel: 'หยุด',
      icon: <CalendarDays size={20} className="lg:h-4 lg:w-4" />,
      rowClass: 'bg-emerald-50',
      iconClass: 'bg-white text-emerald-600',
      badgeClass: 'bg-white text-emerald-600',
    }
  }

  if (type === 'note') {
    return {
      label: 'Note',
      shortLabel: 'Note',
      icon: <StickyNote size={20} className="lg:h-4 lg:w-4" />,
      rowClass: 'bg-sky-50',
      iconClass: 'bg-white text-blue-600',
      badgeClass: 'bg-white text-blue-600',
    }
  }

  return {
    label: 'พนักงานลางาน',
    shortLabel: 'ลา',
    icon: <Umbrella size={20} className="lg:h-4 lg:w-4" />,
    rowClass: 'bg-orange-50',
    iconClass: 'bg-white text-orange-500',
    badgeClass: 'bg-orange-50 text-orange-500',
  }
}

export default UserCalendarPage