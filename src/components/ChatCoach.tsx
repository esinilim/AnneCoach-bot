import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Heart, RefreshCw } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'coach'
  text: string
}

const glass = {
  card: {
    background: 'rgba(255,255,255,0.70)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.72)',
    boxShadow: '0 8px 32px rgba(45,27,14,0.07), inset 0 1px 0 rgba(255,255,255,0.6)',
  } as React.CSSProperties,
}

const COACH_RESPONSES: Record<string, string[]> = {
  yorgun: [
    'Yorgunluk hissediyorsun ve bu tamamen normal. Sen hem bir profesyonel hem de iki harika çocuğun annesisin. Bugün bir şeyi daha az mükemmel yapsan da sorun değil.',
    'Yorulduğunda beynin "hepsini yapmalıyım" moduna giriyor. Dur bir dakika: Bugün EN önemli olan tek şey ne? Sadece o bir şeye odaklan. Gerisi bekleyebilir.',
    'Çamaşır yarına kalabilir. Ütü haftaya kalabilir. Ama sen bugün 5 dakika sadece senin için bir şey yapabilirsin. Kahveni sıcak iç, derin nefes al.',
  ],
  utu: [
    'Ütü yaparken podcast veya sesli kitap aç. Eller meşgul, beyin dinleniyor — bu kombini çok az iş sunar. Zamanın nasıl geçtiğini fark etmeyeceksin.',
    'Ütü hem el hem göz ister ama kulağını serbest bırakır. Sevdiğin bir müzik listesini aç, ritme gir. Her düzeltilen kıyafet sana küçük bir tamamlama dopamini verir.',
    'Şu an ütü masasının başındasın ve bunu yapıyorsun — bu zaten büyük bir adım. Her kıyafeti "çocuklarım için, ailem için" diye katlıyorsun. Bu sevgi görünmez ama hissedilir.',
    'Ütüyü daha hızlı bitirmek için önce küçük parçaları (çorap, mendil) yap, sonra büyüklere geç. Küçük tamamlamalar beyni tetikler, momentum kazanırsın.',
  ],
  evisi: [
    'Ev işleri bitmez, ama sen tükenmemelisin. Bugün sadece en kritik olanı yap, geri kalanını yarına bırak. Yarın da sen olacaksın ve o da yapılacak.',
    'Şunu dene: her odaya 10 dakika ver, daha fazla değil. Zamanlayıcı koy, ne kadar bittiyse o kadar. Mükemmel değil ama yeterince temiz.',
    'Bulaşık, çamaşır, ütü — bunlar döngüsel işler. Hiç bitmez. Ama sen her gün bunları yaparak aslında ailen için büyük bir hizmet sunuyorsun. Bu değeri küçümseme.',
  ],
  cocuk: [
    'Ödev saati için şunu dene: Çocuklarla birlikte "ödev ritüeli" oluştur. Aynı masa, aynı saat. Rutin başlayınca tartışma azalır.',
    '1. ve 2. sınıf çocuklar için: 15 dakika çalış, 5 dakika mola ver. Hem sen hem onlar daha az yorulur.',
    'Çocuklarla kaliteli an miktarıyla değil, niteliğiyle ölçülür. Akşam 20 dakika tam odaklanmış oyun, 2 saat yanında ama dikkat vermemekten daha değerlidir.',
  ],
  motivasyon: [
    'Bugün sabah kalkıp işe gittin. Çocuklarını okula hazırladın. Bütün bunları yaptın ve gün daha bitmedi. Bu güç çok az insanda var.',
    'Kamu görevlisi olarak topluma hizmet ediyorsun, eve dönünce ailen için hizmet ediyorsun. Çocukların bu modeli görerek büyüyor — sen onların süper kahramanısın.',
    'Çalışan annelerin çocukları daha bağımsız ve daha güçlü yetişkinler oluyor. Annelerinin gücünü görüyorlar. Sen onlar için en iyi rol modelsin.',
  ],
  zaman: [
    '"Zamanım yok" derken aslında "bu önceliklerimde değil" diyoruz. Küçük kazanımlar büyük fark yaratır.',
    'Zaman yönetimi için "hayır" diyebilmek şart. Okul WhatsApp gruplarında her şeyi okumak zorunda değilsin.',
    'Pazar akşamı 15 dakika ile haftanın yemeklerini, randevularını, ödev günlerini planla. Pazartesi sabahı panik azalır.',
  ],
  yemek: [
    'Hafta içi 5 kolay tarif belirle. Beyin "ne pişirsem" sorusunu sormaz olunca enerji kurtulur.',
    'Hafta sonu 2 saat pişirip hafta boyu yemek çıkar. Kuru fasulye, nohut, pirinç: önceden pişirip buzdolabına koy.',
    'Derin dondurucuyu kullan. Köfte, börek iç harcı, sos: bol yapıp dondur. Yorgun bir gecede kurtarıcı olur.',
  ],
  namaz: [
    'Namaz, günün içinde sadece sana ait 5 dakikadır. Dünya durur, sen yalnızca kendinle ve Rabbinle olursun. Bu anı koru.',
    'Vakit namazını kılmak hem ruhsal hem fiziksel bir mola. Secde, beynin stres hormonlarını düşürür. Bu bilimsel bir gerçek.',
    'Namaz vaktini bir ara olarak değil, günün ritmi olarak gör. İşten eve, evden çocuklara geçişte bu molalar seni dengede tutar.',
  ],
  default: [
    'Seni dinliyorum. Ne hissediyorsun, bugün ne zorlayıcı geldi?',
    'Anlat bakalım, ev mi, iş mi, çocuklar mı — neyi konuşmak istersin?',
    'Buradayım. Bugün nasıl geçti, ne yaşadın?',
    'Her gün bu tempoyu sürdürmek büyük bir güç istiyor. Nasıl yardımcı olabilirim?',
  ],
}

const QUICK_PROMPTS = [
  { label: 'Yorgunum', key: 'yorgun' },
  { label: 'Ütü yapıyorum', key: 'utu' },
  { label: 'Motive et', key: 'motivasyon' },
  { label: 'Ödev vakti', key: 'cocuk' },
  { label: 'Ne pişirsem', key: 'yemek' },
  { label: 'Zaman yönetimi', key: 'zaman' },
  { label: 'Namaz molası', key: 'namaz' },
  { label: 'Ev işleri', key: 'evisi' },
]

const DAILY_AFFIRMATIONS = [
  'Bugün yaptıgın her sey önemli. Görünmese de hissedilir.',
  'Mükemmel anne degil, gerçek anne olmak yeterli.',
  'Ikinci sınıf çocugunun bugün sana sarılması, en iyi tesekkür.',
  'Yorgunluk basarının isareti. Dur, nefes al, devam et.',
  'Sen hem kariyer kadını hem annesisin. Ikisi birden olmak süper güç.',
]

function getCoachReply(text: string, forceKey?: string): string {
  const lower = text.toLowerCase()
  let pool: string[] = COACH_RESPONSES.default

  if (forceKey && COACH_RESPONSES[forceKey]) {
    pool = COACH_RESPONSES[forceKey]
  } else if (/ütü|utu|ütülüyorum|ütüle/.test(lower)) pool = COACH_RESPONSES.utu
  else if (/ev isi|bulaşık|çamasir|temizlik|topla/.test(lower)) pool = COACH_RESPONSES.evisi
  else if (/yorgun|bitkin|enerji|dinlen|tükend/.test(lower)) pool = COACH_RESPONSES.yorgun
  else if (/namaz|vakit|kıl|dua/.test(lower)) pool = COACH_RESPONSES.namaz
  else if (/çocuk|ödev|okul|ders|sınıf/.test(lower)) pool = COACH_RESPONSES.cocuk
  else if (/motiv|moral|güven|yeter|güçlü/.test(lower)) pool = COACH_RESPONSES.motivasyon
  else if (/zaman|vakit|saat|öncelik/.test(lower)) pool = COACH_RESPONSES.zaman
  else if (/yemek|piş|mutfak|ne yap/.test(lower)) pool = COACH_RESPONSES.yemek

  return pool[Math.floor(Math.random() * pool.length)]
}

const INIT_MESSAGE: Message = {
  id: 'init',
  role: 'coach',
  text: 'Merhaba! Ben MomCoach, senin kisisel yasam koçunum. Bugün nasılsın? Yorgunluk, ev isleri, çocuklar, is: ne hissedersen anlat. Buradayım.',
}

const TODAY_IDX = new Date().getDay() % DAILY_AFFIRMATIONS.length

function replyDelay() {
  return 1000 + 500 * Math.random()
}

export default function ChatCoach() {
  const [messages, setMessages] = useState<Message[]>([INIT_MESSAGE])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const msgCounter = useRef(1)

  const todayAffirmation = DAILY_AFFIRMATIONS[TODAY_IDX]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const send = (overrideText?: string, forceKey?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text) return
    const userMsg: Message = { id: String(msgCounter.current++), role: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    const delay = replyDelay()
    setTimeout(() => {
      const reply = getCoachReply(text, forceKey)
      setMessages((prev) => [
        ...prev,
        { id: String(msgCounter.current++), role: 'coach', text: reply },
      ])
      setIsTyping(false)
    }, delay)
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const reset = () => {
    setMessages([
      { id: String(msgCounter.current++), role: 'coach', text: 'Yeni bir sohbete baslayalım. Bugün ne üzerinde konusmak istersin?' },
    ])
  }

  return (
    <div className="flex flex-col h-full">
      {/* Günlük affirmation */}
      <div
        className="mx-4 mt-4 mb-3 rounded-2xl px-4 py-3 flex items-start gap-3"
        style={{
          background: 'linear-gradient(135deg, rgba(194,96,63,0.10) 0%, rgba(253,232,208,0.60) 100%)',
          border: '1px solid rgba(194,96,63,0.18)',
        }}
      >
        <Heart size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
        <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
          {todayAffirmation}
        </p>
      </div>

      {/* Mesajlar */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-2">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'coach' && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1"
                  style={{ background: 'var(--accent-soft)', border: '1px solid rgba(194,96,63,0.25)' }}
                >
                  <Sparkles size={13} style={{ color: 'var(--accent)' }} />
                </div>
              )}
              <div
                className="max-w-[82%] rounded-2xl px-4 py-3"
                style={
                  msg.role === 'user'
                    ? { background: 'var(--accent)', color: 'white', borderBottomRightRadius: 4 }
                    : { ...glass.card, borderBottomLeftRadius: 4, color: 'var(--ink)' }
                }
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center mr-2 flex-shrink-0"
                style={{ background: 'var(--accent-soft)', border: '1px solid rgba(194,96,63,0.25)' }}
              >
                <Sparkles size={13} style={{ color: 'var(--accent)' }} />
              </div>
              <div className="rounded-2xl rounded-bl-sm px-4 py-3" style={glass.card}>
                <div className="flex gap-1 items-center h-5">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: 'var(--muted)' }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Hızlı butonlar */}
      <div className="px-4 pt-2 pb-1 flex gap-2 overflow-x-auto no-scrollbar">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p.key}
            onClick={() => { send(p.label, p.key) }}
            disabled={isTyping}
            className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all disabled:opacity-40"
            style={{
              background: 'rgba(194,96,63,0.09)',
              color: 'var(--accent)',
              border: '1px solid rgba(194,96,63,0.22)',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2">
        <div
          className="flex items-end gap-2 rounded-2xl px-3 py-2"
          style={{
            background: 'rgba(255,255,255,0.80)',
            border: '1px solid var(--border-strong)',
            boxShadow: '0 2px 12px rgba(45,27,14,0.06)',
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ne düsünüyorsun? Anlat..."
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed py-1"
            style={{ color: 'var(--ink)', maxHeight: 96, fontFamily: 'DM Sans, sans-serif' }}
          />
          <div className="flex items-center gap-1 mb-0.5">
            <button
              onClick={reset}
              className="p-1.5 rounded-xl transition-colors"
              style={{ color: 'var(--subtle)' }}
              title="Sohbeti sıfırla"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => { send() }}
              disabled={!input.trim() || isTyping}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
        <p className="text-center text-xs mt-2" style={{ color: 'var(--subtle)' }}>
          Telegram bot entegrasyonu yakında geliyor
        </p>
      </div>
    </div>
  )
}
