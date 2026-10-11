import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, CheckSquare, PiggyBank, BarChart2, UserCircle } from 'lucide-react'
import ChatCoach from './components/ChatCoach'
import TaskPlanner from './components/TaskPlanner'
import SavingsPool from './components/SavingsPool'
import StatsPanel from './components/StatsPanel'
import ProfilePanel from './components/ProfilePanel'

type Tab = 'coach' | 'tasks' | 'savings' | 'stats' | 'profile'

const TABS: { id: Tab; label: string; Icon: typeof MessageCircle }[] = [
  { id: 'coach',   label: 'Koç',     Icon: MessageCircle },
  { id: 'tasks',   label: 'Görevler', Icon: CheckSquare },
  { id: 'savings', label: 'Birikim', Icon: PiggyBank },
  { id: 'stats',   label: 'İstatistik', Icon: BarChart2 },
  { id: 'profile', label: 'Profil',  Icon: UserCircle },
]

const GREETINGS = [
  { hour: 0,  text: 'İyi geceler',         sub: 'Dinlen, yarın da devam edersin.' },
  { hour: 5,  text: 'Günaydın',            sub: 'Yeni bir güne güzel başla.' },
  { hour: 12, text: 'İyi öğleden sonralar', sub: 'Öğleden bu yana çok şey yaptın.' },
  { hour: 17, text: 'İyi akşamlar',        sub: 'Eve dönerken koçun burada.' },
  { hour: 21, text: 'İyi geceler',         sub: 'Bugün de harikalar yarattın.' },
]

function getGreeting() {
  const h = new Date().getHours()
  for (let i = GREETINGS.length - 1; i >= 0; i--) {
    if (h >= GREETINGS[i].hour) return GREETINGS[i]
  }
  return GREETINGS[0]
}

const greeting = getGreeting()

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('coach')

  return (
    <div
      className="relative min-h-dvh overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #fdf8f5 0%, #fffcf7 52%, #fef6f0 100%)' }}
    >
      {/* Arka plan blob'ları */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '4%', left: '-5%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(194,96,63,0.13) 0%, transparent 70%)', filter: 'blur(64px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-8%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,232,208,0.50) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', top: '45%', right: '10%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(133,177,237,0.10) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      </div>

      {/* İçerik */}
      <div className="relative z-10 mx-auto max-w-md flex flex-col min-h-dvh">

        {/* Header */}
        <header className="px-4 pt-5 pb-2 flex items-start justify-between">
          <div>
            <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}>
              MomCoach
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
              {greeting.text} — {greeting.sub}
            </p>
          </div>
          <div
            className="mt-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(194,96,63,0.10)', border: '1px solid rgba(194,96,63,0.20)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Aktif</span>
          </div>
        </header>

        {/* Ana içerik */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute inset-0 overflow-y-auto"
            >
              {activeTab === 'coach'   && <ChatCoach />}
              {activeTab === 'tasks'   && <TaskPlanner />}
              {activeTab === 'savings' && <SavingsPool />}
              {activeTab === 'stats'   && <StatsPanel />}
              {activeTab === 'profile' && <ProfilePanel />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Alt navigasyon */}
        <nav
          className="px-2 py-2"
          style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderTop: '1px solid rgba(255,255,255,0.80)',
            boxShadow: '0 -4px 20px rgba(45,27,14,0.06)',
          }}
        >
          <div className="flex items-center justify-around">
            {TABS.map(({ id, label, Icon }) => {
              const active = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-2xl transition-all min-w-0 flex-1"
                  style={{
                    color: active ? 'var(--accent)' : 'var(--subtle)',
                    background: active ? 'rgba(194,96,63,0.08)' : 'transparent',
                  }}
                >
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.7} />
                  <span className="text-xs font-semibold leading-none" style={{ fontSize: 10 }}>
                    {label}
                  </span>
                  {active && (
                    <motion.div
                      layoutId="nav-dot"
                      className="w-1 h-1 rounded-full mt-0.5"
                      style={{ background: 'var(--accent)' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </nav>

      </div>
    </div>
  )
}
