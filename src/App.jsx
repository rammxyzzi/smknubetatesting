import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const programs = [
  { code: 'TKJ', title: 'Teknik Komputer dan Jaringan', desc: 'Belajar jaringan komputer, server, sistem operasi, dan infrastruktur digital.', icon: '⌘' },
  { code: 'RPL', title: 'Rekayasa Perangkat Lunak', desc: 'Mengenal pemrograman, pengembangan aplikasi, dan pembuatan website.', icon: '</>' },
  { code: 'AKL', title: 'Akuntansi dan Keuangan Lembaga', desc: 'Mempelajari pencatatan keuangan, akuntansi, dan administrasi bisnis.', icon: '▤' },
]

const announcements = [
  { tag: 'AKADEMIK', date: 'Pengumuman sekolah', title: 'Selamat datang di Portal SMK NU', desc: 'Pantau informasi, kegiatan, dan pengumuman sekolah melalui halaman ini.' },
  { tag: 'ABSENSI', date: 'Panduan siswa', title: 'Persiapkan data sebelum absensi', desc: 'Pastikan biodata dan kelas sudah sesuai. Fitur absensi akan diaktifkan setelah sistem terhubung.' },
  { tag: 'KEGIATAN', date: 'Informasi umum', title: 'Informasi kegiatan sekolah', desc: 'Jadwal dan detail kegiatan sekolah akan diumumkan melalui portal resmi ini.' },
]

export default function App() {
  const [active, setActive] = useState('Beranda')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [notice, setNotice] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [adminUser, setAdminUser] = useState(null)
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState('')
  const [studentName, setStudentName] = useState('')
  const [studentNis, setStudentNis] = useState('')
  const [studentClass, setStudentClass] = useState('')
  const [editingStudentId, setEditingStudentId] = useState(null)
  const [newClassName, setNewClassName] = useState('')
  const [studentSearch, setStudentSearch] = useState('')

  useEffect(() => {
    if (adminUser) loadAdminData()
  }, [adminUser])

  const openAttendance = () => {
    setShowLogin(true)
    setAuthError('')
    setAuthPassword('')
    setMobileMenu(false)
  }

  const handleAdminLogin = async (event) => {
    event.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      })
      if (error) throw error
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('user_id', data.user.id)
        .single()
      if (profileError || !profile) {
        await supabase.auth.signOut()
        throw new Error('Profil akun tidak ditemukan. Periksa tabel profiles di Supabase.')
      }
      if (profile.role !== 'admin') {
        await supabase.auth.signOut()
        throw new Error('Akun ini bukan admin. Akses dashboard ditolak.')
      }
      setAdminUser({ id: data.user.id, email: data.user.email, fullName: profile.full_name })
      setShowLogin(false)
      setAuthPassword('')
      setNotice('Login admin berhasil. Selamat datang, ' + profile.full_name + '!')
    } catch (error) {
      setAuthError(error.message || 'Login gagal. Coba periksa email dan password.')
    } finally {
      setAuthLoading(false)
    }
  }

  const loadAdminData = async () => {
    setDataLoading(true)
    setDataError('')
    try {
      const [{ data: classRows, error: classError }, { data: studentRows, error: studentError }] = await Promise.all([
        supabase.from('classes').select('id, name').order('name'),
        supabase.from('students').select('id, nis, full_name, class_id, classes(name)').order('full_name'),
      ])
      if (classError) throw classError
      if (studentError) throw studentError
      setClasses(classRows || [])
      setStudents(studentRows || [])
      if (!studentClass && classRows?.length) setStudentClass(classRows[0].id)
    } catch (error) {
      setDataError(error.message || 'Gagal memuat data. Periksa tabel dan kebijakan RLS Supabase.')
    } finally {
      setDataLoading(false)
    }
  }

  const saveStudent = async (event) => {
    event.preventDefault()
    setDataError('')
    if (!studentClass) {
      setDataError('Buat/pilih kelas terlebih dahulu sebelum menambahkan siswa.')
      return
    }
    const payload = { nis: studentNis.trim(), full_name: studentName.trim(), class_id: studentClass }
    try {
      const result = editingStudentId
        ? await supabase.from('students').update(payload).eq('id', editingStudentId)
        : await supabase.from('students').insert(payload)
      if (result.error) throw result.error
      setStudentName('')
      setStudentNis('')
      setEditingStudentId(null)
      await loadAdminData()
      setNotice(editingStudentId ? 'Data siswa berhasil diperbarui.' : 'Siswa berhasil ditambahkan.')
    } catch (error) {
      setDataError(error.message || 'Gagal menyimpan data siswa.')
    }
  }

  const startEditStudent = (student) => {
    setEditingStudentId(student.id)
    setStudentName(student.full_name)
    setStudentNis(student.nis)
    setStudentClass(student.class_id)
  }

  const cancelEditStudent = () => {
    setEditingStudentId(null)
    setStudentName('')
    setStudentNis('')
  }

  const deleteStudent = async (student) => {
    if (!window.confirm(`Hapus data siswa ${student.full_name}?`)) return
    setDataError('')
    const { error } = await supabase.from('students').delete().eq('id', student.id)
    if (error) setDataError(error.message || 'Gagal menghapus siswa.')
    else {
      setNotice('Data siswa berhasil dihapus.')
      await loadAdminData()
    }
  }

  const addClass = async (event) => {
    event.preventDefault()
    const name = newClassName.trim()
    if (!name) return
    setDataError('')
    const { data, error } = await supabase.from('classes').insert({ name }).select('id, name').single()
    if (error) {
      setDataError(error.message || 'Gagal menambahkan kelas.')
      return
    }
    setClasses((old) => [...old, data].sort((a, b) => a.name.localeCompare(b.name)))
    setStudentClass(data.id)
    setNewClassName('')
    setNotice('Kelas berhasil ditambahkan.')
  }

  const handleAdminLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      setNotice('Logout gagal: ' + error.message)
      return
    }
    setAdminUser(null)
    setNotice('Lu berhasil logout dari akun admin.')
  }

  const goTo = (item, sectionId) => {
    setActive(item)
    setMobileMenu(false)
    setNotice('')
    if (sectionId) document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
    else if (item === 'Absensi') openAttendance()
  }

  const nav = [
    { label: 'Beranda', id: 'beranda' },
    { label: 'Profil Sekolah', id: 'profil' },
    { label: 'Jurusan', id: 'jurusan' },
    { label: 'Data Siswa', id: 'data-siswa' },
    { label: 'Informasi', id: 'informasi' },
  ]

  return (
    <div className="app-shell">
      <div className="topline">
        <div className="container topline-inner">
          <span>Portal Informasi & Kehadiran Siswa</span>
          <span className="topline-right">Membangun generasi unggul dan berakhlak</span>
        </div>
      </div>

      <header className="header">
        <div className="container nav-wrap">
          <button className="brand" onClick={() => goTo('Beranda', 'beranda')} aria-label="Kembali ke beranda">
            <span className="brand-mark">NU</span>
            <span className="brand-copy">
              <strong>SMK NU</strong>
              <small>PORTAL SEKOLAH</small>
            </span>
          </button>

          <button className="menu-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Buka navigasi">
            {mobileMenu ? '✕' : '☰'}
          </button>

          <nav className={mobileMenu ? 'nav-links open' : 'nav-links'}>
            {nav.map((item) => (
              <button
                key={item.label}
                className={active === item.label ? 'nav-link active' : 'nav-link'}
                onClick={() => goTo(item.label, item.id)}
              >
                {item.label}
              </button>
            ))}
            <button className="nav-login" onClick={() => goTo('Absensi')}>
              <span>◉</span> Absensi
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero" id="beranda">
          <div className="hero-glow glow-one" />
          <div className="hero-glow glow-two" />
          <div className="container hero-grid">
            <div className="hero-content">
              <div className="eyebrow"><span className="eyebrow-dot" /> PORTAL RESMI SEKOLAH</div>
              <h1>Masa depan hebat<br />dimulai <em>dari sini.</em></h1>
              <p className="hero-description">
                Selamat datang di portal SMK NU. Temukan informasi sekolah, kenali program keahlian, dan akses layanan siswa dalam satu tempat.
              </p>
              <div className="hero-actions">
                <button className="button button-light" onClick={() => goTo('Profil Sekolah', 'profil')}>
                  Kenali Sekolah <span>↗</span>
                </button>
                <button className="button button-outline" onClick={() => goTo('Absensi')}>
                  <span className="scan-symbol">◎</span> Mulai Absensi
                </button>
              </div>
              <div className="hero-note"><span className="note-check">✓</span> Informasi sekolah dalam satu portal</div>
            </div>
            <div className="hero-art" aria-label="Ilustrasi pelajar">
              <div className="art-orbit orbit-a" />
              <div className="art-orbit orbit-b" />
              <div className="art-card card-top"><span className="mini-icon">✦</span><span><b>Belajar</b><small>Terus berkembang</small></span></div>
              <div className="student-illustration">
                <div className="student-halo" />
                <div className="student-head"><div className="hair" /><div className="face"><i /><i /><b /></div></div>
                <div className="student-neck" />
                <div className="student-body"><div className="shirt-collar" /><div className="shirt-button" /><div className="shirt-pocket" /></div>
                <div className="student-book"><span>✦</span></div>
              </div>
              <div className="art-card card-bottom"><span className="mini-icon green">✓</span><span><b>Siap berkarya</b><small>Untuk masa depan</small></span></div>
              <div className="floating-star star-one">✳</div>
              <div className="floating-star star-two">✦</div>
            </div>
          </div>
          <div className="hero-bottom-line" />
        </section>

        <section className="quick-stats">
          <div className="container stats-grid">
            <div className="stat"><span className="stat-icon">⌂</span><div><strong>Profil Sekolah</strong><small>Kenali lingkungan kami</small></div></div>
            <div className="stat"><span className="stat-icon">▦</span><div><strong>Program Keahlian</strong><small>Temukan minatmu</small></div></div>
            <div className="stat"><span className="stat-icon">◷</span><div><strong>Informasi Terkini</strong><small>Ikuti kabar sekolah</small></div></div>
            <div className="stat"><span className="stat-icon">◎</span><div><strong>Layanan Siswa</strong><small>Akses lebih mudah</small></div></div>
          </div>
        </section>

        <section className="section intro-section" id="profil">
          <div className="container intro-grid">
            <div className="intro-visual">
              <div className="visual-panel">
                <div className="visual-sun" />
                <div className="school-building">
                  <div className="building-roof" />
                  <div className="building-main">
                    <div className="building-sign">SMK NU</div>
                    <div className="building-windows"><i/><i/><i/><i/><i/><i/><i/><i/></div>
                    <div className="building-door" />
                  </div>
                  <div className="building-wing" />
                </div>
                <div className="visual-ground" />
                <span className="visual-label">TEMPAT BERTUMBUH</span>
              </div>
              <div className="experience-card"><strong>Belajar.</strong><strong className="green-text">Berkarya.</strong><strong>Berdampak.</strong></div>
            </div>
            <div className="intro-copy">
              <div className="section-kicker">TENTANG SEKOLAH</div>
              <h2>Lebih dari sekadar tempat belajar.</h2>
              <p>SMK NU hadir untuk mendukung siswa mengembangkan pengetahuan, keterampilan, karakter, dan kesiapan menghadapi dunia kerja maupun pendidikan lanjutan.</p>
              <p>Melalui portal ini, siswa dan warga sekolah dapat menemukan informasi penting serta layanan sekolah dengan lebih mudah.</p>
              <div className="value-list">
                <div><span>01</span><div><b>Pendidikan berkualitas</b><small>Mendukung proses belajar yang terus berkembang.</small></div></div>
                <div><span>02</span><div><b>Karakter dan kedisiplinan</b><small>Mendorong tanggung jawab, integritas, dan kolaborasi.</small></div></div>
                <div><span>03</span><div><b>Siap menghadapi masa depan</b><small>Mengembangkan keterampilan yang relevan.</small></div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section programs-section" id="jurusan">
          <div className="container">
            <div className="section-heading">
              <div><div className="section-kicker">PROGRAM KEAHLIAN</div><h2>Temukan bidangmu.</h2></div>
              <p>Kenali bidang keahlian yang dapat menjadi langkah awal perjalanan masa depanmu.</p>
            </div>
            <div className="program-grid">
              {programs.map((program, index) => (
                <article className="program-card" key={program.code}>
                  <div className={`program-icon icon-${index}`}>{program.icon}</div>
                  <div className="program-code">PROGRAM {program.code}</div>
                  <h3>{program.title}</h3>
                  <p>{program.desc}</p>
                  <button className="text-link" onClick={() => setNotice('Informasi jurusan akan disesuaikan dengan data resmi SMK NU.')}>Pelajari lebih lanjut <span>↗</span></button>
                </article>
              ))}
            </div>
            <p className="demo-note">Catatan: daftar jurusan di atas masih contoh. Sesuaikan dengan jurusan resmi yang tersedia di sekolah.</p>
          </div>
        </section>

        <section className="section service-section" id="data-siswa">
          <div className="container service-grid">
            <div className="service-copy">
              <div className="section-kicker">LAYANAN SISWA</div>
              <h2>Semua kebutuhan sekolah, lebih terarah.</h2>
              <p>Portal dirancang untuk membantu siswa menemukan informasi dan mengakses layanan sesuai akun serta hak aksesnya.</p>
              <div className="service-list">
                <div><span className="service-check">✓</span><span><b>Data siswa</b><small>Informasi siswa akan ditampilkan sesuai izin akses.</small></span></div>
                <div><span className="service-check">✓</span><span><b>Absensi terintegrasi</b><small>Alur absensi dirancang untuk terhubung ke kelas siswa.</small></span></div>
                <div><span className="service-check">✓</span><span><b>Riwayat kehadiran</b><small>Rencana fitur untuk melihat catatan absensi pribadi.</small></span></div>
              </div>
            </div>
            <div className="attendance-preview">
              <div className="preview-header"><div><span className="preview-label">PORTAL SISWA</span><h3>Layanan Kehadiran</h3></div><span className="preview-status">DEMO</span></div>
              <div className="preview-avatar">◎</div>
              <h4>Absensi siswa</h4>
              <p>Masuk menggunakan akun siswa yang telah terdaftar untuk melanjutkan proses absensi.</p>
              <button className="button button-dark full-width" onClick={() => goTo('Absensi')}>Lihat alur absensi <span>→</span></button>
              <div className="preview-foot"><span>🔒</span> Fitur belum terhubung ke database</div>
            </div>
          </div>
        </section>

        <section className="section news-section" id="informasi">
          <div className="container">
            <div className="section-heading">
              <div><div className="section-kicker">KABAR SEKOLAH</div><h2>Informasi terbaru.</h2></div>
              <span className="coming-soon">CONTOH KONTEN</span>
            </div>
            <div className="news-grid">
              {announcements.map((item, index) => (
                <article className="news-card" key={item.title}>
                  <div className={`news-art news-art-${index}`}><span>{index === 0 ? '✦' : index === 1 ? '◎' : '▤'}</span></div>
                  <div className="news-content"><div className="news-meta"><span>{item.tag}</span><small>{item.date}</small></div><h3>{item.title}</h3><p>{item.desc}</p><button className="text-link" onClick={() => setNotice('Konten ini masih contoh dan dapat dikelola melalui dashboard admin setelah backend dibuat.')}>Baca informasi <span>↗</span></button></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="container cta-inner">
            <div><div className="section-kicker light-kicker">PORTAL SMK NU</div><h2>Mulai langkahmu hari ini.</h2><p>Portal sekolah yang terus dikembangkan untuk mendukung layanan pendidikan.</p></div>
            <button className="button button-light" onClick={() => goTo('Absensi')}>Lihat layanan absensi <span>→</span></button>
          </div>
        </section>
      </main>

      {(showLogin || adminUser) && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={adminUser ? 'Dashboard admin' : 'Login admin'}
          onClick={(event) => { if (event.target === event.currentTarget && !adminUser) setShowLogin(false) }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(7, 22, 15, 0.72)', display: 'grid', placeItems: 'center', padding: 18, overflowY: 'auto' }}
        >
          <div style={{ width: '100%', maxWidth: 520, background: '#fff', color: '#173b2b', borderRadius: 22, padding: 24, boxShadow: '0 24px 80px rgba(0,0,0,.28)', position: 'relative' }}>
            <button
              onClick={() => { if (adminUser) handleAdminLogout(); else setShowLogin(false) }}
              aria-label={adminUser ? 'Logout' : 'Tutup'}
              style={{ position: 'absolute', right: 16, top: 14, border: 0, background: '#edf4ef', borderRadius: 999, width: 36, height: 36, cursor: 'pointer', fontSize: 20, color: '#173b2b' }}
            >{adminUser ? '↪' : '×'}</button>
            {adminUser ? (
              <>
                <div style={{ display: 'inline-block', background: '#e2f4e8', color: '#207246', borderRadius: 999, padding: '7px 12px', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>ADMIN TERVERIFIKASI</div>
                <h2 style={{ margin: '18px 0 8px', fontSize: 28 }}>Dashboard Admin</h2>
                <p style={{ color: '#607367', lineHeight: 1.6, marginTop: 0 }}>Halo, {adminUser.fullName}. Lu login sebagai admin dengan akun {adminUser.email}.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 12, margin: '22px 0' }}>
                  <div style={{ background: '#f2f7f3', padding: 16, borderRadius: 14 }}><div style={{ fontSize: 12, color: '#607367' }}>STATUS</div><strong style={{ display: 'block', marginTop: 6 }}>Terhubung</strong></div>
                  <div style={{ background: '#f2f7f3', padding: 16, borderRadius: 14 }}><div style={{ fontSize: 12, color: '#607367' }}>HAK AKSES</div><strong style={{ display: 'block', marginTop: 6 }}>Admin</strong></div>
                </div>
                <div style={{ marginTop: 22, borderTop: '1px solid #e3ece5', paddingTop: 18 }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 21 }}>Kelola kelas</h3>
                  <form onSubmit={addClass} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="Contoh: X TKJ 1" required style={{ minWidth: 0, flex: 1, border: '1px solid #d4e0d7', borderRadius: 10, padding: 11, fontSize: 14 }} />
                    <button type="submit" style={{ border: 0, borderRadius: 10, padding: '10px 13px', background: '#17683d', color: '#fff', fontWeight: 700 }}>Tambah</button>
                  </form>
                  <p style={{ color: '#607367', fontSize: 13, margin: '0 0 20px' }}>Kelas tersedia: {classes.length ? classes.map((c) => c.name).join(', ') : 'Belum ada kelas.'}</p>

                  <h3 style={{ margin: '0 0 12px', fontSize: 21 }}>{editingStudentId ? 'Edit siswa' : 'Tambah siswa'}</h3>
                  <form onSubmit={saveStudent} style={{ display: 'grid', gap: 10 }}>
                    <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Nama lengkap siswa" required style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d4e0d7', borderRadius: 10, padding: 12, fontSize: 14 }} />
                    <input value={studentNis} onChange={(e) => setStudentNis(e.target.value)} placeholder="NIS siswa" required style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d4e0d7', borderRadius: 10, padding: 12, fontSize: 14 }} />
                    <select value={studentClass} onChange={(e) => setStudentClass(e.target.value)} required style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d4e0d7', borderRadius: 10, padding: 12, fontSize: 14, background: '#fff' }}>
                      <option value="">Pilih kelas</option>
                      {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" style={{ flex: 1, border: 0, borderRadius: 10, padding: 12, background: '#17683d', color: '#fff', fontWeight: 700 }}>{editingStudentId ? 'Simpan perubahan' : 'Tambah siswa'}</button>
                      {editingStudentId && <button type="button" onClick={cancelEditStudent} style={{ border: '1px solid #d4e0d7', borderRadius: 10, padding: 12, background: '#fff', color: '#173b2b' }}>Batal</button>}
                    </div>
                  </form>
                  <div style={{ marginTop: 22 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <h3 style={{ margin: 0, fontSize: 21 }}>Daftar siswa ({students.length})</h3>
                      <button type="button" onClick={loadAdminData} style={{ border: '1px solid #d4e0d7', borderRadius: 9, padding: '8px 10px', background: '#fff', color: '#173b2b' }}>Refresh</button>
                    </div>
                    <input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Cari nama atau NIS..." style={{ width: '100%', boxSizing: 'border-box', marginTop: 12, border: '1px solid #d4e0d7', borderRadius: 10, padding: 12, fontSize: 14 }} />
                    {dataLoading && <p style={{ color: '#607367' }}>Memuat data...</p>}
                    {dataError && <p role="alert" style={{ background: '#fff0f0', color: '#a12b2b', padding: 12, borderRadius: 10, fontSize: 13, lineHeight: 1.5 }}>{dataError}</p>}
                    {!dataLoading && !students.length && <p style={{ color: '#607367', fontSize: 14 }}>Belum ada data siswa. Tambahkan kelas terlebih dahulu, lalu isi formulir siswa.</p>}
                    <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                      {students.filter((st) => `${st.full_name} ${st.nis} ${st.classes?.name || ''}`.toLowerCase().includes(studentSearch.toLowerCase())).map((st) => (
                        <div key={st.id} style={{ border: '1px solid #e0e9e2', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
                          <div style={{ minWidth: 0 }}>
                            <strong style={{ display: 'block', overflowWrap: 'anywhere' }}>{st.full_name}</strong>
                            <span style={{ display: 'block', color: '#607367', fontSize: 12, marginTop: 4 }}>NIS: {st.nis} · {st.classes?.name || 'Kelas tidak diketahui'}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <button type="button" onClick={() => startEditStudent(st)} aria-label="Edit siswa" style={{ border: '1px solid #d4e0d7', borderRadius: 8, padding: '7px 9px', background: '#fff', color: '#173b2b' }}>Edit</button>
                            <button type="button" onClick={() => deleteStudent(st)} aria-label="Hapus siswa" style={{ border: '1px solid #f0cccc', borderRadius: 8, padding: '7px 9px', background: '#fff7f7', color: '#a12b2b' }}>Hapus</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={handleAdminLogout} style={{ width: '100%', border: 0, borderRadius: 12, padding: 13, background: '#17683d', color: '#fff', fontWeight: 700, cursor: 'pointer', marginTop: 22 }}>Logout</button>
              </>
            ) : (
              <>
                <div style={{ display: 'inline-block', background: '#e2f4e8', color: '#207246', borderRadius: 999, padding: '7px 12px', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>PORTAL SMK NU</div>
                <h2 style={{ margin: '18px 0 8px', fontSize: 28 }}>Login Admin</h2>
                <p style={{ color: '#607367', lineHeight: 1.6, marginTop: 0 }}>Masuk menggunakan akun yang sudah terdaftar di Supabase Authentication.</p>
                <form onSubmit={handleAdminLogin}>
                  <label htmlFor="admin-email" style={{ display: 'block', fontSize: 13, fontWeight: 700, margin: '18px 0 7px' }}>Email admin</label>
                  <input id="admin-email" type="email" autoComplete="username" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="admin@sekolah.sch.id" style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d4e0d7', borderRadius: 11, padding: 13, fontSize: 15, outlineColor: '#21804c' }} />
                  <label htmlFor="admin-password" style={{ display: 'block', fontSize: 13, fontWeight: 700, margin: '16px 0 7px' }}>Password</label>
                  <input id="admin-password" type="password" autoComplete="current-password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Masukkan password" style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d4e0d7', borderRadius: 11, padding: 13, fontSize: 15, outlineColor: '#21804c' }} />
                  {authError && <p role="alert" style={{ background: '#fff0f0', color: '#a12b2b', padding: 12, borderRadius: 10, fontSize: 13, lineHeight: 1.5 }}>{authError}</p>}
                  <button type="submit" disabled={authLoading} style={{ width: '100%', border: 0, borderRadius: 12, padding: 14, background: authLoading ? '#739984' : '#17683d', color: '#fff', fontWeight: 700, cursor: authLoading ? 'wait' : 'pointer', marginTop: 20 }}>{authLoading ? 'Memeriksa akun...' : 'Login sebagai Admin'}</button>
                </form>
                <p style={{ color: '#718176', fontSize: 12, lineHeight: 1.6, marginBottom: 0 }}>Akses admin diberikan hanya jika role akun di tabel profiles adalah admin.</p>
              </>
            )}
          </div>
        </div>
      )}

      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Tutup notifikasi">×</button>
        </div>
      )}

      <footer className="footer">
        <div className="container footer-main">
          <button className="brand footer-brand" onClick={() => goTo('Beranda', 'beranda')}>
            <span className="brand-mark">NU</span><span className="brand-copy"><strong>SMK NU</strong><small>PORTAL SEKOLAH</small></span>
          </button>
          <p>Portal informasi dan layanan siswa.<br />Mendukung pembelajaran, karakter, dan masa depan.</p>
          <div className="footer-links"><button onClick={() => goTo('Profil Sekolah', 'profil')}>Profil</button><button onClick={() => goTo('Jurusan', 'jurusan')}>Jurusan</button><button onClick={() => goTo('Informasi', 'informasi')}>Informasi</button></div>
        </div>
        <div className="container footer-bottom"><span>© {new Date().getFullYear()} SMK NU. Template awal website.</span><span>Dibuat untuk dikembangkan lebih lanjut.</span></div>
      </footer>
    </div>
  )
}
