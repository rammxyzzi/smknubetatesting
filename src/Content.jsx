import { useEffect, useState } from 'react'
import { listPosts, getPost, countView, listEvents, searchAll, fmtDate, fmtRange, excerpt } from './content.js'
import './content.css'

const PATHS = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6',
  news: 'M5 3h14v18H5zM9 8h6M9 12h6M9 16h4',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  school: 'M4 21V8l8-5 8 5v13M9 21v-6h6v6M8 11h1M11.5 11h1M15 11h1',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5',
  calendar: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  pin: 'M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11zM12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  user: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21a8 8 0 0 1 16 0',
  megaphone: 'M3 10v4h4l8 4V6L7 10H3zM18 9a4 4 0 0 1 0 6',
  scan: 'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M9 14a3 3 0 0 1 6 0M12 8a1.5 1.5 0 1 0 0 3',
  book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
}

export const Icon = ({ name, size = 18 }) => (
  <svg className="cx-ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={PATHS[name]} /></svg>
)

function useLoad(fn, deps) {
  const [s, setS] = useState({ loading: true, data: null, error: false })
  useEffect(() => {
    let on = true
    setS((x) => ({ ...x, loading: true, error: false }))
    fn().then((d) => on && setS({ loading: false, data: d, error: false }))
      .catch(() => on && setS({ loading: false, data: null, error: true }))
    return () => { on = false }
  }, deps)
  return s
}

export function SearchBar({ className = '' }) {
  const [q, setQ] = useState('')
  const go = (e) => {
    e.preventDefault()
    const v = q.trim()
    if (v) location.hash = '#/cari/' + encodeURIComponent(v)
  }
  return (
    <form className={`cx-search ${className}`} onSubmit={go} role="search">
      <Icon name="search" size={18} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari berita, pengumuman, agenda…"
        aria-label="Cari informasi" enterKeyHint="search" />
    </form>
  )
}

function PostCard({ p }) {
  const href = `#/post/${p.id}`
  return (
    <article className="cx-card">
      <a href={href} className="cx-thumb" tabIndex={-1} aria-hidden="true">
        {p.image_url
          ? <img src={p.image_url} alt="" loading="lazy" />
          : <div className="cx-thumb-empty"><img src="/logo.png" alt="" /></div>}
        <span className="cx-badge"><Icon name={p.kind === 'berita' ? 'news' : 'megaphone'} size={14} /> {p.kind === 'berita' ? 'Berita' : 'Pengumuman'}</span>
      </a>
      <div className="cx-body">
        <h3><a href={href}>{p.title}</a></h3>
        <p>{excerpt(p.body)}</p>
        <div className="cx-meta">
          <span><Icon name="user" size={15} /> {p.author_name || 'Admin'}</span>
          <span><Icon name="calendar" size={15} /> {fmtDate(p.published_at)}</span>
          <span><Icon name="eye" size={15} /> {p.views}</span>
        </div>
        <a className="cx-btn" href={href}>Lihat Detail</a>
      </div>
    </article>
  )
}

function AgendaCard({ e }) {
  return (
    <article className="cx-agenda">
      <span className="cx-agenda-date"><Icon name="calendar" size={15} /> {fmtRange(e.starts_on, e.ends_on)}</span>
      <h3>{e.title}</h3>
      <div className="cx-agenda-meta">
        {e.location && <span><Icon name="pin" size={15} /> {e.location}</span>}
        {e.time_text && <span><Icon name="clock" size={15} /> {e.time_text}</span>}
      </div>
    </article>
  )
}

const Row = ({ children }) => <div className="cx-row">{children}</div>

function Block({ title, link, children }) {
  return (
    <div className="cx-block">
      <div className="cx-block-head">
        <h2>{title}</h2>
        {link && <a href={link}>Lihat semua</a>}
      </div>
      {children}
    </div>
  )
}

/* Bagian di beranda */
export function HomeContent() {
  const s = useLoad(async () => {
    const [ev, an, nw] = await Promise.all([
      listEvents({ limit: 6 }),
      listPosts({ kind: 'pengumuman', limit: 6 }),
      listPosts({ kind: 'berita', limit: 6 }),
    ])
    return { ev, an, nw }
  }, [])
  const d = s.data
  const empty = d && !d.ev.length && !d.an.length && !d.nw.length

  return (
    <section className="section cx-section" id="informasi">
      <div className="container">
        {s.loading && <p className="cx-muted">Memuat informasi…</p>}
        {s.error && <p className="cx-muted">Informasi belum bisa dimuat. Coba muat ulang halaman.</p>}
        {empty && <p className="cx-muted">Belum ada informasi terbaru.</p>}
        {d?.ev.length > 0 && <Block title="Agenda" link="#/agenda"><Row>{d.ev.map((e) => <AgendaCard key={e.id} e={e} />)}</Row></Block>}
        {d?.an.length > 0 && <Block title="Pengumuman" link="#/pengumuman"><Row>{d.an.map((p) => <PostCard key={p.id} p={p} />)}</Row></Block>}
        {d?.nw.length > 0 && <Block title="Berita dan Artikel Sekolah" link="#/berita"><Row>{d.nw.map((p) => <PostCard key={p.id} p={p} />)}</Row></Block>}
      </div>
    </section>
  )
}

/* Halaman daftar berita / pengumuman */
function PostListPage({ kind }) {
  const PAGE = 9
  const [items, setItems] = useState([])
  const [more, setMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = async (from) => {
    setLoading(true); setError(false)
    try {
      const d = await listPosts({ kind, limit: PAGE, from })
      setItems((x) => (from ? [...x, ...d] : d))
      setMore(d.length === PAGE)
    } catch { setError(true) }
    setLoading(false)
  }
  useEffect(() => { load(0) }, [kind])

  return (<>
    <div className="cx-tabs">
      <a className={kind === 'berita' ? 'cx-tab on' : 'cx-tab'} href="#/berita">Berita</a>
      <a className={kind === 'pengumuman' ? 'cx-tab on' : 'cx-tab'} href="#/pengumuman">Pengumuman</a>
      <a className="cx-tab" href="#/agenda">Agenda</a>
    </div>
    {error && <p className="cx-muted">Gagal memuat. Coba lagi nanti.</p>}
    {!loading && !error && items.length === 0 && <p className="cx-muted">Belum ada tulisan.</p>}
    <div className="cx-grid">{items.map((p) => <PostCard key={p.id} p={p} />)}</div>
    {loading && <p className="cx-muted">Memuat…</p>}
    {more && !loading && <button className="cx-btn cx-more" onClick={() => load(items.length)}>Muat lebih banyak</button>}
  </>)
}

function AgendaPage() {
  const s = useLoad(() => listEvents({ limit: 60 }), [])
  return (<>
    <div className="cx-tabs">
      <a className="cx-tab" href="#/berita">Berita</a>
      <a className="cx-tab" href="#/pengumuman">Pengumuman</a>
      <a className="cx-tab on" href="#/agenda">Agenda</a>
    </div>
    {s.loading && <p className="cx-muted">Memuat…</p>}
    {s.error && <p className="cx-muted">Gagal memuat. Coba lagi nanti.</p>}
    {s.data && s.data.length === 0 && <p className="cx-muted">Belum ada agenda yang akan datang.</p>}
    <div className="cx-grid">{s.data?.map((e) => <AgendaCard key={e.id} e={e} />)}</div>
  </>)
}

function PostDetail({ id }) {
  const s = useLoad(async () => {
    const p = await getPost(id)
    if (!p) return null
    countView(id)
    const others = await listPosts({ kind: p.kind, limit: 4 })
    return { p, others: others.filter((o) => o.id !== id).slice(0, 3) }
  }, [id])
  const [copied, setCopied] = useState(false)

  if (s.loading) return <p className="cx-muted">Memuat…</p>
  if (s.error) return <p className="cx-muted">Gagal memuat tulisan.</p>
  if (!s.data) return <p className="cx-muted">Tulisan tidak ditemukan. <a href="#/berita">Kembali ke berita</a></p>

  const { p, others } = s.data
  const url = `${location.origin}${location.pathname}#/post/${p.id}`
  const t = encodeURIComponent(p.title)
  const u = encodeURIComponent(url)
  const copy = () => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800) }

  return (<>
    <a className="cx-back" href={p.kind === 'berita' ? '#/berita' : '#/pengumuman'}>← {p.kind === 'berita' ? 'Semua berita' : 'Semua pengumuman'}</a>
    <article className="cx-article">
      <span className="cx-badge static"><Icon name={p.kind === 'berita' ? 'news' : 'megaphone'} size={14} /> {p.kind === 'berita' ? 'Berita' : 'Pengumuman'}</span>
      <h1>{p.title}</h1>
      <div className="cx-meta">
        <span><Icon name="user" size={15} /> {p.author_name || 'Admin'}</span>
        <span><Icon name="calendar" size={15} /> {fmtDate(p.published_at)}</span>
        <span><Icon name="eye" size={15} /> {p.views}</span>
      </div>
      {p.image_url && <img className="cx-hero-img" src={p.image_url} alt="" />}
      <div className="cx-text">{p.body.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}</div>

      <div className="cx-share">
        <b>Bagikan</b>
        <a href={`https://wa.me/?text=${t}%20${u}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} target="_blank" rel="noopener noreferrer">Facebook</a>
        <a href={`https://twitter.com/intent/tweet?url=${u}&text=${t}`} target="_blank" rel="noopener noreferrer">X</a>
        <a href={`https://t.me/share/url?url=${u}&text=${t}`} target="_blank" rel="noopener noreferrer">Telegram</a>
        <button onClick={copy}>{copied ? 'Tautan disalin' : 'Salin tautan'}</button>
      </div>
    </article>

    {others.length > 0 && (
      <Block title="Kabar sekolah lainnya"><div className="cx-grid">{others.map((o) => <PostCard key={o.id} p={o} />)}</div></Block>
    )}
  </>)
}

function SearchPage({ q }) {
  const s = useLoad(() => searchAll(q), [q])
  const d = s.data
  return (<>
    <h1 className="cx-title">Hasil pencarian</h1>
    <p className="cx-muted">Kata kunci: <b>{q}</b></p>
    {s.loading && <p className="cx-muted">Mencari…</p>}
    {s.error && <p className="cx-muted">Pencarian gagal. Coba lagi.</p>}
    {d && !d.posts.length && !d.events.length && <p className="cx-muted">Tidak ada hasil yang cocok.</p>}
    {d?.events.length > 0 && <Block title="Agenda"><div className="cx-grid">{d.events.map((e) => <AgendaCard key={e.id} e={e} />)}</div></Block>}
    {d?.posts.length > 0 && <Block title="Berita dan pengumuman"><div className="cx-grid">{d.posts.map((p) => <PostCard key={p.id} p={p} />)}</div></Block>}
  </>)
}

/* Router halaman selain beranda */
export function Pages({ route }) {
  const [, seg, arg] = route.split('/')
  const a = arg ? decodeURIComponent(arg) : ''
  let page
  if (seg === 'berita') page = <PostListPage kind="berita" />
  else if (seg === 'pengumuman') page = <PostListPage kind="pengumuman" />
  else if (seg === 'agenda') page = <AgendaPage />
  else if (seg === 'post') page = <PostDetail id={a} />
  else if (seg === 'cari') page = <SearchPage q={a} />
  else page = <p className="cx-muted">Halaman tidak ditemukan. <a href="#/">Ke beranda</a></p>
  return <section className="cx-page"><div className="container" key={seg + a}>{page}</div></section>
}
