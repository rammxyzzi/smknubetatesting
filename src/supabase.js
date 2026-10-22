import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Siswa login pakai NIS -> diubah jadi email internal.
// Domain ini HARUS sama dengan EMAIL_DOMAIN di supabase/functions/create-students/index.ts
export const EMAIL_DOMAIN = 'smknughofarona.local'
export const toEmail = (id) => {
  const v = id.trim()
  return v.includes('@') ? v : `${v.toLowerCase()}@${EMAIL_DOMAIN}`
}

export const normRole = (r) => {
  const v = (r || '').toLowerCase()
  if (['siswa', 'student'].includes(v)) return 'siswa'
  if (['wali_kelas', 'wali', 'teacher', 'guru'].includes(v)) return 'wali_kelas'
  if (v === 'admin') return 'admin'
  return null
}

export const todayJakarta = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
