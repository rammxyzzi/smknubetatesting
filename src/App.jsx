import { useEffect, useState } from 'react'
import Portal from './Portal.jsx'

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
  const [view, setView] = useState('landing')

  const goTo = (item, sectionId) => {
    setActive(item)
    setMobileMenu(false)
    setNotice('')
    if (sectionId) document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
    else if (item === 'Absensi') setView('portal')
  }

  // Efek muncul halus saat discroll. Hanya untuk bagian yang belum terlihat di layar.
  useEffect(() => {
    if (view !== 'landing') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
    const targets = document.querySelectorAll(
      '.stat, .intro-visual, .intro-copy, .section-heading, .program-card, .service-copy, .attendance-preview, .news-card, .cta-inner'
    )
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
    targets.forEach((el, i) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return
      el.classList.add('reveal')
      el.style.setProperty('--d', `${(i % 3) * 70}ms`)
      io.observe(el)
    })
    return () => io.disconnect()
  }, [view])

  const nav = [
    { label: 'Beranda', id: 'beranda' },
    { label: 'Profil Sekolah', id: 'profil' },
    { label: 'Jurusan', id: 'jurusan' },
    { label: 'Data Siswa', id: 'data-siswa' },
    { label: 'Informasi', id: 'informasi' },
  ]

  if (view === 'portal') return <Portal onBack={() => setView('landing')} />

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
            <img className="brand-logo" src="/logo.png" alt="Logo SMK NU Ghofarona Pusakajaya" />
            <span className="brand-copy">
              <strong>SMK NU</strong>
              <small>GHOFARONA PUSAKAJAYA</small>
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

      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Tutup notifikasi">×</button>
        </div>
      )}

      <footer className="footer">
        <div className="container footer-main">
          <button className="brand footer-brand" onClick={() => goTo('Beranda', 'beranda')}>
            <img className="brand-logo" src="/logo.png" alt="Logo SMK NU Ghofarona Pusakajaya" /><span className="brand-copy"><strong>SMK NU</strong><small>GHOFARONA PUSAKAJAYA</small></span>
          </button>
          <p>Portal informasi dan layanan siswa.<br />Mendukung pembelajaran, karakter, dan masa depan.</p>
          <div className="footer-links"><button onClick={() => goTo('Profil Sekolah', 'profil')}>Profil</button><button onClick={() => goTo('Jurusan', 'jurusan')}>Jurusan</button><button onClick={() => goTo('Informasi', 'informasi')}>Informasi</button></div>
        </div>
        <div className="container footer-bottom"><span>© {new Date().getFullYear()} SMK NU Ghofarona Pusakajaya. Template awal website.</span><span>Dibuat untuk dikembangkan lebih lanjut.</span></div>
      </footer>
    </div>
  )
}
