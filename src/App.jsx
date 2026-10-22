import { useEffect, useState } from 'react'
import Portal from './Portal.jsx'
import { Pages, HomeContent, SearchBar, Icon } from './Content.jsx'
import { CONTACT, SCHOOL } from './config.js'

const programs = [
  { code: 'TKJT', title: 'Teknik Komputer Jaringan dan Telekomunikasi', desc: 'Mempelajari jaringan komputer, administrasi server, dan telekomunikasi, dari perakitan hingga pengelolaan infrastruktur jaringan.' },
  { code: 'TBSM', title: 'Teknik Bisnis Sepeda Motor', desc: 'Mempelajari perawatan, perbaikan, dan servis sepeda motor, serta dasar pengelolaan usaha bengkel.' },
  { code: 'BDP', title: 'Bisnis Daring dan Pemasaran', desc: 'Mempelajari dasar bisnis, pemasaran, dan penjualan, termasuk pemasaran melalui platform daring.' },
]

const navigate = (p) => { location.hash = '#' + p }

// Router sederhana berbasis hash (#/berita, #/post/ID, ...). Tidak butuh pengaturan server.
function useRoute() {
  const get = () => location.hash.replace(/^#/, '') || '/'
  const [route, setRoute] = useState(get)
  useEffect(() => {
    const f = () => { setRoute(get()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return route
}

export default function App() {
  const [active, setActive] = useState('Beranda')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [notice, setNotice] = useState('')
  const route = useRoute()
  const [sheet, setSheet] = useState(false)
  const [pending, setPending] = useState('')
  const seg = route.split('/')[1] || ''
  const isLanding = route === '/' || route === ''

  const goTo = (item, sectionId, to) => {
    setActive(item)
    setMobileMenu(false)
    setSheet(false)
    setNotice('')
    if (item === 'Absensi') { navigate('/masuk'); return }
    if (to) { navigate(to); return }
    if (!sectionId) return
    if (!isLanding) { setPending(sectionId); navigate('/') }
    else document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
  }

  // Setelah pindah ke beranda dari halaman lain, gulir ke bagian yang dituju.
  useEffect(() => {
    if (!isLanding || !pending) return
    const t = setTimeout(() => { document.getElementById(pending)?.scrollIntoView({ behavior: 'smooth' }); setPending('') }, 80)
    return () => clearTimeout(t)
  }, [isLanding, pending])

  useEffect(() => { setSheet(false) }, [route])

  // Efek muncul halus saat discroll. Hanya untuk bagian yang belum terlihat di layar.
  useEffect(() => {
    if (!isLanding) return
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
  }, [route])

  const nav = [
    { label: 'Beranda', id: 'beranda' },
    { label: 'Profil Sekolah', id: 'profil' },
    { label: 'Jurusan', id: 'jurusan' },
    { label: 'Data Siswa', id: 'data-siswa' },
    { label: 'Informasi', id: 'informasi' },
    { label: 'Berita', to: '/berita' },
  ]

  if (route === '/masuk') return <Portal onBack={() => navigate('/')} />

  const bottom = [
    { key: 'home', label: 'Home', icon: 'home', on: isLanding, act: () => { setActive('Beranda'); isLanding ? window.scrollTo({ top: 0, behavior: 'smooth' }) : navigate('/') } },
    { key: 'berita', label: 'Berita', icon: 'news', on: ['berita', 'pengumuman', 'agenda', 'post', 'cari'].includes(seg), act: () => navigate('/berita') },
    { key: 'menu', label: 'Menu', icon: 'grid', on: sheet, act: () => setSheet(true) },
    { key: 'kontak', label: 'Kontak', icon: 'phone', on: false, act: () => goTo('Kontak', 'kontak') },
    { key: 'profil', label: 'Profil', icon: 'school', on: false, act: () => goTo('Profil Sekolah', 'profil') },
  ]
  const sheetItems = [
    { label: 'Profil Sekolah', icon: 'school', act: () => goTo('Profil Sekolah', 'profil') },
    { label: 'Jurusan', icon: 'book', act: () => goTo('Jurusan', 'jurusan') },
    { label: 'Agenda', icon: 'calendar', act: () => goTo('Agenda', null, '/agenda') },
    { label: 'Pengumuman', icon: 'megaphone', act: () => goTo('Pengumuman', null, '/pengumuman') },
    { label: 'Absensi Siswa', icon: 'scan', act: () => goTo('Absensi') },
  ]
  const contactItems = [
    CONTACT.alamat && { k: 'Alamat', t: CONTACT.alamat },
    CONTACT.telepon && { k: 'Telepon', t: CONTACT.telepon, h: `tel:${CONTACT.telepon.replace(/\s/g, '')}` },
    CONTACT.whatsapp && { k: 'WhatsApp', t: `+${CONTACT.whatsapp}`, h: `https://wa.me/${CONTACT.whatsapp}` },
    CONTACT.email && { k: 'Email', t: CONTACT.email, h: `mailto:${CONTACT.email}` },
    CONTACT.instagram && { k: 'Instagram', t: `@${CONTACT.instagram}`, h: `https://instagram.com/${CONTACT.instagram}` },
    CONTACT.maps && { k: 'Peta', t: 'Lihat di Google Maps', h: CONTACT.maps },
  ].filter(Boolean)

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

          <SearchBar className="search-desktop" />

          <button className="menu-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Buka navigasi">
            {mobileMenu ? '✕' : '☰'}
          </button>

          <nav className={mobileMenu ? 'nav-links open' : 'nav-links'}>
            {nav.map((item) => (
              <button
                key={item.label}
                className={active === item.label ? 'nav-link active' : 'nav-link'}
                onClick={() => goTo(item.label, item.id, item.to)}
              >
                {item.label}
              </button>
            ))}
            <button className="nav-login" onClick={() => goTo('Absensi')}>
              <span>◉</span> Absensi
            </button>
          </nav>
        </div>
        <div className="container search-row"><SearchBar /></div>
      </header>

      <main>
        {!isLanding ? <Pages route={route} /> : (<>
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
                <img className="school-photo" src="/sekolah.jpg" alt="Siswa SMK NU Ghofarona Pusakajaya mengikuti upacara di halaman sekolah" />
              </div>
              <div className="experience-card"><small>LOKASI</small><strong>Pusakajaya</strong><strong className="green-text">Kabupaten Subang</strong></div>
            </div>
            <div className="intro-copy">
              <div className="section-kicker">TENTANG SEKOLAH</div>
              <h2>Sekolah kejuruan di Pusakajaya, Subang.</h2>
              <p>SMK NU Ghofarona Pusakajaya, juga dikenal sebagai SMK NU Ghofarona Pusakanegara, adalah sekolah menengah kejuruan swasta di bawah naungan Lembaga Pendidikan Ma'arif yang berlokasi di Kabupaten Subang, Jawa Barat.</p>
              <p>Sekolah ini membuka program keahlian Teknik Komputer Jaringan dan Telekomunikasi, Teknik Bisnis Sepeda Motor, serta Bisnis Daring dan Pemasaran.</p>
              <dl className="facts">
                {CONTACT.alamat && <div><dt>Alamat</dt><dd>{CONTACT.alamat}</dd></div>}
                {SCHOOL.npsn && <div><dt>NPSN</dt><dd>{SCHOOL.npsn}</dd></div>}
                {SCHOOL.akreditasi && <div><dt>Akreditasi</dt><dd>{SCHOOL.akreditasi}</dd></div>}
                {CONTACT.telepon && <div><dt>Telepon</dt><dd><a href={`tel:${CONTACT.telepon.replace(/\s/g, '')}`}>{CONTACT.telepon}</a></dd></div>}
              </dl>
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
                  <div className={`program-icon code icon-${index}`}>{program.code}</div>
                  <div className="program-code">PROGRAM KEAHLIAN</div>
                  <h3>{program.title}</h3>
                  <p>{program.desc}</p>
                </article>
              ))}
            </div>
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

        <HomeContent />

        <section className="cta-section">
          <div className="container cta-inner">
            <div><div className="section-kicker light-kicker">PORTAL SMK NU</div><h2>Mulai langkahmu hari ini.</h2><p>Portal sekolah yang terus dikembangkan untuk mendukung layanan pendidikan.</p></div>
            <button className="button button-light" onClick={() => goTo('Absensi')}>Lihat layanan absensi <span>→</span></button>
          </div>
        </section>
        </>)}
      </main>

      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Tutup notifikasi">×</button>
        </div>
      )}

      <footer className="footer" id="kontak">
        <div className="container footer-main">
          <button className="brand footer-brand" onClick={() => goTo('Beranda', 'beranda')}>
            <img className="brand-logo" src="/logo.png" alt="Logo SMK NU Ghofarona Pusakajaya" /><span className="brand-copy"><strong>SMK NU</strong><small>GHOFARONA PUSAKAJAYA</small></span>
          </button>
          <p>Portal informasi dan layanan siswa.<br />Mendukung pembelajaran, karakter, dan masa depan.</p>
          <div className="footer-links"><button onClick={() => goTo('Profil Sekolah', 'profil')}>Profil</button><button onClick={() => goTo('Jurusan', 'jurusan')}>Jurusan</button><button onClick={() => goTo('Informasi', 'informasi')}>Informasi</button></div>
        </div>
        {contactItems.length > 0 && (
          <div className="container footer-contact">
            {contactItems.map((c) => (
              <div key={c.k}><small>{c.k}</small>{c.h ? <a href={c.h} target="_blank" rel="noopener noreferrer">{c.t}</a> : <span>{c.t}</span>}</div>
            ))}
          </div>
        )}
        <div className="container footer-bottom"><span>© {new Date().getFullYear()} SMK NU Ghofarona Pusakajaya</span>{SCHOOL.npsn && <span>NPSN {SCHOOL.npsn}</span>}</div>
      </footer>

      <nav className="bottom-nav" aria-label="Navigasi utama">
        {bottom.map((b) => (
          <button key={b.key} className={b.on ? 'bn-item on' : 'bn-item'} onClick={b.act} aria-current={b.on && b.key !== 'menu' ? 'page' : undefined}>
            <Icon name={b.icon} size={22} /><span>{b.label}</span>
          </button>
        ))}
      </nav>

      <div className={sheet ? 'sheet-wrap open' : 'sheet-wrap'} aria-hidden={!sheet}>
        <div className="sheet-backdrop" onClick={() => setSheet(false)} />
        <div className="sheet" role="dialog" aria-label="Menu">
          <div className="sheet-handle" />
          <div className="sheet-grid">
            {sheetItems.map((s) => (
              <button key={s.label} className="sheet-item" onClick={s.act} tabIndex={sheet ? 0 : -1}>
                <Icon name={s.icon} size={22} /><span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
