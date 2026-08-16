'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { setConsent } from '@/lib/auth/consent'
import { disconnect } from '@/lib/calendar/google'

/**
 * Ngắt kết nối Google Calendar.
 *
 * Rút lại đồng ý phải kéo theo XOÁ dữ liệu đã thu thập vì mục đích đó — không
 * chỉ tắt một cờ. `disconnect` thu hồi token ở phía Google rồi xoá hẳn bản ghi
 * CalendarConnection, nên sau thao tác này không còn gì để xoá nữa.
 */
export async function disconnectCalendarAction() {
  const session = await auth()
  if (!session?.user?.id) return { ok: false as const }

  await disconnect(session.user.id)
  await setConsent(session.user.id, 'CALENDAR_ACCESS', false)

  revalidatePath('/lich-on')
  return { ok: true as const }
}
