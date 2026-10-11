import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Baby, Briefcase, Send, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface Profile {
  name: string
  job: string
  childCount: number
  childGrades: string
  telegramHandle: string
}

const DEFAULT_PROFILE: Profile = {
  name: '',
  job: 'Kamu Görevlisi',
  childCount: 2,
  childGrades: '1. ve 2. Sınıf',
  telegramHandle: '',
}

const PRAYER_TIMES = [
  { name: 'İmsak', time: '05:12', passed: false },
  { name: 'Güneş', time: '06:41', passed: false },
  { name: 'Öğle', time: '12:48', passed: false },
  { name: 'İkindi', time: '16:12', passed: false },
  { name: 'Akşam', time: '18:52', passed: false },
  { name: 'Yatsı', time: '20:18', passed: false },
]

const glass = {
  card: {
    background: 'rgba(255,255,255,0.70)',
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    border: '1px solid rgba(255,255,255,0.70)',
    boxShadow: '0 4px 24px rgba(45,27,14,0.06)',
  } as React.CSSProperties,
}

function getNextPrayer(times: typeof PRAYER_TIMES) {
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  for (const p of times) {
    const [h, m] = p.time.split(':').map(Number)
    if (h * 60 + m > nowMin) return p.name
  }
  return times[0].name
}

function markPassed(times: typeof PRAYER_TIMES) {
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  return times.map((p) => {
    const [h, m] = p.time.split(':').map(Number)
    return { ...p, passed: h * 60 + m < nowMin }
  })
}

const COMPUTED_TIMES = markPassed(PRAYER_TIMES)
const NEXT_PRAYER = getNextPrayer(PRAYER_TIMES)

export default function ProfilePanel() {
  const [profile, setProfile] = useState<Profile>(() => {
    try {
      const saved = localStorage.getItem('momcoach_profile')
      return saved ? (JSON.parse(saved) as Profile) : DEFAULT_PROFILE
    } catch {
      return DEFAULT_PROFILE
    }
  })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Profile>(profile)

  useEffect(() => {
    try {
      localStorage.setItem('momcoach_profile', JSON.stringify(profile))
    } catch {
      // storage unavailable
    }
  }, [profile])

  const save = () => {
    setProfile(draft)
    setEditing(false)
    toast.success('Profil kaydedildi')
  }

  return (
    <div className="px-4 pt-4 pb-6 space-y-4">

      {/* Profil kartı */}
      <div className="rounded-3xl p-5" style={glass.card}>
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #c2603f, #e08050)' }}
          >
            <User size={24} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="display text-lg font-bold truncate" style={{ color: 'var(--ink)' }}>
              {profile.name || 'Adını ekle'}
            </p>
            <p className="text-sm truncate" style={{ color: 'var(--muted)' }}>{profile.job}</p>
          </div>
          <button
            onClick={() => { setDraft(profile); setEditing(!editing) }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            {editing ? 'İptal' : 'Düzenle'}
          </button>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 rounded-2xl p-3 text-center" style={{ background: 'var(--warm-1)' }}>
            <Baby size={16} style={{ color: 'var(--accent)', margin: '0 auto 4px' }} />
            <p className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>{profile.childCount} Çocuk</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{profile.childGrades}</p>
          </div>
          <div className="flex-1 rounded-2xl p-3 text-center" style={{ background: 'var(--warm-1)' }}>
            <Briefcase size={16} style={{ color: 'var(--accent)', margin: '0 auto 4px' }} />
            <p className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>Meslek</p>
            <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{profile.job}</p>
          </div>
        </div>

        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-3 overflow-hidden"
          >
            {[
              { label: 'Adın', key: 'name', placeholder: 'Adın...' },
              { label: 'Meslek', key: 'job', placeholder: 'Kamu Görevlisi...' },
              { label: 'Çocuk Sınıfları', key: 'childGrades', placeholder: '1. ve 2. Sınıf' },
              { label: 'Telegram (@kullanıcı)', key: 'telegramHandle', placeholder: '@adın' },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--muted)' }}>
                  {field.label}
                </label>
                <input
                  type="text"
                  value={draft[field.key as keyof Profile] as string}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.80)',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--ink)',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                />
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--muted)' }}>
                Çocuk Sayısı
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setDraft((prev) => ({ ...prev, childCount: n }))}
                    className="w-10 h-10 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: draft.childCount === n ? 'var(--accent)' : 'var(--warm-1)',
                      color: draft.childCount === n ? 'white' : 'var(--muted)',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={save}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              Kaydet
            </button>
          </motion.div>
        )}
      </div>

      {/* Namaz vakitleri */}
      <div className="rounded-3xl p-5 space-y-3" style={glass.card}>
        <div className="flex items-center justify-between mb-1">
          <p className="display text-base font-bold" style={{ color: 'var(--ink)' }}>Namaz Vakitleri</p>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(194,96,63,0.10)', color: 'var(--accent)' }}
          >
            Sonraki: {NEXT_PRAYER}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {COMPUTED_TIMES.map((p) => {
            const isNext = p.name === NEXT_PRAYER
            return (
              <div
                key={p.name}
                className="rounded-2xl p-3 text-center"
                style={{
                  background: isNext
                    ? 'linear-gradient(135deg, #c2603f, #e08050)'
                    : p.passed
                    ? 'rgba(255,255,255,0.40)'
                    : 'var(--warm-1)',
                  opacity: p.passed && !isNext ? 0.55 : 1,
                }}
              >
                <p
                  className="text-xs font-semibold"
                  style={{ color: isNext ? 'rgba(255,255,255,0.85)' : 'var(--muted)' }}
                >
                  {p.name}
                </p>
                <p
                  className="text-sm font-bold tabular-nums mt-0.5"
                  style={{ color: isNext ? 'white' : 'var(--ink)' }}
                >
                  {p.time}
                </p>
                {p.passed && !isNext && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--subtle)' }}>Geçti</p>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-xs text-center" style={{ color: 'var(--subtle)' }}>
          Vakitler örnek — konum izni ile gerçek vakitler yakında geliyor
        </p>
      </div>

      {/* Telegram bağlantısı */}
      <div className="rounded-3xl p-5" style={glass.card}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(0,136,204,0.12)' }}
          >
            <Send size={18} style={{ color: '#0088cc' }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Telegram Bot</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Koçuna Telegram'dan da ulaş</p>
          </div>
        </div>
        <div
          className="rounded-2xl p-4 text-center space-y-2"
          style={{ background: 'var(--warm-1)', border: '1px dashed rgba(194,96,63,0.25)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--ink-2)' }}>
            MomCoach Telegram Botu yakında aktif oluyor.
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Bot hazır olduğunda buradan bağlanabilirsin.
          </p>
          <a
            href="https://t.me/AnneCoach_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ background: '#0088cc', color: 'white' }}
          >
            Telegram'ı Aç <ExternalLink size={11} />
          </a>
        </div>
        {profile.telegramHandle && (
          <p className="text-xs text-center mt-2" style={{ color: 'var(--muted)' }}>
            Hesabın: <span className="font-semibold" style={{ color: 'var(--accent)' }}>{profile.telegramHandle}</span>
          </p>
        )}
      </div>

    </div>
  )
}
