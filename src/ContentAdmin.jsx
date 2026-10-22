import { useEffect, useState } from 'react'
import { supabase, todayJakarta } from './supabase.js'
import { fmtDate, fmtRange } from './content.js'

// Perkecil foto sebelum diunggah (maks 1280px, JPEG) supaya hemat penyimpanan.
async function compress(file, max = 1280) {
  const bmp = await createImageBitmap(file)
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s)
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  return new Promise((r) => c.toBlob(r, 'image/jpeg', 0.82))
}

const jakartaDate = (ts) => new Date(ts).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

/* ---------- Berita & Pengumuman ---------- */
function PostsAdmin({ profile }) {
  const blank = { id: null, kind: 'berita', title: '', body: '', image_url: '', author_name: profile.full_name || '',
    published: true, date: todayJakarta(), origDate: null, origTs: null }
  const [list, setList] = useState([])
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    const { data } = await supabase.from('posts')
      .select('id, kind, title, body, image_url, author_name, published, published_at, views')
      .order('published_at', { ascending: false }).limit(100)
    setList(data ?? [])
  }
  useEffect(() => { load() }, [])

  const edit = (p) => setForm({ id: p.id, kind: p.kind, title: p.title, body: p.body, image_url: p.image_url ?? '',
    author_name: p.author_name ?? '', published: p.published, date: jakartaDate(p.published_at),
    origDate: jakartaDate(p.published_at), origTs: p.published_at })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const upload = async (file) => {
    if (!file) return
    setBusy(true); setMsg('')
    try {
      const blob = await compress(file)
      const path = `posts/${crypto.randomUUID()}.jpg`
      const { error } = await supabase.storage.from('media').upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' })
      if (error) throw error
      set('image_url', supabase.storage.from('media').getPublicUrl(path).data.publicUrl)
    } catch { setMsg('Gagal mengunggah gambar.') }
    setBusy(false)
  }

  const save = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setMsg('Judul wajib diisi.'); return }
    setBusy(true); setMsg('')
    let published_at
    if (form.origTs && form.date === form.origDate) published_at = form.origTs
    else if (form.date === todayJakarta()) published_at = new Date().toISOString()
    else published_at = `${form.date}T08:00:00+07:00`
    const row = { kind: form.kind, title: form.title.trim(), body: form.body, image_url: form.image_url || null,
      author_name: form.author_name.trim() || null, published: form.published, published_at }
    const { error } = form.id
      ? await supabase.from('posts').update(row).eq('id', form.id)
      : await supabase.from('posts').insert(row)
    if (error) setMsg('Gagal menyimpan.')
    else { setForm(null); await load() }
    setBusy(false)
  }

  const remove = async (p) => {
    if (!window.confirm(`Hapus "${p.title}"?`)) return
    await supabase.from('posts').delete().eq('id', p.id)
    await load()
  }

  if (form) return (
    <form className="pt-card ca-form" onSubmit={save}>
      <h3>{form.id ? 'Ubah tulisan' : 'Tulisan baru'}</h3>
      <label>Jenis
        <select value={form.kind} onChange={(e) => set('kind', e.target.value)}>
          <option value="berita">Berita</option><option value="pengumuman">Pengumuman</option>
        </select>
      </label>
      <label>Judul<input value={form.title} onChange={(e) => set('title', e.target.value)} required /></label>
      <label>Isi (pisahkan paragraf dengan baris kosong)
        <textarea className="pt-textarea" rows="9" value={form.body} onChange={(e) => set('body', e.target.value)} />
      </label>
      <label>Gambar (opsional)
        <input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0])} />
      </label>
      {form.image_url && (<div className="ca-preview">
        <img src={form.image_url} alt="" />
        <button type="button" className="pt-link" onClick={() => set('image_url', '')}>Hapus gambar</button>
      </div>)}
      <label>Penulis<input value={form.author_name} onChange={(e) => set('author_name', e.target.value)} /></label>
      <label>Tanggal terbit<input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></label>
      <label className="ca-check"><input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} /> Tampilkan di website</label>
      {msg && <div className="pt-error">{msg}</div>}
      <div className="pt-actions">
        <button className="pt-btn" disabled={busy}>{busy ? 'Memproses…' : 'Simpan'}</button>
        <button type="button" className="pt-btn pt-btn-ghost" onClick={() => { setForm(null); setMsg('') }}>Batal</button>
      </div>
    </form>
  )

  return (<>
    <div className="pt-actions"><button className="pt-btn pt-btn-sm" onClick={() => setForm(blank)}>Tambah tulisan</button></div>
    <div className="pt-table-wrap">
      <table className="pt-table">
        <thead><tr><th>Judul</th><th>Jenis</th><th>Tanggal</th><th></th></tr></thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id}>
              <td>{p.title}{!p.published && <small className="pt-muted"> (disembunyikan)</small>}</td>
              <td>{p.kind}</td><td>{fmtDate(p.published_at)}</td>
              <td className="ca-row-actions">
                <button className="pt-link" onClick={() => edit(p)}>Ubah</button>
                <button className="pt-link" onClick={() => remove(p)}>Hapus</button>
              </td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan="4">Belum ada tulisan.</td></tr>}
        </tbody>
      </table>
    </div>
  </>)
}

/* ---------- Agenda ---------- */
function EventsAdmin() {
  const blank = { id: null, title: '', starts_on: todayJakarta(), ends_on: '', time_text: '', location: '', published: true }
  const [list, setList] = useState([])
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    const { data } = await supabase.from('events').select('*').order('starts_on', { ascending: false }).limit(100)
    setList(data ?? [])
  }
  useEffect(() => { load() }, [])
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setMsg('Nama agenda wajib diisi.'); return }
    const ends = form.ends_on || form.starts_on
    if (ends < form.starts_on) { setMsg('Tanggal selesai tidak boleh sebelum tanggal mulai.'); return }
    setBusy(true); setMsg('')
    const row = { title: form.title.trim(), starts_on: form.starts_on, ends_on: ends,
      time_text: form.time_text.trim() || null, location: form.location.trim() || null, published: form.published }
    const { error } = form.id
      ? await supabase.from('events').update(row).eq('id', form.id)
      : await supabase.from('events').insert(row)
    if (error) setMsg('Gagal menyimpan.')
    else { setForm(null); await load() }
    setBusy(false)
  }

  const remove = async (ev) => {
    if (!window.confirm(`Hapus agenda "${ev.title}"?`)) return
    await supabase.from('events').delete().eq('id', ev.id)
    await load()
  }

  if (form) return (
    <form className="pt-card ca-form" onSubmit={save}>
      <h3>{form.id ? 'Ubah agenda' : 'Agenda baru'}</h3>
      <label>Nama agenda<input value={form.title} onChange={(e) => set('title', e.target.value)} required /></label>
      <label>Tanggal mulai<input type="date" value={form.starts_on} onChange={(e) => set('starts_on', e.target.value)} required /></label>
      <label>Tanggal selesai (kosongkan jika satu hari)<input type="date" value={form.ends_on} onChange={(e) => set('ends_on', e.target.value)} /></label>
      <label>Waktu (contoh: 08.00 s.d. selesai)<input value={form.time_text} onChange={(e) => set('time_text', e.target.value)} /></label>
      <label>Tempat<input value={form.location} onChange={(e) => set('location', e.target.value)} /></label>
      <label className="ca-check"><input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} /> Tampilkan di website</label>
      {msg && <div className="pt-error">{msg}</div>}
      <div className="pt-actions">
        <button className="pt-btn" disabled={busy}>{busy ? 'Memproses…' : 'Simpan'}</button>
        <button type="button" className="pt-btn pt-btn-ghost" onClick={() => { setForm(null); setMsg('') }}>Batal</button>
      </div>
    </form>
  )

  return (<>
    <div className="pt-actions"><button className="pt-btn pt-btn-sm" onClick={() => setForm(blank)}>Tambah agenda</button></div>
    <div className="pt-table-wrap">
      <table className="pt-table">
        <thead><tr><th>Agenda</th><th>Tanggal</th><th></th></tr></thead>
        <tbody>
          {list.map((ev) => (
            <tr key={ev.id}>
              <td>{ev.title}{!ev.published && <small className="pt-muted"> (disembunyikan)</small>}</td>
              <td>{fmtRange(ev.starts_on, ev.ends_on)}</td>
              <td className="ca-row-actions">
                <button className="pt-link" onClick={() => setForm({ ...ev, ends_on: ev.ends_on === ev.starts_on ? '' : ev.ends_on, time_text: ev.time_text ?? '', location: ev.location ?? '' })}>Ubah</button>
                <button className="pt-link" onClick={() => remove(ev)}>Hapus</button>
              </td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan="3">Belum ada agenda.</td></tr>}
        </tbody>
      </table>
    </div>
  </>)
}

export default function ContentAdmin({ profile }) {
  const [sub, setSub] = useState('posts')
  return (<>
    <div className="pt-tabs">
      <button className={sub === 'posts' ? 'pt-tab active' : 'pt-tab'} onClick={() => setSub('posts')}>Berita & pengumuman</button>
      <button className={sub === 'events' ? 'pt-tab active' : 'pt-tab'} onClick={() => setSub('events')}>Agenda</button>
    </div>
    {sub === 'posts' ? <PostsAdmin profile={profile} /> : <EventsAdmin />}
  </>)
}
