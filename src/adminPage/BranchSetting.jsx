import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react'

import API_URL from '../utils/api'
import useAuthStore from '../store/auth-store'
import { createAlert } from '../utils/createAlert'

const TABS = [
  { key: 'info', label: 'ข้อมูลสาขา' },
  { key: 'positions', label: 'ตำแหน่งพนักงาน' },
  { key: 'holidays', label: 'วันหยุดร้าน' },
]

const initialBranchForm = {
  name: '',
  code: '',
  address: '',
  radius: 100,
}

const initialPositionForm = {
  name: '',
  description: '',
  maxDayOffPerMonth: 6,
  allowOT: false,
  otCapMinutes: '',
}

const initialHolidayForm = {
  title: '',
  startDate: '',
  endDate: '',
}

const createEmptyShift = (overrides = {}) => ({
  id: null,
  name: '',
  checkInTime: '08:00',
  checkOutTime: '17:00',
  isDefault: false,
  isActive: true,
  ...overrides,
})

const getDateInput = (date) => {
  if (!date) return ''

  try {
    return new Date(date).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

const formatDate = (date) => {
  if (!date) return '-'

  return new Intl.DateTimeFormat('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

const getDatesInRange = (startDate, endDate) => {
  if (!startDate) return []

  const from = new Date(startDate)
  const to = new Date(endDate || startDate)

  from.setHours(0, 0, 0, 0)
  to.setHours(0, 0, 0, 0)

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return []
  if (to < from) return []

  const dates = []
  const current = new Date(from)

  while (current <= to) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

function BranchSetting() {
  const navigate = useNavigate()
  const { branchId } = useParams()
  const token = useAuthStore((state) => state.token)

  const [activeTab, setActiveTab] = useState('info')
  const [pageMode, setPageMode] = useState('main')

  const [branch, setBranch] = useState(null)
  const [branchForm, setBranchForm] = useState(initialBranchForm)

  const [positions, setPositions] = useState([])
  const [positionSearch, setPositionSearch] = useState('')
  const [positionForm, setPositionForm] = useState(initialPositionForm)
  const [positionShifts, setPositionShifts] = useState([
    createEmptyShift({ isDefault: true }),
  ])
  const [deletedShiftIds, setDeletedShiftIds] = useState([])
  const [editingPositionId, setEditingPositionId] = useState(null)

  const [shiftForm, setShiftForm] = useState(createEmptyShift())
  const [editingShiftIndex, setEditingShiftIndex] = useState(null)

  const [holidays, setHolidays] = useState([])
  const [holidaySearch, setHolidaySearch] = useState('')
  const [holidayForm, setHolidayForm] = useState(initialHolidayForm)
  const [editingHolidayId, setEditingHolidayId] = useState(null)

  const [loading, setLoading] = useState(true)
  const [savingBranch, setSavingBranch] = useState(false)
  const [savingPosition, setSavingPosition] = useState(false)
  const [savingHoliday, setSavingHoliday] = useState(false)
  const [deletingBranch, setDeletingBranch] = useState(false)
  const [showDeleteBranchModal, setShowDeleteBranchModal] = useState(false)

  const numericBranchId = Number(branchId)

  useEffect(() => {
    if (token && numericBranchId) {
      fetchAll()
    }
  }, [token, numericBranchId])

  const fetchAll = async () => {
    try {
      setLoading(true)
      await Promise.all([fetchBranch(), fetchPositions(), fetchHolidays()])
    } finally {
      setLoading(false)
    }
  }

  const fetchBranch = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/branches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const list = res.data.data || res.data.result || []
      const found = list.find((item) => Number(item.id) === numericBranchId)

      if (!found) {
        createAlert('error', 'ไม่พบสาขานี้')
        navigate('/admin/branch')
        return
      }

      setBranch(found)
      setBranchForm({
        name: found.name || '',
        code: found.code || '',
        address: found.address || '',
        radius: found.radius || 100,
      })
    } catch (error) {
      console.log(error)
      createAlert('error', 'โหลดข้อมูลสาขาไม่สำเร็จ')
    }
  }

  const fetchPositions = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/admin/positions?branchId=${numericBranchId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const list = res.data.data || res.data.result || []

      const hasBranchField = list.some(
        (item) => item.branchId !== undefined || item.branch
      )

      const filtered = hasBranchField
        ? list.filter((item) => {
            return (
              Number(item.branchId) === numericBranchId ||
              Number(item.branch?.id) === numericBranchId
            )
          })
        : list

      setPositions(filtered)
    } catch (error) {
      console.log(error)
      createAlert('error', 'โหลดตำแหน่งไม่สำเร็จ')
    }
  }

  const fetchHolidays = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/admin/holidays?branchId=${numericBranchId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const list = res.data.data || res.data.result || []

      const hasBranchField = list.some(
        (item) => item.branchId !== undefined || item.branch
      )

      const filtered = hasBranchField
        ? list.filter((item) => {
            return (
              Number(item.branchId) === numericBranchId ||
              Number(item.branch?.id) === numericBranchId
            )
          })
        : list

      setHolidays(filtered)
    } catch (error) {
      console.log(error)
      createAlert('error', 'โหลดวันหยุดร้านไม่สำเร็จ')
    }
  }

  const updateBranchForm = (key, value) => {
    setBranchForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const updatePositionForm = (key, value) => {
    setPositionForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const updateHolidayForm = (key, value) => {
    setHolidayForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const updateShiftForm = (key, value) => {
    setShiftForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const saveBranch = async (e) => {
    e.preventDefault()

    if (!branchForm.name.trim()) {
      createAlert('error', 'กรุณากรอกชื่อสาขา')
      return
    }

    if (!branchForm.code.trim()) {
      createAlert('error', 'กรุณากรอกรหัสสาขา')
      return
    }

    try {
      setSavingBranch(true)

      await axios.patch(
        `${API_URL}/admin/branch/${numericBranchId}`,
        {
          name: branchForm.name.trim(),
          code: branchForm.code.trim(),
          address: branchForm.address.trim() || null,
          radius: Number(branchForm.radius || 100),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      createAlert('success', 'บันทึกข้อมูลสาขาสำเร็จ')
      fetchBranch()
    } catch (error) {
      console.log(error)
      createAlert(
        'error',
        error.response?.data?.message || 'บันทึกข้อมูลสาขาไม่สำเร็จ'
      )
    } finally {
      setSavingBranch(false)
    }
  }

  const deleteBranch = async () => {
    try {
      setDeletingBranch(true)

      await axios.delete(`${API_URL}/admin/branch/${numericBranchId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      createAlert('success', 'ลบสาขาสำเร็จ')
      navigate('/admin/branch')
    } catch (error) {
      console.log(error)
      createAlert(
        'error',
        error.response?.data?.message || 'ลบสาขาไม่สำเร็จ'
      )
    } finally {
      setDeletingBranch(false)
      setShowDeleteBranchModal(false)
    }
  }

  const resetPositionForm = () => {
    setPositionForm(initialPositionForm)
    setPositionShifts([createEmptyShift({ isDefault: true })])
    setDeletedShiftIds([])
    setEditingPositionId(null)
    setEditingShiftIndex(null)
    setShiftForm(createEmptyShift())
  }

  const openAddPositionPage = () => {
    resetPositionForm()
    setPageMode('position-form')
  }

  const openEditPositionPage = (position) => {
    setEditingPositionId(position.id)

    setPositionForm({
      name: position.name || '',
      description: position.description || '',
      maxDayOffPerMonth: position.maxDayOffPerMonth ?? 6,
      allowOT: Boolean(position.allowOT),
      otCapMinutes:
        position.otCapMinutes === null || position.otCapMinutes === undefined
          ? ''
          : String(position.otCapMinutes),
    })

    const mappedShifts =
      position.shifts?.length > 0
        ? position.shifts.map((shift) =>
            createEmptyShift({
              id: shift.id,
              name: shift.name || '',
              checkInTime: shift.checkInTime || '08:00',
              checkOutTime: shift.checkOutTime || '17:00',
              isDefault: Boolean(shift.isDefault),
              isActive: Boolean(shift.isActive),
            })
          )
        : [
            createEmptyShift({
              name: `${position.name}_shift`,
              checkInTime: position.checkInTime || '08:00',
              checkOutTime: position.checkOutTime || '17:00',
              isDefault: true,
            }),
          ]

    const hasDefault = mappedShifts.some((shift) => shift.isDefault)

    setPositionShifts(
      hasDefault
        ? mappedShifts
        : mappedShifts.map((shift, index) => ({
            ...shift,
            isDefault: index === 0,
          }))
    )

    setDeletedShiftIds([])
    setPageMode('position-form')
  }

  const closePositionForm = () => {
    if (savingPosition) return

    resetPositionForm()
    setPageMode('main')
  }

  const openAddShiftPage = () => {
    setEditingShiftIndex(null)
    setShiftForm(
      createEmptyShift({
        isDefault: positionShifts.length === 0,
        checkInTime: positionShifts[0]?.checkInTime || '08:00',
        checkOutTime: positionShifts[0]?.checkOutTime || '17:00',
      })
    )
    setPageMode('shift-form')
  }

  const openEditShiftPage = (shift, index) => {
    setEditingShiftIndex(index)
    setShiftForm(createEmptyShift(shift))
    setPageMode('shift-form')
  }

  const closeShiftForm = () => {
    setEditingShiftIndex(null)
    setShiftForm(createEmptyShift())
    setPageMode('position-form')
  }

  const saveShiftToPosition = (e) => {
    e.preventDefault()

    if (!shiftForm.checkInTime || !shiftForm.checkOutTime) {
      createAlert('error', 'กรุณากำหนดเวลาเข้าและเวลาออก')
      return
    }

    const nextShift = {
      ...shiftForm,
      isActive: Boolean(shiftForm.isActive),
      isDefault: Boolean(shiftForm.isDefault),
    }

    setPositionShifts((prev) => {
      let next = [...prev]

      if (editingShiftIndex !== null) {
        next[editingShiftIndex] = nextShift
      } else {
        next.push(nextShift)
      }

      if (nextShift.isDefault) {
        next = next.map((item, index) => ({
          ...item,
          isDefault:
            editingShiftIndex !== null
              ? index === editingShiftIndex
              : index === next.length - 1,
          isActive:
            editingShiftIndex !== null && index === editingShiftIndex
              ? true
              : editingShiftIndex === null && index === next.length - 1
                ? true
                : item.isActive,
        }))
      }

      if (!next.some((item) => item.isDefault)) {
        next = next.map((item, index) => ({
          ...item,
          isDefault: index === 0,
          isActive: index === 0 ? true : item.isActive,
        }))
      }

      return next
    })

    closeShiftForm()
  }

  const normalizeShiftName = (shift, index) => {
    const baseName = positionForm.name.trim() || 'position'

    if (shift.name?.trim()) return shift.name.trim()

    return index === 0 ? `${baseName}_shift` : `${baseName}_shift_${index + 1}`
  }

  const validatePosition = () => {
    if (!positionForm.name.trim()) {
      createAlert('error', 'กรุณากรอกชื่อตำแหน่ง')
      return false
    }

    if (positionForm.allowOT) {
      const cap = Number(positionForm.otCapMinutes || 0)

      if (cap <= 0) {
        createAlert('error', 'กรุณากำหนด OT Cap มากกว่า 0 นาที')
        return false
      }
    }

    if (positionShifts.length === 0) {
      createAlert('error', 'กรุณาเพิ่มกะอย่างน้อย 1 กะ')
      return false
    }

    const activeShifts = positionShifts.filter((shift) => shift.isActive)

    if (activeShifts.length === 0) {
      createAlert('error', 'ต้องมีกะที่ใช้งานอย่างน้อย 1 กะ')
      return false
    }

    const defaultShift = positionShifts.find((shift) => shift.isDefault)

    if (!defaultShift) {
      createAlert('error', 'กรุณาเลือกกะหลัก')
      return false
    }

    if (!defaultShift.isActive) {
      createAlert('error', 'กะหลักต้องเป็นกะที่ใช้งาน')
      return false
    }

    const names = positionShifts.map((shift, index) =>
      normalizeShiftName(shift, index).toLowerCase()
    )

    const hasDuplicate = names.some(
      (name, index) => names.indexOf(name) !== index
    )

    if (hasDuplicate) {
      createAlert('error', 'ชื่อกะซ้ำกัน กรุณาเปลี่ยนชื่อกะ')
      return false
    }

    return true
  }

  const buildShiftPayload = (shift, positionId, index) => ({
    name: normalizeShiftName(shift, index),
    checkInTime: shift.checkInTime,
    checkOutTime: shift.checkOutTime,
    positionId: Number(positionId),
    isDefault: Boolean(shift.isDefault),
    isActive: Boolean(shift.isActive),
  })

  const syncShifts = async (positionId, defaultShiftId = null) => {
    for (const shiftId of deletedShiftIds) {
      try {
        await axios.delete(`${API_URL}/admin/shift/${shiftId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      } catch (error) {
        await axios.patch(
          `${API_URL}/admin/shift/${shiftId}`,
          {
            isActive: false,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      }
    }

    for (let index = 0; index < positionShifts.length; index++) {
      const shift = positionShifts[index]
      const payload = buildShiftPayload(shift, positionId, index)

      if (shift.id) {
        await axios.patch(`${API_URL}/admin/shift/${shift.id}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      } else if (defaultShiftId && shift.isDefault) {
        await axios.patch(`${API_URL}/admin/shift/${defaultShiftId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      } else {
        await axios.post(`${API_URL}/admin/shift`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }
    }
  }

  const savePosition = async (e) => {
    e.preventDefault()

    if (!validatePosition()) return

    try {
      setSavingPosition(true)

      const defaultShift =
        positionShifts.find((shift) => shift.isDefault) || positionShifts[0]

      const payload = {
        branchId: numericBranchId,
        name: positionForm.name.trim(),
        description: positionForm.description.trim() || null,
        checkInTime: defaultShift.checkInTime,
        checkOutTime: defaultShift.checkOutTime,
        maxDayOffPerMonth: Number(positionForm.maxDayOffPerMonth || 0),
        allowOT: Boolean(positionForm.allowOT),
        otCapMinutes: positionForm.allowOT
          ? Number(positionForm.otCapMinutes || 0)
          : null,
      }

      if (editingPositionId) {
        await axios.patch(
          `${API_URL}/admin/position/${editingPositionId}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        await syncShifts(editingPositionId)

        createAlert('success', 'แก้ไขตำแหน่งสำเร็จ')
      } else {
        const res = await axios.post(`${API_URL}/admin/position`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const createdPosition =
          res.data.data || res.data.result || res.data.position
        const defaultShiftFromServer = res.data.defaultShift

        await syncShifts(createdPosition.id, defaultShiftFromServer?.id)

        createAlert('success', 'เพิ่มตำแหน่งสำเร็จ')
      }

      await fetchPositions()
      closePositionForm()
    } catch (error) {
      console.log(error)
      createAlert(
        'error',
        error.response?.data?.message || 'บันทึกตำแหน่งไม่สำเร็จ'
      )
    } finally {
      setSavingPosition(false)
    }
  }

  const deletePosition = async (positionId) => {
    const ok = window.confirm('ต้องการลบตำแหน่งนี้ใช่หรือไม่?')
    if (!ok) return

    try {
      await axios.delete(`${API_URL}/admin/position/${positionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      createAlert('success', 'ลบตำแหน่งสำเร็จ')
      fetchPositions()
    } catch (error) {
      console.log(error)
      createAlert(
        'error',
        error.response?.data?.message || 'ลบตำแหน่งไม่สำเร็จ'
      )
    }
  }

  const removeShift = (index) => {
    const targetShift = positionShifts[index]

    if (targetShift.isDefault) {
      createAlert('error', 'กรุณาเลือกกะหลักอื่นก่อนลบ')
      return
    }

    if (positionShifts.length <= 1) {
      createAlert('error', 'ต้องมีกะอย่างน้อย 1 กะ')
      return
    }

    if (targetShift.id) {
      setDeletedShiftIds((prev) => [...prev, targetShift.id])
    }

    setPositionShifts((prev) => prev.filter((_, i) => i !== index))
  }

  const openAddHolidayPage = () => {
    setEditingHolidayId(null)
    setHolidayForm(initialHolidayForm)
    setPageMode('holiday-form')
  }

  const openEditHolidayPage = (holiday) => {
    setEditingHolidayId(holiday.id)

    setHolidayForm({
      title: holiday.title || '',
      startDate: getDateInput(holiday.date),
      endDate: getDateInput(holiday.date),
    })

    setPageMode('holiday-form')
  }

  const closeHolidayForm = () => {
    if (savingHoliday) return

    setEditingHolidayId(null)
    setHolidayForm(initialHolidayForm)
    setPageMode('main')
  }

  const saveHoliday = async (e) => {
    e.preventDefault()

    if (!holidayForm.title.trim()) {
      createAlert('error', 'กรุณากรอกชื่อวันหยุด')
      return
    }

    if (!holidayForm.startDate) {
      createAlert('error', 'กรุณาเลือกวันที่เริ่มต้น')
      return
    }

    const dates = getDatesInRange(holidayForm.startDate, holidayForm.endDate)

    if (dates.length === 0) {
      createAlert('error', 'ช่วงวันที่ไม่ถูกต้อง')
      return
    }

    try {
      setSavingHoliday(true)

      if (editingHolidayId) {
        await axios.patch(
          `${API_URL}/admin/holiday/${editingHolidayId}`,
          {
            branchId: numericBranchId,
            title: holidayForm.title.trim(),
            date: dates[0],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (dates.length > 1) {
          for (const date of dates.slice(1)) {
            await axios.post(
              `${API_URL}/admin/holiday`,
              {
                branchId: numericBranchId,
                title: holidayForm.title.trim(),
                date,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            )
          }
        }

        createAlert('success', 'แก้ไขวันหยุดสำเร็จ')
      } else {
        for (const date of dates) {
          await axios.post(
            `${API_URL}/admin/holiday`,
            {
              branchId: numericBranchId,
              title: holidayForm.title.trim(),
              date,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        }

        createAlert('success', 'เพิ่มวันหยุดร้านสำเร็จ')
      }

      await fetchHolidays()
      closeHolidayForm()
    } catch (error) {
      console.log(error)
      createAlert(
        'error',
        error.response?.data?.message || 'บันทึกวันหยุดไม่สำเร็จ'
      )
    } finally {
      setSavingHoliday(false)
    }
  }

  const deleteHoliday = async (holidayId) => {
    const ok = window.confirm('ต้องการลบวันหยุดนี้ใช่หรือไม่?')
    if (!ok) return

    try {
      await axios.delete(`${API_URL}/admin/holiday/${holidayId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      createAlert('success', 'ลบวันหยุดสำเร็จ')
      fetchHolidays()
    } catch (error) {
      console.log(error)
      createAlert(
        'error',
        error.response?.data?.message || 'ลบวันหยุดไม่สำเร็จ'
      )
    }
  }

  const filteredPositions = useMemo(() => {
    const keyword = positionSearch.trim().toLowerCase()

    if (!keyword) return positions

    return positions.filter((position) => {
      return (
        position.name?.toLowerCase().includes(keyword) ||
        position.description?.toLowerCase().includes(keyword)
      )
    })
  }, [positions, positionSearch])

  const filteredHolidays = useMemo(() => {
    const keyword = holidaySearch.trim().toLowerCase()

    if (!keyword) return holidays

    return holidays.filter((holiday) => {
      return (
        holiday.title?.toLowerCase().includes(keyword) ||
        formatDate(holiday.date).toLowerCase().includes(keyword)
      )
    })
  }, [holidays, holidaySearch])

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F5F8FD]">
        <Loader2 className="animate-spin text-blue-600" size={34} />
      </div>
    )
  }

  if (pageMode === 'position-form') {
    return (
      <PositionFormPage
        branchName={branch?.name}
        form={positionForm}
        shifts={positionShifts}
        editingId={editingPositionId}
        saving={savingPosition}
        updateForm={updatePositionForm}
        onAddShift={openAddShiftPage}
        onEditShift={openEditShiftPage}
        onRemoveShift={removeShift}
        onBack={closePositionForm}
        onSubmit={savePosition}
      />
    )
  }

  if (pageMode === 'shift-form') {
    return (
      <ShiftFormPage
        branchName={branch?.name}
        form={shiftForm}
        editingIndex={editingShiftIndex}
        updateForm={updateShiftForm}
        onBack={closeShiftForm}
        onSubmit={saveShiftToPosition}
      />
    )
  }

  if (pageMode === 'holiday-form') {
    return (
      <HolidayFormPage
        branchName={branch?.name}
        form={holidayForm}
        editingId={editingHolidayId}
        saving={savingHoliday}
        updateForm={updateHolidayForm}
        onBack={closeHolidayForm}
        onSubmit={saveHoliday}
      />
    )
  }

  return (
    <div className="min-h-dvh bg-[#F5F8FD] px-3.5 pb-28 pt-4 text-[#0F172A] sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/branch')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,0.06)] active:scale-95"
          >
            <ChevronLeft size={23} strokeWidth={3} />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <h1 className="truncate text-xl font-black tracking-tight text-slate-950">
              Branch Setting
            </h1>
            <p className="mt-0.5 truncate text-xs font-bold text-slate-400">
              สาขา {branch?.name || '-'}
            </p>
          </div>

          <div className="h-11 w-11 shrink-0" />
        </header>

        <section className="mb-4 rounded-[1.7rem] bg-white p-2 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="grid grid-cols-3 gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`h-11 rounded-2xl text-xs font-black transition active:scale-[0.98] sm:text-sm ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)]'
                    : 'bg-slate-50 text-slate-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {activeTab === 'info' && (
          <BranchInfoTab
            form={branchForm}
            branchName={branch?.name}
            saving={savingBranch}
            updateForm={updateBranchForm}
            onSubmit={saveBranch}
            onDelete={() => setShowDeleteBranchModal(true)}
          />
        )}

        {activeTab === 'positions' && (
          <ManagementListTab
            title="ตำแหน่งพนักงาน"
            subtitle="จัดการตำแหน่งและกะทำงานของสาขานี้"
            placeholder="ค้นหาตำแหน่ง"
            search={positionSearch}
            setSearch={setPositionSearch}
            onAdd={openAddPositionPage}
            count={filteredPositions.length}
            emptyText="ยังไม่มีตำแหน่งในสาขานี้"
            icon={UsersRound}
          >
            {filteredPositions.map((position, index) => {
              const defaultShift =
                position.shifts?.find((shift) => shift.isDefault) ||
                position.shifts?.[0] ||
                null

              return (
                <React.Fragment key={position.id}>
                  {index > 0 && <div className="mx-4 h-px bg-slate-100" />}

                  <div className="flex items-center justify-between gap-3 px-4 py-4">
                    <button
                      type="button"
                      onClick={() => openEditPositionPage(position)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left active:scale-[0.99]"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <UsersRound size={19} strokeWidth={2.5} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">
                          {position.name}
                        </p>

                        <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                          {defaultShift
                            ? `${defaultShift.checkInTime} - ${defaultShift.checkOutTime}`
                            : position.description || 'ยังไม่มีกะทำงาน'}
                        </p>
                      </div>
                    </button>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditPositionPage(position)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 active:scale-95"
                      >
                        <Pencil size={16} strokeWidth={2.7} />
                      </button>

                      <button
                        type="button"
                        onClick={() => deletePosition(position.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500 active:scale-95"
                      >
                        <Trash2 size={16} strokeWidth={2.7} />
                      </button>
                    </div>
                  </div>
                </React.Fragment>
              )
            })}
          </ManagementListTab>
        )}

        {activeTab === 'holidays' && (
          <ManagementListTab
            title="วันหยุดร้าน"
            subtitle="จัดการวันหยุดของสาขานี้"
            placeholder="ค้นหาวันหยุด"
            search={holidaySearch}
            setSearch={setHolidaySearch}
            onAdd={openAddHolidayPage}
            count={filteredHolidays.length}
            emptyText="ยังไม่มีวันหยุดร้านในสาขานี้"
            icon={CalendarDays}
          >
            {filteredHolidays.map((holiday, index) => (
              <React.Fragment key={holiday.id}>
                {index > 0 && <div className="mx-4 h-px bg-slate-100" />}

                <div className="flex items-center justify-between gap-3 px-4 py-4">
                  <button
                    type="button"
                    onClick={() => openEditHolidayPage(holiday)}
                    className="min-w-0 flex-1 text-left active:scale-[0.99]"
                  >
                    <p className="truncate text-sm font-black text-slate-950">
                      {holiday.title || 'วันหยุดร้าน'}
                    </p>

                    <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                      {formatDate(holiday.date)}
                    </p>
                  </button>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditHolidayPage(holiday)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 active:scale-95"
                    >
                      <Pencil size={16} strokeWidth={2.7} />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteHoliday(holiday.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500 active:scale-95"
                    >
                      <Trash2 size={16} strokeWidth={2.7} />
                    </button>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </ManagementListTab>
        )}
      </div>

      {showDeleteBranchModal && (
        <DeleteBranchModal
          branchName={branch?.name}
          deleting={deletingBranch}
          onClose={() => setShowDeleteBranchModal(false)}
          onConfirm={deleteBranch}
        />
      )}
    </div>
  )
}

function BranchInfoTab({
  form,
  branchName,
  saving,
  updateForm,
  onSubmit,
  onDelete,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[1.7rem] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
    >
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
          Branch Info
        </p>
        <h2 className="mt-1 text-lg font-black text-slate-950">
          แก้ไขข้อมูลของสาขา
        </h2>
        {branchName && (
          <p className="mt-0.5 text-xs font-semibold text-slate-400">
            {branchName}
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <InputField
          label="ชื่อสาขา"
          value={form.name}
          onChange={(value) => updateForm('name', value)}
          placeholder="ชื่อสาขา"
        />

        <InputField
          label="รหัสสาขา"
          value={form.code}
          onChange={(value) => updateForm('code', value)}
          placeholder="รหัสสาขา"
        />

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-black text-slate-500">
            ที่อยู่
          </label>
          <textarea
            value={form.address}
            onChange={(e) => updateForm('address', e.target.value)}
            placeholder="ที่อยู่ของสาขา"
            rows={3}
            className="w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-300 focus:border-blue-300 focus:bg-white"
          />
        </div>

        <InputField
          label="รัศมีเช็กอิน / เมตร"
          type="number"
          min="10"
          value={form.radius}
          onChange={(value) => updateForm('radius', value)}
          placeholder="100"
        />
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button
          type="submit"
          disabled={saving}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)] active:scale-95 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Save size={18} />
          )}
          บันทึกข้อมูลสาขา
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={saving}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-50 text-sm font-black text-red-500 active:scale-95 disabled:opacity-50"
        >
          <Trash2 size={18} strokeWidth={2.7} />
          ลบสาขา
        </button>
      </div>
    </form>
  )
}

function ManagementListTab({
  title,
  subtitle,
  placeholder,
  search,
  setSearch,
  onAdd,
  count,
  emptyText,
  icon: Icon,
  children,
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-[1.7rem] bg-white p-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2.5">
            <Search
              size={18}
              strokeWidth={2.7}
              className="shrink-0 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="h-8 min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-300"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-400"
              >
                <X size={15} strokeWidth={3} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onAdd}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)] transition active:scale-[0.99] sm:w-auto sm:min-w-[120px] sm:shrink-0"
          >
            <Plus size={18} strokeWidth={3} className="shrink-0" />
            <span>เพิ่ม</span>
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.7rem] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm font-black text-slate-950">{title}</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-400">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600">
              {count}
            </span>
            {Icon && (
              <Icon
                className="hidden text-blue-600 sm:block"
                size={22}
                strokeWidth={2.7}
              />
            )}
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        {count === 0 ? <EmptyBox text={emptyText} /> : children}
      </section>
    </div>
  )
}

function PositionFormPage({
  branchName,
  form,
  shifts,
  editingId,
  saving,
  updateForm,
  onAddShift,
  onEditShift,
  onRemoveShift,
  onBack,
  onSubmit,
}) {
  return (
    <div className="min-h-dvh bg-[#F5F8FD] px-3.5 pb-28 pt-4 text-[#0F172A] sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <FormHeader
          title={editingId ? 'แก้ไขตำแหน่ง' : 'เพิ่มตำแหน่ง'}
          subtitle={`สาขา ${branchName || '-'}`}
          onBack={onBack}
          disabled={saving}
        />

        <form onSubmit={onSubmit} className="space-y-3">
          <section className="rounded-[1.7rem] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            <div className="space-y-4">
              <InputField
                label="ชื่อตำแหน่ง"
                value={form.name}
                onChange={(value) => updateForm('name', value)}
                placeholder="เช่น พนักงานครัว"
              />

              <InputField
                label="รายละเอียด ไม่บังคับ"
                value={form.description}
                onChange={(value) => updateForm('description', value)}
                placeholder="เช่น หน้าที่และความรับผิดชอบ"
              />

              <div>
                <label className="mb-1.5 block text-xs font-black text-slate-500">
                  วันลาต่อเดือน
                </label>

                <div className="flex h-12 items-center rounded-2xl border border-slate-100 bg-slate-50 px-3">
                  <input
                    type="number"
                    min="0"
                    value={form.maxDayOffPerMonth}
                    onChange={(e) =>
                      updateForm('maxDayOffPerMonth', e.target.value)
                    }
                    className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-700 outline-none"
                  />
                  <span className="text-xs font-black text-slate-400">
                    วัน
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[1.7rem] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-950">การทำ OT</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-400">
                  อนุญาตให้ตำแหน่งนี้ทำ OT
                </p>
              </div>

              <button
                type="button"
                onClick={() => updateForm('allowOT', !form.allowOT)}
                className={`relative h-7 w-12 rounded-full transition ${
                  form.allowOT ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                    form.allowOT ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {form.allowOT && (
              <div className="mt-4">
                <InputField
                  label="OT Cap นาที"
                  type="number"
                  min="1"
                  value={form.otCapMinutes}
                  onChange={(value) => updateForm('otCapMinutes', value)}
                  placeholder="เช่น 120"
                />
              </div>
            )}
          </section>

          <section className="rounded-[1.7rem] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-950">กะทำงาน</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-400">
                  {shifts.length} กะ
                </p>
              </div>

              <button
                type="button"
                onClick={onAddShift}
                className="flex h-9 items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 text-xs font-black text-blue-600 active:scale-95"
              >
                <Plus size={15} strokeWidth={3} />
                เพิ่มกะ
              </button>
            </div>

            <div className="space-y-2.5">
              {shifts.map((shift, index) => (
                <div
                  key={shift.id || index}
                  className="flex items-center justify-between gap-3 rounded-[1.35rem] border border-slate-100 bg-white px-3 py-3"
                >
                  <button
                    type="button"
                    onClick={() => onEditShift(shift, index)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500">
                      <Clock3 size={18} strokeWidth={2.6} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-black text-slate-950">
                          {shift.name || `กะ #${index + 1}`}
                        </p>

                        {shift.isDefault && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-600">
                            กะหลัก
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 text-xs font-semibold text-slate-400">
                        {shift.checkInTime} - {shift.checkOutTime}
                      </p>
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditShift(shift, index)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 active:scale-95"
                    >
                      <Pencil size={14} strokeWidth={2.7} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemoveShift(index)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 active:scale-95"
                    >
                      <Trash2 size={14} strokeWidth={2.7} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="sticky bottom-3 z-20">
            <div className="grid gap-2 rounded-[1.7rem] bg-white/95 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur">
              <button
                type="submit"
                disabled={saving}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)] active:scale-95 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Save size={18} />
                )}
                {editingId ? 'บันทึกตำแหน่ง' : 'เพิ่มตำแหน่ง'}
              </button>

              <button
                type="button"
                onClick={onBack}
                disabled={saving}
                className="h-12 rounded-2xl bg-white text-sm font-black text-slate-500 shadow-[0_8px_22px_rgba(15,23,42,0.05)] active:scale-95 disabled:opacity-50"
              >
                ยกเลิก
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  )
}

function ShiftFormPage({
  branchName,
  form,
  editingIndex,
  updateForm,
  onBack,
  onSubmit,
}) {
  return (
    <div className="min-h-dvh bg-[#F5F8FD] px-3.5 pb-28 pt-4 text-[#0F172A] sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <FormHeader
          title={editingIndex !== null ? 'แก้ไขกะทำงาน' : 'เพิ่มกะทำงาน'}
          subtitle={`สาขา ${branchName || '-'}`}
          onBack={onBack}
        />

        <form onSubmit={onSubmit} className="space-y-3">
          <section className="rounded-[1.7rem] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            <div className="space-y-4">
              <InputField
                label="ชื่อกะ"
                value={form.name}
                onChange={(value) => updateForm('name', value)}
                placeholder="เช่น Morning Shift"
              />

              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="เวลาเข้า"
                  type="time"
                  value={form.checkInTime}
                  onChange={(value) => updateForm('checkInTime', value)}
                />

                <InputField
                  label="เวลาออก"
                  type="time"
                  value={form.checkOutTime}
                  onChange={(value) => updateForm('checkOutTime', value)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-[1.7rem] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            <SwitchRow
              title="ตั้งเป็นกะหลัก"
              subtitle="ใช้กะนี้เป็นค่าเริ่มต้นของตำแหน่ง"
              checked={form.isDefault}
              onClick={() => updateForm('isDefault', !form.isDefault)}
            />

            <div className="my-4 h-px bg-slate-100" />

            <SwitchRow
              title="ใช้งานกะนี้"
              subtitle="เปิด/ปิดกะนี้ในระบบ"
              checked={form.isActive}
              onClick={() => updateForm('isActive', !form.isActive)}
            />
          </section>

          <section className="sticky bottom-3 z-20">
            <div className="grid gap-2 rounded-[1.7rem] bg-white/95 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur">
              <button
                type="submit"
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)] active:scale-95"
              >
                <Save size={18} />
                {editingIndex !== null ? 'บันทึกกะ' : 'เพิ่มกะ'}
              </button>

              <button
                type="button"
                onClick={onBack}
                className="h-12 rounded-2xl bg-white text-sm font-black text-slate-500 shadow-[0_8px_22px_rgba(15,23,42,0.05)] active:scale-95"
              >
                ยกเลิก
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  )
}

function HolidayFormPage({
  branchName,
  form,
  editingId,
  saving,
  updateForm,
  onBack,
  onSubmit,
}) {
  return (
    <div className="min-h-dvh bg-[#F5F8FD] px-3.5 pb-28 pt-4 text-[#0F172A] sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <FormHeader
          title={editingId ? 'แก้ไขวันหยุดร้าน' : 'เพิ่มวันหยุดร้าน'}
          subtitle={`สาขา ${branchName || '-'}`}
          onBack={onBack}
          disabled={saving}
        />

        <form onSubmit={onSubmit} className="space-y-3">
          <section className="rounded-[1.7rem] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            <div className="space-y-4">
              <InputField
                label="ชื่อวันหยุด"
                value={form.title}
                onChange={(value) => updateForm('title', value)}
                placeholder="เช่น วันรายอ / ร้านปิดปรับปรุง"
              />

              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="วันที่เริ่มต้น"
                  type="date"
                  value={form.startDate}
                  onChange={(value) => updateForm('startDate', value)}
                />

                <InputField
                  label="วันที่สิ้นสุด"
                  type="date"
                  value={form.endDate}
                  onChange={(value) => updateForm('endDate', value)}
                />
              </div>
            </div>
          </section>

          <section className="sticky bottom-3 z-20">
            <div className="grid gap-2 rounded-[1.7rem] bg-white/95 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur">
              <button
                type="submit"
                disabled={saving}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)] active:scale-95 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Save size={18} />
                )}
                {editingId ? 'บันทึกวันหยุด' : 'เพิ่มวันหยุด'}
              </button>

              <button
                type="button"
                onClick={onBack}
                disabled={saving}
                className="h-12 rounded-2xl bg-white text-sm font-black text-slate-500 shadow-[0_8px_22px_rgba(15,23,42,0.05)] active:scale-95 disabled:opacity-50"
              >
                ยกเลิก
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  )
}

function SwitchRow({ title, subtitle, checked, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 text-left"
    >
      <div>
        <p className="text-sm font-black text-slate-950">{title}</p>
        <p className="mt-0.5 text-xs font-semibold text-slate-400">
          {subtitle}
        </p>
      </div>

      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? 'bg-blue-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </span>
    </button>
  )
}

function FormHeader({ title, subtitle, onBack, disabled }) {
  return (
    <header className="mb-5 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        disabled={disabled}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,0.06)] active:scale-95 disabled:opacity-50"
      >
        <ChevronLeft size={23} strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1 text-center">
        <h1 className="truncate text-xl font-black tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-0.5 truncate text-xs font-bold text-slate-400">
          {subtitle}
        </p>
      </div>

      <div className="h-11 w-11 shrink-0" />
    </header>
  )
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-black text-slate-500">
        {label}
      </label>

      <input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-slate-100 bg-white px-3 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-300 focus:border-blue-300"
      />
    </div>
  )
}

function EmptyBox({ text }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <X size={24} strokeWidth={2.7} />
      </div>

      <p className="mt-4 text-sm font-black text-slate-900">{text}</p>
    </div>
  )
}

function DeleteBranchModal({ branchName, deleting, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[1.7rem] bg-white p-5 shadow-2xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
          <Trash2 size={27} strokeWidth={2.7} />
        </div>

        <h2 className="mt-4 text-lg font-black text-slate-950">
          ลบสาขานี้ใช่ไหม?
        </h2>

        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
          สาขา{' '}
          <span className="font-black text-slate-900">
            {branchName || '-'}
          </span>{' '}
          จะถูกลบออกจากระบบ
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="h-12 rounded-2xl bg-slate-100 text-sm font-black text-slate-600 active:scale-95 disabled:opacity-50"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="h-12 rounded-2xl bg-red-500 text-sm font-black text-white active:scale-95 disabled:opacity-60"
          >
            {deleting ? (
              <Loader2 className="mx-auto animate-spin" size={21} />
            ) : (
              'ลบ'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BranchSetting