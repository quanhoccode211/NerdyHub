'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { auth, signOut } from '@/auth'
import { setConsent } from '@/lib/auth/consent'
import {
  cancelAccountDeletion,
  requestAccountDeletion,
} from '@/lib/auth/data-rights'
import { CONSENT_PURPOSES, type ConsentPurpose } from '@/lib/enums'

export type ActionResult = { ok: boolean; message?: string }

export async function toggleConsentAction(
  purpose: string,
  granted: boolean,
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Chưa đăng nhập' }

  if (!(CONSENT_PURPOSES as readonly string[]).includes(purpose)) {
    return { ok: false, message: 'Mục đích không hợp lệ' }
  }

  const result = await setConsent(session.user.id, purpose as ConsentPurpose, granted)
  if (!result.ok) return { ok: false, message: result.reason }

  revalidatePath('/cai-dat/du-lieu')
  return { ok: true }
}

export async function requestDeletionAction(): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Chưa đăng nhập' }

  const { purgeAfter } = await requestAccountDeletion(session.user.id)
  // Đăng xuất ngay: tài khoản đã ở trạng thái chờ xoá, không nên tiếp tục dùng
  await signOut({ redirect: false })
  redirect(`/?xoa-tai-khoan=${encodeURIComponent(purgeAfter.toISOString())}`)
}

export async function cancelDeletionAction(): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Chưa đăng nhập' }

  await cancelAccountDeletion(session.user.id)
  revalidatePath('/cai-dat/du-lieu')
  return { ok: true }
}
