import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Siswa login pakai NIS -> diubah jadi email internal.
// Kalau akun siswa kamu dibuat dengan email lain, ubah domain di sini.
export const toEmail = (id) => (id.includes('@') ? id.trim() : `${id.trim()}@smkyapimu`)

export const normRole = (r) => {
  const v = (r || '').toLowerCase()
  if (['siswa', 'student'].includes(v)) return 'siswa'
  if (['wali_kelas', 'wali', 'teacher', 'guru'].includes(v)) return 'wali_kelas'
  if (v === 'admin') return 'admin'
  return null
}

export const todayJakarta = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
