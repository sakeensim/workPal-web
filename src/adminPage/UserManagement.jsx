import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarCheck2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  Loader2,
  Plus,
  Search,
  Timer,
  Trash2,
  User,
  UsersRound,
  Wallet,
  X,
} from 'lucide-react'

import useAuthStore from '../store/auth-store'
import API_URL from '../utils/api'
import { createAlert } from '../utils/createAlert'

function UserManagement() {
  const navigate = useNavigate()

  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  const [dashboardEmployees, setDashboardEmployees] = useState([])
  const [managementEmployees, setManagementEmployees] = useState([])
  const [branches, setBranches] = useState([])
  const [positions, setPositions] = useState([])

  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const [newUser, setNewUser] = useState({
    firstname: '',
    lastname: '',
    email: '',
    role: 'USER',
    baseSalary: '',
    branchId: '',
    positionId: '',
  })

  const isOwner = String(user?.role || '').toUpperCase() === 'OWNER'
  const resetNewUser = () => {
    setNewUser({
      firstname: '',
      lastname: '',
      email: '',
      role: 'USER',
      baseSalary: '',
      branchId: '',
      positionId: '',
    })
  }

  const openAddEmployeePage = () => {
    resetNewUser()
    setIsAddOpen(true)
  }

  const closeAddEmployeePage = () => {
    if (saving) return

    setIsAddOpen(false)
    resetNewUser()
  }
  useEffect(() => {
    if (!user) return

    if (!isOwner) {
      navigate('/user/other')
    }
  }, [user, isOwner, navigate])

  useEffect(() => {
    if (!token || !isOwner) return

    fetchAllData()
  }, [token, isOwner, selectedMonth])

  const fetchAllData = async () => {
    try {
      setLoading(true)

      await Promise.all([
        fetchDashboardData(),
        fetchEmployees(),
        fetchBranches(),
        fetchPositions(),
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboardData = async () => {
    try {
      const year = selectedMonth.getFullYear()
      const month = selectedMonth.getMonth() + 1

      const res = await axios.get(
        `${API_URL}/admin/dashboard?year=${year}&month=${month}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setDashboardEmployees(normalizeEmployeeArray(res.data))
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      setDashboardEmployees([])
    }
  }

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setManagementEmployees(normalizeEmployeeArray(res.data))
    } catch (error) {
      console.error('Error fetching employees:', error)
      setManagementEmployees([])
    }
  }

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/branches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const branchData = res.data.data || res.data.result || []

      setBranches(
        branchData.filter((branch) => {
          return branch && branch.isDeleted !== true
        })
      )
    } catch (error) {
      console.error('Error fetching branches:', error)
      setBranches([])
    }
  }

  const fetchPositions = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/positions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const positionData = res.data.data || res.data.result || []

      setPositions(
        positionData.filter((position) => {
          return position && position.isDeleted !== true
        })
      )
    } catch (error) {
      console.error('Error fetching positions:', error)
      setPositions([])
    }
  }

  const activeBranches = useMemo(() => {
    return branches.filter(isActiveBranch)
  }, [branches])

  const activePositions = useMemo(() => {
    return positions.filter(isActivePosition)
  }, [positions])

  const employees = useMemo(() => {
    return mergeEmployees(dashboardEmployees, managementEmployees).filter(
      (employee) => employee && employee.isDeleted !== true
    )
  }, [dashboardEmployees, managementEmployees])

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const keyword = filter.trim().toLowerCase()
      const fullName = getEmployeeName(employee).toLowerCase()
      const email = String(employee.email || '').toLowerCase()

      const matchesSearch =
        !keyword || fullName.includes(keyword) || email.includes(keyword)

      const employeeBranchId =
        employee.branchId || employee.branch?.id || employee.branch?.branchId

      const matchesBranch =
        selectedBranch === 'all' ||
        String(employeeBranchId) === String(selectedBranch)

      return matchesSearch && matchesBranch
    })
  }, [employees, filter, selectedBranch])

  const changeMonth = (value) => {
    const newDate = new Date(selectedMonth)
    newDate.setMonth(newDate.getMonth() + value)
    setSelectedMonth(newDate)
  }

  const handleBack = () => {
    navigate('/user/other')
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()

    if (!newUser.firstname.trim() || !newUser.lastname.trim() || !newUser.email.trim()) {
      createAlert('error', 'กรุณากรอกชื่อ นามสกุล และอีเมล')
      return
    }

    if (newUser.positionId && !newUser.branchId) {
      createAlert('error', 'กรุณาเลือกสาขาก่อนเลือกตำแหน่ง')
      return
    }

    const selectedPosition = activePositions.find(
      (position) => String(position.id) === String(newUser.positionId)
    )

    if (
      selectedPosition &&
      Number(selectedPosition.branchId) !== Number(newUser.branchId)
    ) {
      createAlert('error', 'ตำแหน่งไม่ตรงกับสาขาที่เลือก')
      return
    }

    try {
      setSaving(true)

      const payload = {
        firstname: newUser.firstname.trim(),
        lastname: newUser.lastname.trim(),
        email: newUser.email.trim(),
        role: newUser.role || 'USER',
        baseSalary: Number(newUser.baseSalary || 0),
        branchId: newUser.branchId || null,
        positionId: newUser.positionId || null,
      }

      await axios.post(`${API_URL}/admin/user`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      createAlert('success', 'Create user success')

      setIsAddOpen(false)
      setNewUser({
        firstname: '',
        lastname: '',
        email: '',
        role: 'USER',
        baseSalary: '',
        branchId: '',
        positionId: '',
      })

      await fetchAllData()
    } catch (error) {
      console.error('Error creating user:', error)
      createAlert('error', error.response?.data?.message || 'Create user failed')
    } finally {
      setSaving(false)
    }
  }

  const updateSalary = async (id, baseSalary) => {
    try {
      await axios.patch(
        `${API_URL}/user/update-salary/${id}`,
        {
          baseSalary: Number(baseSalary || 0),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      createAlert('success', 'Salary updated successfully')
      await fetchAllData()
    } catch (error) {
      console.error('Error updating salary:', error)
      createAlert(
        'error',
        error.response?.data?.message || 'Failed to update salary'
      )
    }
  }

  const updateUserBranch = async (id, branchId) => {
    try {
      await axios.patch(
        `${API_URL}/admin/user-branch/${id}`,
        {
          branchId: branchId || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      createAlert('success', 'Branch updated')
      await fetchAllData()
    } catch (error) {
      console.error('Error updating branch:', error)
      createAlert(
        'error',
        error.response?.data?.message || 'Update branch failed'
      )
    }
  }

  const updateUserPosition = async (id, positionId) => {
    try {
      await axios.patch(
        `${API_URL}/admin/user-position/${id}`,
        {
          positionId: positionId || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      createAlert('success', 'Position updated')
      await fetchAllData()
    } catch (error) {
      console.error('Error updating position:', error)
      createAlert(
        'error',
        error.response?.data?.message || 'Update position failed'
      )
    }
  }

  const handleRoleChange = async (id, role) => {
    try {
      await axios.post(
        `${API_URL}/user/update-role`,
        { id, role },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      createAlert('success', 'Role updated successfully')
      await fetchAllData()
    } catch (error) {
      console.error('Error updating role:', error)
      createAlert(
        'error',
        error.response?.data?.message || 'Failed to update role'
      )
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/user/delete/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          reason: 'Deleted from user management',
        },
      })

      createAlert('success', 'User deleted successfully')
      setConfirmDelete(null)
      setSelectedEmployee(null)
      await fetchAllData()
    } catch (error) {
      console.error('Error deleting user:', error)
      createAlert(
        'error',
        error.response?.data?.message || 'Failed to delete user'
      )
    }
  }

  if (user && !isOwner) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F5F8FD] px-4 text-center">
        <div>
          <p className="text-lg font-black text-slate-950">ไม่มีสิทธิ์เข้าถึง</p>
          <p className="mt-1 text-sm font-semibold text-slate-400">
            เฉพาะ OWNER เท่านั้นที่จัดการพนักงานได้
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#F5F8FD] px-3.5 pb-28 pt-3 text-[#0F172A] sm:px-5 sm:pb-8 lg:px-4 xl:px-5">
      <div className="mx-auto w-full max-w-7xl">
        <div className="sticky top-0 z-30 -mx-3.5 bg-[#F5F8FD]/95 px-3.5 pb-3 pt-1 backdrop-blur-xl sm:-mx-5 sm:px-5 lg:-mx-4 lg:px-4 xl:-mx-5 xl:px-5">
          <header className="relative flex h-12 items-center justify-center">
            <button
              type="button"
              onClick={handleBack}
              className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-[0_8px_22px_rgba(15,23,42,0.06)] active:scale-95"
            >
              <ChevronLeft size={22} strokeWidth={3} />
            </button>

            <div className="min-w-0 px-12 text-center">
              <h1 className="truncate text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                การจัดการพนักงาน
              </h1>
              <p className="hidden text-xs font-semibold text-slate-400 sm:block">
                จัดการข้อมูลพนักงานและดูสรุปรายเดือน
              </p>
            </div>
          </header>

          <section className="mt-3 rounded-[1.45rem] bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center justify-center gap-2 md:justify-start">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F8FD] text-slate-500 active:scale-95"
                >
                  <ChevronLeft size={20} strokeWidth={2.8} />
                </button>

                <div className="flex h-10 min-w-[150px] items-center justify-center rounded-full bg-[#F5F8FD] px-4 text-sm font-black text-slate-950">
                  {formatMonth(selectedMonth)}
                </div>

                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F8FD] text-slate-500 active:scale-95"
                >
                  <ChevronRight size={20} strokeWidth={2.8} />
                </button>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row md:min-w-[520px]">
                <div className="relative min-w-0 flex-1">
                  <Search
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="ค้นหาพนักงาน"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
                  />
                </div>

                <SelectBox
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="sm:w-[170px]"
                >
                  <option value="all">ทุกสาขา</option>

                  {activeBranches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </SelectBox>

                <button
                  type="button"
                  onClick={() => setIsAddOpen(true)}
                  className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] active:scale-95"
                >
                  <Plus size={18} strokeWidth={3} />
                  เพิ่ม
                </button>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-2 overflow-hidden rounded-[1.5rem] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="max-h-[calc(100dvh-255px)] overflow-auto md:max-h-[calc(100dvh-260px)]">
            <div className="sticky top-0 z-20 hidden border-b border-slate-100 bg-white px-4 py-3 lg:block">
              <div className="grid grid-cols-[minmax(230px,1.7fr)_repeat(6,minmax(86px,0.7fr))] items-center gap-2">
                <HeaderLabel text="พนักงาน" />
                <HeaderLabel text="มาทำงาน" />
                <HeaderLabel text="สาย" />
                <HeaderLabel text="ขาด" />
                <HeaderLabel text="OT" />
                <HeaderLabel text="เงินเดือนปกติ" />
                <HeaderLabel text="ยอดเงินเดือน" />
              </div>
            </div>

            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={30} />
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center px-5 text-center">
                <UsersRound size={36} className="text-slate-300" />
                <p className="mt-3 text-sm font-black text-slate-700">
                  ไม่พบพนักงาน
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  ลองเปลี่ยนคำค้นหาหรือเลือกสาขาใหม่
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredEmployees.map((employee) => {
                  const stats = getEmployeeStats(employee)
                  const fullName = getEmployeeName(employee)
                  const baseSalary = Number(employee.baseSalary || 0)
                  const finalSalary = resolveFinalSalary(employee)
                  const safeBranch = getSafeBranch(employee)
                  const safePosition = getSafePosition(employee)

                  return (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => setSelectedEmployee(employee)}
                      className="block w-full px-4 py-3 text-left transition hover:bg-slate-50 active:bg-slate-100"
                    >
                      <div className="lg:grid lg:grid-cols-[minmax(230px,1.7fr)_repeat(6,minmax(86px,0.7fr))] lg:items-center lg:gap-2">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar employee={employee} />

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-950">
                              {fullName}
                            </p>

                            <p className="hidden truncate text-xs font-semibold text-slate-400 sm:block lg:hidden">
                              {safePosition?.name || employee.role || '-'} ·{' '}
                              {safeBranch?.name || '-'}
                            </p>
                          </div>

                          <ChevronRight
                            size={18}
                            strokeWidth={3}
                            className="shrink-0 text-slate-300 lg:hidden"
                          />
                        </div>

                        <div className="mt-2 hidden gap-2 overflow-x-auto sm:flex lg:hidden">
                          <MobileStatPill
                            label="ทำงาน"
                            value={`${stats.workingDays} วัน`}
                            color="dashboardSlate"
                          />
                          <MobileStatPill
                            label="สาย"
                            value={`${stats.lateDays} วัน`}
                            color="dashboardSlate"
                          />
                          <MobileStatPill
                            label="ขาด"
                            value={`${stats.absentDays} วัน`}
                            color="dashboardSlate"
                          />
                          <MobileStatPill
                            label="OT"
                            value={formatOTHours(stats.otMinutes)}
                            color="dashboardSlate"
                          />
                          <MobileStatPill
                            label="เงินเดือน"
                            value={formatCurrencyShort(finalSalary)}
                            color="dashboardSlate"
                          />
                        </div>

                        <DesktopStat
                          value={`${stats.workingDays} วัน`}
                          color="dashboardSlate"
                        />
                        <DesktopStat
                          value={`${stats.lateDays} วัน`}
                          color="dashboardSlate"
                        />
                        <DesktopStat
                          value={`${stats.absentDays} วัน`}
                          color="dashboardSlate"
                        />
                        <DesktopStat
                          value={formatOTHours(stats.otMinutes)}
                          color="dashboardSlate"
                        />
                        <DesktopStat
                          value={formatCurrencyShort(baseSalary)}
                          color="dashboardSlate"
                        />
                        <DesktopStat
                          value={formatCurrencyShort(finalSalary)}
                          color="dashboardSlate"
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {selectedEmployee && (
        <EmployeeFullScreen
          employee={selectedEmployee}
          employees={filteredEmployees}
          token={token}
          user={user}
          month={selectedMonth}
          branches={activeBranches}
          positions={activePositions}
          onClose={() => setSelectedEmployee(null)}
          onSelectEmployee={(employee) => {
            setConfirmDelete(null)
            setSelectedEmployee(employee)
          }}
          onRefresh={fetchAllData}
          updateSalary={updateSalary}
          updateUserBranch={updateUserBranch}
          updateUserPosition={updateUserPosition}
          handleRoleChange={handleRoleChange}
          handleDelete={handleDelete}
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
        />
      )}

      {isAddOpen && (
        <AddEmployeeSheet
          newUser={newUser}
          setNewUser={setNewUser}
          branches={activeBranches}
          positions={activePositions}
          saving={saving}
          onClose={() => setIsAddOpen(false)}
          onSubmit={handleCreateUser}
        />
      )}
    </div>
  )
}

function EmployeeFullScreen({
  employee,
  employees,
  token,
  user,
  month,
  branches,
  positions,
  onClose,
  onSelectEmployee,
  onRefresh,
  updateSalary,
  updateUserBranch,
  updateUserPosition,
  handleRoleChange,
  handleDelete,
  confirmDelete,
  setConfirmDelete,
}) {
  const [detail, setDetail] = useState(employee)
  const [detailMonth, setDetailMonth] = useState(month)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('history')
  const [salaryDraft, setSalaryDraft] = useState(employee.baseSalary || '')
  const [statsOpen, setStatsOpen] = useState(false)

  const canManageEmployee = String(user?.role || '').toUpperCase() === 'OWNER'

  useEffect(() => {
    setDetail(employee)
    setDetailMonth(month)
    setStatsOpen(false)
    setConfirmDelete(null)
  }, [employee, month, setConfirmDelete])

  useEffect(() => {
    fetchEmployeeMonthDetail()
  }, [detailMonth, employee])

  useEffect(() => {
    setSalaryDraft(detail.baseSalary || '')
  }, [detail.baseSalary])

  useEffect(() => {
    if (!canManageEmployee && activeTab === 'manage') {
      setActiveTab('history')
    }
  }, [canManageEmployee, activeTab])

  const currentIndex = useMemo(() => {
    return employees.findIndex((item) => String(item.id) === String(employee.id))
  }, [employees, employee.id])

  const hasPrevEmployee = currentIndex > 0
  const hasNextEmployee = currentIndex >= 0 && currentIndex < employees.length - 1

  const safeBranch = getSafeBranch(detail)
  const safePosition = getSafePosition(detail)

  const goToEmployee = (direction) => {
    const nextIndex = currentIndex + direction

    if (nextIndex < 0 || nextIndex >= employees.length) return

    const nextEmployee = employees[nextIndex]

    if (nextEmployee) {
      onSelectEmployee(nextEmployee)
    }
  }

  const fetchEmployeeMonthDetail = async () => {
    try {
      setLoading(true)

      const year = detailMonth.getFullYear()
      const month = detailMonth.getMonth() + 1

      const res = await axios.get(
        `${API_URL}/admin/dashboard?year=${year}&month=${month}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const dashboardEmployees = normalizeEmployeeArray(res.data)

      const found = dashboardEmployees.find(
        (item) => String(item.id) === String(employee.id)
      )

      if (found) {
        setDetail((prev) => ({
          ...prev,
          ...found,
          branch: found.branch || prev.branch,
          position: found.position || prev.position,
          branchId: found.branchId ?? prev.branchId,
          positionId: found.positionId ?? prev.positionId,
        }))
      }
    } catch (error) {
      console.error('Error fetching employee detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const changeMonth = (value) => {
    const newDate = new Date(detailMonth)
    newDate.setMonth(newDate.getMonth() + value)
    setDetailMonth(newDate)
  }

  const refreshAfterUpdate = async () => {
    await onRefresh()
    await fetchEmployeeMonthDetail()
  }

  const stats = getEmployeeStats(detail)
  const baseSalary = Number(detail.baseSalary || 0)
  const advanceTaken = resolveAdvanceTaken(detail)
  const finalSalary = resolveFinalSalary(detail)

  const statCards = [
    {
      label: 'มาทำงาน',
      value: `${stats.workingDays} วัน`,
      icon: <BriefcaseBusiness size={15} />,
      color: 'blue',
    },
    {
      label: 'สาย',
      value: `${stats.lateDays} วัน`,
      icon: <Clock3 size={15} />,
      color: 'orange',
    },
    {
      label: 'ออกก่อน',
      value: `${stats.earlyDays} วัน`,
      icon: <AlertTriangle size={15} />,
      color: 'orange',
    },
    {
      label: 'ลา',
      value: `${stats.approvedDayOffs} วัน`,
      icon: <CalendarCheck2 size={15} />,
      color: 'green',
    },
    {
      label: 'ขาด',
      value: `${stats.absentDays} วัน`,
      icon: <AlertTriangle size={15} />,
      color: 'red',
    },
    {
      label: 'OT',
      value: formatOTHours(stats.otMinutes),
      icon: <Timer size={15} />,
      color: 'purple',
    },
    {
      label: 'เงินเดือนปกติ',
      value: formatCurrencyShort(baseSalary),
      icon: <Wallet size={15} />,
      color: 'blue',
    },
    {
      label: 'เบิกล่วงหน้า',
      value: formatCurrencyShort(advanceTaken),
      icon: <Wallet size={15} />,
      color: 'blue',
    },
    {
      label: 'ยอดเงินเดือน',
      value: formatCurrencyShort(finalSalary),
      icon: <Wallet size={15} />,
      color: 'blue',
    },
  ]

  return (
    <div className="fixed inset-0 z-[999999] overflow-y-auto bg-[#F5F8FD] pb-[calc(env(safe-area-inset-bottom)+92px)] text-[#0F172A] lg:pb-8 lg:pl-[260px] xl:pl-[260px]">
      <div className="sticky top-0 z-30 bg-[#F5F8FD]/95 px-3.5 pb-3 pt-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-[0_8px_22px_rgba(15,23,42,0.06)] active:scale-95"
          >
            <ChevronLeft size={22} strokeWidth={3} />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-lg font-black text-slate-950">
              รายละเอียดพนักงาน
            </p>
            <p className="truncate text-xs font-semibold text-slate-400">
              {formatMonth(detailMonth)}
            </p>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => goToEmployee(-1)}
              disabled={!hasPrevEmployee}
              className="flex h-10 items-center justify-center rounded-full bg-white px-4 text-xs font-black text-slate-600 shadow-[0_8px_22px_rgba(15,23,42,0.06)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 disabled:active:scale-100"
            >
              ย้อนกลับ
            </button>

            <button
              type="button"
              onClick={() => goToEmployee(1)}
              disabled={!hasNextEmployee}
              className="flex h-10 items-center justify-center rounded-full bg-white px-4 text-xs font-black text-slate-600 shadow-[0_8px_22px_rgba(15,23,42,0.06)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 disabled:active:scale-100"
            >
              ต่อไป
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl space-y-3 px-3.5 pb-8 sm:px-6">
        <section className="rounded-[1.5rem] bg-white p-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <Avatar employee={detail} size="lg" />

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-black text-slate-950">
                {getEmployeeName(detail)}
              </h2>

              <p className="mt-0.5 truncate text-sm font-semibold text-slate-500">
                {safePosition?.name || detail.role || '-'} ·{' '}
                {safeBranch?.name || '-'}
              </p>

              <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                {detail.email || '-'}
              </p>
            </div>
          </div>

          {detail.branchId && !safeBranch && (
            <p className="mt-3 rounded-2xl bg-orange-50 px-3 py-2 text-xs font-bold text-orange-600">
              สาขานี้ถูกปิดใช้งานหรือถูกลบแล้ว
            </p>
          )}

          {detail.positionId && !safePosition && (
            <p className="mt-3 rounded-2xl bg-orange-50 px-3 py-2 text-xs font-bold text-orange-600">
              ตำแหน่งไม่ตรงกับสาขา หรือถูกปิดใช้งานแล้ว
            </p>
          )}

          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F8FD] text-slate-500 active:scale-95"
            >
              <ChevronLeft size={19} strokeWidth={3} />
            </button>

            <div className="flex h-9 min-w-[145px] items-center justify-center rounded-full bg-[#F5F8FD] px-4 text-sm font-black text-slate-800">
              {formatMonth(detailMonth)}
            </div>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F8FD] text-slate-500 active:scale-95"
            >
              <ChevronRight size={19} strokeWidth={3} />
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.35rem] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
          <button
            type="button"
            onClick={() => setStatsOpen((prev) => !prev)}
            className="flex w-full items-center justify-between px-3.5 py-3 text-left active:bg-slate-50"
          >
            <div>
              <p className="text-sm font-black text-slate-950">สรุปเดือนนี้</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-400">
                ทำงาน {stats.workingDays} วัน · สาย {stats.lateDays} วัน · เงินเดือน{' '}
                <span className="font-black text-slate-600">
                  {formatCurrencyShort(finalSalary)}
                </span>
              </p>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F8FD] text-slate-500">
              {statsOpen ? (
                <ChevronUp size={18} strokeWidth={3} />
              ) : (
                <ChevronDown size={18} strokeWidth={3} />
              )}
            </div>
          </button>

          {statsOpen && (
            <div className="grid grid-cols-3 gap-2 border-t border-slate-100 p-3 sm:grid-cols-5">
              {statCards.map((item) => (
                <CompactStat key={item.label} item={item} />
              ))}
            </div>
          )}
        </section>

        <section className="flex rounded-[1.35rem] bg-white p-1 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
          <TabButton
            active={activeTab === 'history'}
            label="ประวัติ"
            onClick={() => setActiveTab('history')}
          />

          {canManageEmployee && (
            <TabButton
              active={activeTab === 'manage'}
              label="จัดการ"
              onClick={() => setActiveTab('manage')}
            />
          )}
        </section>

        <section className="rounded-[1.5rem] bg-white p-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={28} />
            </div>
          ) : activeTab === 'history' || !canManageEmployee ? (
            <EmployeeHistoryLists stats={stats} />
          ) : (
            <EmployeeManagePanel
              detail={detail}
              user={user}
              branches={branches}
              positions={positions}
              salaryDraft={salaryDraft}
              setSalaryDraft={setSalaryDraft}
              updateSalary={async () => {
                await updateSalary(detail.id, salaryDraft)
                await refreshAfterUpdate()
              }}
              updateUserBranch={async (id, branchId) => {
                await updateUserBranch(id, branchId)
                setDetail((prev) => ({
                  ...prev,
                  branchId: branchId || null,
                  positionId: null,
                  position: null,
                }))
                await refreshAfterUpdate()
              }}
              updateUserPosition={async (id, positionId) => {
                await updateUserPosition(id, positionId)
                await refreshAfterUpdate()
              }}
              handleRoleChange={async (id, role) => {
                await handleRoleChange(id, role)
                await refreshAfterUpdate()
              }}
              handleDelete={handleDelete}
              confirmDelete={confirmDelete}
              setConfirmDelete={setConfirmDelete}
            />
          )}
        </section>
      </main>

      {confirmDelete && String(confirmDelete.id) === String(detail.id) && (
        <ConfirmDeletePopup
          employee={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(detail.id)}
        />
      )}
    </div>
  )
}
function EmployeeHistoryLists({ stats }) {
  const [activeList, setActiveList] = useState('attendance')

  const tabs = [
    {
      key: 'attendance',
      label: 'เข้างาน / OT',
      count: stats.combinedLogs.length,
    },
    {
      key: 'dayoff',
      label: 'วันลา',
      count: stats.dayOffs.length,
    },
    {
      key: 'salary',
      label: 'เบิกเงิน',
      count: stats.advanceLogs.length,
    },
  ]

  return (
    <div>
      <div className="mb-3 flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveList(tab.key)}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-black ${
              activeList === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-[#F5F8FD] text-slate-500'
            }`}
          >
            {tab.label} · {tab.count}
          </button>
        ))}
      </div>

      <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
        {activeList === 'attendance' ? (
          <AttendanceList logs={stats.combinedLogs} />
        ) : activeList === 'dayoff' ? (
          <DayOffList logs={stats.dayOffs} />
        ) : (
          <SalaryList logs={stats.advanceLogs} />
        )}
      </div>
    </div>
  )
}

function AttendanceList({ logs }) {
  if (!logs.length) {
    return <EmptyState text="ยังไม่มีประวัติเข้างาน" />
  }

  return logs.map((log, index) => {
    const isOT = log.type === 'OT'
    const status = normalizeAttendanceStatus(log.status, isOT ? 'OT' : 'WORK')
    const isNonTimeRecord =
      status === 'DAY_OFF' || status === 'HOLIDAY' || status === 'ABSENT'

    return (
      <div
        key={`${log.type}-${log.id || log.date}-${index}`}
        className="rounded-[1.15rem] bg-[#F8FAFC] p-3"
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isOT
                ? 'bg-purple-50 text-purple-600'
                : getAttendanceStatusColor(status)
            }`}
          >
            {isOT ? <Timer size={20} /> : <BriefcaseBusiness size={20} />}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-slate-950">
              {isOT ? getOTStatusLabel(status) : getAttendanceStatusLabel(status)}
            </p>

            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
              {formatDate(log.date || log.checkIn || log.createdAt)} ·{' '}
              {isNonTimeRecord
                ? log.reason || log.title || log.note || 'ไม่มีการบันทึกเวลา'
                : `${formatTime(log.checkIn)} - ${formatTime(log.checkOut)}`}
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">
            {isOT
              ? formatOTHours(log.otMinutes)
              : isNonTimeRecord
                ? getAttendanceStatusLabel(status)
                : calculateDuration(log.checkIn, log.checkOut)}
          </span>
        </div>

        {!isOT && !isNonTimeRecord && (
          <div className="mt-2 flex flex-wrap gap-2">
            {Number(log.lateMinutes || 0) > 0 && (
              <SmallPill
                label={`สาย ${log.lateMinutes} นาที`}
                className="bg-orange-50 text-orange-500"
              />
            )}

            {Number(log.earlyLeaveMinutes || 0) > 0 && (
              <SmallPill
                label={`ออกก่อน ${log.earlyLeaveMinutes} นาที`}
                className="bg-red-50 text-red-500"
              />
            )}
          </div>
        )}

        {(log.checkInNote || log.checkOutNote || log.note || log.reason) && (
          <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-500">
            {log.checkInNote || log.checkOutNote || log.note || log.reason}
          </p>
        )}
      </div>
    )
  })
}

function DayOffList({ logs }) {
  if (!logs.length) {
    return <EmptyState text="ยังไม่มีประวัติวันลา" />
  }

  return [...logs]
    .sort(
      (a, b) =>
        getDateTime(b.date || b.createdAt) -
        getDateTime(a.date || a.createdAt)
    )
    .map((item, index) => (
      <div
        key={item.id || index}
        className="rounded-[1.15rem] bg-[#F8FAFC] p-3"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CalendarCheck2 size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-slate-950">
              ขอวันลา
            </p>

            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
              {formatDate(item.date || item.createdAt)}
            </p>
          </div>

          <RequestBadge status={item.status} />
        </div>

        {item.reason && (
          <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-500">
            {item.reason}
          </p>
        )}
      </div>
    ))
}

function SalaryList({ logs }) {
  if (!logs.length) {
    return <EmptyState text="ยังไม่มีประวัติเบิกเงิน" />
  }

  return [...logs]
    .sort(
      (a, b) =>
        getDateTime(b.requestDate || b.createdAt) -
        getDateTime(a.requestDate || a.createdAt)
    )
    .map((item, index) => (
      <div
        key={item.id || index}
        className="rounded-[1.15rem] bg-[#F8FAFC] p-3"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Wallet size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-slate-700">
              {formatCurrency(item.amount)}
            </p>

            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
              {formatDate(item.requestDate || item.createdAt)}
            </p>
          </div>

          <RequestBadge status={item.status} />
        </div>
      </div>
    ))
}

function EmployeeManagePanel({
  detail,
  user,
  branches,
  positions,
  salaryDraft,
  setSalaryDraft,
  updateSalary,
  updateUserBranch,
  updateUserPosition,
  handleRoleChange,
  handleDelete,
  confirmDelete,
  setConfirmDelete,
}) {
  const currentBranchId = detail.branchId || detail.branch?.id || ''
  const currentPositionId = detail.positionId || detail.position?.id || ''

  const filteredPositions = useMemo(() => {
    return positions.filter((position) => {
      if (!currentBranchId) return false

      return String(position.branchId) === String(currentBranchId)
    })
  }, [positions, currentBranchId])

  return (
    <div className="space-y-3">
      <ManageBlock label="เงินเดือนปกติ">
        <div className="flex gap-2">
          <input
            value={salaryDraft}
            onChange={(e) => setSalaryDraft(e.target.value)}
            type="number"
            className="h-11 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
          />

          <button
            type="button"
            onClick={updateSalary}
            className="h-11 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white"
          >
            บันทึก
          </button>
        </div>
      </ManageBlock>

      <ManageBlock label="สาขา">
        <SelectBox
          value={currentBranchId}
          onChange={(e) => updateUserBranch(detail.id, e.target.value)}
        >
          <option value="">ไม่กำหนดสาขา</option>

          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </SelectBox>
      </ManageBlock>

      <ManageBlock label="ตำแหน่ง">
        <SelectBox
          value={currentPositionId}
          disabled={!currentBranchId}
          onChange={(e) => updateUserPosition(detail.id, e.target.value)}
        >
          <option value="">
            {currentBranchId ? 'ไม่กำหนดตำแหน่ง' : 'เลือกสาขาก่อน'}
          </option>

          {filteredPositions.map((position) => (
            <option key={position.id} value={position.id}>
              {position.name}
            </option>
          ))}
        </SelectBox>

        {currentBranchId && filteredPositions.length === 0 && (
          <p className="mt-1.5 text-[11px] font-bold text-orange-500">
            สาขานี้ยังไม่มีตำแหน่งที่ใช้งานได้
          </p>
        )}
      </ManageBlock>

      <ManageBlock label="บทบาท">
        <SelectBox
          value={detail.role || 'USER'}
          onChange={(e) => handleRoleChange(detail.id, e.target.value)}
        >
          <option hidden value="OWNER">
            OWNER
          </option>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </SelectBox>
      </ManageBlock>

      {user?.id !== detail.id && (
        <div className="rounded-[1.15rem] bg-red-50 p-3">
          <button
            type="button"
            onClick={() => setConfirmDelete(detail)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-red-500 text-sm font-black text-white"
          >
            <Trash2 size={17} strokeWidth={2.8} />
            ลบพนักงาน
          </button>
        </div>
      )}
    </div>
  )
}

function ConfirmDeletePopup({ employee, onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-[1000000] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"
      onMouseDown={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-[1.6rem] bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.24)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <Trash2 size={21} strokeWidth={2.8} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-black text-slate-950">
              ลบพนักงานคนนี้?
            </h3>

            <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-500">
              ต้องการลบ {getEmployeeName(employee)} ออกจากระบบหรือไม่
            </p>

            <p className="mt-2 text-xs font-bold leading-5 text-orange-500">
              ระบบจะเป็น soft delete: บัญชีจะถูกปิดใช้งาน แต่ประวัติยังเก็บไว้
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-2xl bg-[#F5F8FD] text-sm font-black text-slate-500 active:scale-[0.98]"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="h-11 rounded-2xl bg-red-500 text-sm font-black text-white active:scale-[0.98]"
          >
            ลบพนักงาน
          </button>
        </div>
      </div>
    </div>
  )
}

function AddEmployeeSheet({
  newUser,
  setNewUser,
  branches,
  positions,
  saving,
  onClose,
  onSubmit,
}) {
  const filteredPositions = useMemo(() => {
    if (!newUser.branchId) return []

    return positions.filter((position) => {
      return String(position.branchId) === String(newUser.branchId)
    })
  }, [positions, newUser.branchId])

  const updateBranch = (branchId) => {
    setNewUser({
      ...newUser,
      branchId,
      positionId: '',
    })
  }

  return (
    <div
      className="fixed inset-0 z-[999999] overflow-y-auto bg-slate-950/40 px-3.5 py-5 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="mx-auto w-full max-w-xl rounded-[1.6rem] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.22)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              เพิ่มพนักงาน
            </h2>

            <p className="mt-0.5 text-xs font-semibold text-slate-400">
              สร้างบัญชีพนักงานใหม่
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F8FD] text-slate-500"
          >
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="ชื่อ"
            value={newUser.firstname}
            onChange={(e) =>
              setNewUser({ ...newUser, firstname: e.target.value })
            }
          />

          <Input
            placeholder="นามสกุล"
            value={newUser.lastname}
            onChange={(e) =>
              setNewUser({ ...newUser, lastname: e.target.value })
            }
          />

          <Input
            placeholder="อีเมล"
            value={newUser.email}
            className="sm:col-span-2"
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />

          <Input
            placeholder="เงินเดือนปกติ"
            type="number"
            value={newUser.baseSalary}
            onChange={(e) =>
              setNewUser({ ...newUser, baseSalary: e.target.value })
            }
          />

          <SelectBox
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </SelectBox>

          <SelectBox
            value={newUser.branchId}
            onChange={(e) => updateBranch(e.target.value)}
          >
            <option value="">เลือกสาขา</option>

            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </SelectBox>

          <SelectBox
            value={newUser.positionId}
            disabled={!newUser.branchId}
            onChange={(e) =>
              setNewUser({ ...newUser, positionId: e.target.value })
            }
          >
            <option value="">
              {newUser.branchId ? 'เลือกตำแหน่ง' : 'เลือกสาขาก่อน'}
            </option>

            {filteredPositions.map((position) => (
              <option key={position.id} value={position.id}>
                {position.name}
              </option>
            ))}
          </SelectBox>

          {newUser.branchId && filteredPositions.length === 0 && (
            <p className="text-xs font-bold text-orange-500 sm:col-span-2">
              สาขานี้ยังไม่มีตำแหน่งที่ใช้งานได้
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-2 h-12 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] disabled:opacity-60 sm:col-span-2"
          >
            {saving ? 'กำลังสร้าง...' : 'สร้างพนักงาน'}
          </button>
        </form>
      </div>
    </div>
  )
}
function getEmployeeStats(employee) {
  const attendanceLogs = employee.attendanceLogs || []
  const timeLogs = employee.timetracking || employee.timeTrackings || []

  const rawOvertimeLogs =
    employee.overtimeLogs ||
    employee.overtimeTrackings ||
    employee.otLogs ||
    []

  const dayOffs =
    employee.dayOff ||
    employee.dayOffs ||
    employee.dayOffsTaken ||
    employee.leaveRequests ||
    []

  const advanceLogs =
    employee.advanceSalary ||
    employee.advanceSalaries ||
    employee.advanceRequests ||
    employee.salaryRequests ||
    []

  const normalLogs = attendanceLogs.length
    ? attendanceLogs
    : timeLogs.map((log) => ({
        ...log,
        date: log.date || log.checkIn,
        status: log.status || 'PRESENT',
        shiftName:
          log.shiftNameSnapshot ||
          log.shift?.name ||
          log.shiftName ||
          null,
      }))

    const normalizedNormalLogs = normalLogs.map((log) => {
        const baseStatus = normalizeAttendanceStatus(log.status)
        const timeStatus = normalizeAttendanceStatus(log.timeStatus)

        const status =
            baseStatus === 'PRESENT' &&
            ['ACTIVE', 'EXPIRED', 'CANCELED'].includes(timeStatus)
            ? timeStatus
            : baseStatus

        return {
            ...log,
            type: 'WORK',
            status,
            date: log.date || log.checkIn || log.createdAt,
            sortDate: log.checkOut || log.checkIn || log.date || log.createdAt,
        }
    })

  const overtimeLogs = rawOvertimeLogs.map((ot) => {
    const status = normalizeOTStatus(ot.status)

    return {
      ...ot,
      type: 'OT',
      status,
      date: ot.date || ot.checkIn || ot.createdAt,
      sortDate: ot.checkIn || ot.date || ot.createdAt,
      checkIn: ot.checkIn,
      checkOut: ot.checkOut,
      otMinutes: Number(
        ot.otMinutes || calculateDurationMinutes(ot.checkIn, ot.checkOut)
      ),
    }
  })

  const approvedDayOffWorkLogs = dayOffs
    .filter((item) => normalizeRequestStatus(item.status) === 'APPROVED')
    .map((item) => ({
      ...item,
      type: 'WORK',
      status: 'DAY_OFF',
      date: item.date || item.requestDate || item.createdAt,
      sortDate: item.date || item.requestDate || item.createdAt,
      reason: item.reason || item.note || '',
    }))

  const combinedLogs = [
    ...normalizedNormalLogs,
    ...overtimeLogs,
    ...approvedDayOffWorkLogs,
  ].sort(
    (a, b) =>
      getDateTime(b.sortDate || b.date) - getDateTime(a.sortDate || a.date)
  )

  const workingDays =
    getNumberOrNull(employee.workingDays) ??
    normalizedNormalLogs.filter((log) => {
      const status = normalizeAttendanceStatus(log.status)
      return status === 'PRESENT' || status === 'ACTIVE'
    }).length

  const lateDays =
    getNumberOrNull(employee.lateDays) ??
    normalizedNormalLogs.filter((log) => Number(log.lateMinutes || 0) > 0).length

  const earlyDays =
    getNumberOrNull(employee.earlyDays) ??
    normalizedNormalLogs.filter(
      (log) => Number(log.earlyLeaveMinutes || 0) > 0
    ).length

  const absentDays =
    getNumberOrNull(employee.absentDays) ??
    normalizedNormalLogs.filter((log) => {
      return normalizeAttendanceStatus(log.status) === 'ABSENT'
    }).length

  const otMinutes =
    getNumberOrNull(employee.totalOtMinutes) ??
    overtimeLogs
      .filter(isCountableOT)
      .reduce((sum, ot) => sum + Number(ot.otMinutes || 0), 0)

  const approvedDayOffs =
    getNumberOrNull(employee.dayOffsTaken) ??
    getNumberOrNull(employee.approvedDayOffs) ??
    dayOffs.filter((item) => normalizeRequestStatus(item.status) === 'APPROVED')
      .length

  return {
    attendanceLogs: normalizedNormalLogs,
    overtimeLogs,
    combinedLogs,
    dayOffs,
    advanceLogs,
    workingDays,
    lateDays,
    earlyDays,
    otMinutes,
    approvedDayOffs,
    absentDays,
  }
}

function normalizeEmployeeArray(payload) {
  if (!payload) return []

  if (Array.isArray(payload)) {
    return payload.map(normalizeEmployee).filter(Boolean)
  }

  const result =
    payload.result ||
    payload.data ||
    payload.employees ||
    payload.users ||
    payload.items ||
    []

  if (Array.isArray(result)) {
    return result.map(normalizeEmployee).filter(Boolean)
  }

  return []
}

function normalizeEmployee(employee) {
  if (!employee) return null

  const branch =
    employee.branch && employee.branch.isDeleted !== true
      ? employee.branch
      : null

  const position =
    employee.position && employee.position.isDeleted !== true
      ? employee.position
      : null

  return {
    ...employee,
    branch,
    position,
    branchId: employee.branchId ?? branch?.id ?? null,
    positionId: employee.positionId ?? position?.id ?? null,
  }
}

function mergeEmployees(dashboardEmployees, managementEmployees) {
  const map = new Map()

  managementEmployees.forEach((employee) => {
    if (!employee?.id) return

    map.set(String(employee.id), normalizeEmployee(employee))
  })

  dashboardEmployees.forEach((employee) => {
    if (!employee?.id) return

    const current = map.get(String(employee.id)) || {}

    map.set(
      String(employee.id),
      normalizeEmployee({
        ...current,
        ...employee,
        branch: employee.branch || current.branch,
        position: employee.position || current.position,
        branchId: employee.branchId ?? current.branchId,
        positionId: employee.positionId ?? current.positionId,
        baseSalary: employee.baseSalary ?? current.baseSalary,
        role: employee.role ?? current.role,
        email: employee.email ?? current.email,
        firstname: employee.firstname ?? current.firstname,
        lastname: employee.lastname ?? current.lastname,
        profileImage: employee.profileImage ?? current.profileImage,
      })
    )
  })

  return Array.from(map.values()).filter(Boolean)
}

function isActiveBranch(branch) {
  if (!branch) return false
  if (branch.isActive === false) return false
  if (branch.isDeleted === true) return false

  return true
}

function isActivePosition(position) {
  if (!position) return false
  if (position.isActive === false) return false
  if (position.isDeleted === true) return false
  if (!position.branchId) return false

  return true
}

function getSafeBranch(employee) {
  if (!employee) return null

  const branch = employee.branch || null
  const branchId = employee.branchId || branch?.id || null

  if (!branchId) return null
  if (!isActiveBranch(branch)) return null

  return branch
}

function getSafePosition(employee) {
  if (!employee) return null

  const position = employee.position || null
  const positionId = employee.positionId || position?.id || null
  const branchId = employee.branchId || employee.branch?.id || null

  if (!positionId) return null
  if (!isActivePosition(position)) return null

  if (
    branchId &&
    position.branchId &&
    Number(position.branchId) !== Number(branchId)
  ) {
    return null
  }

  return position
}

function normalizeAttendanceStatus(status) {
  const value = String(status || '').toUpperCase()

  if (value === 'PRESENT' || value === 'COMPLETED') return 'PRESENT'
  if (value === 'ACTIVE') return 'ACTIVE'
  if (value === 'ABSENT') return 'ABSENT'
  if (value === 'DAY_OFF' || value === 'DAYOFF' || value === 'LEAVE') {
    return 'DAY_OFF'
  }
  if (value === 'HOLIDAY' || value === 'STORE_HOLIDAY') return 'HOLIDAY'
  if (value === 'EXPIRED') return 'EXPIRED'
  if (value === 'CANCELED' || value === 'CANCELLED') return 'CANCELED'

  return value || 'UNKNOWN'
}

function normalizeOTStatus(status) {
  const value = String(status || '').toUpperCase()

  if (value === 'COMPLETED') return 'COMPLETED'
  if (value === 'ACTIVE') return 'ACTIVE'
  if (value === 'EXPIRED') return 'EXPIRED'
  if (value === 'CANCELED' || value === 'CANCELLED') return 'CANCELED'

  return value || 'ACTIVE'
}

function normalizeRequestStatus(status) {
  const value = String(status || 'PENDING').toUpperCase()

  if (value === 'APPROVED') return 'APPROVED'
  if (value === 'REJECTED') return 'REJECTED'
  if (value === 'CANCELED' || value === 'CANCELLED') return 'CANCELED'

  return 'PENDING'
}

function isCountableOT(ot) {
  const status = normalizeOTStatus(ot?.status)

  return ot?.checkIn && ot?.checkOut && status === 'COMPLETED'
}

function HeaderLabel({ text }) {
  return (
    <p className="hidden truncate text-xs font-black uppercase tracking-wide text-slate-400 lg:block">
      {text}
    </p>
  )
}

function Avatar({ employee, size = 'md' }) {
  const avatarSize =
    size === 'lg' ? 'h-16 w-16 rounded-2xl' : 'h-11 w-11 rounded-xl'

  return (
    <div className={`${avatarSize} shrink-0 overflow-hidden bg-blue-50`}>
      {employee?.profileImage ? (
        <img
          src={employee.profileImage}
          alt="profile"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-black text-blue-600">
          {employee?.firstname?.charAt(0) || <User size={20} />}
        </div>
      )}
    </div>
  )
}

function DesktopStat({ value, color }) {
  const styles = getColorStyle(color)

  return (
    <p className={`hidden truncate text-sm font-black lg:block ${styles.text}`}>
      {value || '-'}
    </p>
  )
}

function MobileStatPill({ label, value, color }) {
  const styles = getColorStyle(color)

  return (
    <div
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${styles.bg} ${styles.text}`}
    >
      {label}: {value}
    </div>
  )
}

function CompactStat({ item }) {
  const styles = getColorStyle(item.color)

  return (
    <div className="min-w-0 rounded-2xl bg-[#F8FAFC] p-2.5">
      <div className="flex items-center gap-1.5">
        <span className={`shrink-0 ${styles.text}`}>{item.icon}</span>
        <p className="truncate text-[10px] font-bold text-slate-400">
          {item.label}
        </p>
      </div>

      <p className={`mt-1 truncate text-xs font-black ${styles.text}`}>
        {item.value}
      </p>
    </div>
  )
}

function TabButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 flex-1 rounded-[1.05rem] text-sm font-black transition active:scale-[0.98] ${
        active
          ? 'bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]'
          : 'text-slate-400'
      }`}
    >
      {label}
    </button>
  )
}

function ManageBlock({ label, children }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-black text-slate-950">{label}</p>
      {children}
    </div>
  )
}

function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 ${className}`}
    />
  )
}

function SelectBox({ children, className = '', disabled = false, ...props }) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <select
        {...props}
        disabled={disabled}
        className="h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-3 pr-9 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      >
        {children}
      </select>

      <ChevronDown
        size={17}
        strokeWidth={3}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  )
}

function RequestBadge({ status }) {
  const value = normalizeRequestStatus(status)

  if (value === 'APPROVED') {
    return (
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-600">
        อนุมัติแล้ว
      </span>
    )
  }

  if (value === 'REJECTED') {
    return (
      <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-500">
        ปฏิเสธ
      </span>
    )
  }

  if (value === 'CANCELED') {
    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">
        ยกเลิก
      </span>
    )
  }

  return (
    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-black text-orange-500">
      รออนุมัติ
    </span>
  )
}

function SmallPill({ label, className }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-black ${className}`}
    >
      {label}
    </span>
  )
}

function EmptyState({ text }) {
  return (
    <div className="flex min-h-[160px] items-center justify-center rounded-[1.15rem] bg-[#F8FAFC]">
      <p className="text-sm font-bold text-slate-400">{text}</p>
    </div>
  )
}

function getColorStyle(color) {
  const styles = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    green: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-500',
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-500',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
    },
    slate: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
    },
    dashboardSlate: {
      bg: 'bg-slate-100',
      text: 'text-slate-500',
    },
  }

  return styles[color] || styles.blue
}

function getAttendanceStatusColor(status) {
  const value = normalizeAttendanceStatus(status)

  if (value === 'PRESENT' || value === 'ACTIVE') {
    return 'bg-blue-50 text-blue-600'
  }

  if (value === 'ABSENT' || value === 'CANCELED') {
    return 'bg-red-50 text-red-500'
  }

  if (value === 'DAY_OFF') {
    return 'bg-emerald-50 text-emerald-600'
  }

  if (value === 'HOLIDAY') {
    return 'bg-orange-50 text-orange-500'
  }

  if (value === 'EXPIRED') {
    return 'bg-yellow-50 text-yellow-600'
  }

  return 'bg-slate-100 text-slate-500'
}

function getAttendanceStatusLabel(status) {
  const value = normalizeAttendanceStatus(status)

  if (value === 'PRESENT') return 'มาทำงาน'
  if (value === 'ACTIVE') return 'กำลังทำงาน'
  if (value === 'ABSENT') return 'ขาดงาน'
  if (value === 'DAY_OFF') return 'วันลา'
  if (value === 'HOLIDAY') return 'วันหยุดร้าน'
  if (value === 'EXPIRED') return 'หมดเวลา'
  if (value === 'CANCELED') return 'ยกเลิก'

  return value || '-'
}

function getOTStatusLabel(status) {
  const value = normalizeOTStatus(status)

  if (value === 'COMPLETED') return 'จบ OT'
  if (value === 'ACTIVE') return 'กำลังทำ OT'
  if (value === 'EXPIRED') return 'OT หมดเวลา'
  if (value === 'CANCELED') return 'ยกเลิก OT'

  return 'OT'
}

function getEmployeeName(employee) {
  return (
    [employee?.firstname, employee?.lastname].filter(Boolean).join(' ') ||
    employee?.name ||
    employee?.email ||
    'ไม่ระบุชื่อ'
  )
}

function resolveAdvanceTaken(employee) {
  const directValue = Number(employee.advanceTaken)

  if (!Number.isNaN(directValue) && directValue > 0) {
    return directValue
  }

  const advanceLogs =
    employee.advanceSalary ||
    employee.advanceSalaries ||
    employee.advanceRequests ||
    []

  return advanceLogs
    .filter((item) =>
      ['APPROVED', 'PENDING'].includes(normalizeRequestStatus(item.status))
    )
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)
}

function resolveFinalSalary(employee) {
  const directValue = Number(employee.finalSalary)

  if (!Number.isNaN(directValue) && directValue > 0) {
    return directValue
  }

  const baseSalary = Number(employee.baseSalary || 0)
  const advanceTaken = resolveAdvanceTaken(employee)

  return Math.max(baseSalary - advanceTaken, 0)
}

function getNumberOrNull(value) {
  if (value === undefined || value === null || value === '') return null

  const number = Number(value)

  if (Number.isNaN(number)) return null

  return number
}

function formatMonth(date) {
  return new Date(date).toLocaleDateString('th-TH', {
    month: 'long',
    year: 'numeric',
  })
}

function formatDate(date) {
  if (!date) return '-'

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) return '-'

  return parsed.toLocaleDateString('th-TH')
}

function formatTime(date) {
  if (!date) return '-'

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) return '-'

  return parsed.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(Number(amount || 0))
}

function formatCurrencyShort(amount) {
  return `${Number(amount || 0).toLocaleString('th-TH')} บาท`
}

function formatOTHours(minutes) {
  const totalMinutes = Number(minutes || 0)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  if (totalMinutes <= 0) return '0 ชม.'
  if (hours <= 0) return `${mins} นาที`
  if (mins <= 0) return `${hours} ชม.`

  return `${hours} ชม. ${mins} นาที`
}

function calculateDuration(checkIn, checkOut) {
  const minutes = calculateDurationMinutes(checkIn, checkOut)

  if (minutes <= 0) return '-'

  return formatOTHours(minutes)
}

function calculateDurationMinutes(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0

  const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime()

  if (diffMs <= 0) return 0

  return Math.floor(diffMs / (1000 * 60))
}

function getDateTime(date) {
  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) return 0

  return parsed.getTime()
}

export default UserManagement