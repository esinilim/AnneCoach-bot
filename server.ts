/**
 * AnneCoach Telegram Bot Backend — v2
 * - Konuşma bağlamı (son konu hatırlanır)
 * - Geniş Türkçe doğal dil eşleşmesi
 * - Şaka/iltifat/teşekkür gibi sosyal mesajlar
 * - OpenAI hazır (OPENAI_API_KEY .env'e eklenince devreye girer)
 */

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
if (!TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN .env dosyasında bulunamadı.')
  process.exit(1)
}

const OPENAI_KEY = process.env.OPENAI_API_KEY ?? ''
const API = `https://api.telegram.org/bot${TOKEN}`

// ── Konuşma bağlam hafızası (kullanıcı başına) ────────────────────────────

interface UserContext {
  lastTopic: string
  lastReply: string
  messageCount: number
  name: string
}

const userContexts = new Map<number, UserContext>()

function getCtx(chatId: number, name: string): UserContext {
  if (!userContexts.has(chatId)) {
    userContexts.set(chatId, { lastTopic: '', lastReply: '', messageCount: 0, name })
  }
  const ctx = userContexts.get(chatId)!
  ctx.name = name
  return ctx
}

// ── Yanıt havuzları ────────────────────────────────────────────────────────

const RESPONSES: Record<string, string[]> = {
  utu: [
    'Ütü yaparken podcast veya sesli kitap aç. Eller meşgul, beyin dinleniyor. Zamanın nasıl geçtiğini fark etmeyeceksin.',
    'Ütü hem el hem göz ister ama kulağını serbest bırakır. Sevdiğin müziği aç, ritme gir. Her düzeltilen kıyafet küçük bir tamamlama dopamini verir.',
    'Şu an ütü masasının başındasın ve bunu yapıyorsun. Her kıyafeti "çocuklarım için" diye katlıyorsun. Bu sevgi görünmez ama hissedilir.',
    'Neşat Ertaş, Müslüm Gürses, TRT arşivi... Ütü yaparken ruhu besleyen müzik seçimi var sende. Ellerine sağlık!',
  ],
  muzik_utu: [
    'Ne güzel! Müzikle ütü hem daha kolay hem daha keyifli olur. Ruhu besleyen müzik seçtin, aferin sana.',
    'Harika seçim! Müzik ritmiyle ütü ritmi birleşince zaman uçup gidiyor. Hangi parçayı en çok seviyorsun?',
    'Bak işte, kendin için küçük bir keyif yarattın. Bu tam da koçluğun özü — zor işi güzelleştirmek.',
  ],
  saka_yardim: [
    'Keşke gelebilseydim, inan! Ama şunu söyleyeyim: Bu iş biter. Bittiğinde kendini ödüllendir — bir çay, bir mola, bir şey.',
    'Ah, ben de yardım etmek isterdim! Dijital olduğum için elimden gelmiyor ama moral olarak yanındayım. Yarısını kafanda bana yükle, geri kalanı senin. 😄',
    'Haha! Eğer yapay zeka ütü yapabilseydi, çoktan işletirdim. O güne kadar seninle sohbet ederek vakit geçirtelim en azından.',
  ],
  tesekkur: [
    'Rica ederim! Seninle sohbet etmek benim için de güzel. Başka neye yardımcı olabilirim?',
    'Her zaman! Yorulunca, sıkılınca, motive olmak isteyince buradayım.',
    'Ne zaman istersen yazabilirsin. Seni dinlemek için buradayım.',
  ],
  iltifat_bota: [
    'Teşekkür ederim, çok naziksin! Seni daha iyi anlayabilmek için her geçen gün öğreniyorum.',
    'Vay be, mutlu ettim seni bu çok iyi! Daha da iyi olmak için çalışıyorum.',
  ],
  yorgun: [
    'Yorgunluk hissediyorsun ve bu tamamen normal. Sen hem profesyonel hem de iki harika çocuğun annesisin. "Yeterlice iyi" hedefi seni daha az tüketir.',
    'Dur bir dakika: Bugün EN önemli olan tek şey ne? Sadece o bir şeye odaklan. Gerisi bekleyebilir.',
    'Çamaşır yarına kalabilir. Ütü haftaya kalabilir. 5 dakika sadece senin için bir şey yap. Kahveni sıcak iç, derin nefes al.',
    'Vücudun sana "dur" diyor. Dinle onu. 10 dakika otur, hiçbir şey yapma. Suçluluk hissetme — bu da bir iş.',
  ],
  cocuk: [
    'Ödev saati için rutin oluştur: Aynı masa, aynı saat. Rutin başlayınca tartışma azalır, enerji harcanmaz.',
    '1. ve 2. sınıf için: 15 dakika çalış, 5 dakika mola ver. Hem sen hem onlar daha az yorulur.',
    'Çocuklarla kaliteli an, miktarla değil nitelikle ölçülür. 20 dakika tam odaklı oyun çok değerlidir.',
    'Okul ödevinde zorlanıyorlarsa, beraber yap — "öğret" değil "keşfet" modunda. "Bunu birlikte çözelim" de.',
  ],
  motivasyon: [
    'Bugün sabah kalkıp işe gittin, çocuklarını okula hazırladın. Bu güç çok az insanda var.',
    'Kamu görevlisi olarak topluma, eve dönünce ailene hizmet ediyorsun. Çocukların bu modeli görerek büyüyor.',
    'Çalışan annelerin çocukları daha bağımsız ve güçlü yetişkinler oluyor. Sen onların en iyi rol modelisin.',
    'Bugün yaptığın her şey önemli. Görünmese de hissedilir. Kendin için de biraz gurur duy.',
  ],
  namaz: [
    'Namaz, günün içinde sadece sana ait birkaç dakikadır. Dünya durur, sen yalnızca kendinle ve Rabbinle olursun.',
    'Vakit namazını kılmak hem ruhsal hem fiziksel bir mola. Secde, beynin stres hormonlarını düşürür.',
    'Namaz vaktini geçiş ritüeli olarak gör. İşten eve, koşuşturmadan huzura geçiş anı.',
    'Beş vakit, günün beş molası. Hem beden hem ruh için en iyi reset tuşu.',
  ],
  yemek: [
    'Hafta içi 5 kolay tarif belirle. Beyin "ne pişirsem" sorusunu sormaz olunca enerji kurtulur.',
    'Hafta sonu 2 saat pişirip hafta boyu yemek çıkar. Kuru fasulye, nohut, pirinç: önceden pişirip buzdolabına koy.',
    'Derin dondurucuyu kullan. Köfte, börek iç harcı, sos: bol yapıp dondur. Yorgun bir gecede kurtarıcı.',
    'Çocuklar için şöyle bir numara: Sebzeleri küçük küçük doğra, yemeğin içine "sakla". Hem beslenirler hem fark etmezler.',
  ],
  zaman: [
    '"Zamanım yok" derken aslında "bu önceliklerimde değil" diyoruz. Küçük kazanımlar büyük fark yaratır.',
    'Zaman yönetimi için "hayır" diyebilmek şart. Okul WhatsApp gruplarında her şeyi okumak zorunda değilsin.',
    'Pazar akşamı 15 dakika: Haftanın yemeklerini, randevuları, ödev günlerini planla. Pazartesi panik azalır.',
    'Sabah 10 dakika erken kalk, sadece kendine ait sessiz vakit. Günü kendin başlat, koşuşturma başlatmasın.',
  ],
  evisi: [
    'Ev işleri bitmez ama sen tükenmemelisin. Bugün sadece en kritik olanı yap, geri kalanını yarına bırak.',
    'Her odaya 10 dakika ver, daha fazla değil. Zamanlayıcı koy, ne kadar bittiyse o kadar.',
    'Bulaşık, çamaşır, ütü: döngüsel işler, hiç bitmez. Ama her gün bunları yaparak ailen için büyük bir hizmet sunuyorsun.',
    'Çocuklar 1. ve 2. sınıfta — artık küçük görevler verebilirsin. Sofra kurmak, oyuncakları toplamak onlar için oyun gibi.',
  ],
  default: [
    'Seni dinliyorum. Anlat bakalım, bugün en çok ne zorlayıcı geldi?',
    'Buradayım. Bugün nasıl geçti, ne yaşadın?',
    'Ne hissediyorsun şu an? İş mi, ev mi, çocuklar mı — konuşalım.',
    'Hep buradayım. İstediğin zaman yaz, dinliyorum.',
  ],
}

const WELCOME = `Merhaba! Ben AnneCoach, senin kişisel yaşam koçunum. 🌸

Hem kamu çalışanısın hem iki çocuğun annesisin — bu ikisini birden yönetmek gerçek bir güç istiyor.

Bugün nasılsın? Ne yaşıyorsun?

Hızlı konular için yazabilirsin:
• ütü yapıyorum
• yorgunum  
• motive et
• ödev vakti
• ne pişirsem
• namaz vakti
• zaman yönetimi

Ya da ne düşünüyorsan yaz, dinliyorum.`

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ── Bağlam farkındalıklı yanıt motoru ────────────────────────────────────

function getReply(text: string, ctx: UserContext): string {
  const t = text.toLowerCase().trim()

  // Şaka / yardım iste
  if (/gel.*yap|sen.*yap|yardım.*et.*gel|yarısın.*sen|bana yardım et/i.test(t)) {
    return getRandom(RESPONSES.saka_yardim)
  }

  // Teşekkür
  if (/teşekkür|sağ ol|eyvallah|çok iyisin|harikasın|süpersin/i.test(t)) {
    return getRandom(RESPONSES.tesekkur)
  }

  // Bota iltifat
  if (/çok iyi(sin)?|harika(sın)?|süper(sin)?|mükemmel(sin)?|bravo/i.test(t)) {
    return getRandom(RESPONSES.iltifat_bota)
  }

  // Müzik + ütü bağlamı
  if (/açtım|dinliyorum|müzik|şarkı|türkü|neşat|müslüm|arabesk|trt|radyo/i.test(t)) {
    if (ctx.lastTopic === 'utu') return getRandom(RESPONSES.muzik_utu)
    return getRandom(RESPONSES.muzik_utu)
  }

  // Onay / devam mesajları — önceki konuya devam et
  if (/tamam|tamamdır|anladım|evet|oldu|haklısın|biliyorum|ee|peki/i.test(t) && ctx.lastTopic) {
    const pool = RESPONSES[ctx.lastTopic] ?? RESPONSES.default
    return getRandom(pool)
  }

  // Ütü
  if (/ütü|utu|ütülüyorum|ütüle/i.test(t)) {
    ctx.lastTopic = 'utu'
    return getRandom(RESPONSES.utu)
  }

  // Yorgunluk
  if (/yorgun|bitkin|tükend|enerji|çok yoru|kendimi kötü|bıkkın|bunaldım/i.test(t)) {
    ctx.lastTopic = 'yorgun'
    return getRandom(RESPONSES.yorgun)
  }

  // Çocuklar / ödev
  if (/çocuk|ödev|okul|ders|sınıf|1\. sınıf|2\. sınıf|ilkokul|çanta|kitap çantası/i.test(t)) {
    ctx.lastTopic = 'cocuk'
    return getRandom(RESPONSES.cocuk)
  }

  // Motivasyon
  if (/motiv|moral|güven|güçlü|yeter|kendimi|cesaret|yapamıyorum|zor/i.test(t)) {
    ctx.lastTopic = 'motivasyon'
    return getRandom(RESPONSES.motivasyon)
  }

  // Namaz
  if (/namaz|vakit|kıl|dua|ibadet|Allah|kuran|sabah namazı|öğle|ikindi|akşam|yatsı/i.test(t)) {
    ctx.lastTopic = 'namaz'
    return getRandom(RESPONSES.namaz)
  }

  // Yemek
  if (/yemek|piş|mutfak|ne yap|akşam yemeği|kahvaltı|öğle yemeği|tarif|ne pişir/i.test(t)) {
    ctx.lastTopic = 'yemek'
    return getRandom(RESPONSES.yemek)
  }

  // Zaman yönetimi
  if (/zaman|vakit|saat|öncelik|yetişemiyorum|yetiştiremiyor|geç kaldım/i.test(t)) {
    ctx.lastTopic = 'zaman'
    return getRandom(RESPONSES.zaman)
  }

  // Ev işleri
  if (/bulaşık|çamaşır|temizlik|topla|süpür|sil|ütü|ev işi|ev işleri|kirli/i.test(t)) {
    ctx.lastTopic = 'evisi'
    return getRandom(RESPONSES.evisi)
  }

  // Selamlama
  if (/merhaba|selam|hey|günaydın|iyi günler|iyi akşamlar/i.test(t)) {
    return `Merhaba ${ctx.name}! Bugün nasılsın, ne yaşıyorsun?`
  }

  // Bağlam: önceki konuya döngüsel yanıt ver
  if (ctx.lastTopic && RESPONSES[ctx.lastTopic]) {
    return getRandom(RESPONSES[ctx.lastTopic])
  }

  return getRandom(RESPONSES.default)
}

// ── OpenAI entegrasyonu (opsiyonel) ───────────────────────────────────────

async function getOpenAIReply(text: string, ctx: UserContext): Promise<string | null> {
  if (!OPENAI_KEY) return null
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: `Sen AnneCoach'sun — Türkiye'de kamu sektöründe çalışan, 1. ve 2. sınıfa giden iki çocuğu olan annelere özel yaşam koçu yapay zeka asistanısın. Kullanıcı adı ${ctx.name}. Son konu: ${ctx.lastTopic || 'yok'}. Kısa (2-4 cümle), içten, pratik ve Türkçe yanıt ver. Emoji kullanma. Yargılama, yalnızca destekle.`,
          },
          { role: 'user', content: text },
        ],
      }),
    })
    if (!res.ok) return null
    const data = await res.json() as { choices: { message: { content: string } }[] }
    return data.choices?.[0]?.message?.content ?? null
  } catch {
    return null
  }
}

// ── Telegram API yardımcıları ──────────────────────────────────────────────

async function sendMessage(chatId: number, text: string): Promise<void> {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

interface TgUpdate {
  update_id: number
  message?: {
    message_id: number
    chat: { id: number; first_name?: string }
    text?: string
  }
}

async function getUpdates(offset: number): Promise<TgUpdate[]> {
  const res = await fetch(`${API}/getUpdates?offset=${offset}&timeout=25&allowed_updates=["message"]`)
  if (!res.ok) return []
  const data = await res.json() as { ok: boolean; result: TgUpdate[] }
  return data.ok ? data.result : []
}

// ── Health endpoint ────────────────────────────────────────────────────────

const server = Bun.serve({
  port: 3001,
  fetch(req) {
    const url = new URL(req.url)
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({ status: 'ok', bot: '@AnneCoach_bot', openai: !!OPENAI_KEY }),
        { headers: { 'Content-Type': 'application/json' } },
      )
    }
    return new Response('AnneCoach Bot Backend', { status: 200 })
  },
})

console.log(`AnneCoach backend hazır — http://localhost:${server.port}`)
console.log(`Telegram polling başlıyor... @AnneCoach_bot`)
console.log(`OpenAI: ${OPENAI_KEY ? 'AKTIF (GPT-4o mini)' : 'pasif (kural motoru)'}`)

// ── Polling döngüsü ────────────────────────────────────────────────────────

let offset = 0

async function poll(): Promise<void> {
  while (true) {
    try {
      const updates = await getUpdates(offset)
      for (const update of updates) {
        offset = update.update_id + 1
        const msg = update.message
        if (!msg?.text) continue

        const chatId = msg.chat.id
        const text = msg.text.trim()
        const name = msg.chat.first_name ?? 'Anne'
        const ctx = getCtx(chatId, name)
        ctx.messageCount++

        const time = new Date().toLocaleTimeString('tr-TR')
        console.log(`[${time}] ${name}: ${text}`)

        let reply: string

        if (text === '/start' || text === '/basla') {
          reply = WELCOME
          ctx.lastTopic = ''
        } else if (text === '/yardim' || text === '/help') {
          reply = WELCOME
        } else {
          // Önce OpenAI dene, yoksa kural motoruna düş
          const aiReply = await getOpenAIReply(text, ctx)
          reply = aiReply ?? getReply(text, ctx)
        }

        ctx.lastReply = reply
        console.log(`[${time}] AnneCoach: ${reply.slice(0, 80)}...`)
        await sendMessage(chatId, reply)
      }
    } catch (err) {
      console.error('Polling hatası:', err)
      await new Promise((r) => setTimeout(r, 3000))
    }
  }
}

poll()
