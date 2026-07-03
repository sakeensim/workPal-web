import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithPopup } from 'firebase/auth'
import {
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Wallet,
} from 'lucide-react'

import useAuthStore from '../store/auth-store'
import { createAlert } from '../utils/createAlert'
import { auth, googleProvider } from '../../firebase'
import workPalIcon from '/icons/logo.png'

function Login() {
  const navigate = useNavigate()
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle)

  const [loading, setLoading] = useState(false)

  const roleDirect = (role) => {
    if (role === 'USER') {
      navigate('/user')
      return
    }

    if (role === 'ADMIN' || role === 'OWNER') {
      navigate('/admin')
      return
    }

    navigate('/')
  }

  const handleGoogleLogin = async () => {
    if (loading) return

    try {
      setLoading(true)

      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()
      const res = await loginWithGoogle(idToken)

      if (res.success) {
        roleDirect(res.role)
        createAlert('success', 'เข้าสู่ระบบสำเร็จ')
      } else {
        createAlert('error', res.message || 'เข้าสู่ระบบไม่สำเร็จ')
      }
    } catch (error) {
      console.log(error)
      createAlert('error', 'Google Login Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#F5F8FD] text-[#0F172A]">
      <div className="absolute -left-24 top-[-120px] h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="absolute -right-28 bottom-[-140px] h-96 w-96 rounded-full bg-blue-300/30 blur-3xl" />

      <main className="relative mx-auto flex min-h-dvh w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_440px]">
          <section className="hidden lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-xs font-black text-blue-600 shadow-[0_10px_26px_rgba(15,23,42,0.05)] backdrop-blur-xl">
              <Sparkles size={15} strokeWidth={2.7} />
              WorkPal Employee System
            </div>

            <h1 className="mt-5 max-w-2xl text-[56px] font-black leading-[1.02] tracking-tight text-slate-950">
              จัดการเวลางาน
              <br />
              คำขอ และทีมของคุณ
              <br />
              ให้จบในที่เดียว
            </h1>

            <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-slate-500">
              ระบบสำหรับพนักงานและผู้ดูแลร้าน ใช้เช็กอิน เช็กเอาท์ ขอวันลา
              ขอเบิกเงิน และติดตามข้อมูลการทำงานได้ง่ายขึ้น
            </p>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <FeatureCard
                icon={<Clock3 size={23} strokeWidth={2.7} />}
                title="Time"
                subtitle="เช็กอิน / เช็กเอาท์"
                color="blue"
              />

              <FeatureCard
                icon={<CalendarCheck2 size={23} strokeWidth={2.7} />}
                title="Request"
                subtitle="ลา / เบิกเงิน"
                color="green"
              />

              <FeatureCard
                icon={<UsersRound size={23} strokeWidth={2.7} />}
                title="Team"
                subtitle="อนุมัติและจัดการ"
                color="orange"
              />
            </div>
          </section>

          <section className="mx-auto w-full max-w-md">
            <div className="mb-6 text-center lg:hidden">
              <div className="mx-auto flex justify-center">
                <LogoMark size="mobile" />
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                WorkPal
              </h1>

              <p className="mt-1 text-sm font-bold text-slate-400">
                ระบบลงเวลาและจัดการคำขอพนักงาน
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-6 lg:rounded-[2.1rem] lg:p-7">
              <div className="hidden lg:flex lg:items-center lg:gap-3">
                <LogoMark />

                <div>
                  <p className="text-2xl font-black tracking-tight text-slate-950">
                    WorkPal
                  </p>
                  <p className="text-xs font-bold text-slate-400">
                    Attendance & Request
                  </p>
                </div>
              </div>

              <div className="mt-2 text-center lg:mt-8 lg:text-left">
                <p className="text-sm font-black text-blue-600">
                  ยินดีต้อนรับกลับ
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  เข้าสู่ระบบ
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
                  ใช้บัญชี Google ที่ได้รับอนุญาตจากระบบเท่านั้น
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-800 shadow-[0_10px_26px_rgba(15,23,42,0.07)] transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <Loader2
                    className="animate-spin"
                    size={21}
                    strokeWidth={2.7}
                  />
                ) : (
                  <GoogleIcon />
                )}

                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}
              </button>

              <div className="mt-5 rounded-[1.35rem] bg-blue-50 p-4">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600">
                    <ShieldCheck size={21} strokeWidth={2.7} />
                  </div>

                  <div>
                    <p className="text-sm font-black text-slate-950">
                      Secure Access
                    </p>

                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                      เฉพาะอีเมลที่แอดมินเพิ่มไว้ในระบบเท่านั้น
                      จึงจะสามารถเข้าสู่ระบบได้
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 lg:hidden">
                <MiniFeature icon={<Clock3 size={17} />} label="เวลา" />
                <MiniFeature icon={<Wallet size={17} />} label="คำขอ" />
                <MiniFeature icon={<CheckCircle2 size={17} />} label="อนุมัติ" />
              </div>
            </div>

            <p className="mt-5 text-center text-xs font-bold text-slate-400">
              WorkPal v1.0 · Employee Management System
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}

function LogoMark({ size = 'desktop' }) {
  const boxSize = size === 'mobile' ? 'h-[92px] w-[92px]' : 'h-[72px] w-[72px]'
  const imageScale = size === 'mobile' ? 'scale-[2.35]' : 'scale-[2.25]'

  return (
    <div
      className={`${boxSize} shrink-0 overflow-hidden rounded-[1.25rem]`}
    >
      <img
        src={workPalIcon}
        alt="WorkPal logo"
        className={`h-full w-full object-contain ${imageScale}`}
      />
    </div>
  )
}

function FeatureCard({ icon, title, subtitle, color }) {
  const style = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-500',
  }[color]

  return (
    <div className="rounded-[1.35rem] border border-white/80 bg-white/80 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${style}`}
      >
        {icon}
      </div>

      <p className="mt-4 text-lg font-black text-slate-950">{title}</p>
      <p className="mt-1 text-xs font-bold text-slate-400">{subtitle}</p>
    </div>
  )
}

function MiniFeature({ icon, label }) {
  return (
    <div className="rounded-2xl bg-[#F5F8FD] px-2 py-3 text-center">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600">
        {icon}
      </div>

      <p className="mt-1.5 text-[11px] font-black text-slate-500">{label}</p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}

export default Login