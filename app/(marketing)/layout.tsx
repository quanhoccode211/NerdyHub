import { AppShell } from '@/components/shell/app-shell'

/**
 * KHÔNG gọi `auth()` ở đây — đọc cookie sẽ ép mọi trang công khai sang render
 * động và mất ISR/SSG, đi ngược yêu cầu SEO của SPEC F7. Avatar tự lấy session
 * phía client (xem components/providers.tsx).
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
