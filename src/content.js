import { supabase, todayJakarta } from './supabase.js'

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })

const short = (d) =>
  new Date(d + 'T00:00:00+07:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', timeZone: 'Asia/Jakarta' })

export const fmtRange = (a, b) => {
  if (!b || a === b) return `${short(a)} ${a.slice(0, 4)}`
  return `${short(a)} – ${short(b)} ${b.slice(0, 4)}`
}

export const excerpt = (body, n = 140) => {
  const t = (body || '').replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n).trimEnd() + '…' : t
}

const POST_COLS = 'id, kind, title, body, image_url, author_name, published_at, views'
const EVENT_COLS = 'id, title, starts_on, ends_on, time_text, location'

export async function listPosts({ kind, limit = 6, from = 0 } = {}) {
  let q = supabase.from('posts').select(POST_COLS).eq('published', true)
    .order('published_at', { ascending: false }).range(from, from + limit - 1)
  if (kind) q = q.eq('kind', kind)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function getPost(id) {
  const { data, error } = await supabase.from('posts').select(POST_COLS).eq('id', id).eq('published', true).maybeSingle()
  if (error) throw error
  return data
}

// Hitung views sekali per sesi browser per tulisan.
export function countView(id) {
  try {
    const key = `viewed:${id}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
  } catch { /* abaikan */ }
  supabase.rpc('increment_post_views', { p_id: id })
}

export async function listEvents({ limit = 6 } = {}) {
  const { data, error } = await supabase.from('events').select(EVENT_COLS).eq('published', true)
    .gte('ends_on', todayJakarta()).order('starts_on', { ascending: true }).limit(limit)
  if (error) throw error
  return data ?? []
}

const clean = (q) => q.replace(/[,()%*\\]/g, ' ').trim()

export async function searchAll(q) {
  const t = clean(q)
  if (!t) return { posts: [], events: [] }
  const [p, e] = await Promise.all([
    supabase.from('posts').select(POST_COLS).eq('published', true)
      .or(`title.ilike.%${t}%,body.ilike.%${t}%`).order('published_at', { ascending: false }).limit(20),
    supabase.from('events').select(EVENT_COLS).eq('published', true)
      .or(`title.ilike.%${t}%,location.ilike.%${t}%`).order('starts_on', { ascending: false }).limit(20),
  ])
  return { posts: p.data ?? [], events: e.data ?? [] }
}
