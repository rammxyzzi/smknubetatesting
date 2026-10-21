import { useEffect, useState } from 'react'
import { supabase, toEmail, normRole } from './supabase.js'
import StudentAttendance from './StudentAttendance.jsx'
import AdminPanel from './AdminPanel.jsx'
import './portal.css'

function Login({ onBack }) {
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email: toEmail(id), password: pw })
    if (error) setErr('NIS/email atau password salah.')
    setBusy(false)
  }

  return (
    <div className="pt-center">
      <form className="pt-card" onSubmit={submit}>
        <img className="pt-logo" src="/logo.png" alt="Logo SMK NU Ghofarona Pusakajaya" />
        <h2 style={{ textAlign: 'center', margin: 0 }}>Masuk</h2>
        <p className="pt-muted" style={{ textAlign: 'center' }}>SMK NU Ghofarona Pusakajaya</p>
        <input placeholder="NIS atau email" value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" required />
        <input type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required />
        {err && <div className="pt-error">{err}</div>}
        <button className="pt-btn" disabled={busy}>{busy ? 'Memproses…' : 'Masuk'}</button>
        <button type="button" className="pt-link" onClick={onBack}>← Kembali ke beranda</button>
      </form>
    </div>
  )
}

export default function Portal({ onBack }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) { setProfile(null); setLoading(false) }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    setLoading(true)
    ;(async () => {
      const { data: p } = await supabase.from('profiles')
        .select('user_id, full_name, role').eq('user_id', session.user.id).maybeSingle()
      const role = normRole(p?.role)
      if (!p || !role) { setProfile(null); setLoading(false); return }
      let student = null
      if (role === 'siswa') {
        const { data: s } = await supabase.from('students')
          .select('id, nis, class_id, classes(name)').eq('profile_id', session.user.id).maybeSingle()
        student = s
      }
      setProfile({ ...p, role, student })
      setLoading(false)
    })()
  }, [session?.user?.id])

  const logout = () => supabase.auth.signOut()

  if (loading) return <div className="pt-center"><p>Memuat…</p></div>
  if (!session) return <Login onBack={onBack} />
  if (!profile) return (
    <div className="pt-center"><div className="pt-card">
      <p>Akun belum terdaftar di data sekolah atau role belum diatur. Hubungi admin.</p>
      <button className="pt-btn" onClick={logout}>Keluar</button>
    </div></div>
  )

  // Role ditentukan dari database, bukan dari pilihan user.
  return profile.role === 'siswa'
    ? <StudentAttendance profile={profile} onLogout={logout} />
    : <AdminPanel profile={profile} onLogout={logout} />
}
