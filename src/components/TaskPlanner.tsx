import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, Trash2, Clock, ChevronDown } from 'lucide-react'

type Category = 'ev' | 'is' | 'cocuk' | 'ben'

interface Task {
  id: string
  text: string
  category: Category
  done: boolean
  priority: 'high' | 'normal'
  createdAt: number
}

const CATEGORY_META: Record<Category, { label: string; color: string; bg: string }> = {
  ev: { label: 'Ev', color: '#c2603f', bg: 'rgba(194,96,63,0.10)' },
  is: { label: 'İş', color: '#2d6a9f', bg: 'rgba(45,106,159,0.10)' },
  cocuk: { label: 'Çocuklar', color: '#2d8a5e', bg: 'rgba(45,138,94,0.10)' },
  ben: { label: 'Benim İçin', color: '#7b4fa2', bg: 'rgba(123,79,162,0.10)' },
}

const SMART_SUGGESTIONS: Record<Category, string[]> = {
  ev: ['Yemek pişir', 'Çamaşır yıka', 'Bulaşık yıka', 'Ütü yap', 'Evi topla', 'Market alışverişi'],
  is: ['E-postaları kontrol et', 'Rapor hazırla', 'Toplantı notları', 'Dosyaları düzenle'],
  cocuk: ['Ödev kontrolü', 'Çanta hazırla', 'Kitap oku', 'Oyun oyna', 'Uyku rutini'],
  ben: ['Vakit Namazını kıl', 'Kısa yürüyüş', 'Kitap oku', 'Arkadaşı ara', 'Banyo keyfi'],
}

const glass = {
  card: {
    background: 'rgba(255,255,255,0.70)',
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    border: '1px solid rgba(255,255,255,0.70)',
    boxShadow: '0 4px 24px rgba(45,27,14,0.06)',
  } as React.CSSProperties,
}

export default function TaskPlanner() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const now = Date.now()
    return [
      { id: '1', text: 'Çamaşır yıka', category: 'ev', done: false, priority: 'normal', createdAt: now - 3600000 },
      { id: '2', text: 'Matematik ödevi kontrolü', category: 'cocuk', done: false, priority: 'high', createdAt: now - 1800000 },
      { id: '3', text: 'Akşam yemeği', category: 'ev', done: true, priority: 'high', createdAt: now - 7200000 },
    ]
  })
  const [newText, setNewText] = useState('')
  const [newCategory, setNewCategory] = useState<Category>('ev')
  const [newPriority, setNewPriority] = useState<'high' | 'normal'>('normal')
  const [showAdd, setShowAdd] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeFilter, setActiveFilter] = useState<Category | 'all'>('all')

  const add = (text: string = newText) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const task: Task = {
      id: Date.now().toString(),
      text: trimmed,
      category: newCategory,
      done: false,
      priority: newPriority,
      createdAt: Date.now(),
    }
    setTasks((prev) => [task, ...prev])
    setNewText('')
    setShowAdd(false)
    setShowSuggestions(false)
  }

  const toggle = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const remove = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id))

  const filtered = tasks.filter((t) => activeFilter === 'all' || t.category === activeFilter)
  const pending = filtered.filter((t) => !t.done)
  const done = filtered.filter((t) => t.done)
  const totalDone = tasks.filter((t) => t.done).length
  const total = tasks.length

  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      {/* İlerleme */}
      <div className="rounded-2xl p-4" style={glass.card}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--ink-2)' }}>
            Bugünkü ilerleme
          </span>
          <span className="text-xs font-semibold mono tabular-nums" style={{ color: 'var(--accent)' }}>
            {totalDone}/{total}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--warm-1)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, var(--accent), #e08050)' }}
            initial={{ width: 0 }}
            animate={{ width: total > 0 ? `${(totalDone / total) * 100}%` : '0%' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        {totalDone === total && total > 0 && (
          <p className="text-xs mt-2 text-center font-medium" style={{ color: 'var(--success)' }}>
            Harika! Hepsini tamamladın!
          </p>
        )}
      </div>

      {/* Kategori filtresi */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveFilter('all')}
          className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all"
          style={{
            background: activeFilter === 'all' ? 'var(--accent)' : 'rgba(255,255,255,0.70)',
            color: activeFilter === 'all' ? 'white' : 'var(--muted)',
            border: '1px solid',
            borderColor: activeFilter === 'all' ? 'transparent' : 'var(--border)',
          }}
        >
          Tümü
        </button>
        {(Object.entries(CATEGORY_META) as [Category, typeof CATEGORY_META[Category]][]).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all"
            style={{
              background: activeFilter === key ? meta.color : 'rgba(255,255,255,0.70)',
              color: activeFilter === key ? 'white' : meta.color,
              border: `1px solid ${activeFilter === key ? 'transparent' : meta.color + '40'}`,
            }}
          >
            {meta.label}
          </button>
        ))}
      </div>

      {/* Görev ekle */}
      <div>
        <button
          onClick={() => { setShowAdd(!showAdd); setShowSuggestions(false) }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all"
          style={{
            background: showAdd ? 'var(--accent)' : 'rgba(194,96,63,0.08)',
            color: showAdd ? 'white' : 'var(--accent)',
            border: '1.5px dashed',
            borderColor: showAdd ? 'transparent' : 'rgba(194,96,63,0.30)',
          }}
        >
          <Plus size={16} />
          Görev Ekle
        </button>

        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 rounded-2xl p-4 space-y-3" style={glass.card}>
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && add()}
                  placeholder="Ne yapman gerekiyor?"
                  autoFocus
                  className="w-full bg-transparent text-sm outline-none py-1"
                  style={{ color: 'var(--ink)', fontFamily: 'DM Sans, sans-serif', borderBottom: '1px solid var(--border)' }}
                />

                {/* Kategori + Öncelik */}
                <div className="flex gap-2 flex-wrap">
                  {(Object.entries(CATEGORY_META) as [Category, typeof CATEGORY_META[Category]][]).map(([key, meta]) => (
                    <button
                      key={key}
                      onClick={() => setNewCategory(key)}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                      style={{
                        background: newCategory === key ? meta.color : meta.bg,
                        color: newCategory === key ? 'white' : meta.color,
                      }}
                    >
                      {meta.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  {(['high', 'normal'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setNewPriority(p)}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                      style={{
                        background: newPriority === p ? 'var(--ink)' : 'var(--warm-1)',
                        color: newPriority === p ? 'white' : 'var(--muted)',
                      }}
                    >
                      {p === 'high' ? 'Öncelikli' : 'Normal'}
                    </button>
                  ))}

                  {/* Hızlı öneriler */}
                  <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="ml-auto px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                    style={{ color: 'var(--muted)', background: 'var(--warm-1)' }}
                  >
                    Öneriler <ChevronDown size={11} />
                  </button>
                </div>

                <AnimatePresence>
                  {showSuggestions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-wrap gap-1.5">
                        {SMART_SUGGESTIONS[newCategory].map((s) => (
                          <button
                            key={s}
                            onClick={() => add(s)}
                            className="px-2.5 py-1 rounded-full text-xs border transition-all"
                            style={{
                              color: CATEGORY_META[newCategory].color,
                              borderColor: CATEGORY_META[newCategory].color + '40',
                              background: CATEGORY_META[newCategory].bg,
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => add()}
                  disabled={!newText.trim()}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                  style={{ background: 'var(--accent)', color: 'white' }}
                >
                  Ekle
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bekleyen görevler */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-widest uppercase px-1" style={{ color: 'var(--subtle)', letterSpacing: '0.08em' }}>
            Bekleyen · {pending.length}
          </p>
          <AnimatePresence>
            {pending
              .sort((a, b) => (b.priority === 'high' ? 1 : 0) - (a.priority === 'high' ? 1 : 0))
              .map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={glass.card}
                >
                  <button
                    onClick={() => toggle(task.id)}
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ borderColor: CATEGORY_META[task.category].color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>
                      {task.priority === 'high' && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 mb-0.5" style={{ background: 'var(--accent)' }} />
                      )}
                      {task.text}
                    </p>
                    <span
                      className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                      style={{ background: CATEGORY_META[task.category].bg, color: CATEGORY_META[task.category].color }}
                    >
                      {CATEGORY_META[task.category].label}
                    </span>
                  </div>
                  <button onClick={() => remove(task.id)} className="p-1 rounded-lg flex-shrink-0" style={{ color: 'var(--subtle)' }}>
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      )}

      {/* Tamamlanan görevler */}
      {done.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-widest uppercase px-1" style={{ color: 'var(--subtle)', letterSpacing: '0.08em' }}>
            Tamamlanan · {done.length}
          </p>
          <AnimatePresence>
            {done.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 opacity-60"
                style={{ background: 'rgba(255,255,255,0.40)', border: '1px solid rgba(255,255,255,0.50)' }}
              >
                <button
                  onClick={() => toggle(task.id)}
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: CATEGORY_META[task.category].color }}
                >
                  <Check size={11} color="white" />
                </button>
                <p className="text-sm flex-1 line-through" style={{ color: 'var(--muted)' }}>
                  {task.text}
                </p>
                <Clock size={12} style={{ color: 'var(--subtle)', flexShrink: 0 }} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {pending.length === 0 && done.length === 0 && (
        <div className="text-center py-10" style={{ color: 'var(--subtle)' }}>
          <p className="text-sm">Henüz görev eklenmedi.</p>
          <p className="text-xs mt-1">Bugünkü ilk görevini ekle!</p>
        </div>
      )}
    </div>
  )
}
