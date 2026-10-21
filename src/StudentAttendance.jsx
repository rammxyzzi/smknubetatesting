import { useEffect, useRef, useState } from 'react'
import { supabase, todayJakarta } from './supabase.js'
import { loadFaceApi, getDescriptor, average } from './face.js'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const REASONS = {
  no_match: 'Wajah tidak cocok dengan data terdaftar. Coba lagi.',
  no_face: 'Wajah belum terdaftar.',
  already: 'Kamu sudah absen hari ini.',
  marked: 'Kehadiranmu hari ini sudah dicatat oleh guru (izin/sakit/alpha). Hubungi wali kelas jika keliru.',
  no_session: 'Sesi absen kelasmu belum dibuka admin. Coba lagi nanti.',
  closed: 'Sesi absen kelasmu sudah ditutup.',
  not_student: 'Akun ini tidak terhubung ke data siswa. Hubungi admin.',
  bad_input: 'Data wajah tidak valid. Coba lagi.',
}

function Camera({ videoRef }) {
  useEffect(() => {
    let stream
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then((s) => { stream = s; if (videoRef.current) videoRef.current.srcObject = s })
      .catch(() => {})
    return () => stream?.getTracks().forEach((t) => t.stop())
  }, [])
  return <video ref={videoRef} className="pt-video" autoPlay playsInline muted />
}

export default function StudentAttendance({ profile, onLogout }) {
  const student = profile.student
  const [registered, setRegistered] = useState(undefined) // undefined = memuat
  const [doneToday, setDoneToday] = useState(false)
  const [todayStatus, setTodayStatus] = useState(null)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const videoRef = useRef(null)

  const load = async () => {
    if (!student) { setRegistered(false); return }
    const [{ data: reg }, { data: rec }] = await Promise.all([
      supabase.rpc('face_registered'),
      supabase.from('attendance_records')
        .select('id, status, attendance_sessions!inner(attendance_date)')
        .eq('student_id', student.id)
        .eq('attendance_sessions.attendance_date', todayJakarta())
        .limit(1),
    ])
    setRegistered(!!reg)
    setDoneToday((rec?.length ?? 0) > 0)
    setTodayStatus(rec?.[0]?.status ?? null)
  }
  useEffect(() => { load(); loadFaceApi() }, [])

  const register = async () => {
    setBusy(true); setMsg('Tahan posisi wajah, mengambil 3 sampel…')
    try {
      const samples = []
      for (let i = 0; i < 3; i++) {
        const d = await getDescriptor(videoRef.current)
        if (!d) { setMsg('Wajah tidak terdeteksi. Pastikan cahaya cukup dan hanya ada satu wajah.'); setBusy(false); return }
        samples.push(d); await sleep(600)
      }
      const { error } = await supabase.rpc('register_face', { p_descriptor: average(samples) })
      if (error) throw error
      setMsg('Wajah berhasil didaftarkan. Sekarang kamu bisa absen.')
      await load()
    } catch { setMsg('Gagal menyimpan data wajah. Coba lagi.') }
    setBusy(false)
  }

  const scan = async () => {
    setBusy(true); setMsg('Memindai wajah…')
    try {
      const d = await getDescriptor(videoRef.current)
      if (!d) { setMsg('Wajah tidak terdeteksi. Coba lagi.'); setBusy(false); return }
      const { data, error } = await supabase.rpc('submit_attendance', { p_descriptor: d })
      if (error) throw error
      setMsg(data.ok ? 'Absensi berhasil dicatat. ✓' : REASONS[data.reason] ?? 'Absensi gagal.')
      await load()
    } catch { setMsg('Gagal mengirim absensi. Coba lagi.') }
    setBusy(false)
  }

  return (
    <div className="pt-center">
      <div className="pt-card">
        <div className="pt-row"><b>{profile.full_name}</b><button className="pt-link" onClick={onLogout}>Keluar</button></div>
        <p className="pt-muted">Kelas {student?.classes?.name ?? '-'}{student?.nis ? ` · NIS ${student.nis}` : ''}</p>

        {registered === undefined && <p>Memuat…</p>}

        {registered === false && student && (<>
          <h3>Daftarkan wajah</h3>
          <p className="pt-muted">Kamu belum terdaftar. Daftarkan wajah sekali saja sebelum absen.</p>
          <Camera videoRef={videoRef} />
          <button className="pt-btn" onClick={register} disabled={busy}>Daftarkan wajah</button>
        </>)}

        {registered === false && !student && <div className="pt-error">Akun ini belum terhubung ke data siswa. Hubungi admin.</div>}

        {registered && doneToday && <div className="pt-ok">{todayStatus === 'hadir' ? 'Kamu sudah absen hari ini ✓' : `Hari ini kamu tercatat: ${todayStatus}`}</div>}

        {registered && !doneToday && (<>
          <h3>Absensi</h3>
          <Camera videoRef={videoRef} />
          <button className="pt-btn" onClick={scan} disabled={busy}>Scan wajah & absen</button>
        </>)}

        {msg && <p className="pt-msg">{msg}</p>}
      </div>
    </div>
  )
}
