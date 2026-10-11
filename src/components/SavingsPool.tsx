import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, ArrowUpRight, Sparkles, Info, ExternalLink } from 'lucide-react'
import { ConnectKitButton } from 'connectkit'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { erc20Abi } from 'viem'
import { getUsdc, buildTxExplorerUrl } from '@/onchain-facts'
import { parseAmount, usdcDecimalsFor, Amount } from '@/onchain-money'

const TARGET_CHAIN_ID = 5042002 // Arc Testnet

const usdcFact = getUsdc(TARGET_CHAIN_ID)

const glass = {
  card: {
    background: 'rgba(255,255,255,0.70)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.72)',
    boxShadow: '0 8px 32px rgba(45,27,14,0.07), inset 0 1px 0 rgba(255,255,255,0.6)',
  } as React.CSSProperties,
}

const GOALS = [
  { label: 'Spa randevusu', amount: 5, icon: '✦' },
  { label: 'Kitapçı keyfi', amount: 10, icon: '◆' },
  { label: 'Kurs ücreti', amount: 20, icon: '▲' },
  { label: 'Hafta sonu kaçamağı', amount: 50, icon: '★' },
]


function parseOnchainError(error: unknown): string {
  const msg = (error as { message?: string })?.message?.toLowerCase() ?? ''
  if (msg.includes('user rejected') || msg.includes('4001')) return 'İşlem iptal edildi.'
  if (msg.includes('insufficient')) return 'Yetersiz bakiye.'
  if (msg.includes('reverted')) return 'İşlem başarısız. Tekrar dene.'
  if (msg.includes('network') || msg.includes('timeout')) return 'Ağ hatası. Bağlantını kontrol et.'
  return 'Bir hata oluştu. Tekrar dene.'
}

export default function SavingsPool() {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()

  const [amount, setAmount] = useState('')
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null)
  const [savedTotal, setSavedTotal] = useState(0) // local tracker for demo
  const [showInfo, setShowInfo] = useState(false)

  const isWrongChain = isConnected && chainId !== TARGET_CHAIN_ID

  // USDC bakiyesi
  const { data: balanceRaw, refetch: refetchBalance } = useReadContract(
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

  const balance = balanceRaw != null
    ? Amount.fromRaw(balanceRaw, usdcDecimalsFor(TARGET_CHAIN_ID)).toFixed(2)
    : null

  const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const handleDeposit = () => {
    if (!usdcFact || !address) return
    if (isWrongChain) {
      switchChain({ chainId: TARGET_CHAIN_ID })
      return
    }

    let parsed
    try {
      parsed = parseAmount(TARGET_CHAIN_ID, amount)
    } catch {
      return
    }

    // Gerçek uygulamada POOL_ADDRESS bir akıllı kontrat olacak
    // Şimdilik kullanıcı kendi adresine biriktirir (self-custodial)
    writeContract({
      address: usdcFact.address as `0x${string}`,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [address, parsed.raw], // self-transfer demo
    })
  }

  // isSuccess sonrası
  if (isSuccess) {
    const deposited = parseFloat(amount) || 0
    setSavedTotal((prev) => prev + deposited)
    void refetchBalance()
    setAmount('')
    setSelectedGoal(null)
    resetWrite()
  }

  const setQuickAmount = (val: number, goalIdx: number) => {
    setAmount(val.toString())
    setSelectedGoal(goalIdx)
  }

  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      {/* Başlık kartı */}
      <div
        className="rounded-3xl p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #c2603f 0%, #a84e30 100%)',
          boxShadow: '0 8px 32px rgba(194,96,63,0.28)',
        }}
      >
        {/* Spectral strip */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl"
          style={{ background: 'linear-gradient(90deg, #5fbeff, #af8ff4, #f05c6b, #ffcd83, #7ef1b3)' }}
        />
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">
              Kendine Zaman Havuzu
            </p>
            <p className="display text-3xl font-bold text-white tabular-nums">
              ${savedTotal.toFixed(2)}
            </p>
            <p className="text-sm text-white/70 mt-0.5">Bu oturumda biriktirilen</p>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Sparkles size={22} color="white" />
          </div>
        </div>

        {balance !== null && (
          <div className="flex items-center gap-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.20)' }}>
            <Wallet size={14} color="rgba(255,255,255,0.70)" />
            <span className="text-sm text-white/70">
              Cüzdan: <span className="text-white font-semibold tabular-nums">{balance} USDC</span>
            </span>
          </div>
        )}
      </div>

      {/* Cüzdan bağla */}
      {!isConnected && (
        <div className="rounded-2xl p-5 text-center space-y-3" style={glass.card}>
          <Wallet size={28} style={{ color: 'var(--accent)', margin: '0 auto' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--ink-2)' }}>
            Birikimlerini onchain takip etmek için cüzdanını bağla
          </p>
          <div className="flex justify-center">
            <ConnectKitButton />
          </div>
        </div>
      )}

      {/* Yanlış zincir uyarısı */}
      {isWrongChain && (
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'rgba(186,43,76,0.08)', border: '1px solid rgba(186,43,76,0.25)' }}
        >
          <Info size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>Arc Testnet'e geç</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>USDC birikimi Arc Testnet üzerinde çalışır.</p>
          </div>
          <button
            onClick={() => switchChain({ chainId: TARGET_CHAIN_ID })}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: 'var(--danger)', color: 'white' }}
          >
            Geç
          </button>
        </div>
      )}

      {/* Hedef kartları */}
      {isConnected && !isWrongChain && (
        <>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest px-1 mb-2" style={{ color: 'var(--subtle)', letterSpacing: '0.08em' }}>
              Hedef seç
            </p>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((goal, i) => (
                <button
                  key={goal.label}
                  onClick={() => setQuickAmount(goal.amount, i)}
                  className="rounded-2xl p-3 text-left transition-all"
                  style={{
                    ...glass.card,
                    border: selectedGoal === i ? '1.5px solid var(--accent)' : '1px solid rgba(255,255,255,0.72)',
                    background: selectedGoal === i ? 'rgba(194,96,63,0.08)' : 'rgba(255,255,255,0.70)',
                  }}
                >
                  <span className="text-lg block mb-1" style={{ color: 'var(--accent)' }}>{goal.icon}</span>
                  <p className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>{goal.label}</p>
                  <p className="text-sm font-bold tabular-nums mt-0.5" style={{ color: 'var(--accent)' }}>
                    ${goal.amount}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Miktar girişi */}
          <div className="rounded-2xl p-4 space-y-3" style={glass.card}>
            <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              Miktar (USDC)
            </label>
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid var(--border-strong)' }}
            >
              <span className="text-sm font-bold" style={{ color: 'var(--muted)' }}>$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setSelectedGoal(null) }}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="flex-1 bg-transparent text-xl font-bold outline-none tabular-nums"
                style={{ color: 'var(--ink)', fontFamily: 'Space Grotesk, sans-serif' }}
              />
              <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>USDC</span>
            </div>

            {/* İşlem durumu */}
            <AnimatePresence mode="wait">
              {writeError && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-center"
                  style={{ color: 'var(--danger)' }}
                >
                  {parseOnchainError(writeError)}
                </motion.p>
              )}
              {(isPending || isConfirming) && (
                <motion.p
                  key="pending"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-center"
                  style={{ color: 'var(--muted)' }}
                >
                  {isPending ? 'Cüzdanda onayla...' : 'Onaylanıyor...'}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              onClick={handleDeposit}
              disabled={!amount || parseFloat(amount) <= 0 || isPending || isConfirming}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              <ArrowUpRight size={16} />
              {isPending ? 'Onay bekleniyor...' : isConfirming ? 'İşleniyor...' : 'Havuza Ekle'}
            </button>

            {hash && (
              <a
                href={buildTxExplorerUrl(TARGET_CHAIN_ID, hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 text-xs"
                style={{ color: 'var(--accent)' }}
              >
                İşlemi görüntüle <ExternalLink size={11} />
              </a>
            )}
          </div>

          {/* Bilgi notu */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="w-full flex items-center gap-2 text-xs text-left"
            style={{ color: 'var(--subtle)' }}
          >
            <Info size={12} />
            Bu nasıl çalışır?
          </button>

          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-2xl p-4 text-xs space-y-1.5" style={{ background: 'var(--warm-1)', color: 'var(--muted)' }}>
                  <p>USDC Arc Testnet üzerinde kendine gönderilir. Gerçek uygulamada bir akıllı kontrata kilitlenir.</p>
                  <p>Hedefine ulaştığında parayı çekebilirsin veya bir hizmet için ödeme yapabilirsin.</p>
                  <p className="font-medium" style={{ color: 'var(--ink-2)' }}>Şu an testnet USDC kullanılıyor — gerçek para değil.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
