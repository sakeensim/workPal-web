import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Camera,
  Mail,
  Phone,
  ShieldAlert,
  UserRound,
  PencilLine,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import FormUploadImage from '../form/FormUploadImage'
import useAuthStore from '../store/auth-store'
import { createAlert } from '../utils/createAlert'
import API_URL from '../utils/api'

function Profile() {
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

  const [image, setImage] = useState('')
  const [profile, setProfile] = useState({})
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, setValue, getValues, reset } = useForm({
    defaultValues: {
      image: '',
      firstname: '',
      lastname: '',
      phone: '',
      emergencyContact: '',
    },
  })

  useEffect(() => {
    if (token) getProfile()
  }, [token])

  useEffect(() => {
    resetForm()
  }, [profile])

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

  const resetForm = () => {
    reset({
      image: '',
      firstname: profile?.firstname || '',
      lastname: profile?.lastname || '',
      phone: profile?.phone || '',
      emergencyContact: profile?.emergencyContact || '',
    })
  }

  const getProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/myProfile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setProfile(res.data.result || res.data.data || res.data || {})
    } catch (error) {
      console.log(error)

      if (
        error.response?.status === 401 ||
        error.response?.status === 403 ||
        error.response?.status === 404
      ) {
        clearLocalAuth()
      }
    }
  }

  const updateProfile = async (payload, successMessage) => {
    const employeeId = profile?.id || user?.id

    if (!employeeId) {
      createAlert('error', 'ไม่พบข้อมูลผู้ใช้งาน')
      return
    }

    try {
      setSaving(true)

      await axios.patch(`${API_URL}/user/update-profile/${employeeId}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      await getProfile()

      setImage('')
      setEditMode(false)

      createAlert('success', successMessage || 'อัปเดตโปรไฟล์สำเร็จ')
    } catch (error) {
      console.log(error)

      createAlert(
        'error',
        error.response?.data?.message || 'อัปเดตโปรไฟล์ไม่สำเร็จ'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleSaveImage = async () => {
    const uploadedImage = getValues('image') || image

    if (!uploadedImage) {
      createAlert('error', 'กรุณาเลือกรูปภาพก่อน')
      return
    }

    await updateProfile(
      {
        image: uploadedImage,
      },
      'อัปเดตรูปโปรไฟล์สำเร็จ'
    )
  }

  const handleSubmitProfile = async (value) => {
    const uploadedImage = getValues('image') || image

    const payload = {
      firstname: value.firstname,
      lastname: value.lastname,
      phone: value.phone,
      emergencyContact: value.emergencyContact,
    }

    if (uploadedImage) {
      payload.image = uploadedImage
    }

    await updateProfile(payload, 'แก้ไขโปรไฟล์สำเร็จ')
  }

  const handleOpenEdit = () => {
    resetForm()
    setImage('')
    setEditMode(true)
  }

  const handleBack = () => {
    if (editMode) {
      setEditMode(false)
      setImage('')
      resetForm()
      return
    }

    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/user/other')
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
    user?.firstname ||
    'ผู้ใช้งาน'

  const positionLabel =
    safePosition?.name || profile?.role || user?.role || 'Employee'

  if (editMode) {
    return (
      <div className="min-h-dvh bg-[#F5F8FD] px-3.5 pb-32 pt-4 text-[#0F172A] lg:px-6 lg:pb-10 lg:pt-6">
        <div className="mx-auto w-full max-w-md lg:max-w-3xl xl:max-w-4xl">
          <header className="relative flex h-11 items-center justify-center">
            <button
              type="button"
              onClick={handleBack}
              className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,0.06)] active:scale-95"
            >
              <ArrowLeft size={21} strokeWidth={2.8} />
            </button>

            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              แก้ไขโปรไฟล์
            </h1>
          </header>

          <form onSubmit={handleSubmit(handleSubmitProfile)} className="mt-5">
            <input type="hidden" {...register('image')} />

            <section className="flex flex-col items-center">
              <ProfileImage
                image={image}
                profileImage={profile?.profileImage}
                setValue={setValue}
                setImage={setImage}
              />

              <h2 className="mt-4 max-w-full truncate text-2xl font-black text-slate-950">
                {fullName}
              </h2>

              <p className="mt-1 max-w-full truncate text-sm font-semibold text-slate-500">
                {positionLabel}
              </p>
            </section>

            <section className="mt-6 overflow-hidden rounded-[1.15rem] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] lg:rounded-[1.35rem]">
              <div className="grid gap-x-4 px-4 py-4 lg:grid-cols-2 lg:px-6 lg:py-5">
                <EditInput
                  label="ชื่อ"
                  placeholder="กรอกชื่อ"
                  register={register('firstname')}
                />

                <EditInput
                  label="นามสกุล"
                  placeholder="กรอกนามสกุล"
                  register={register('lastname')}
                />

                <EditInput
                  label="เบอร์โทร"
                  type="tel"
                  placeholder="กรอกเบอร์โทร"
                  register={register('phone')}
                />

                <div className="mb-4 lg:col-span-2">
                  <p className="mb-1.5 text-sm font-black text-slate-950">
                    อีเมล
                  </p>

                  <input
                    disabled
                    type="email"
                    value={profile?.email || user?.email || ''}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-bold text-slate-400 outline-none"
                  />
                </div>

                <EditInput
                  label="เบอร์ติดต่อฉุกเฉิน"
                  type="tel"
                  placeholder="กรอกเบอร์ติดต่อฉุกเฉิน"
                  register={register('emergencyContact')}
                />
              </div>
            </section>

            <button
              type="submit"
              disabled={saving}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#F5F8FD] px-3.5 pb-32 pt-4 text-[#0F172A] lg:px-6 lg:pb-10 lg:pt-6">
      <div className="mx-auto w-full max-w-md lg:max-w-3xl xl:max-w-4xl">
        <header className="relative flex h-11 items-center justify-center">
          <button
            type="button"
            onClick={handleBack}
            className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,0.06)] active:scale-95"
          >
            <ArrowLeft size={21} strokeWidth={2.8} />
          </button>

          <h1 className="text-2xl font-black tracking-tight text-slate-950">
            โปรไฟล์
          </h1>
        </header>

        <form onSubmit={(e) => e.preventDefault()} className="mt-5">
          <input type="hidden" {...register('image')} />

          <section className="flex flex-col items-center">
            <ProfileImage
              image={image}
              profileImage={profile?.profileImage}
              setValue={setValue}
              setImage={setImage}
            />

            {image && (
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveImage}
                className="mt-4 h-10 rounded-full bg-blue-600 px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] active:scale-95 disabled:opacity-60"
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึกรูปภาพ'}
              </button>
            )}

            <h2 className="mt-4 max-w-full truncate text-2xl font-black text-slate-950">
              {fullName}
            </h2>

            <p className="mt-1 max-w-full truncate text-sm font-semibold text-slate-500">
              {positionLabel}
            </p>
          </section>

          <section className="mt-6 overflow-hidden rounded-[1.15rem] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] lg:rounded-[1.35rem]">
            <div className="flex items-center justify-between px-4 pb-1 pt-4 lg:px-6 lg:pt-5">
              <div>
                <h2 className="text-base font-black text-slate-950">
                  ข้อมูลโปรไฟล์
                </h2>

                <p className="mt-0.5 text-xs font-semibold text-slate-400">
                  ข้อมูลบัญชีผู้ใช้งานของคุณ
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenEdit}
                className="flex items-center gap-1.5 text-sm font-black text-blue-600 active:scale-95"
              >
                <PencilLine size={15} strokeWidth={2.8} />
                แก้ไข
              </button>
            </div>

            <div className="px-4 pb-2 pt-1 lg:px-6 lg:pb-4">
              <InfoRow
                label="ชื่อ"
                value={profile?.firstname || '-'}
                icon={<UserRound size={20} strokeWidth={2.5} />}
                color="blue"
              />

              <Divider />

              <InfoRow
                label="นามสกุล"
                value={profile?.lastname || '-'}
                icon={<UserRound size={20} strokeWidth={2.5} />}
                color="blue"
              />

              <Divider />

              <InfoRow
                label="เบอร์โทร"
                value={profile?.phone || '-'}
                icon={<Phone size={20} strokeWidth={2.5} />}
                color="blue"
              />

              <Divider />

              <InfoRow
                label="อีเมล"
                value={profile?.email || user?.email || '-'}
                icon={<Mail size={20} strokeWidth={2.5} />}
                color="slate"
              />

              <Divider />

              <InfoRow
                label="เบอร์ติดต่อฉุกเฉิน"
                value={profile?.emergencyContact || '-'}
                icon={<ShieldAlert size={20} strokeWidth={2.5} />}
                color="blue"
              />
            </div>
          </section>

          <section className="mt-4 overflow-hidden rounded-[1.15rem] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] lg:rounded-[1.35rem]">
            <div className="px-4 py-2 lg:px-6 lg:py-3">
              <InfoRow
                label="ตำแหน่ง"
                value={safePosition?.name || '-'}
                icon={<BriefcaseBusiness size={20} strokeWidth={2.5} />}
                color="slate"
              />

              <Divider />

              <InfoRow
                label="สาขา"
                value={safeBranch?.name || '-'}
                icon={<Building2 size={20} strokeWidth={2.5} />}
                color="slate"
              />
            </div>
          </section>

          {profile?.branchId && !safeBranch && (
            <p className="mt-3 rounded-2xl bg-orange-50 px-3 py-2 text-xs font-bold leading-5 text-orange-600">
              สาขาของบัญชีนี้ถูกปิดใช้งานหรือถูกลบแล้ว กรุณาติดต่อผู้ดูแลระบบ
            </p>
          )}

          {profile?.positionId && !safePosition && (
            <p className="mt-3 rounded-2xl bg-orange-50 px-3 py-2 text-xs font-bold leading-5 text-orange-600">
              ตำแหน่งของบัญชีนี้ไม่ตรงกับสาขา หรือถูกปิดใช้งานแล้ว กรุณาติดต่อผู้ดูแลระบบ
            </p>
          )}

          {!profile?.branchId && (
            <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-500">
              บัญชีนี้ยังไม่ได้ถูกกำหนดสาขา
            </p>
          )}

          {!profile?.positionId && (
            <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-500">
              บัญชีนี้ยังไม่ได้ถูกกำหนดตำแหน่ง
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

function ProfileImage({ image, profileImage, setValue, setImage }) {
  return (
    <div className="relative">
      <div className="h-[118px] w-[118px] overflow-hidden rounded-full bg-blue-50 shadow-[0_12px_30px_rgba(37,99,235,0.12)] ring-4 ring-white">
        {image || profileImage ? (
          <img
            src={image || profileImage}
            alt="profile"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-blue-600">
            <UserRound size={50} strokeWidth={2.5} />
          </div>
        )}
      </div>

      <div className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-900 shadow-[0_8px_22px_rgba(15,23,42,0.18)] ring-2 ring-[#F5F8FD]">
        <Camera size={17} strokeWidth={2.8} />

        <div className="absolute inset-0 overflow-hidden rounded-full opacity-0 [&_*]:h-full [&_*]:w-full [&_*]:cursor-pointer">
          <FormUploadImage setValue={setValue} setImage={setImage} />
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, icon, color = 'blue' }) {
  const iconClass =
    color === 'blue'
      ? 'bg-blue-50 text-blue-600'
      : 'bg-slate-50 text-slate-500'

  return (
    <div className="flex items-center gap-3 py-3 lg:gap-4 lg:py-3.5">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-400">{label}</p>

        <p className="mt-0.5 truncate text-[15px] font-black text-slate-950">
          {value}
        </p>
      </div>
    </div>
  )
}

function EditInput({ label, register, placeholder, type = 'text' }) {
  return (
    <div className="mb-4">
      <p className="mb-1.5 text-sm font-black text-slate-950">{label}</p>

      <input
        type={type}
        placeholder={placeholder}
        {...register}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-300 focus:border-blue-500"
      />
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-slate-100" />
}

export default Profile