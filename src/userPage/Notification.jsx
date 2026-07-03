import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Home,
  Inbox,
  Loader2,
  Send,
  Store,
  Wallet,
  XCircle,
} from 'lucide-react'

import API_URL from '../utils/api'
import useAuthStore from '../store/auth-store'

const APPROVAL_TAB = 'approval'
const BRANCH_TAB = 'branch'

function Notification() {
  const navigate = useNavigate()

  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  const [notifications, setNotifications] = useState([])
  const [activeTab, setActiveTab] = useState(APPROVAL_TAB)
  const [loading, setLoading] = useState(true)

  const role = String(user?.role || '').toUpperCase()
  const isAdminOrOwner = role === 'ADMIN' || role === 'OWNER'

  const isCreatedByMe = (item) => {
    return Number(item?.createdBy?.id) === Number(user?.id)
  }

  const isUnread = (item) => {
    if (!item) return false
    if (item.isRead === false) return true
    if (item.readAt === null) return true
    if (item.readAt === undefined && item.isRead !== true) return true

    return false
  }

  const notifyNotificationUpdated = () => {
    window.dispatchEvent(new Event('notifications-updated'))
  }

  const normalizeNotificationLink = (item) => {
    const link = item?.link || ''

    if (!link) {
      if (item?.entity === 'CalendarNote' || item?.entity === 'StoreHoliday') {
        return '/user/calendar'
      }

      return ''
    }

    if (link === '/calendar/user') return '/user/calendar'

    if (link.startsWith('/calendar/user?')) {
      return link.replace('/calendar/user', '/user/calendar')
    }

    return link
  }

  const isCalendarNoteNotification = (item) => {
    return item?.entity === 'CalendarNote'
  }

  const isStoreHolidayNotification = (item) => {
    return item?.entity === 'StoreHoliday'
  }

  const isRequestCanceled = (item) => {
    const type = String(item?.type || '').toUpperCase()

    return (
      type === 'REQUEST_CANCELED' ||
      type === 'REQUEST_CANCELLED' ||
      type === 'DAYOFF_CANCELED' ||
      type === 'DAYOFF_CANCELLED' ||
      type === 'DAY_OFF_CANCELED' ||
      type === 'DAY_OFF_CANCELLED' ||
      type === 'LEAVE_CANCELED' ||
      type === 'LEAVE_CANCELLED' ||
      (item?.entity === 'DayOff' &&
        (type.includes('DELETE') ||
          type.includes('DELETED') ||
          type.includes('CANCEL')))
    )
  }

  const isHolidayCanceled = (item) => {
    const type = String(item?.type || '').toUpperCase()

    return (
      type === 'HOLIDAY_DELETED' ||
      type === 'HOLIDAY_CANCELED' ||
      type === 'HOLIDAY_CANCELLED' ||
      (isStoreHolidayNotification(item) &&
        (type.includes('DELETE') ||
          type.includes('DELETED') ||
          type.includes('CANCEL') ||
          type === 'SYSTEM'))
    )
  }

  const isNoteCanceled = (item) => {
    const type = String(item?.type || '').toUpperCase()

    return (
      type === 'CALENDAR_NOTE_DELETED' ||
      type === 'CALENDAR_NOTE_CANCELED' ||
      type === 'CALENDAR_NOTE_CANCELLED' ||
      (isCalendarNoteNotification(item) &&
        (type.includes('DELETE') ||
          type.includes('DELETED') ||
          type.includes('CANCEL') ||
          type === 'SYSTEM'))
    )
  }

  const isApprovalNotification = (item) => {
    if (item.type === 'REQUEST_APPROVED') return true
    if (item.type === 'REQUEST_REJECTED') return true
    if (isRequestCanceled(item)) return true

    if (item.type === 'REQUEST_CREATED') {
      return isAdminOrOwner
    }

    return false
  }

  const isBranchNotification = (item) => {
    return (
      item.type === 'HOLIDAY_CREATED' ||
      item.type === 'HOLIDAY_DELETED' ||
      item.type === 'HOLIDAY_CANCELED' ||
      item.type === 'HOLIDAY_CANCELLED' ||
      item.type === 'CALENDAR_NOTE_CREATED' ||
      item.type === 'CALENDAR_NOTE_DELETED' ||
      item.type === 'CALENDAR_NOTE_CANCELED' ||
      item.type === 'CALENDAR_NOTE_CANCELLED' ||
      isCalendarNoteNotification(item) ||
      isStoreHolidayNotification(item)
    )
  }

  const approvalNotifications = useMemo(() => {
    return notifications.filter(isApprovalNotification)
  }, [notifications, isAdminOrOwner])

  const branchNotifications = useMemo(() => {
    return notifications.filter(isBranchNotification)
  }, [notifications])

  const currentNotifications =
    activeTab === APPROVAL_TAB ? approvalNotifications : branchNotifications

  const approvalUnreadCount = approvalNotifications.filter(isUnread).length
  const branchUnreadCount = branchNotifications.filter(isUnread).length

  useEffect(() => {
    if (token) {
      getNotifications()
    }
  }, [token])

  // เปิดแถบไหนอยู่ ให้ mark read เฉพาะแถบนั้นทันที
  useEffect(() => {
    if (!token || loading) return

    markTabAsSeen(activeTab)
  }, [token, loading, activeTab, approvalNotifications.length, branchNotifications.length])

  useEffect(() => {
    const handlePageHide = () => {
      markCurrentTabAsSeen()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        markCurrentTabAsSeen()
      }
    }

    window.addEventListener('pagehide', handlePageHide)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [activeTab, notifications])

  const getNotifications = async () => {
    try {
      setLoading(true)

      const res = await axios.get(`${API_URL}/user/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setNotifications(res.data.data || [])
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const getTabNotifications = (tab) => {
    return tab === APPROVAL_TAB ? approvalNotifications : branchNotifications
  }

  const markItemsAsRead = async (items) => {
    const unreadItems = items.filter((item) => item?.id && isUnread(item))

    if (unreadItems.length === 0) {
      notifyNotificationUpdated()
      return
    }

    const readAt = new Date().toISOString()
    const unreadIds = new Set(unreadItems.map((item) => item.id))

    setNotifications((prev) =>
      prev.map((item) =>
        unreadIds.has(item.id)
          ? {
              ...item,
              isRead: true,
              readAt,
            }
          : item
      )
    )

    notifyNotificationUpdated()

    try {
      await Promise.all(
        unreadItems.map((item) =>
          axios.patch(
            `${API_URL}/user/notifications/${item.id}/read`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      )

      notifyNotificationUpdated()
    } catch (error) {
      console.log(error)
      notifyNotificationUpdated()
    }
  }

  const markTabAsSeen = (tab) => {
    const tabNotifications = getTabNotifications(tab)
    markItemsAsRead(tabNotifications)
  }

  const markCurrentTabAsSeen = () => {
    markTabAsSeen(activeTab)
  }

  const handleTabChange = (nextTab) => {
    if (nextTab === activeTab) return

    markCurrentTabAsSeen()
    setActiveTab(nextTab)
  }

  const handleNavigate = (path) => {
    markCurrentTabAsSeen()
    navigate(path)
  }

  const handleNotificationClick = (item) => {
    const link = normalizeNotificationLink(item)

    if (link) {
      markCurrentTabAsSeen()
      navigate(link)
      return
    }

    markItemsAsRead([item])
  }

  const getNotificationDate = (date) => {
    if (!date) return '-'

    return new Intl.DateTimeFormat('th-TH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  const getIconBox = (item) => {
    if (item.type === 'REQUEST_APPROVED') {
      return {
        icon: CheckCircle2,
        boxClass: 'bg-emerald-50 text-emerald-600',
      }
    }

    if (item.type === 'REQUEST_REJECTED' || isRequestCanceled(item)) {
      return {
        icon: XCircle,
        boxClass: 'bg-red-50 text-red-500',
      }
    }

    if (item.type === 'REQUEST_CREATED') {
      if (item.entity === 'AdvanceSalary') {
        return {
          icon: Wallet,
          boxClass: 'bg-blue-50 text-blue-600',
        }
      }

      return {
        icon: Send,
        boxClass: 'bg-blue-50 text-blue-600',
      }
    }

    if (isHolidayCanceled(item)) {
      return {
        icon: XCircle,
        boxClass: 'bg-red-50 text-red-500',
      }
    }

    if (item.type === 'HOLIDAY_CREATED' || isStoreHolidayNotification(item)) {
      return {
        icon: CalendarDays,
        boxClass: 'bg-purple-50 text-purple-600',
      }
    }

    if (isNoteCanceled(item)) {
      return {
        icon: XCircle,
        boxClass: 'bg-red-50 text-red-500',
      }
    }

    if (
      item.type === 'CALENDAR_NOTE_CREATED' ||
      isCalendarNoteNotification(item)
    ) {
      return {
        icon: Store,
        boxClass: 'bg-amber-50 text-amber-600',
      }
    }

    return {
      icon: Bell,
      boxClass: 'bg-slate-100 text-slate-500',
    }
  }

  const getStatusChip = (item) => {
    if (item.type === 'REQUEST_APPROVED') {
      return {
        text: 'อนุมัติแล้ว',
        className: 'bg-emerald-50 text-emerald-600',
      }
    }

    if (item.type === 'REQUEST_REJECTED') {
      return {
        text: 'ปฏิเสธ',
        className: 'bg-red-50 text-red-500',
      }
    }

    if (isRequestCanceled(item)) {
      return {
        text:
          item.entity === 'AdvanceSalary' ? 'ยกเลิกเบิกเงิน' : 'ยกเลิกวันลา',
        className: 'bg-red-50 text-red-500',
      }
    }

    if (item.type === 'REQUEST_CREATED') {
      return {
        text: isCreatedByMe(item) ? 'ส่งแล้ว' : 'รออนุมัติ',
        className: 'bg-orange-50 text-orange-500',
      }
    }

    if (isHolidayCanceled(item)) {
      return {
        text: 'ยกเลิกวันหยุด',
        className: 'bg-red-50 text-red-500',
      }
    }

    if (item.type === 'HOLIDAY_CREATED' || isStoreHolidayNotification(item)) {
      return {
        text: 'วันหยุด',
        className: 'bg-purple-50 text-purple-600',
      }
    }

    if (isNoteCanceled(item)) {
      return {
        text: 'ยกเลิกโน้ต',
        className: 'bg-red-50 text-red-500',
      }
    }

    if (
      item.type === 'CALENDAR_NOTE_CREATED' ||
      isCalendarNoteNotification(item)
    ) {
      return {
        text: 'โน้ตสาขา',
        className: 'bg-amber-50 text-amber-600',
      }
    }

    return {
      text: 'แจ้งเตือน',
      className: 'bg-slate-100 text-slate-500',
    }
  }

  const getTitle = (item) => {
    if (item.type === 'REQUEST_CREATED') {
      if (isCreatedByMe(item)) {
        return item.entity === 'AdvanceSalary'
          ? 'ส่งคำขอเบิกเงินสำเร็จ'
          : 'ส่งคำขอลาสำเร็จ'
      }
      return item.entity === 'AdvanceSalary'
        ? 'มีคำขอเบิกเงินใหม่'
        : 'มีคำขอลาใหม่'
    }

    if (item.type === 'REQUEST_APPROVED') {
      return item.entity === 'AdvanceSalary'
        ? 'อนุมัติคำขอเบิกเงินแล้ว'
        : 'อนุมัติคำขอลาแล้ว'
    }

    if (item.type === 'REQUEST_REJECTED') {
      return item.entity === 'AdvanceSalary'
        ? 'ปฏิเสธคำขอเบิกเงิน'
        : 'ปฏิเสธคำขอลา'
    }

    if (isRequestCanceled(item)) {
      return item.entity === 'AdvanceSalary'
        ? 'ยกเลิกคำขอเบิกเงิน'
        : 'ยกเลิกวันลา'
    }

    if (isHolidayCanceled(item)) {
      return item.title || 'วันหยุดสาขาถูกยกเลิก'
    }

    if (item.type === 'HOLIDAY_CREATED' || isStoreHolidayNotification(item)) {
      return item.title || 'มีวันหยุดสาขาใหม่'
    }

    if (isNoteCanceled(item)) {
      return item.title || 'Note ในปฏิทินถูกยกเลิก'
    }

    if (
      item.type === 'CALENDAR_NOTE_CREATED' ||
      isCalendarNoteNotification(item)
    ) {
      return item.title || 'มีโน้ตใหม่จากสาขา'
    }

    return item.title || 'การแจ้งเตือน'
  }

  const getDescription = (item) => {
    if (item.message) return item.message

    if (item.type === 'REQUEST_CREATED') {
      if (isCreatedByMe(item)) {
        return 'ระบบได้ส่งคำขอของคุณไปยังผู้ดูแลแล้ว'
      }

      return 'มีคำขอใหม่รอให้คุณตรวจสอบ'
    }

    if (item.type === 'REQUEST_APPROVED') {
      return 'คำขอของคุณได้รับการอนุมัติแล้ว'
    }

    if (item.type === 'REQUEST_REJECTED') {
      return 'คำขอของคุณไม่ได้รับการอนุมัติ'
    }

    if (isRequestCanceled(item)) {
      return item.entity === 'AdvanceSalary'
        ? 'คำขอเบิกเงินถูกยกเลิกแล้ว'
        : 'คำขอลาถูกยกเลิกแล้ว'
    }

    if (isHolidayCanceled(item)) {
      return item.branch?.name
        ? `มีการยกเลิกวันหยุดสำหรับสาขา ${item.branch.name}`
        : 'มีการยกเลิกวันหยุดของสาขา'
    }

    if (item.type === 'HOLIDAY_CREATED' || isStoreHolidayNotification(item)) {
      return item.branch?.name
        ? `มีการกำหนดวันหยุดสำหรับสาขา ${item.branch.name}`
        : 'มีการกำหนดวันหยุดใหม่'
    }

    if (isNoteCanceled(item)) {
      return item.branch?.name
        ? `มีการยกเลิก Note จากสาขา ${item.branch.name}`
        : 'มีการยกเลิก Note ในปฏิทินของสาขา'
    }

    if (
      item.type === 'CALENDAR_NOTE_CREATED' ||
      isCalendarNoteNotification(item)
    ) {
      return item.branch?.name
        ? `มีโน้ตใหม่จากสาขา ${item.branch.name}`
        : 'มีโน้ตใหม่จากสาขา'
    }

    return ''
  }

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center rounded-[1.7rem] bg-white px-6 py-12 text-center shadow-[0_10px_28px_rgba(15,23,42,0.05)] lg:rounded-[1.2rem] lg:px-5 lg:py-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 lg:h-12 lg:w-12">
        <Inbox size={30} strokeWidth={2.5} className="lg:h-6 lg:w-6" />
      </div>

      <p className="mt-4 text-base font-black text-slate-900 lg:mt-3 lg:text-sm">
        ยังไม่มีการแจ้งเตือน
      </p>

      <p className="mt-1 text-sm font-semibold leading-6 text-slate-400 lg:text-xs lg:leading-5">
        ถ้ามีคำขออนุมัติ หรือประกาศจากสาขา ระบบจะแสดงที่หน้านี้
      </p>
    </div>
  )

  return (
    <div className="h-dvh overflow-hidden bg-[#F5F8FD] text-[#0F172A] lg:h-[calc(100dvh-78px)]">
      <div className="mx-auto flex h-full w-full max-w-md flex-col px-3.5 pt-5 lg:mx-0 lg:max-w-none lg:px-5 lg:pt-4 xl:px-6">
        <header className="relative flex min-h-[54px] shrink-0 items-center justify-center lg:min-h-[42px] lg:justify-start">
          <button
            type="button"
            onClick={() => handleNavigate('/user')}
            className="absolute left-0 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,0.06)] active:scale-95 lg:static lg:h-9 lg:w-9"
          >
            <ChevronLeft size={24} strokeWidth={3} className="lg:h-5 lg:w-5" />
          </button>

          <div className="px-14 text-center lg:px-3 lg:text-left">
            <h1 className="text-2xl font-black tracking-tight text-slate-950 lg:text-xl">
              การแจ้งเตือน
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-400 lg:mt-0.5 lg:text-[11px]">
              อัปเดตล่าสุดจากคำขอและสาขา
            </p>
          </div>
        </header>

        <section className="mt-5 grid shrink-0 grid-cols-2 gap-2 rounded-[1.7rem] bg-white p-1.5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] lg:mt-3 lg:rounded-[1.15rem] lg:p-1">
          <button
            type="button"
            onClick={() => handleTabChange(APPROVAL_TAB)}
            className={`relative flex h-14 items-center justify-center gap-2 rounded-[1.35rem] text-sm font-black transition lg:h-10 lg:rounded-xl lg:text-xs ${
              activeTab === APPROVAL_TAB
                ? 'bg-blue-600 text-white shadow-[0_10px_20px_rgba(37,99,235,0.25)]'
                : 'text-slate-500'
            }`}
          >
            <ClipboardCheck size={20} strokeWidth={2.6} className="lg:h-4 lg:w-4" />
            การอนุมัติ

            {approvalUnreadCount > 0 && (
              <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-red-500 lg:right-2.5 lg:top-2.5 lg:h-2 lg:w-2" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange(BRANCH_TAB)}
            className={`relative flex h-14 items-center justify-center gap-2 rounded-[1.35rem] text-sm font-black transition lg:h-10 lg:rounded-xl lg:text-xs ${
              activeTab === BRANCH_TAB
                ? 'bg-blue-600 text-white shadow-[0_10px_20px_rgba(37,99,235,0.25)]'
                : 'text-slate-500'
            }`}
          >
            <Store size={20} strokeWidth={2.6} className="lg:h-4 lg:w-4" />
            จากสาขา

            {branchUnreadCount > 0 && (
              <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-red-500 lg:right-2.5 lg:top-2.5 lg:h-2 lg:w-2" />
            )}
          </button>
        </section>

        <div className="mt-5 min-h-0 flex-1 overflow-y-auto pb-36 lg:mt-3 lg:pb-5">
          {loading ? (
            <div className="flex h-72 items-center justify-center lg:h-52">
              <Loader2 className="animate-spin text-blue-600" size={34} />
            </div>
          ) : currentNotifications.length === 0 ? (
            <EmptyState />
          ) : (
            <section className="overflow-hidden rounded-[1.7rem] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] lg:rounded-[1.15rem]">
              {currentNotifications.map((item, index) => {
                const { icon: Icon, boxClass } = getIconBox(item)
                const chip = getStatusChip(item)

                return (
                  <React.Fragment key={item.id}>
                    {index > 0 && (
                      <div className="mx-4 h-px bg-slate-100 lg:mx-3" />
                    )}

                    <button
                      type="button"
                      onClick={() => handleNotificationClick(item)}
                      className="relative flex w-full gap-3 p-4 text-left active:bg-blue-50 lg:gap-2.5 lg:p-3"
                    >
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full lg:h-10 lg:w-10 ${boxClass}`}
                      >
                        <Icon
                          size={28}
                          strokeWidth={2.5}
                          className="lg:h-5 lg:w-5"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-1 text-base font-black text-slate-950 lg:text-sm">
                            {getTitle(item)}
                          </p>

                          {isUnread(item) && (
                            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 lg:mt-1 lg:h-2 lg:w-2" />
                          )}
                        </div>

                        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-500 lg:mt-0.5 lg:text-xs lg:leading-5">
                          {getDescription(item)}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-2 lg:mt-2">
                          <div className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-slate-400 lg:text-[10px]">
                            <Clock3
                              size={15}
                              strokeWidth={2.4}
                              className="lg:h-3.5 lg:w-3.5"
                            />
                            <span className="truncate">
                              {getNotificationDate(
                                item.notificationCreatedAt || item.createdAt
                              )}
                            </span>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-black lg:px-2 lg:py-0.5 lg:text-[10px] ${chip.className}`}
                          >
                            {chip.text}
                          </span>
                        </div>
                      </div>

                      {normalizeNotificationLink(item) && (
                        <ChevronRight
                          size={20}
                          strokeWidth={3}
                          className="mt-4 shrink-0 text-slate-300 lg:mt-3 lg:h-4 lg:w-4"
                        />
                      )}
                    </button>
                  </React.Fragment>
                )
              })}
            </section>
          )}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-transparent px-3.5 pb-4 md:hidden">
        <div className="mx-auto grid h-[78px] max-w-md grid-cols-5 rounded-[1.7rem] bg-white px-2 shadow-[0_-10px_35px_rgba(15,23,42,0.08)]">
          <BottomNavItem
            icon={Home}
            label="หน้าหลัก"
            onClick={() => handleNavigate('/user')}
          />

          <BottomNavItem
            icon={CalendarDays}
            label="ตารางงาน"
            onClick={() => handleNavigate('/user/calendar')}
          />

          <BottomNavItem
            icon={Wallet}
            label="คำขอ"
            onClick={() => handleNavigate('/user/request')}
          />

          <BottomNavItem
            icon={Clock3}
            label="ประวัติ"
            onClick={() => handleNavigate('/user/history')}
          />

          <BottomNavItem icon={Bell} label="แจ้งเตือน" active />
        </div>
      </nav>
    </div>
  )
}

function BottomNavItem({ icon: Icon, label, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 text-xs font-black ${
        active ? 'text-blue-600' : 'text-slate-400'
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
          active ? 'bg-blue-600 text-white' : 'bg-transparent'
        }`}
      >
        <Icon size={23} strokeWidth={2.5} />
      </div>
      <span>{label}</span>
    </button>
  )
}

export default Notification