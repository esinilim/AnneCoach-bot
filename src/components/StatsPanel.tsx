import { motion } from 'framer-motion'
import { CheckCircle, TrendingUp, Heart, Star } from 'lucide-react'
import { ConnectKitButton } from 'connectkit'
import { useAccount, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { getUsdc } from '@/onchain-facts'
import { Amount, usdcDecimalsFor } from '@/onchain-money'

const TARGET_CHAIN_ID = 5042002
const usdcFact = getUsdc(TARGET_CHAIN_ID)

const glass = {
  card: {
    background: 'rgba(255,255,255,0.70)',
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    border: '1px solid rgba(255,255,255,0.70)',
    boxShadow: '0 4px 24px rgba(45,27,14,0.06)',
  } as React.CSSProperties,
}

const MOTIVATIONAL_QUOTES = [
  'Her tamamlanan görev, sana bir adım daha yaklaştırır.',
  'Küçük adımlar büyük yolculuklar yaratır.',
  'Bugün bitirdiğin, yarın özgürlüğündür.',
  'Sen zaten yapabiliyorsun — kanıtı listenin altında.',
]

const TODAY_DAY = new Date().getDay()
const QUOTE = MOTIVATIONAL_QUOTES[TODAY_DAY % MOTIVATIONAL_QUOTES.length]
const TODAY_BAR = TODAY_DAY === 0 ? 6 : TODAY_DAY - 1

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  accent?: boolean
}

function StatCard({ icon, label, value, sub, accent }: StatCardProps) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        ...glass.card,
        background: accent
          ? 'linear-gradient(135deg, rgba(194,96,63,0.12) 0%, rgba(253,232,208,0.50) 100%)'
          : 'rgba(255,255,255,0.70)',
        border: accent ? '1px solid rgba(194,96,63,0.22)' : '1px solid rgba(255,255,255,0.70)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: accent ? 'rgba(194,96,63,0.15)' : 'var(--warm-1)' }}
        >
          {icon}
        </div>
        <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>{label}</span>
      </div>
      <p className="display text-2xl font-bold tabular-nums" style={{ color: accent ? 'var(--accent)' : 'var(--ink)' }}>
        {value}
      </p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--subtle)' }}>{sub}</p>}
    </div>
  )
}

export default function StatsPanel() {
  const { address, isConnected } = useAccount()

  const { data: balanceRaw } = useReadContract(
    address && usdcFact
      ? {
          address: usdcFact.address as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
          chainId: TARGET_CHAIN_ID,
        }
      : undefined,
  )

  const balance =
    balanceRaw != null
      ? Amount.fromRaw(balanceRaw, usdcDecimalsFor(TARGET_CHAIN_ID)).toFixed(2)
      : null

  return (
    <div className="px-4 pt-4 pb-6 space-y-4">

      {/* Başlık */}
      <div
        className="rounded-3xl p-5"
        style={{
          background: 'linear-gradient(135deg, #c2603f 0%, #a84e30 100%)',
          boxShadow: '0 8px 32px rgba(194,96,63,0.25)',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl"
          style={{ background: 'linear-gradient(90deg, #5fbeff, #af8ff4, #f05c6b, #ffcd83, #7ef1b3)' }}
        />
        <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">
          Bugünkü Özet
        </p>
        <p className="display text-3xl font-bold text-white">Harikasın!</p>
        <p className="text-sm text-white/70 mt-1">{QUOTE}</p>
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<CheckCircle size={16} style={{ color: 'var(--success)' }} />}
          label="Görev Tamamlandı"
          value="3"
          sub="Bugün"
          accent={false}
        />
        <StatCard
          icon={<TrendingUp size={16} style={{ color: 'var(--accent)' }} />}
          label="Seri"
          value="7 Gün"
          sub="Kesintisiz"
          accent={true}
        />
        <StatCard
          icon={<Heart size={16} style={{ color: '#e05c8c' }} />}
          label="Koç Sohbeti"
          value="12"
          sub="Bu hafta"
          accent={false}
        />
        <StatCard
          icon={<Star size={16} style={{ color: '#f0a030' }} />}
          label="Öncelikli Görev"
          value="5"
          sub="Tamamlanan"
          accent={false}
        />
      </div>

      {/* USDC bakiye kartı */}
      <div className="rounded-3xl p-5" style={glass.card}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--subtle)', letterSpacing: '0.08em' }}>
          Kendine Zaman Havuzu
        </p>
        {!isConnected ? (
          <div className="text-center space-y-3 py-2">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Birikim bakiyeni görmek için cüzdanını bağla
            </p>
            <div className="flex justify-center">
              <ConnectKitButton />
            </div>
          </div>
        ) : balance !== null ? (
          <div className="flex items-end justify-between">
            <div>
              <p className="display text-3xl font-bold tabular-nums" style={{ color: 'var(--accent)' }}>
                ${balance}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Arc Testnet USDC</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold" style={{ color: 'var(--success)' }}>Aktif</p>
              <p className="text-xs" style={{ color: 'var(--subtle)' }}>Cüzdan bağlı</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-center py-2" style={{ color: 'var(--muted)' }}>
            Yükleniyor...
          </p>
        )}
      </div>

      {/* Haftalık ilerleme */}
      <div className="rounded-3xl p-5" style={glass.card}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--subtle)', letterSpacing: '0.08em' }}>
          Bu Hafta
        </p>
        <div className="flex gap-1.5 items-end">
          {[4, 7, 3, 8, 5, 6, 3].map((val, i) => {
            const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
            const isToday = i === TODAY_BAR
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  className="w-full rounded-lg"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: 'easeOut' }}
                  style={{
                    originY: 1,
                    height: val * 6,
                    background: isToday ? 'linear-gradient(180deg, #c2603f, #e08050)' : 'var(--warm-1)',
                    border: isToday ? '1px solid rgba(194,96,63,0.30)' : 'none',
                  }}
                />
                <span className="text-xs" style={{ color: isToday ? 'var(--accent)' : 'var(--subtle)', fontWeight: isToday ? 700 : 400 }}>
                  {days[i]}
                </span>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-center mt-3" style={{ color: 'var(--subtle)' }}>
          Tamamlanan görev sayısı (örnek veri)
        </p>
      </div>

    </div>
  )
}
