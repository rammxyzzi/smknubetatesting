import { useEffect, useMemo, useState } from 'react'
import { supabase, todayJakarta } from './supabase.js'

const STATUSES = ['hadir', 'izin', 'sakit', 'alpha']
const monthStart = () => todayJakarta().slice(0, 8) + '01'

// PostgREST membatasi 1000 baris per request, jadi diambil bertahap.
async function fetchAll(build) {
  const out = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build().range(from, from + 999)
    if (error) throw error
    out.push(...data)
    if (data.length < 1000) return out
  }
}

/* ---------------- Rekap ---------------- */
function Rekap({ classes, students, isAdmin }) {
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(todayJakarta())
  const [classId, setClassId] = useState(isAdmin ? '' : classes[0]?.id ?? '')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      setLoading(true); setError('')
      try {
        setRecords(await fetchAll(() => supabase.from('attendance_records')
          .select('student_id, status, attendance_sessions!inner(attendance_date, class_id)')
          .gte('attendance_sessions.attendance_date', from)
          .lte('attendance_sessions.attendance_date', to)))
      } catch { setError('Gagal memuat data.') }
      setLoading(false)
    })()
  }, [from, to])

  const rows = useMemo(() => {
    const t = todayJakarta()
    return students.filter((s) => !classId || s.class_id === classId).map((s) => {
      const mine = records.filter((r) => r.student_id === s.id)
      const count = (st) => mine.filter((r) => r.status === st).length
      const today = mine.find((r) => r.attendance_sessions.attendance_date === t)
      return { ...s, hadir: count('hadir'), izin: count('izin'), sakit: count('sakit'), alpha: count('alpha'), today: today?.status }
    })
  }, [students, records, classId])

  const perClass = useMemo(() => classes.map((c) => ({
    ...c,
    siswa: students.filter((s) => s.class_id === c.id).length,
    hadir: records.filter((r) => r.status === 'hadir' && r.attendance_sessions.class_id === c.id).length,
  })), [classes, students, records])

  return (<>
    <div className="pt-filters">
      <label>Dari <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
      <label>Sampai <input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
      {(isAdmin || classes.length > 1) && (
        <label>Kelas
          <select value={classId} onChange={(e) => setClassId(e.target.value)}>
            {isAdmin && <option value="">Semua kelas</option>}
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      )}
    </div>
    {error && <div className="pt-error">{error}</div>}
    {loading ? <p>Memuat…</p> : (<>
      <div className="pt-grid">
        {perClass.map((c) => (
          <div className="pt-stat" key={c.id}>
            <small>{c.name}</small><strong>{c.hadir}</strong>
            <small>kehadiran · {c.siswa} siswa</small>
          </div>
        ))}
      </div>
      <div className="pt-table-wrap">
        <table className="pt-table">
          <thead><tr><th>Nama</th><th>NIS</th><th>Hadir</th><th>Izin</th><th>Sakit</th><th>Alpha</th><th>Hari ini</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.full_name}</td><td>{r.nis}</td><td>{r.hadir}</td><td>{r.izin}</td><td>{r.sakit}</td><td>{r.alpha}</td>
                <td>{r.today ?? '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="7">Belum ada data.</td></tr>}
          </tbody>
        </table>
      </div>
    </>)}
  </>)
}

/* ---------------- Koreksi status ---------------- */
function Koreksi({ classes, students }) {
  const [date, setDate] = useState(todayJakarta())
  const [classId, setClassId] = useState(classes[0]?.id ?? '')
  const [session, setSession] = useState(null)
  const [recs, setRecs] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!classId) { setLoading(false); return }
    (async () => {
      setLoading(true); setMsg('')
      const { data: sess } = await supabase.from('attendance_sessions')
        .select('id, is_open').eq('class_id', classId).eq('attendance_date', date).maybeSingle()
      setSession(sess)
      if (sess) {
        const { data } = await supabase.from('attendance_records').select('student_id, status').eq('session_id', sess.id)
        setRecs(Object.fromEntries((data ?? []).map((r) => [r.student_id, r.status])))
      } else setRecs({})
      setLoading(false)
    })()
  }, [classId, date])

  const change = async (studentId, value) => {
    setSaving(studentId); setMsg('')
    const { error } = await supabase.rpc('set_attendance_status', {
      p_session_id: session.id, p_student_id: studentId, p_status: value || null,
    })
    if (error) setMsg('Gagal menyimpan perubahan.')
    else setRecs((r) => { const n = { ...r }; if (value) n[studentId] = value; else delete n[studentId]; return n })
    setSaving('')
  }

  const list = students.filter((s) => s.class_id === classId)

  return (<>
    <div className="pt-filters">
      <label>Tanggal <input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      {classes.length > 1 && (
        <label>Kelas
          <select value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      )}
    </div>
    {msg && <div className="pt-error">{msg}</div>}
    {loading ? <p>Memuat…</p> : !session ? (
      <p className="pt-muted">Belum ada sesi absen untuk kelas dan tanggal ini. Minta admin membuka sesi dulu.</p>
    ) : (
      <div className="pt-table-wrap">
        <table className="pt-table">
          <thead><tr><th>Nama</th><th>Status</th></tr></thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id}>
                <td>{s.full_name}<br /><small className="pt-muted">{s.nis}</small></td>
                <td>
                  <select value={recs[s.id] ?? ''} disabled={saving === s.id} onChange={(e) => change(s.id, e.target.value)}>
                    <option value="">Belum ada</option>
                    {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan="2">Tidak ada siswa di kelas ini.</td></tr>}
          </tbody>
        </table>
      </div>
    )}
  </>)
}

/* ---------------- Sesi (khusus admin) ---------------- */
function Sesi({ classes, adminId }) {
  const [date, setDate] = useState(todayJakarta())
  const [sessions, setSessions] = useState({})
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('attendance_sessions').select('class_id, is_open').eq('attendance_date', date)
    setSessions(Object.fromEntries((data ?? []).map((s) => [s.class_id, s.is_open])))
    setLoading(false)
  }
  useEffect(() => { load() }, [date])

  const setOpen = async (classId, open) => {
    setMsg('')
    const { error } = await supabase.from('attendance_sessions').upsert(
      { class_id: classId, attendance_date: date, opened_by: adminId, is_open: open },
      { onConflict: 'class_id,attendance_date' })
    if (error) setMsg('Gagal mengubah sesi.')
    await load()
  }

  const openAll = async () => {
    setMsg('')
    const { error } = await supabase.from('attendance_sessions').upsert(
      classes.map((c) => ({ class_id: c.id, attendance_date: date, opened_by: adminId, is_open: true })),
      { onConflict: 'class_id,attendance_date', ignoreDuplicates: true })
    if (error) setMsg('Gagal membuka sesi.')
    await load()
  }

  return (<>
    <div className="pt-filters">
      <label>Tanggal <input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      <button className="pt-btn pt-btn-sm" onClick={openAll}>Buka semua kelas</button>
    </div>
    <p className="pt-muted">Siswa hanya bisa absen kalau sesi kelasnya dibuka di sini.</p>
    {msg && <div className="pt-error">{msg}</div>}
    {loading ? <p>Memuat…</p> : (
      <div className="pt-table-wrap">
        <table className="pt-table">
          <thead><tr><th>Kelas</th><th>Sesi</th><th></th></tr></thead>
          <tbody>
            {classes.map((c) => {
              const st = sessions[c.id]
              return (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{st === undefined ? 'Belum dibuat' : st ? 'Dibuka' : 'Ditutup'}</td>
                  <td>
                    {st ? <button className="pt-btn pt-btn-sm" onClick={() => setOpen(c.id, false)}>Tutup</button>
                        : <button className="pt-btn pt-btn-sm" onClick={() => setOpen(c.id, true)}>{st === false ? 'Buka lagi' : 'Buka'}</button>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )}
  </>)
}

/* ---------------- Shell ---------------- */
export default function AdminPanel({ profile, onLogout }) {
  const isAdmin = profile.role === 'admin'
  const [tab, setTab] = useState('rekap')
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  // RLS di Supabase membatasi wali kelas ke kelasnya sendiri.
  useEffect(() => {
    (async () => {
      try {
        const [c, s] = await Promise.all([
          supabase.from('classes').select('id, name').order('name'),
          fetchAll(() => supabase.from('students').select('id, full_name, nis, class_id').order('full_name')),
        ])
        setClasses(c.data ?? []); setStudents(s)
      } catch { setError('Gagal memuat data.') }
      setReady(true)
    })()
  }, [])

  const tabs = [['rekap', 'Rekap'], ['koreksi', 'Koreksi status'], ...(isAdmin ? [['sesi', 'Sesi absen']] : [])]

  return (
    <div className="pt-wide">
      <div className="pt-row">
        <div><h2>Panel {isAdmin ? 'Admin' : 'Wali Kelas'}</h2><p className="pt-muted">{profile.full_name}</p></div>
        <button className="pt-link" onClick={onLogout}>Keluar</button>
      </div>
      <div className="pt-tabs">
        {tabs.map(([k, label]) => (
          <button key={k} className={tab === k ? 'pt-tab active' : 'pt-tab'} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>
      {error && <div className="pt-error">{error}</div>}
      {!ready ? <p>Memuat…</p> : (<>
        {tab === 'rekap' && <Rekap classes={classes} students={students} isAdmin={isAdmin} />}
        {tab === 'koreksi' && <Koreksi classes={classes} students={students} />}
        {tab === 'sesi' && isAdmin && <Sesi classes={classes} adminId={profile.user_id} />}
      </>)}
    </div>
  )
}
