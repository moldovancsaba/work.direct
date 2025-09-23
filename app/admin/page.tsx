import { redirect } from 'next/navigation'

// Admin root redirects to /admin/games (server-side)
export default function AdminPage() {
  redirect('/admin/games')
}
