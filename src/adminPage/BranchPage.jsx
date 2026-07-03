import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Plus,
  Search,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'

import 'leaflet/dist/leaflet.css'
import 'leaflet-control-geocoder'
import 'leaflet-control-geocoder/dist/Control.Geocoder.css'

import API_URL from '../utils/api'
import useAuthStore from '../store/auth-store'
import { createAlert } from '../utils/createAlert'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const DEFAULT_FORM = {
  name: '',
  code: '',
  address: '',
  lat: 0,
  lng: 0,
  radius: 100,
  isActive: true,
}

function SearchControl({ onSelect }) {
  const map = useMap()

  useEffect(() => {
    const geocoder = L.Control.geocoder({
      defaultMarkGeocode: false,
      placeholder: 'Search branch location...',
    })

    geocoder.on('markgeocode', (e) => {
      const { lat, lng } = e.geocode.center

      onSelect({ lat, lng })
      map.setView([lat, lng], 17)
    })

    geocoder.addTo(map)

    const input = geocoder.getContainer()?.querySelector('input')

    if (input) {
      input.style.backgroundColor = 'white'
      input.style.color = '#0F172A'
      input.style.borderRadius = '16px'
      input.style.padding = '12px 16px'
      input.style.fontWeight = '700'
      input.style.width = '240px'
      input.style.border = 'none'
      input.style.outline = 'none'
      input.style.boxShadow = '0 10px 30px rgba(15,23,42,0.14)'
    }

    return () => map.removeControl(geocoder)
  }, [map, onSelect])

  return null
}

function ChangeMapView({ position }) {
  const map = useMap()

  useEffect(() => {
    map.setView([position.lat, position.lng], map.getZoom())
  }, [map, position])

  return null
}

function LocationPicker({ position, radius, onSelect }) {
  useMapEvents({
    click(e) {
      onSelect({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      })
    },
  })

  return (
    <>
      <Marker position={[position.lat, position.lng]} />
      <Circle center={[position.lat, position.lng]} radius={Number(radius)} />
    </>
  )
}

function BranchPage() {
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)

  const [branches, setBranches] = useState([])
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState(DEFAULT_FORM)

  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [isFormPageOpen, setIsFormPageOpen] = useState(false)
  const [formStep, setFormStep] = useState('location')

  const mapPosition = {
    lat: Number(form.lat) || DEFAULT_FORM.lat,
    lng: Number(form.lng) || DEFAULT_FORM.lng,
  }

  const hasSelectedLocation =
    !Number.isNaN(Number(form.lat)) &&
    !Number.isNaN(Number(form.lng)) &&
    !(Number(form.lat) === 0 && Number(form.lng) === 0)

  const filteredBranches = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) return branches

    return branches.filter((branch) => {
      return (
        branch.name?.toLowerCase().includes(keyword) ||
        branch.code?.toLowerCase().includes(keyword)
      )
    })
  }, [branches, search])

  const employeeCountByBranch = useMemo(() => {
    const map = {}

    employees.forEach((employee) => {
      if (!employee || employee.isDeleted === true) return

      const branchId =
        employee.branchId || employee.branch?.id || employee.branch?.branchId

      if (!branchId) return

      map[String(branchId)] = (map[String(branchId)] || 0) + 1
    })

    return map
  }, [employees])

  const activeBranchCount = useMemo(() => {
    return branches.filter((branch) => branch?.isActive !== false).length
  }, [branches])

  const fetchBranches = async () => {
    const res = await axios.get(`${API_URL}/admin/branches`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    setBranches(res.data.data || res.data.result || [])
  }

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/getemployee`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setEmployees(normalizeEmployeeArray(res.data))
    } catch (error) {
      console.log(error)
      setEmployees([])
    }
  }

  const fetchAllData = async () => {
    try {
      setFetching(true)

      await Promise.all([fetchBranches(), fetchEmployees()])
    } catch (error) {
      console.log(error)
      createAlert('error', 'โหลดข้อมูลสาขาไม่สำเร็จ')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchAllData()
    }
  }, [token])

  const updateForm = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const hdlChange = (e) => {
    updateForm(e.target.name, e.target.value)
  }

  const hdlSelectLocation = ({ lat, lng }) => {
    setForm((prev) => ({
      ...prev,
      lat,
      lng,
    }))
  }

  const getCurrentLocationSilently = () => {
    if (!navigator.geolocation) {
      createAlert('error', 'เครื่องนี้ไม่รองรับ Location')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }))
      },
      (error) => {
        console.log(error)
        createAlert(
          'error',
          'กรุณาอนุญาต Location ใน Browser หรือเลือกตำแหน่งบนแผนที่เอง'
        )
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const openAddBranchPage = () => {
    setForm(DEFAULT_FORM)
    setFormStep('location')
    setIsFormPageOpen(true)
    getCurrentLocationSilently()
  }

  const closeFormPage = () => {
    if (saving) return

    setIsFormPageOpen(false)
    setForm(DEFAULT_FORM)
    setFormStep('location')
  }

  const goToDetailsStep = () => {
    if (!hasSelectedLocation) {
      createAlert('error', 'กรุณาเลือกตำแหน่งสาขาบนแผนที่ก่อน')
      return
    }

    setFormStep('details')
  }

  const validateBranch = () => {
    if (!hasSelectedLocation) {
      createAlert('error', 'กรุณาเลือกตำแหน่งสาขาก่อน')
      return false
    }

    if (!form.name.trim()) {
      createAlert('error', 'กรุณากรอกชื่อสาขา')
      return false
    }

    if (!form.code.trim()) {
      createAlert('error', 'กรุณากรอกรหัสสาขา')
      return false
    }

    if (Number.isNaN(Number(form.lat)) || Number.isNaN(Number(form.lng))) {
      createAlert('error', 'พิกัดสาขาไม่ถูกต้อง')
      return false
    }

    if (Number(form.radius) <= 0) {
      createAlert('error', 'รัศมีต้องมากกว่า 0')
      return false
    }

    return true
  }

  const hdlSubmit = async (e) => {
    e.preventDefault()

    if (!validateBranch()) return

    try {
      setSaving(true)

      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        address: form.address.trim() || null,
        lat: Number(form.lat),
        lng: Number(form.lng),
        radius: Number(form.radius || 100),
        isActive: true,
      }

      await axios.post(`${API_URL}/admin/branch`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      createAlert('success', 'เพิ่มสาขาสำเร็จ')

      await fetchAllData()
      closeFormPage()
    } catch (error) {
      console.log(error)
      createAlert(
        'error',
        error.response?.data?.message || 'บันทึกสาขาไม่สำเร็จ'
      )
    } finally {
      setSaving(false)
    }
  }

  if (isFormPageOpen && formStep === 'location') {
    return (
      <BranchLocationPage
        form={form}
        mapPosition={mapPosition}
        hdlSelectLocation={hdlSelectLocation}
        onBack={closeFormPage}
        onNext={goToDetailsStep}
      />
    )
  }

  if (isFormPageOpen && formStep === 'details') {
    return (
      <BranchDetailsPage
        form={form}
        saving={saving}
        hdlChange={hdlChange}
        onBack={closeFormPage}
        onBackToLocation={() => setFormStep('location')}
        onSubmit={hdlSubmit}
      />
    )
  }

  return (
    <div className="min-h-dvh bg-[#F5F8FD] px-3.5 pb-28 pt-4 text-[#0F172A] sm:px-6 lg:px-8 lg:pb-10">
      <div className="mx-auto w-full max-w-3xl lg:max-w-6xl xl:max-w-7xl">
        <header className="mb-5 flex items-center justify-between gap-3 lg:mb-6">
          <button
            type="button"
            onClick={() => navigate('/user/other', { replace: true })}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,0.06)] active:scale-95"
          >
            <ChevronLeft size={23} strokeWidth={3} />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <h1 className="text-2xl font-black tracking-tight text-slate-950 lg:text-3xl">
              จัดการสาขา
            </h1>
            <p className="mt-0.5 text-xs font-bold text-slate-400 lg:text-sm">
              เพิ่มและตั้งค่าข้อมูลสาขาสำหรับการเช็กอิน
            </p>
          </div>

          <div className="h-11 w-11 shrink-0" />
        </header>

        <section className="mb-4 rounded-[1.7rem] bg-white p-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.06)] lg:mb-5 lg:p-4">
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
                placeholder="ค้นหาสาขา"
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
              onClick={openAddBranchPage}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)] transition active:scale-[0.99] sm:w-auto sm:min-w-[120px] sm:shrink-0"
            >
              <Plus size={18} strokeWidth={3} className="shrink-0" />
              <span>เพิ่ม</span>
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.7rem] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between px-4 py-4 lg:px-5">
            <div>
              <p className="text-sm font-black text-slate-950 lg:text-base">
                รายชื่อสาขา
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-400">
                แตะชื่อสาขาเพื่อเข้าหน้าตั้งค่า
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600">
              {filteredBranches.length}
            </span>
          </div>

          <div className="h-px bg-slate-100" />

          <div className="hidden grid-cols-[minmax(0,1fr)_170px_40px] border-b border-slate-100 bg-slate-50/70 px-5 py-3 lg:grid">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              สาขา
            </p>
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              พนักงาน
            </p>
            <div />
          </div>

          {fetching ? (
            <div className="flex h-72 items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : filteredBranches.length === 0 ? (
            <div className="flex h-72 flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <MapPin size={27} strokeWidth={2.7} />
              </div>

              <p className="mt-4 text-sm font-black text-slate-900">
                ยังไม่มีสาขา
              </p>

              <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">
                กดปุ่มเพิ่มเพื่อเพิ่มสาขาแรกของระบบ
              </p>
            </div>
          ) : (
            <div className="max-h-[calc(100dvh-430px)] overflow-y-auto lg:max-h-[calc(100dvh-480px)]">
              {filteredBranches.map((branch, index) => {
                const employeeCount =
                  employeeCountByBranch[String(branch.id)] || 0

                return (
                  <React.Fragment key={branch.id}>
                    {index > 0 && <div className="mx-4 h-px bg-slate-100" />}

                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/admin/branch/${branch.id}/settings`)
                      }
                      className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left active:bg-blue-50 lg:grid lg:grid-cols-[minmax(0,1fr)_170px_40px] lg:px-5 lg:hover:bg-slate-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                            branch.isActive === false
                              ? 'bg-red-400'
                              : 'bg-emerald-400'
                          }`}
                        />

                        <p className="truncate text-sm font-black text-slate-950">
                          {branch.name}
                        </p>
                      </div>

                      <div className="hidden items-center gap-2 lg:flex">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <UserRound size={17} strokeWidth={2.7} />
                        </div>

                        <p className="text-sm font-black text-slate-700">
                          {employeeCount} คน
                        </p>
                      </div>

                      <ChevronRight
                        size={20}
                        strokeWidth={3}
                        className="shrink-0 text-slate-300 lg:justify-self-end"
                      />
                    </button>
                  </React.Fragment>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color = 'blue' }) {
  const style = getStatStyle(color)

  return (
    <div className="rounded-[1.45rem] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-400">{label}</p>
          <p className={`mt-1 text-2xl font-black ${style.text}`}>{value}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${style.bg} ${style.text}`}
        >
          <Icon size={22} strokeWidth={2.6} />
        </div>
      </div>
    </div>
  )
}

function getStatStyle(color) {
  const styles = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    green: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
    },
  }

  return styles[color] || styles.blue
}

function BranchLocationPage({
  form,
  mapPosition,
  hdlSelectLocation,
  onBack,
  onNext,
}) {
  return (
    <div className="min-h-dvh bg-[#F5F8FD] px-3.5 pb-6 pt-4 text-[#0F172A] sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,0.06)] active:scale-95"
          >
            <ChevronLeft size={23} strokeWidth={3} />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              เลือกตำแหน่งสาขา
            </h1>
            <p className="mt-0.5 text-xs font-bold text-slate-400">
              แตะบนแผนที่หรือค้นหาพื้นที่ของสาขา
            </p>
          </div>

          <div className="h-11 w-11 shrink-0" />
        </header>

        <section className="overflow-hidden rounded-[1.7rem] bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="mb-3 px-1">
            <p className="text-sm font-black text-slate-950">
              พื้นที่ Check-in
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-400">
              เลือกจุดศูนย์กลางของสาขาก่อนกรอกข้อมูล
            </p>
          </div>

          <div className="overflow-hidden rounded-[1.4rem] border border-slate-100">
            <MapContainer
              center={[mapPosition.lat, mapPosition.lng]}
              zoom={15}
              scrollWheelZoom
              className="h-[360px] w-full sm:h-[420px] lg:h-[calc(100dvh-330px)] lg:min-h-[420px] lg:max-h-[520px]"
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <SearchControl onSelect={hdlSelectLocation} />
              <ChangeMapView position={mapPosition} />
              <LocationPicker
                position={mapPosition}
                radius={form.radius}
                onSelect={hdlSelectLocation}
              />
            </MapContainer>
          </div>

          <button
            type="button"
            onClick={onNext}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)] active:scale-[0.99]"
          >
            ถัดไป
            <ChevronRight size={18} strokeWidth={3} />
          </button>
        </section>
      </div>
    </div>
  )
}

function BranchDetailsPage({
  form,
  saving,
  hdlChange,
  onBack,
  onBackToLocation,
  onSubmit,
}) {
  return (
    <div className="min-h-dvh bg-[#F5F8FD] px-3.5 pb-10 pt-4 text-[#0F172A] sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToLocation}
            disabled={saving}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,0.06)] active:scale-95 disabled:opacity-50"
          >
            <ChevronLeft size={23} strokeWidth={3} />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              ข้อมูลสาขา
            </h1>
            <p className="mt-0.5 text-xs font-bold text-slate-400">
              กรอกชื่อ รหัส และรายละเอียดของสาขา
            </p>
          </div>

          <div className="h-11 w-11 shrink-0" />
        </header>

        <form
          onSubmit={onSubmit}
          className="rounded-[1.7rem] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
        >
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
              Branch Setup
            </p>

            <h2 className="mt-1 text-lg font-black text-slate-950">
              Add Branch
            </h2>
          </div>

          <div className="space-y-3">
            <InputField
              label="ชื่อสาขา"
              name="name"
              value={form.name}
              onChange={hdlChange}
              placeholder="Branch name"
            />

            <InputField
              label="รหัสสาขา"
              name="code"
              value={form.code}
              onChange={hdlChange}
              placeholder="Branch code"
            />

            <div>
              <label className="mb-1.5 block text-xs font-black text-slate-500">
                ที่อยู่
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={hdlChange}
                placeholder="Address"
                rows={3}
                className="w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-300 focus:border-blue-300 focus:bg-white"
              />
            </div>

            <InputField
              label="รัศมีเช็กอิน / เมตร"
              name="radius"
              type="number"
              min="10"
              value={form.radius}
              onChange={hdlChange}
              placeholder="Radius"
            />
          </div>

          <div className="mt-5 grid gap-2">
            <button
              type="submit"
              disabled={saving}
              className="h-12 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)] active:scale-95 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="mx-auto animate-spin" size={21} />
              ) : (
                'เพิ่มสาขา'
              )}
            </button>

            <button
              type="button"
              onClick={onBack}
              disabled={saving}
              className="h-12 rounded-2xl bg-slate-100 text-sm font-black text-slate-600 active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
}) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-xs font-black text-slate-500">
          {label}
        </label>
      )}

      <input
        name={name}
        type={type}
        min={min}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-300 focus:border-blue-300 focus:bg-white"
      />
    </div>
  )
}

function normalizeEmployeeArray(payload) {
  if (!payload) return []

  if (Array.isArray(payload)) {
    return payload.filter(Boolean)
  }

  const result =
    payload.result ||
    payload.data ||
    payload.employees ||
    payload.users ||
    payload.items ||
    []

  if (Array.isArray(result)) {
    return result.filter(Boolean)
  }

  return []
}

export default BranchPage