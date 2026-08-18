'use client'

import { useEffect, useState, useCallback } from 'react'
import { TR, CATEGORIES, CAT_META, MANDALS, QUALITIES, STATUS_TR } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Toaster, toast } from 'sonner'
import {
  Sprout, Menu, X, Globe, LogOut, LayoutDashboard, Search, MapPin, IndianRupee,
  Smartphone, ShieldCheck, PackageCheck, Leaf, Trash2, Pencil, Plus, Heart,
  ShoppingCart, Users, Store, ClipboardList, TrendingUp, CheckCircle2, Truck, Ban,
  Handshake, LineChart, UserCheck, PackageSearch, Phone, SlidersHorizontal, Inbox,
} from 'lucide-react'

const HERO_IMG = 'https://images.pexels.com/photos/29039800/pexels-photo-29039800.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'
const HARVEST_IMG = 'https://images.unsplash.com/photo-1572908721147-0a9eb395762d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwzfHxyaWNlJTIwaGFydmVzdHxlbnwwfHx8Z3JlZW58MTc4Njk2OTM1NXww&ixlib=rb-4.1.0&q=85'

// ---------------- API helper ----------------
async function api(path, opts = {}) {
  const res = await fetch('/api' + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Something went wrong')
  return data
}

const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
const validPhone = (p) => !p || /^[0-9]{10}$/.test(String(p).trim())

const STATUS_STYLE = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  processing: 'bg-indigo-100 text-indigo-800',
  ready: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-stone-200 text-stone-600',
  available: 'bg-green-100 text-green-800',
  unavailable: 'bg-stone-200 text-stone-600',
}

function StatusBadge({ status, lang = 'en' }) {
  const label = STATUS_TR[status] ? STATUS_TR[status][lang] || STATUS_TR[status].en : (status || 'unknown')
  return <Badge className={`${STATUS_STYLE[status] || 'bg-stone-100 text-stone-700'} hover:opacity-100`}>{label}</Badge>
}

// ---------------- Root App ----------------
function App() {
  const [lang, setLang] = useState('en')
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [route, setRoute] = useState('/')
  const [mobileNav, setMobileNav] = useState(false)
  const [wishlist, setWishlist] = useState([]) // array of produce ids

  const t = useCallback((k) => (TR[lang] && TR[lang][k]) || TR.en[k] || k, [lang])

  const navigate = useCallback((path) => {
    window.location.hash = path
    setMobileNav(false)
  }, [])

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace(/^#/, '') || '/'
      setRoute(h)
      window.scrollTo(0, 0)
    }
    onHash()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('lang') : null
    if (saved) setLang(saved)
  }, [])
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('lang', lang) }, [lang])

  const refreshWishlist = useCallback(async () => {
    try { const d = await api('/buyer/wishlist'); setWishlist(Array.isArray(d) ? d.map(p => p.id) : []) }
    catch { setWishlist([]) }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const d = await api('/auth/me')
      setUser(d.user)
      if (d.user?.role === 'buyer') setWishlist(d.user.wishlist || [])
    } catch { setUser(null) }
    finally { setAuthChecked(true) }
  }, [])
  useEffect(() => { refreshUser() }, [refreshUser])

  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }) } catch {}
    setUser(null); setWishlist([])
    navigate('/')
    toast.success('Logged out')
  }

  const toggleWishlist = async (produceId) => {
    if (!user) { navigate('/login'); return }
    if (user.role !== 'buyer') { toast.error('Only buyers can save produce'); return }
    try {
      if (wishlist.includes(produceId)) {
        await api('/buyer/wishlist/' + produceId, { method: 'DELETE' })
        setWishlist(w => w.filter(id => id !== produceId))
      } else {
        await api('/buyer/wishlist', { method: 'POST', body: JSON.stringify({ produce_id: produceId }) })
        setWishlist(w => [...w, produceId])
        toast.success('Saved to wishlist')
      }
    } catch (e) { toast.error(e.message) }
  }

  useEffect(() => {
    if (!authChecked) return
    if (route.startsWith('/dashboard') && !user) navigate('/login')
  }, [route, user, authChecked, navigate])

  const shared = { lang, t, user, navigate, refreshUser, setUser, wishlist, toggleWishlist }

  const renderPage = () => {
    if (route.startsWith('/product/')) return <ProductDetail {...shared} id={route.split('/product/')[1]} />
    if (route.startsWith('/marketplace')) return <Marketplace {...shared} />
    if (route.startsWith('/how')) return <HowItWorks {...shared} />
    if (route.startsWith('/about')) return <About {...shared} />
    if (route.startsWith('/login')) return <AuthPage {...shared} mode="login" />
    if (route.startsWith('/register')) return <AuthPage {...shared} mode="register" />
    if (route.startsWith('/dashboard')) {
      if (!authChecked || !user) return <Loading />
      if (user.role === 'farmer') return <FarmerDashboard {...shared} />
      if (user.role === 'buyer') return <BuyerDashboard {...shared} />
      if (user.role === 'admin') return <AdminDashboard {...shared} />
    }
    return <Home {...shared} />
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      <Toaster position="top-center" richColors />
      <Navbar {...shared} route={route} setLang={setLang} logout={logout} mobileNav={mobileNav} setMobileNav={setMobileNav} />
      <main className="flex-1">{renderPage()}</main>
      <Footer t={t} navigate={navigate} />
    </div>
  )
}

// ---------------- Navbar ----------------
function Navbar({ t, user, navigate, route, lang, setLang, logout, mobileNav, setMobileNav }) {
  const links = [
    { key: 'nav_home', path: '/' },
    { key: 'nav_marketplace', path: '/marketplace' },
    { key: 'nav_how', path: '/how' },
    { key: 'nav_about', path: '/about' },
  ]
  const isActive = (p) => (p === '/' ? route === '/' : route.startsWith(p))
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 shrink-0" aria-label="AgriDirect home">
          <div className="w-9 h-9 rounded-lg bg-green-700 flex items-center justify-center"><Sprout className="w-5 h-5 text-white" /></div>
          <div className="text-left leading-tight">
            <div className="font-bold text-green-800">{t('brand')}</div>
            <div className="text-[10px] text-stone-500 -mt-0.5">{t('region')}</div>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <button key={l.path} onClick={() => navigate(l.path)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive(l.path) ? 'text-green-800 bg-green-50' : 'text-stone-600 hover:text-green-800 hover:bg-stone-100'}`}>
              {t(l.key)}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setLang(lang === 'en' ? 'te' : 'en')} className="gap-1 h-9" aria-label="Switch language">
            <Globe className="w-4 h-4" /> {lang === 'en' ? 'తెలుగు' : 'English'}
          </Button>
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Button size="sm" onClick={() => navigate('/dashboard')} className="bg-green-700 hover:bg-green-800 gap-1 h-9"><LayoutDashboard className="w-4 h-4" /> {t('dashboard')}</Button>
              <Button size="sm" variant="ghost" onClick={logout} className="gap-1 h-9" aria-label="Logout"><LogOut className="w-4 h-4" /></Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => navigate('/login')} className="h-9">{t('login')}</Button>
              <Button size="sm" onClick={() => navigate('/register')} className="bg-green-700 hover:bg-green-800 h-9">{t('register')}</Button>
            </div>
          )}
          <button className="md:hidden p-2" onClick={() => setMobileNav(!mobileNav)} aria-label="Menu">
            {mobileNav ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileNav && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 py-3 space-y-1">
          {links.map(l => (
            <button key={l.path} onClick={() => navigate(l.path)}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${isActive(l.path) ? 'text-green-800 bg-green-50' : 'text-stone-700'}`}>
              {t(l.key)}
            </button>
          ))}
          <Separator className="my-2" />
          {user ? (
            <>
              <Button className="w-full bg-green-700 hover:bg-green-800 mb-2" onClick={() => navigate('/dashboard')}>{t('dashboard')}</Button>
              <Button variant="outline" className="w-full" onClick={logout}>{t('logout')}</Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="w-full mb-2" onClick={() => navigate('/login')}>{t('login')}</Button>
              <Button className="w-full bg-green-700 hover:bg-green-800" onClick={() => navigate('/register')}>{t('register')}</Button>
            </>
          )}
        </div>
      )}
    </header>
  )
}

function Footer({ t, navigate }) {
  return (
    <footer className="bg-green-900 text-green-50 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center"><Sprout className="w-4 h-4" /></div>
            <span className="font-bold">{t('brand')} · {t('region')}</span>
          </div>
          <p className="text-sm text-green-200/80 max-w-xs">{t('tagline')}</p>
        </div>
        <div className="text-sm">
          <div className="font-semibold mb-3">Links</div>
          <div className="space-y-2 text-green-200/90">
            <button onClick={() => navigate('/marketplace')} className="block hover:text-white">{t('nav_marketplace')}</button>
            <button onClick={() => navigate('/how')} className="block hover:text-white">{t('nav_how')}</button>
            <button onClick={() => navigate('/about')} className="block hover:text-white">{t('nav_about')}</button>
          </div>
        </div>
        <div className="text-sm">
          <div className="font-semibold mb-3">Smart India Hackathon</div>
          <p className="text-green-200/80">A prototype for direct agricultural trade in West Godavari, Andhra Pradesh. Demonstration data only.</p>
        </div>
      </div>
      <div className="border-t border-green-800 py-4 text-center text-xs text-green-300/70">© 2025 AgriDirect · Prototype</div>
    </footer>
  )
}

function Loading({ label = 'Loading…' }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-20 text-center text-stone-500">
      <div className="inline-block w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-3" />
      <div>{label}</div>
    </div>
  )
}

function EmptyState({ icon: Icon = Inbox, title, hint, action }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3"><Icon className="w-7 h-7 text-stone-400" /></div>
      <p className="font-medium text-stone-700">{title}</p>
      {hint && <p className="text-sm text-stone-500 mt-1">{hint}</p>}
      {action}
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="text-center py-16">
      <p className="text-red-600 font-medium">{message || 'Something went wrong.'}</p>
      {onRetry && <Button variant="outline" className="mt-3" onClick={onRetry}>Retry</Button>}
    </div>
  )
}

// ---------------- Home ----------------
function Home({ t, navigate, lang }) {
  const goRegister = (role) => { try { localStorage.setItem('signup_role', role) } catch {}; navigate('/register') }
  return (
    <div>
      <section className="relative">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Paddy field in West Godavari" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-green-950/70" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32 text-white">
          <Badge className="bg-green-600 hover:bg-green-600 mb-4">{t('region')}, Andhra Pradesh</Badge>
          <h1 className="text-3xl md:text-5xl font-bold max-w-2xl leading-tight">{t('brand')} — Connecting Farmers Directly to Markets</h1>
          <p className="mt-4 text-green-100 max-w-xl text-base md:text-lg">{t('hero_sub')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate('/marketplace')} className="bg-green-600 hover:bg-green-500">{t('browse_market')}</Button>
            <Button size="lg" variant="outline" onClick={() => goRegister('farmer')} className="bg-white/10 border-white/40 text-white hover:bg-white/20">Sell Your Produce</Button>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="max-w-6xl mx-auto px-4 py-14 grid md:grid-cols-2 gap-6">
        <Card className="border-stone-200">
          <CardHeader><CardTitle className="text-xl text-red-700">The Problem</CardTitle></CardHeader>
          <CardContent className="text-stone-700 space-y-2 text-sm">
            <p>• Farmers often depend on multiple intermediaries to reach the market.</p>
            <p>• Price transparency can be limited, reducing farmer income.</p>
            <p>• Direct access to genuine buyers can be difficult.</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader><CardTitle className="text-xl text-green-800">The Solution</CardTitle></CardHeader>
          <CardContent className="text-stone-700 space-y-2 text-sm">
            <p>• AgriDirect connects farmers directly with buyers across West Godavari.</p>
            <p>• Farmers list produce and set their own fair price.</p>
            <p>• Buyers browse, compare and order — no middlemen in between.</p>
          </CardContent>
        </Card>
      </section>

      {/* Why */}
      <section className="max-w-6xl mx-auto px-4 pb-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: IndianRupee, t: 'feat1_t', d: 'feat1_d' },
            { icon: Smartphone, t: 'feat2_t', d: 'feat2_d' },
            { icon: ShieldCheck, t: 'feat3_t', d: 'feat3_d' },
            { icon: PackageCheck, t: 'feat4_t', d: 'feat4_d' },
          ].map((f, i) => (
            <Card key={i} className="border-stone-200 shadow-sm">
              <CardHeader>
                <div className="w-11 h-11 rounded-lg bg-green-100 flex items-center justify-center mb-2"><f.icon className="w-6 h-6 text-green-700" /></div>
                <CardTitle className="text-lg">{t(f.t)}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-stone-600 -mt-2">{t(f.d)}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works quick */}
      <section className="bg-white border-y border-stone-200 mt-10">
        <div className="max-w-6xl mx-auto px-4 py-14 grid md:grid-cols-2 gap-10">
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Sprout className="w-5 h-5 text-green-700" />{t('farmer')}</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {['Register', 'List Produce', 'Receive Orders', 'Sell Directly'].map((s, i) => (
                <span key={i} className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-green-50 text-green-800 border border-green-200">{s}</span>
                  {i < 3 && <span className="text-stone-400">→</span>}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-green-700" />{t('buyer')}</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {['Browse', 'Compare', 'Order', 'Track'].map((s, i) => (
                <span key={i} className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">{s}</span>
                  {i < 3 && <span className="text-stone-400">→</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">{t('categories')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => navigate('/marketplace')}
              className="rounded-xl border border-stone-200 bg-white hover:bg-green-50 hover:border-green-300 transition p-6 text-center">
              <div className="text-4xl mb-2">{CAT_META[c].emoji}</div>
              <div className="font-semibold text-stone-800">{lang === 'te' ? CAT_META[c].te : c}</div>
            </button>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 pb-14">
        <div className="rounded-2xl bg-green-800 text-white p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold">Join AgriDirect</h3>
          <p className="text-green-100 mt-2">{t('tagline')}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => goRegister('farmer')} className="bg-white text-green-800 hover:bg-green-50 gap-2"><Sprout className="w-4 h-4" />I'm a Farmer</Button>
            <Button size="lg" onClick={() => goRegister('buyer')} className="bg-green-600 hover:bg-green-500 gap-2"><ShoppingCart className="w-4 h-4" />I'm a Buyer</Button>
          </div>
        </div>
      </section>
    </div>
  )
}

// ---------------- How It Works ----------------
function HowItWorks({ t }) {
  const farmerSteps = [
    { icon: UserCheck, text: 'Register as a Farmer' },
    { icon: Pencil, text: 'Create your profile' },
    { icon: Plus, text: 'Add your produce' },
    { icon: Inbox, text: 'Receive buyer orders' },
    { icon: CheckCircle2, text: 'Accept orders' },
    { icon: PackageCheck, text: 'Complete sales & get paid fairly' },
  ]
  const buyerSteps = [
    { icon: UserCheck, text: 'Register as a Buyer' },
    { icon: PackageSearch, text: 'Browse produce' },
    { icon: SlidersHorizontal, text: 'Search & filter' },
    { icon: Users, text: 'View farmer details' },
    { icon: ShoppingCart, text: 'Place an order' },
    { icon: Truck, text: 'Track your order' },
  ]
  const Col = ({ title, icon: Icon, steps }) => (
    <Card className="border-stone-200">
      <CardHeader><div className="flex items-center gap-2"><Icon className="w-6 h-6 text-green-700" /><CardTitle>{title}</CardTitle></div></CardHeader>
      <CardContent className="space-y-4">
        {steps.map((s, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-9 h-9 shrink-0 rounded-full bg-green-100 flex items-center justify-center"><s.icon className="w-5 h-5 text-green-700" /></div>
            <p className="text-stone-700">{idx + 1}. {s.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
  return (
    <div className="max-w-5xl mx-auto px-4 py-14">
      <h1 className="text-3xl font-bold text-center mb-2">{t('nav_how')}</h1>
      <p className="text-center text-stone-500 mb-10">{t('tagline')}</p>
      <div className="grid md:grid-cols-2 gap-8">
        <Col title={`For ${t('farmer')}s`} icon={Sprout} steps={farmerSteps} />
        <Col title={`For ${t('buyer')}s`} icon={ShoppingCart} steps={buyerSteps} />
      </div>
    </div>
  )
}

// ---------------- About ----------------
function About({ t }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-14">
      <h1 className="text-3xl font-bold mb-4">{t('nav_about')}</h1>
      <img src={HARVEST_IMG} alt="Rice harvest" className="w-full h-56 object-cover rounded-xl mb-6" />
      <div className="text-stone-700 space-y-4">
        <p><b>AgriDirect</b> is a <b>Smart India Hackathon prototype</b> built to empower farmers of <b>West Godavari, Andhra Pradesh</b> — one of India's most fertile regions, famous for paddy, banana, coconut, vegetables and sugarcane.</p>
        <p>Farmers here often lose a large share of their income to intermediaries. AgriDirect connects them <b>directly with buyers</b> so they can set fair prices and sell their harvest with dignity.</p>
        <p><b>Technology:</b> The prototype is built as a responsive, mobile-first web application with a Node/Next.js API and a database backend, offering a bilingual <b>English + Telugu</b> experience.</p>
        <p><b>Social impact:</b> Better price realisation for farmers, transparent direct trade, and easier market access for local buyers.</p>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
          Note: This is a <b>prototype with demonstration data</b>. It is not a government-approved platform and does not use verified government data.
        </div>
      </div>
    </div>
  )
}

// ---------------- Produce visual (image with emoji fallback) ----------------
function ProduceVisual({ item, className = 'h-28', emojiClass = 'text-6xl' }) {
  const meta = CAT_META[item?.category] || { emoji: '🌱', color: 'bg-stone-100 text-stone-700' }
  const [err, setErr] = useState(false)
  if (item?.image_url && !err) {
    return (
      <div className={`${className} bg-stone-100 overflow-hidden`}>
        <img src={item.image_url} alt={item?.name || 'produce'} onError={() => setErr(true)} className="w-full h-full object-cover" />
      </div>
    )
  }
  return <div className={`${className} flex items-center justify-center ${emojiClass} ${meta.color.split(' ')[0]}`}>{meta.emoji}</div>
}

// ---------------- Produce Card ----------------
function ProduceCard({ item, t, lang, navigate, wishlist = [], toggleWishlist, showWish = true }) {
  const meta = CAT_META[item.category] || { emoji: '🌱', color: 'bg-stone-100 text-stone-700' }
  const displayName = lang === 'te' && item.name_te ? item.name_te : item.name
  const wished = wishlist.includes(item.id)
  return (
    <Card className="border-stone-200 overflow-hidden hover:shadow-md transition flex flex-col">
      <div className="relative">
        <ProduceVisual item={item} className="h-28" />
        {showWish && (
          <button onClick={() => toggleWishlist && toggleWishlist(item.id)} aria-label="Save to wishlist"
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
            <Heart className={`w-4 h-4 ${wished ? 'fill-red-500 text-red-500' : 'text-stone-500'}`} />
          </button>
        )}
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-1 mb-2 flex-wrap">
          <Badge variant="outline" className={meta.color}>{lang === 'te' ? meta.te : item.category}</Badge>
          {item.quality ? <Badge variant="outline" className="bg-stone-50 text-stone-600 border-stone-200">{item.quality}</Badge> : null}
        </div>
        <h3 className="font-semibold text-stone-900 leading-snug">{displayName}</h3>
        <div className="text-xs text-stone-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{item.mandal || item.location || t('region')} · {t('by')} {item.farmer_name}</div>
        <div className="mt-3 flex items-end justify-between">
          <div className="text-green-800 font-bold text-lg">{money(item.price)}<span className="text-xs font-normal text-stone-500"> /{item.unit}</span></div>
        </div>
        <Button className="mt-3 w-full bg-green-700 hover:bg-green-800" onClick={() => navigate('/product/' + item.id)}>{t('view_details')}</Button>
      </CardContent>
    </Card>
  )
}

// ---------------- Marketplace ----------------
function Marketplace({ t, lang, navigate, wishlist, toggleWishlist, user }) {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading') // loading | ok | error
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [mandal, setMandal] = useState('All')
  const [sort, setSort] = useState('latest')
  const [minP, setMinP] = useState('')
  const [maxP, setMaxP] = useState('')
  const [mandalOptions, setMandalOptions] = useState(MANDALS)

  useEffect(() => { api('/mandals').then(m => { if (Array.isArray(m) && m.length) setMandalOptions(m) }).catch(() => {}) }, [])

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (category !== 'All') params.set('category', category)
      if (mandal !== 'All') params.set('mandal', mandal)
      if (minP) params.set('min_price', minP)
      if (maxP) params.set('max_price', maxP)
      if (sort !== 'latest') params.set('sort', sort === 'low' ? 'price_asc' : 'price_desc')
      const data = await api('/produce?' + params.toString())
      setItems(Array.isArray(data) ? data : [])
      setStatus('ok')
    } catch (e) { setStatus('error') }
  }, [search, category, mandal, sort, minP, maxP])

  useEffect(() => { const id = setTimeout(load, 250); return () => clearTimeout(id) }, [load])

  const clearFilters = () => { setSearch(''); setCategory('All'); setMandal('All'); setSort('latest'); setMinP(''); setMaxP('') }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-1">{t('nav_marketplace')}</h1>
      <p className="text-stone-500 mb-6">{t('region')}, Andhra Pradesh</p>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search_placeholder')} className="pl-9" aria-label="Search produce" />
        </div>
        <Select value={mandal} onValueChange={setMandal}>
          <SelectTrigger className="md:w-44"><SelectValue placeholder={t('all_mandals')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">{t('all_mandals')}</SelectItem>
            {mandalOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="md:w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">{t('sort_latest')}</SelectItem>
            <SelectItem value="low">{t('sort_price_low')}</SelectItem>
            <SelectItem value="high">{t('sort_price_high')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {['All', ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${category === c ? 'bg-green-700 text-white border-green-700' : 'bg-white text-stone-600 border-stone-300 hover:border-green-400'}`}>
            {c === 'All' ? t('all') : (lang === 'te' ? CAT_META[c].te : c)}
          </button>
        ))}
        <div className="flex items-center gap-2 ml-auto text-sm">
          <span className="text-stone-500 hidden sm:inline">{t('price_range')}</span>
          <Input type="number" min="0" value={minP} onChange={e => setMinP(e.target.value)} placeholder={t('min')} className="w-20 h-9" aria-label="Minimum price" />
          <span className="text-stone-400">–</span>
          <Input type="number" min="0" value={maxP} onChange={e => setMaxP(e.target.value)} placeholder={t('max')} className="w-20 h-9" aria-label="Maximum price" />
          <Button variant="ghost" size="sm" onClick={clearFilters}>{t('clear')}</Button>
        </div>
      </div>

      {status === 'loading' ? <Loading /> :
        status === 'error' ? <ErrorState message="Could not load produce." onRetry={load} /> :
          items.length === 0 ? <EmptyState icon={PackageSearch} title={t('no_produce')} hint="Try clearing filters or search for something else." /> : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map(it => <ProduceCard key={it.id} item={it} t={t} lang={lang} navigate={navigate} wishlist={wishlist} toggleWishlist={toggleWishlist} showWish={!user || user.role === 'buyer'} />)}
            </div>
          )}
    </div>
  )
}

// ---------------- Product Detail ----------------
function ProductDetail({ t, lang, navigate, user, id, wishlist = [], toggleWishlist }) {
  const [item, setItem] = useState(null)
  const [status, setStatus] = useState('loading')
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')
  const [placing, setPlacing] = useState(false)

  const load = useCallback(() => {
    setStatus('loading')
    api('/produce/' + id).then(d => { setItem(d); setStatus('ok') }).catch(() => setStatus('error'))
  }, [id])
  useEffect(() => { load() }, [load])

  if (status === 'loading') return <Loading />
  if (status === 'error' || !item) return <div className="max-w-4xl mx-auto px-4 py-10"><ErrorState message="Produce not found." onRetry={() => navigate('/marketplace')} /></div>

  const meta = CAT_META[item.category] || { emoji: '🌱', color: 'bg-stone-100', te: item.category }
  const displayName = lang === 'te' && item.name_te ? item.name_te : item.name
  const available = item.status === 'available' && (item.quantity || 0) > 0
  const numericQty = Number(qty || 0)
  const overStock = item.quantity ? numericQty > item.quantity : false
  const wished = wishlist.includes(item.id)

  const placeOrder = async () => {
    if (!user) { navigate('/login'); return }
    if (user.role !== 'buyer') { toast.error('Only buyers can place orders'); return }
    if (numericQty <= 0) { toast.error('Enter a valid quantity'); return }
    if (overStock) { toast.error(`Only ${item.quantity} ${item.unit} available`); return }
    setPlacing(true)
    try {
      await api('/orders', { method: 'POST', body: JSON.stringify({ produce_id: item.id, quantity: numericQty, note }) })
      toast.success('Order placed! (prototype demo transaction)')
      navigate('/dashboard')
    } catch (e) { toast.error(e.message) }
    finally { setPlacing(false) }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/marketplace')} className="text-sm text-green-700 mb-4">← {t('nav_marketplace')}</button>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <ProduceVisual item={item} className="rounded-2xl min-h-[280px]" emojiClass="text-[9rem]" />
        </div>
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className={meta.color}>{lang === 'te' ? meta.te : item.category}</Badge>
              {item.quality ? <Badge variant="outline" className="bg-stone-50 text-stone-600">{item.quality}</Badge> : null}
              <StatusBadge status={item.status} lang={lang} />
            </div>
            {(!user || user.role === 'buyer') && (
              <button onClick={() => toggleWishlist && toggleWishlist(item.id)} aria-label="Save to wishlist" className="shrink-0">
                <Heart className={`w-6 h-6 ${wished ? 'fill-red-500 text-red-500' : 'text-stone-400'}`} />
              </button>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mt-3">{displayName}</h1>
          {item.name_te && lang !== 'te' ? <p className="text-stone-500">{item.name_te}</p> : null}
          <div className="text-3xl font-bold text-green-800 mt-3">{money(item.price)}<span className="text-sm font-normal text-stone-500"> /{item.unit}</span></div>
          <div className="text-sm text-stone-600 mt-1">{t('quantity_available')}: {item.quantity ?? 0} {item.unit}</div>
          {item.description ? <p className="text-stone-700 mt-4">{item.description}</p> : null}

          {/* Farmer info */}
          <Card className="mt-5 border-stone-200">
            <CardContent className="p-4">
              <div className="text-sm font-semibold text-stone-700 mb-2">{t('farmer_info')}</div>
              <div className="grid grid-cols-2 gap-y-1 text-sm text-stone-600">
                <div className="flex items-center gap-1"><Users className="w-4 h-4 text-stone-400" />{item.farmer_name || '—'}</div>
                <div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-stone-400" />{item.village || '—'}</div>
                <div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-stone-400" />{t('mandal')}: {item.mandal || '—'}</div>
                <div className="flex items-center gap-1"><Phone className="w-4 h-4 text-stone-400" />{item.contact || '—'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Order box */}
          <Card className="mt-4 border-stone-200">
            <CardContent className="p-4 space-y-3">
              {available ? (
                <>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="qty" className="w-24">{t('quantity')}</Label>
                    <Input id="qty" type="number" min="1" max={item.quantity} value={qty} onChange={e => setQty(e.target.value)} className="w-28" />
                    <span className="text-sm text-stone-500">{item.unit}</span>
                  </div>
                  {overStock && <p className="text-xs text-red-600">Only {item.quantity} {item.unit} available.</p>}
                  <Textarea placeholder={t('order_note')} value={note} onChange={e => setNote(e.target.value)} rows={2} />
                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-stone-600">{t('total')}</span>
                    <span className="text-xl font-bold text-green-800">{money(numericQty * item.price)}</span>
                  </div>
                  {user && user.role === 'buyer' ? (
                    <Button className="w-full bg-green-700 hover:bg-green-800" onClick={placeOrder} disabled={placing || overStock || numericQty <= 0}>{placing ? '...' : t('place_order')}</Button>
                  ) : (
                    <Button className="w-full bg-green-700 hover:bg-green-800" onClick={() => navigate('/login')}>{t('login_to_order')}</Button>
                  )}
                  <p className="text-[11px] text-center text-stone-400">Prototype demo — no real payment is processed.</p>
                </>
              ) : (
                <div className="text-center py-4 text-stone-500">Currently unavailable / out of stock.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ---------------- Auth ----------------
function AuthPage({ t, mode, navigate, setUser, refreshUser }) {
  const isLogin = mode === 'login'
  const initRole = (typeof window !== 'undefined' && localStorage.getItem('signup_role')) || 'farmer'
  const [form, setForm] = useState({ name: '', email: '', password: '', role: initRole, phone: '', village: '', mandal: '' })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!isLogin && form.phone && !validPhone(form.phone)) { toast.error('Enter a valid 10-digit phone number'); return }
    setBusy(true)
    try {
      const path = isLogin ? '/auth/login' : '/auth/register'
      const d = await api(path, { method: 'POST', body: JSON.stringify(form) })
      setUser(d.user)
      if (typeof window !== 'undefined') localStorage.removeItem('signup_role')
      toast.success(isLogin ? 'Welcome back!' : 'Account created!')
      navigate('/dashboard')
    } catch (err) { toast.error(err.message) }
    finally { setBusy(false) }
  }
  const demo = (email, pw) => setForm(f => ({ ...f, email, password: pw }))

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Card className="border-stone-200">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-xl bg-green-700 flex items-center justify-center mx-auto mb-2"><Sprout className="w-6 h-6 text-white" /></div>
          <CardTitle className="text-2xl">{isLogin ? t('login') : t('create_account')}</CardTitle>
          <CardDescription>{t('brand')} · {t('region')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {!isLogin && (
              <>
                <div><Label htmlFor="name">{t('full_name')}</Label><Input id="name" value={form.name} onChange={e => set('name', e.target.value)} required className="mt-1" /></div>
                <div>
                  <Label>{t('i_am_a')}</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {['farmer', 'buyer'].map(r => (
                      <button type="button" key={r} onClick={() => set('role', r)}
                        className={`py-2 rounded-md border text-sm font-medium ${form.role === r ? 'bg-green-700 text-white border-green-700' : 'bg-white border-stone-300 text-stone-600'}`}>
                        {t(r)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div><Label htmlFor="email">{t('email')}</Label><Input id="email" type="email" value={form.email} onChange={e => set('email', e.target.value)} required className="mt-1" /></div>
            <div><Label htmlFor="pw">{t('password')}</Label><Input id="pw" type="password" value={form.password} onChange={e => set('password', e.target.value)} required className="mt-1" /></div>
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="phone">{t('phone')}</Label><Input id="phone" value={form.phone} onChange={e => set('phone', e.target.value)} className="mt-1" placeholder="10-digit" /></div>
                <div>
                  <Label>{t('mandal')}</Label>
                  <Select value={form.mandal} onValueChange={v => set('mandal', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder={t('mandal')} /></SelectTrigger>
                    <SelectContent>{MANDALS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <Button type="submit" disabled={busy} className="w-full bg-green-700 hover:bg-green-800">{busy ? '...' : isLogin ? t('login') : t('create_account')}</Button>
          </form>

          <div className="text-center text-sm text-stone-500 mt-4">
            {isLogin ? t('no_account') : t('have_account')}{' '}
            <button onClick={() => navigate(isLogin ? '/register' : '/login')} className="text-green-700 font-medium">{isLogin ? t('register') : t('login')}</button>
          </div>

          {isLogin && (
            <div className="mt-5 border-t pt-4">
              <div className="text-xs font-semibold text-stone-500 mb-2">{t('demo_accounts')} <span className="font-normal">(demonstration data)</span></div>
              <div className="grid gap-2 text-xs">
                <button onClick={() => demo('farmer@agridirect.in', 'farmer123')} className="text-left rounded-md border border-stone-200 px-3 py-2 hover:bg-stone-50">🌾 <b>Farmer</b> — farmer@agridirect.in / farmer123</button>
                <button onClick={() => demo('buyer@agridirect.in', 'buyer123')} className="text-left rounded-md border border-stone-200 px-3 py-2 hover:bg-stone-50">🛒 <b>Buyer</b> — buyer@agridirect.in / buyer123</button>
                <button onClick={() => demo('admin@agridirect.in', 'admin123')} className="text-left rounded-md border border-stone-200 px-3 py-2 hover:bg-stone-50">🛡️ <b>Admin</b> — admin@agridirect.in / admin123</button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------- Shared bits ----------------
function Stat({ icon: Icon, label, value, color = 'text-green-700 bg-green-100' }) {
  return (
    <Card className="border-stone-200">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}><Icon className="w-6 h-6" /></div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-stone-500">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

const ORDER_STEPS = ['pending', 'accepted', 'processing', 'ready', 'completed']
function OrderTimeline({ status, lang = 'en' }) {
  if (status === 'rejected' || status === 'cancelled') {
    return <div className="mt-2"><StatusBadge status={status} lang={lang} /></div>
  }
  const activeIdx = ORDER_STEPS.indexOf(status)
  return (
    <div className="flex items-center gap-1 mt-2 flex-wrap">
      {ORDER_STEPS.map((s, i) => (
        <span key={s} className="flex items-center gap-1">
          <span className={`px-2 py-0.5 rounded-full text-[11px] border ${i <= activeIdx ? 'bg-green-600 text-white border-green-600' : 'bg-white text-stone-400 border-stone-200'}`}>
            {STATUS_TR[s] ? STATUS_TR[s][lang] : s}
          </span>
          {i < ORDER_STEPS.length - 1 && <span className={`w-3 h-px ${i < activeIdx ? 'bg-green-500' : 'bg-stone-200'}`} />}
        </span>
      ))}
    </div>
  )
}

// ---------------- Farmer Dashboard ----------------
function FarmerDashboard({ t, lang, user, navigate, setUser }) {
  const [tab, setTab] = useState('overview')
  const [listings, setListings] = useState([])
  const [orders, setOrders] = useState([])
  const [earn, setEarn] = useState(null)
  const [loading, setLoading] = useState(true)
  const emptyForm = { name: '', name_te: '', category: 'Paddy', price: '', unit: 'kg', quantity: '', quality: 'Grade A', description: '', village: user.village || '', mandal: user.mandal || '', contact: user.phone || '', image_url: '' }
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [l, o, e] = await Promise.all([api('/farmer/produce'), api('/farmer/orders'), api('/farmer/earnings')])
      setListings(Array.isArray(l) ? l : []); setOrders(Array.isArray(o) ? o : []); setEarn(e)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { loadAll() }, [loadAll])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true) }
  const openEdit = (item) => { setEditing(item); setForm({ ...emptyForm, ...item }); setDialogOpen(true) }

  const validateForm = () => {
    if (!form.name.trim()) return 'Produce name is required'
    if (form.price === '' || Number(form.price) <= 0) return 'Price must be greater than 0'
    if (form.quantity !== '' && Number(form.quantity) < 0) return 'Quantity cannot be negative'
    if (form.contact && !validPhone(form.contact)) return 'Contact must be a valid 10-digit number'
    return null
  }

  const saveProduce = async (e) => {
    e.preventDefault()
    const err = validateForm()
    if (err) { toast.error(err); return }
    try {
      if (editing) { await api('/produce/' + editing.id, { method: 'PUT', body: JSON.stringify(form) }); toast.success('Produce updated') }
      else { await api('/produce', { method: 'POST', body: JSON.stringify(form) }); toast.success('Produce added') }
      setDialogOpen(false); loadAll()
    } catch (err2) { toast.error(err2.message) }
  }
  const removeProduce = async (item) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    try { await api('/produce/' + item.id, { method: 'DELETE' }); toast.success('Deleted'); loadAll() }
    catch (err) { toast.error(err.message) }
  }
  const toggleAvailability = async (item) => {
    const next = item.status === 'available' ? 'unavailable' : 'available'
    try { await api('/produce/' + item.id, { method: 'PUT', body: JSON.stringify({ status: next }) }); loadAll() }
    catch (err) { toast.error(err.message) }
  }
  const updateOrder = async (id, status) => {
    try { await api('/orders/' + id + '/status', { method: 'PUT', body: JSON.stringify({ status }) }); toast.success('Order updated'); loadAll() }
    catch (err) { toast.error(err.message) }
  }

  const countBy = (s) => orders.filter(o => o.status === s).length
  const activeListings = listings.filter(l => l.status === 'available').length

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('welcome')}, {user.name}</h1>
          <p className="text-stone-500 text-sm">{t('farmer')} · {user.mandal || user.location || t('region')}</p>
        </div>
        <Button onClick={openAdd} className="bg-green-700 hover:bg-green-800 gap-1"><Plus className="w-4 h-4" />{t('add_produce')}</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
          <TabsTrigger value="listings">{t('my_listings')}</TabsTrigger>
          <TabsTrigger value="orders">{t('incoming_orders')}</TabsTrigger>
          <TabsTrigger value="earnings">{t('earnings')}</TabsTrigger>
          <TabsTrigger value="profile">{t('profile')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {loading ? <Loading /> : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Stat icon={Leaf} label="Active Listings" value={activeListings} />
                <Stat icon={ClipboardList} label={STATUS_TR.pending[lang]} value={countBy('pending')} color="text-amber-700 bg-amber-100" />
                <Stat icon={CheckCircle2} label={STATUS_TR.accepted[lang]} value={countBy('accepted') + countBy('processing') + countBy('ready')} color="text-blue-700 bg-blue-100" />
                <Stat icon={PackageCheck} label={STATUS_TR.completed[lang]} value={countBy('completed')} color="text-green-700 bg-green-100" />
                <Stat icon={IndianRupee} label={t('total_earnings')} value={money(earn?.total_earnings ?? 0)} color="text-emerald-700 bg-emerald-100" />
              </div>
              <Card className="mt-6 border-stone-200">
                <CardHeader><CardTitle className="text-lg">{t('incoming_orders')}</CardTitle></CardHeader>
                <CardContent>
                  {orders.length === 0 ? <EmptyState title="No orders yet." hint="Orders from buyers will appear here." /> :
                    orders.slice(0, 5).map(o => (
                      <div key={o.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                        <span>{o.produce_name} · {o.quantity} {o.unit}</span>
                        <div className="flex items-center gap-3"><span className="font-semibold">{money(o.total_amount || o.total)}</span><StatusBadge status={o.status} lang={lang} /></div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="listings" className="mt-6">
          {loading ? <Loading /> : listings.length === 0 ? (
            <EmptyState icon={Leaf} title="You haven't listed any produce yet." hint="Tap 'Add Produce' to list your first item." action={<Button className="mt-4 bg-green-700 hover:bg-green-800" onClick={openAdd}><Plus className="w-4 h-4 mr-1" />{t('add_produce')}</Button>} />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map(item => (
                <Card key={item.id} className="border-stone-200">
                  <ProduceVisual item={item} className="h-24" emojiClass="text-4xl" />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <div className="text-sm text-stone-500">{item.category} · {item.quantity} {item.unit}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(item)} aria-label="Edit"><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => removeProduce(item)} aria-label="Delete"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </div>
                    <div className="text-green-800 font-bold mt-1">{money(item.price)} /{item.unit}</div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <span className="text-sm text-stone-600">{item.status === 'available' ? 'Available' : 'Unavailable'}</span>
                      <Switch checked={item.status === 'available'} onCheckedChange={() => toggleAvailability(item)} aria-label="Toggle availability" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="mt-6 space-y-3">
          {loading ? <Loading /> : orders.length === 0 ? <EmptyState title="No incoming orders." hint="Once buyers order your produce, they'll show here." /> :
            orders.map(o => (
              <Card key={o.id} className="border-stone-200">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{o.produce_name}</div>
                      <div className="text-sm text-stone-500">{o.quantity} {o.unit} · {t('by')} {o.buyer_name} {o.buyer_phone && `· ${o.buyer_phone}`}</div>
                      {o.note && <div className="text-xs text-stone-400 mt-1">"{o.note}"</div>}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-green-800">{money(o.total_amount || o.total)}</span>
                      <StatusBadge status={o.status} lang={lang} />
                      <div className="flex gap-1 flex-wrap">
                        {o.status === 'pending' && <>
                          <Button size="sm" className="bg-green-700 hover:bg-green-800 gap-1" onClick={() => updateOrder(o.id, 'accepted')}><CheckCircle2 className="w-4 h-4" />{t('accept')}</Button>
                          <Button size="sm" variant="outline" className="gap-1 text-red-600" onClick={() => updateOrder(o.id, 'rejected')}><Ban className="w-4 h-4" />{t('reject')}</Button>
                        </>}
                        {o.status === 'accepted' && <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-1" onClick={() => updateOrder(o.id, 'processing')}>{t('start_processing')}</Button>}
                        {o.status === 'processing' && <Button size="sm" className="bg-purple-600 hover:bg-purple-700 gap-1" onClick={() => updateOrder(o.id, 'ready')}><Truck className="w-4 h-4" />{t('mark_ready')}</Button>}
                        {o.status === 'ready' && <Button size="sm" className="bg-green-700 hover:bg-green-800 gap-1" onClick={() => updateOrder(o.id, 'completed')}><PackageCheck className="w-4 h-4" />{t('mark_completed')}</Button>}
                      </div>
                    </div>
                  </div>
                  <OrderTimeline status={o.status} lang={lang} />
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="earnings" className="mt-6">
          {loading ? <Loading /> : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat icon={IndianRupee} label={t('total_earnings')} value={money(earn?.total_earnings ?? 0)} />
              <Stat icon={TrendingUp} label={t('pending_value')} value={money(earn?.pending_value ?? 0)} color="text-purple-700 bg-purple-100" />
              <Stat icon={PackageCheck} label={STATUS_TR.completed[lang]} value={earn?.delivered_count ?? 0} color="text-blue-700 bg-blue-100" />
              <Stat icon={ClipboardList} label={t('total_orders')} value={earn?.total_orders ?? 0} color="text-amber-700 bg-amber-100" />
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <ProfileForm t={t} user={user} setUser={setUser} showFarmerFields />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? t('edit') + ' ' + t('products') : t('add_produce')}</DialogTitle></DialogHeader>
          <form onSubmit={saveProduce} className="space-y-3">
            <div><Label>{t('name')} *</Label><Input value={form.name} onChange={e => set('name', e.target.value)} required className="mt-1" /></div>
            <div><Label>{t('name_telugu')}</Label><Input value={form.name_te} onChange={e => set('name_te', e.target.value)} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('category')}</Label>
                <Select value={form.category} onValueChange={v => set('category', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('quality')}</Label>
                <Select value={form.quality} onValueChange={v => set('quality', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{QUALITIES.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>{t('price')} *</Label><Input type="number" min="1" value={form.price} onChange={e => set('price', e.target.value)} required className="mt-1" /></div>
              <div>
                <Label>{t('unit')}</Label>
                <Select value={form.unit} onValueChange={v => set('unit', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{['kg', 'quintal', 'piece', 'dozen', 'ton'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>{t('quantity')}</Label><Input type="number" min="0" value={form.quantity} onChange={e => set('quantity', e.target.value)} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t('village')}</Label><Input value={form.village} onChange={e => set('village', e.target.value)} className="mt-1" /></div>
              <div>
                <Label>{t('mandal')}</Label>
                <Select value={form.mandal} onValueChange={v => set('mandal', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={t('mandal')} /></SelectTrigger>
                  <SelectContent>{MANDALS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>{t('contact')}</Label><Input value={form.contact} onChange={e => set('contact', e.target.value)} className="mt-1" placeholder="10-digit" /></div>
            <div><Label>{t('image_url')}</Label><Input value={form.image_url} onChange={e => set('image_url', e.target.value)} className="mt-1" placeholder="https://..." /></div>
            <div><Label>{t('description')}</Label><Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="mt-1" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
              <Button type="submit" className="bg-green-700 hover:bg-green-800">{t('save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProfileForm({ t, user, setUser, showFarmerFields }) {
  const [form, setForm] = useState({
    name: user.name || '', phone: user.phone || '', village: user.village || '',
    mandal: user.mandal || '', district: user.district || 'West Godavari',
    profile_image: user.profile_image || '', preferred_language: user.preferred_language || 'en',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const save = async (e) => {
    e.preventDefault()
    if (form.phone && !validPhone(form.phone)) { toast.error('Enter a valid 10-digit phone number'); return }
    try { const d = await api('/auth/profile', { method: 'PUT', body: JSON.stringify(form) }); setUser(d.user); toast.success('Profile updated') }
    catch (err) { toast.error(err.message) }
  }
  return (
    <Card className="border-stone-200 max-w-lg">
      <CardHeader><CardTitle>{t('profile')}</CardTitle><CardDescription>{user.email} · {t(user.role)}</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-3">
          <div><Label>{t('full_name')}</Label><Input value={form.name} onChange={e => set('name', e.target.value)} className="mt-1" /></div>
          <div><Label>{t('phone')}</Label><Input value={form.phone} onChange={e => set('phone', e.target.value)} className="mt-1" placeholder="10-digit" /></div>
          {showFarmerFields && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t('village')}</Label><Input value={form.village} onChange={e => set('village', e.target.value)} className="mt-1" /></div>
              <div>
                <Label>{t('mandal')}</Label>
                <Select value={form.mandal} onValueChange={v => set('mandal', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={t('mandal')} /></SelectTrigger>
                  <SelectContent>{MANDALS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>District</Label><Input value={form.district} onChange={e => set('district', e.target.value)} className="mt-1" /></div>
            <div>
              <Label>Preferred Language</Label>
              <Select value={form.preferred_language} onValueChange={v => set('preferred_language', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="te">తెలుగు</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Profile Image URL</Label><Input value={form.profile_image} onChange={e => set('profile_image', e.target.value)} className="mt-1" placeholder="https://..." /></div>
          <Button type="submit" className="bg-green-700 hover:bg-green-800">{t('save')}</Button>
        </form>
      </CardContent>
    </Card>
  )
}

// ---------------- Buyer Dashboard ----------------
function BuyerDashboard({ t, lang, user, navigate, setUser, wishlist, toggleWishlist }) {
  const [tab, setTab] = useState('overview')
  const [orders, setOrders] = useState([])
  const [wishItems, setWishItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [o, w] = await Promise.all([api('/buyer/orders'), api('/buyer/wishlist')])
      setOrders(Array.isArray(o) ? o : []); setWishItems(Array.isArray(w) ? w : [])
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => { // keep wishlist tab in sync when toggled elsewhere
    api('/buyer/wishlist').then(w => setWishItems(Array.isArray(w) ? w : [])).catch(() => {})
  }, [wishlist])

  const cancelOrder = async (id) => {
    if (!confirm('Cancel this order?')) return
    try { await api('/orders/' + id + '/status', { method: 'PUT', body: JSON.stringify({ status: 'cancelled' }) }); toast.success('Order cancelled'); load() }
    catch (e) { toast.error(e.message) }
  }

  const spent = orders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.total_amount || o.total || 0), 0)
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('welcome')}, {user.name}</h1>
          <p className="text-stone-500 text-sm">{t('buyer')} · {user.mandal || user.location || t('region')}</p>
        </div>
        <Button onClick={() => navigate('/marketplace')} className="bg-green-700 hover:bg-green-800 gap-1"><Store className="w-4 h-4" />{t('browse')}</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
          <TabsTrigger value="orders">{t('my_orders')}</TabsTrigger>
          <TabsTrigger value="wishlist" className="gap-1"><Heart className="w-4 h-4" />Wishlist</TabsTrigger>
          <TabsTrigger value="profile">{t('profile')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Stat icon={ClipboardList} label={t('total_orders')} value={orders.length} color="text-blue-700 bg-blue-100" />
            <Stat icon={PackageCheck} label={STATUS_TR.completed[lang]} value={orders.filter(o => o.status === 'completed').length} />
            <Stat icon={IndianRupee} label="Total Spent" value={money(spent)} color="text-amber-700 bg-amber-100" />
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-6 space-y-3">
          {loading ? <Loading /> : orders.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No orders yet." hint="Explore fresh produce from local farmers." action={<Button className="mt-4 bg-green-700 hover:bg-green-800" onClick={() => navigate('/marketplace')}>{t('browse')}</Button>} />
          ) : orders.map(o => (
            <Card key={o.id} className="border-stone-200">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">{o.produce_name}</div>
                    <div className="text-sm text-stone-500">{o.quantity} {o.unit} · {t('by')} {o.farmer_name}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-green-800">{money(o.total_amount || o.total)}</span>
                    <StatusBadge status={o.status} lang={lang} />
                    {['pending', 'accepted'].includes(o.status) && <Button size="sm" variant="outline" className="text-red-600" onClick={() => cancelOrder(o.id)}>{t('cancel_order')}</Button>}
                  </div>
                </div>
                <OrderTimeline status={o.status} lang={lang} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="wishlist" className="mt-6">
          {loading ? <Loading /> : wishItems.length === 0 ? (
            <EmptyState icon={Heart} title="Your wishlist is empty." hint="Tap the heart on any produce to save it here." />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {wishItems.map(it => <ProduceCard key={it.id} item={it} t={t} lang={lang} navigate={navigate} wishlist={wishlist} toggleWishlist={toggleWishlist} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <ProfileForm t={t} user={user} setUser={setUser} showFarmerFields />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---------------- Admin Dashboard ----------------
function AdminDashboard({ t, lang, user }) {
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [farmers, setFarmers] = useState([])
  const [buyers, setBuyers] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([api('/admin/stats'), api('/admin/farmers'), api('/admin/buyers'), api('/admin/products'), api('/admin/orders')])
      .then(([s, f, b, p, o]) => { setStats(s); setFarmers(f || []); setBuyers(b || []); setProducts(p || []); setOrders(o || []) })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const Th = ({ children }) => <th className="text-left px-3 py-2 font-medium text-stone-500 whitespace-nowrap">{children}</th>
  const Td = ({ children }) => <td className="px-3 py-2 border-t border-stone-100 whitespace-nowrap">{children}</td>
  const dt = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '-'

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">{t('admin')} {t('dashboard')}</h1>
      <p className="text-stone-500 text-sm mb-6">AgriDirect · {t('region')} · demonstration data</p>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
          <TabsTrigger value="farmers">{t('farmers')}</TabsTrigger>
          <TabsTrigger value="buyers">{t('buyers')}</TabsTrigger>
          <TabsTrigger value="products">{t('products')}</TabsTrigger>
          <TabsTrigger value="orders">{t('orders')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {loading ? <Loading /> : (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Stat icon={Sprout} label={t('farmers')} value={stats?.farmers ?? 0} />
              <Stat icon={Users} label={t('buyers')} value={stats?.buyers ?? 0} color="text-blue-700 bg-blue-100" />
              <Stat icon={Leaf} label={t('products')} value={stats?.products ?? 0} color="text-lime-700 bg-lime-100" />
              <Stat icon={ClipboardList} label={t('orders')} value={stats?.orders ?? 0} color="text-purple-700 bg-purple-100" />
              <Stat icon={IndianRupee} label="Completed value" value={money(stats?.gmv ?? 0)} color="text-amber-700 bg-amber-100" />
            </div>
          )}
        </TabsContent>

        <TabsContent value="farmers" className="mt-6">
          <Card className="border-stone-200"><CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm"><thead><tr><Th>{t('name')}</Th><Th>{t('email')}</Th><Th>{t('phone')}</Th><Th>{t('mandal')}</Th><Th>Joined</Th></tr></thead>
              <tbody>{farmers.map(f => <tr key={f.id}><Td>{f.name}</Td><Td>{f.email}</Td><Td>{f.phone || '-'}</Td><Td>{f.mandal || f.location || '-'}</Td><Td>{dt(f.created_at)}</Td></tr>)}</tbody>
            </table>
            {farmers.length === 0 && <EmptyState title="No farmers yet." />}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="buyers" className="mt-6">
          <Card className="border-stone-200"><CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm"><thead><tr><Th>{t('name')}</Th><Th>{t('email')}</Th><Th>{t('phone')}</Th><Th>{t('mandal')}</Th><Th>Joined</Th></tr></thead>
              <tbody>{buyers.map(b => <tr key={b.id}><Td>{b.name}</Td><Td>{b.email}</Td><Td>{b.phone || '-'}</Td><Td>{b.mandal || b.location || '-'}</Td><Td>{dt(b.created_at)}</Td></tr>)}</tbody>
            </table>
            {buyers.length === 0 && <EmptyState title="No buyers yet." />}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <Card className="border-stone-200"><CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm"><thead><tr><Th>{t('name')}</Th><Th>{t('category')}</Th><Th>{t('price')}</Th><Th>Qty</Th><Th>Farmer</Th><Th>{t('status')}</Th></tr></thead>
              <tbody>{products.map(p => <tr key={p.id}><Td>{p.name}</Td><Td>{p.category}</Td><Td>{money(p.price)}/{p.unit}</Td><Td>{p.quantity}</Td><Td>{p.farmer_name}</Td><Td><StatusBadge status={p.status} lang={lang} /></Td></tr>)}</tbody>
            </table>
            {products.length === 0 && <EmptyState title="No products yet." />}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card className="border-stone-200"><CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm"><thead><tr><Th>Produce</Th><Th>Buyer</Th><Th>Farmer</Th><Th>{t('total')}</Th><Th>{t('status')}</Th><Th>Date</Th></tr></thead>
              <tbody>{orders.map(o => <tr key={o.id}><Td>{o.produce_name}</Td><Td>{o.buyer_name}</Td><Td>{o.farmer_name}</Td><Td>{money(o.total_amount || o.total)}</Td><Td><StatusBadge status={o.status} lang={lang} /></Td><Td>{dt(o.created_at)}</Td></tr>)}</tbody>
            </table>
            {orders.length === 0 && <EmptyState title="No orders yet." />}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default App
