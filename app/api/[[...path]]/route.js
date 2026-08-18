import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// ---------------- MongoDB connection ----------------
let client
let db
let seeded = false

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  if (!seeded) {
    await ensureSeed(db)
    seeded = true
  }
  return db
}

// ---------------- Helpers ----------------
const JWT_SECRET = () => process.env.JWT_SECRET || 'dev-secret'

function hashPassword(password) { return bcrypt.hashSync(password, 10) }
function verifyPassword(password, hash) { try { return bcrypt.compareSync(password, hash) } catch { return false } }
function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET(), { expiresIn: '7d' })
}
function getTokenFromRequest(request) {
  const cookieToken = request.cookies.get('token')?.value
  if (cookieToken) return cookieToken
  const auth = request.headers.get('authorization') || ''
  if (auth.startsWith('Bearer ')) return auth.slice(7)
  return null
}
async function getCurrentUser(request, db) {
  const token = getTokenFromRequest(request)
  if (!token) return null
  try {
    const payload = jwt.verify(token, JWT_SECRET())
    const user = await db.collection('users').findOne({ id: payload.sub })
    if (!user) return null
    const { _id, password_hash, ...clean } = user
    return clean
  } catch { return null }
}
function publicUser(u) {
  if (!u) return null
  const { _id, password_hash, ...clean } = u
  return clean
}

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}
function json(data, status = 200) { return handleCORS(NextResponse.json(data, { status })) }
function setAuthCookie(response, token) {
  response.cookies.set('token', token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 })
  return response
}

// Order status transitions (farmer-driven). Buyers may only cancel early.
const FARMER_FLOW = {
  pending: ['accepted', 'rejected'],
  accepted: ['processing'],
  processing: ['ready'],
  ready: ['completed'],
}
const BUYER_CANCELLABLE = ['pending', 'accepted']

// ---------------- Seed data ----------------
async function ensureSeed(db) {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@agridirect.in').toLowerCase()
  const adminExists = await db.collection('users').findOne({ email: adminEmail })
  if (!adminExists) {
    await db.collection('users').insertOne({
      id: uuidv4(), name: 'Platform Admin', email: adminEmail,
      password_hash: hashPassword(process.env.ADMIN_PASSWORD || 'admin123'),
      role: 'admin', phone: '', location: 'West Godavari', village: '', mandal: '', created_at: new Date(),
    })
  }

  const userCount = await db.collection('users').countDocuments({ role: { $in: ['farmer', 'buyer'] } })
  if (userCount > 0) return

  const farmers = [
    { id: uuidv4(), name: 'Ravi Kumar', email: 'farmer@agridirect.in', role: 'farmer', phone: '9876543210', location: 'Bhimavaram', village: 'Vundrajavaram', mandal: 'Bhimavaram' },
    { id: uuidv4(), name: 'Lakshmi Devi', email: 'lakshmi@agridirect.in', role: 'farmer', phone: '9876500011', location: 'Tadepalligudem', village: 'Pentapadu', mandal: 'Tadepalligudem' },
  ]
  const buyer = { id: uuidv4(), name: 'Suresh Traders', email: 'buyer@agridirect.in', role: 'buyer', phone: '9000012345', location: 'Eluru', village: '', mandal: 'Eluru' }

  await db.collection('users').insertMany([
    ...farmers.map(f => ({ ...f, password_hash: hashPassword('farmer123'), created_at: new Date() })),
    { ...buyer, password_hash: hashPassword('buyer123'), created_at: new Date() },
  ])

  const produce = [
    { category: 'Paddy', name: 'BPT Sona Masoori Paddy', name_te: 'బీపీటీ సోనా మసూరి వరి', price: 2100, unit: 'quintal', quantity: 80, quality: 'Grade A', img: 'paddy', farmer: farmers[0], desc: 'Freshly harvested Grade-A paddy, low moisture, ready for milling.' },
    { category: 'Banana', name: 'Karpooravalli Banana', name_te: 'కర్పూరవల్లి అరటి', price: 28, unit: 'kg', quantity: 500, quality: 'Grade A', img: 'banana', farmer: farmers[0], desc: 'Sweet, farm-fresh bananas harvested this week.' },
    { category: 'Coconut', name: 'Tender Coconut', name_te: 'లేత కొబ్బరి', price: 22, unit: 'piece', quantity: 1200, quality: 'Standard', img: 'coconut', farmer: farmers[1], desc: 'Naturally grown tender coconuts, bulk available.' },
    { category: 'Vegetables', name: 'Fresh Brinjal (Vankaya)', name_te: 'తాజా వంకాయ', price: 30, unit: 'kg', quantity: 200, quality: 'Organic', img: 'brinjal', farmer: farmers[1], desc: 'Pesticide-controlled brinjal, picked daily.' },
    { category: 'Sugarcane', name: 'Co-86032 Sugarcane', name_te: 'చెరకు Co-86032', price: 350, unit: 'quintal', quantity: 150, quality: 'Grade A', img: 'sugarcane', farmer: farmers[0], desc: 'High-yield sugarcane variety, good sucrose content.' },
    { category: 'Vegetables', name: 'Fresh Tomato', name_te: 'తాజా టమోటా', price: 24, unit: 'kg', quantity: 300, quality: 'Grade B', img: 'tomato', farmer: farmers[1], desc: 'Ripe, firm tomatoes ideal for wholesale.' },
    { category: 'Paddy', name: 'MTU-1010 Paddy', name_te: 'ఎంటీయూ-1010 వరి', price: 1980, unit: 'quintal', quantity: 120, quality: 'Grade B', img: 'paddy', farmer: farmers[1], desc: 'Medium slender variety, well dried.' },
    { category: 'Banana', name: 'Grand Naine Banana', name_te: 'గ్రాండ్ నైన్ అరటి', price: 25, unit: 'kg', quantity: 600, quality: 'Grade A', img: 'banana', farmer: farmers[0], desc: 'Export-quality bananas, uniform size.' },
    { category: 'Vegetables', name: 'Green Chilli (Pachi Mirapakaya)', name_te: 'పచ్చి మిరపకాయ', price: 40, unit: 'kg', quantity: 120, quality: 'Grade A', img: 'chilli', farmer: farmers[1], desc: 'Fresh spicy green chillies, hand-picked.' },
    { category: 'Vegetables', name: 'Okra / Lady Finger (Bendakaya)', name_te: 'బెండకాయ', price: 35, unit: 'kg', quantity: 150, quality: 'Grade A', img: 'okra', farmer: farmers[0], desc: 'Tender green okra, harvested this morning.' },
    { category: 'Vegetables', name: 'Spinach / Leafy Greens (Palakura)', name_te: 'పాలకూర', price: 18, unit: 'kg', quantity: 90, quality: 'Organic', img: 'spinach', farmer: farmers[1], desc: 'Fresh leafy spinach bunches, organically grown.' },
  ]
  await db.collection('produce').insertMany(produce.map(p => ({
    id: uuidv4(), category: p.category, name: p.name, name_te: p.name_te,
    price: p.price, unit: p.unit, quantity: p.quantity, quality: p.quality, description: p.desc,
    farmer_id: p.farmer.id, farmer_name: p.farmer.name, contact: p.farmer.phone,
    village: p.farmer.village, mandal: p.farmer.mandal, location: p.farmer.location,
    image_url: SEED_IMG[p.img] || '', status: 'available', created_at: new Date(),
  })))
}

const PRODUCE_FIELDS = ['category', 'name', 'name_te', 'unit', 'quality', 'description', 'contact', 'village', 'mandal', 'location', 'image_url', 'status']

// Curated real-photo URLs used to seed demo listings (also mirrored on the frontend as fallbacks).
const SEED_IMG = {
  paddy: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Rice_Field_in_Merced%2C_Banate%2C_Iloilo.jpg/960px-Rice_Field_in_Merced%2C_Banate%2C_Iloilo.jpg',
  banana: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/DFC_1274_Two_vendors_chat_behind_a_stall_piled_high_with_ripe_bananas_at_a_local_market.jpg/960px-DFC_1274_Two_vendors_chat_behind_a_stall_piled_high_with_ripe_bananas_at_a_local_market.jpg',
  coconut: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Coconuts_-_single_and_cracked_open.jpg/960px-Coconuts_-_single_and_cracked_open.jpg',
  brinjal: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Solanum_melongena_24_08_2012_%281%29.JPG/960px-Solanum_melongena_24_08_2012_%281%29.JPG',
  sugarcane: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/U_S_Department_of_Agriculture_USDA_Agricultural_Research_Service_ARS_Sugarcane_Research_Unit_scientists_developed_and_released_a_new_high-fiber_variety_of_sugarcane%2C_or_energy_cane%2C_Ho_06-9002%2C_in_Houma%2C_LA%2C_a_%2820211213-ARS-LSC-1193%29.jpg/960px-thumbnail.jpg',
  tomato: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Fresh_red_tomatoes.jpg/960px-Fresh_red_tomatoes.jpg',
  chilli: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Green_chillies.jpg/960px-Green_chillies.jpg',
  okra: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Okra.jpg/960px-Okra.jpg',
  spinach: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/SPINACH_-GREEN_LEAVES_GO_GREEN_AND_ORGANIC.jpg/960px-SPINACH_-GREEN_LEAVES_GO_GREEN_AND_ORGANIC.jpg',
}

// ---------------- Route handler ----------------
async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    if (route === '/' || route === '/root') return json({ message: 'AgriDirect API running' })

    // ===================== AUTH =====================
    if (route === '/auth/register' && method === 'POST') {
      const body = await request.json()
      const email = (body.email || '').toLowerCase().trim()
      const { name, password, role } = body
      if (!name || !email || !password || !role) return json({ error: 'name, email, password and role are required' }, 400)
      if (!['farmer', 'buyer'].includes(role)) return json({ error: 'role must be farmer or buyer' }, 400)
      const exists = await db.collection('users').findOne({ email })
      if (exists) return json({ error: 'An account with this email already exists' }, 409)
      const user = {
        id: uuidv4(), name, email, password_hash: hashPassword(password), role,
        phone: body.phone || '', location: body.location || '', village: body.village || '', mandal: body.mandal || '', created_at: new Date(),
      }
      await db.collection('users').insertOne(user)
      const token = signToken(user)
      return setAuthCookie(json({ user: publicUser(user) }), token)
    }

    if (route === '/auth/login' && method === 'POST') {
      const body = await request.json()
      const email = (body.email || '').toLowerCase().trim()
      const user = await db.collection('users').findOne({ email })
      if (!user || !verifyPassword(body.password || '', user.password_hash)) return json({ error: 'Invalid email or password' }, 401)
      const token = signToken(user)
      return setAuthCookie(json({ user: publicUser(user) }), token)
    }

    if (route === '/auth/logout' && method === 'POST') {
      const res = json({ ok: true })
      res.cookies.set('token', '', { httpOnly: true, path: '/', maxAge: 0 })
      return res
    }

    if (route === '/auth/me' && method === 'GET') {
      const user = await getCurrentUser(request, db)
      if (!user) return json({ error: 'Not authenticated' }, 401)
      return json({ user })
    }

    if (route === '/auth/profile' && method === 'PUT') {
      const user = await getCurrentUser(request, db)
      if (!user) return json({ error: 'Not authenticated' }, 401)
      const body = await request.json()
      const update = {}
      for (const k of ['name', 'phone', 'location', 'village', 'mandal', 'district', 'profile_image', 'preferred_language']) if (body[k] !== undefined) update[k] = body[k]
      await db.collection('users').updateOne({ id: user.id }, { $set: update })
      const updated = await db.collection('users').findOne({ id: user.id })
      return json({ user: publicUser(updated) })
    }

    // ===================== PRODUCE (public browse) =====================
    if (route === '/produce' && method === 'GET') {
      const sp = request.nextUrl.searchParams
      const q = { status: 'available' }
      const category = sp.get('category')
      if (category && category !== 'All') q.category = category
      const mandal = sp.get('mandal')
      if (mandal && mandal !== 'All') q.mandal = mandal
      const minP = sp.get('min_price'), maxP = sp.get('max_price')
      if (minP || maxP) {
        q.price = {}
        if (minP) q.price.$gte = Number(minP)
        if (maxP) q.price.$lte = Number(maxP)
      }
      const search = (sp.get('search') || '').trim()
      if (search) q.$or = [
        { name: { $regex: search, $options: 'i' } },
        { name_te: { $regex: search, $options: 'i' } },
        { village: { $regex: search, $options: 'i' } },
        { mandal: { $regex: search, $options: 'i' } },
      ]
      let cursor = db.collection('produce').find(q)
      const sort = sp.get('sort')
      if (sort === 'price_asc') cursor = cursor.sort({ price: 1 })
      else if (sort === 'price_desc') cursor = cursor.sort({ price: -1 })
      else cursor = cursor.sort({ created_at: -1 })
      const items = await cursor.limit(200).toArray()
      return json(items.map(({ _id, ...r }) => r))
    }

    // distinct mandals for filter
    if (route === '/mandals' && method === 'GET') {
      const list = await db.collection('produce').distinct('mandal')
      return json(list.filter(Boolean).sort())
    }

    // /produce/:id  (GET public, PUT/DELETE owner)
    if (path[0] === 'produce' && path.length === 2) {
      const id = path[1]
      if (method === 'GET') {
        const item = await db.collection('produce').findOne({ id })
        if (!item) return json({ error: 'Produce not found' }, 404)
        const { _id, ...r } = item
        return json(r)
      }
      const user = await getCurrentUser(request, db)
      if (!user) return json({ error: 'Not authenticated' }, 401)
      const item = await db.collection('produce').findOne({ id })
      if (!item) return json({ error: 'Produce not found' }, 404)
      if (item.farmer_id !== user.id) return json({ error: 'You can only modify your own produce' }, 403)

      if (method === 'PUT') {
        const body = await request.json()
        const update = {}
        for (const k of PRODUCE_FIELDS) if (body[k] !== undefined) update[k] = body[k]
        if (body.price !== undefined) update.price = Number(body.price)
        if (body.quantity !== undefined) update.quantity = Number(body.quantity)
        await db.collection('produce').updateOne({ id }, { $set: update })
        const updated = await db.collection('produce').findOne({ id })
        const { _id, ...r } = updated
        return json(r)
      }
      if (method === 'DELETE') {
        await db.collection('produce').deleteOne({ id })
        return json({ ok: true })
      }
    }

    // create produce (farmer)
    if (route === '/produce' && method === 'POST') {
      const user = await getCurrentUser(request, db)
      if (!user) return json({ error: 'Not authenticated' }, 401)
      if (user.role !== 'farmer') return json({ error: 'Only farmers can add produce' }, 403)
      const body = await request.json()
      if (!body.name || !body.category || body.price === undefined || body.price === '') return json({ error: 'Name, category and price are required' }, 400)
      const item = {
        id: uuidv4(), category: body.category, name: body.name, name_te: body.name_te || '',
        price: Number(body.price), unit: body.unit || 'kg', quantity: Number(body.quantity || 0),
        quality: body.quality || 'Standard', description: body.description || '',
        farmer_id: user.id, farmer_name: user.name, contact: body.contact || user.phone || '',
        village: body.village || user.village || '', mandal: body.mandal || user.mandal || '',
        location: body.location || user.location || 'West Godavari', image_url: body.image_url || '',
        status: 'available', created_at: new Date(),
      }
      await db.collection('produce').insertOne(item)
      const { _id, ...r } = item
      return json(r)
    }

    // farmer's own listings
    if (route === '/farmer/produce' && method === 'GET') {
      const user = await getCurrentUser(request, db)
      if (!user || user.role !== 'farmer') return json({ error: 'Not authorized' }, 403)
      const items = await db.collection('produce').find({ farmer_id: user.id }).sort({ created_at: -1 }).toArray()
      return json(items.map(({ _id, ...r }) => r))
    }

    // ===================== ORDERS =====================
    if (route === '/orders' && method === 'POST') {
      const user = await getCurrentUser(request, db)
      if (!user || user.role !== 'buyer') return json({ error: 'Only buyers can place orders' }, 403)
      const body = await request.json()
      const produce = await db.collection('produce').findOne({ id: body.produce_id })
      if (!produce) return json({ error: 'Produce not found' }, 404)
      if (produce.status !== 'available') return json({ error: 'This produce is currently unavailable' }, 400)
      const qty = Number(body.quantity || 1)
      if (!qty || qty <= 0) return json({ error: 'Quantity must be greater than zero' }, 400)
      if (produce.quantity && qty > produce.quantity) return json({ error: `Only ${produce.quantity} ${produce.unit} available` }, 400)
      const order = {
        id: uuidv4(), produce_id: produce.id, produce_name: produce.name,
        farmer_id: produce.farmer_id, farmer_name: produce.farmer_name,
        buyer_id: user.id, buyer_name: user.name, buyer_phone: user.phone || body.buyer_phone || '',
        quantity: qty, unit: produce.unit, price_per_unit: produce.price, total_amount: qty * produce.price, total: qty * produce.price,
        note: body.note || '', status: 'pending', created_at: new Date(), updated_at: new Date(),
      }
      await db.collection('orders').insertOne(order)
      // decrement stock; mark unavailable if depleted
      const remaining = Math.max(0, (produce.quantity || 0) - qty)
      await db.collection('produce').updateOne({ id: produce.id }, { $set: { quantity: remaining, ...(remaining <= 0 ? { status: 'unavailable' } : {}) } })
      const { _id, ...r } = order
      return json(r)
    }

    if (route === '/buyer/orders' && method === 'GET') {
      const user = await getCurrentUser(request, db)
      if (!user || user.role !== 'buyer') return json({ error: 'Not authorized' }, 403)
      const items = await db.collection('orders').find({ buyer_id: user.id }).sort({ created_at: -1 }).toArray()
      return json(items.map(({ _id, ...r }) => r))
    }

    if (route === '/farmer/orders' && method === 'GET') {
      const user = await getCurrentUser(request, db)
      if (!user || user.role !== 'farmer') return json({ error: 'Not authorized' }, 403)
      const items = await db.collection('orders').find({ farmer_id: user.id }).sort({ created_at: -1 }).toArray()
      return json(items.map(({ _id, ...r }) => r))
    }

    if (route === '/farmer/earnings' && method === 'GET') {
      const user = await getCurrentUser(request, db)
      if (!user || user.role !== 'farmer') return json({ error: 'Not authorized' }, 403)
      const orders = await db.collection('orders').find({ farmer_id: user.id }).toArray()
      const completed = orders.filter(o => o.status === 'completed')
      const active = orders.filter(o => ['accepted', 'processing', 'ready'].includes(o.status))
      const pending = orders.filter(o => o.status === 'pending')
      return json({
        total_earnings: completed.reduce((s, o) => s + (o.total_amount || o.total || 0), 0),
        pending_value: active.reduce((s, o) => s + (o.total_amount || o.total || 0), 0),
        delivered_count: completed.length,
        active_count: active.length,
        pending_count: pending.length,
        total_orders: orders.length,
      })
    }

    // update order status  /orders/:id/status  (farmer flow OR buyer cancel)
    if (path[0] === 'orders' && path[2] === 'status' && method === 'PUT') {
      const user = await getCurrentUser(request, db)
      if (!user) return json({ error: 'Not authenticated' }, 401)
      const id = path[1]
      const order = await db.collection('orders').findOne({ id })
      if (!order) return json({ error: 'Order not found' }, 404)
      const body = await request.json()
      const target = body.status

      if (user.role === 'buyer' && order.buyer_id === user.id) {
        if (target !== 'cancelled') return json({ error: 'Buyers can only cancel orders' }, 403)
        if (!BUYER_CANCELLABLE.includes(order.status)) return json({ error: `Cannot cancel a ${order.status} order` }, 400)
      } else if (user.role === 'farmer' && order.farmer_id === user.id) {
        const allowed = FARMER_FLOW[order.status] || []
        if (!allowed.includes(target)) return json({ error: `Invalid transition from ${order.status} to ${target}` }, 400)
      } else {
        return json({ error: 'Not your order' }, 403)
      }

      await db.collection('orders').updateOne({ id }, { $set: { status: target, updated_at: new Date() } })
      const updated = await db.collection('orders').findOne({ id })
      const { _id, ...r } = updated
      return json(r)
    }

    // ===================== WISHLIST (buyer) =====================
    if (route === '/buyer/wishlist' && method === 'GET') {
      const user = await getCurrentUser(request, db)
      if (!user || user.role !== 'buyer') return json({ error: 'Not authorized' }, 403)
      const ids = user.wishlist || []
      if (ids.length === 0) return json([])
      const items = await db.collection('produce').find({ id: { $in: ids } }).toArray()
      return json(items.map(({ _id, ...r }) => r))
    }
    if (route === '/buyer/wishlist' && method === 'POST') {
      const user = await getCurrentUser(request, db)
      if (!user || user.role !== 'buyer') return json({ error: 'Not authorized' }, 403)
      const body = await request.json()
      if (!body.produce_id) return json({ error: 'produce_id required' }, 400)
      await db.collection('users').updateOne({ id: user.id }, { $addToSet: { wishlist: body.produce_id } })
      const updated = await db.collection('users').findOne({ id: user.id })
      return json({ wishlist: updated.wishlist || [] })
    }
    if (path[0] === 'buyer' && path[1] === 'wishlist' && path.length === 3 && method === 'DELETE') {
      const user = await getCurrentUser(request, db)
      if (!user || user.role !== 'buyer') return json({ error: 'Not authorized' }, 403)
      await db.collection('users').updateOne({ id: user.id }, { $pull: { wishlist: path[2] } })
      const updated = await db.collection('users').findOne({ id: user.id })
      return json({ wishlist: updated.wishlist || [] })
    }

    // ===================== ADMIN =====================
    if (path[0] === 'admin') {
      const user = await getCurrentUser(request, db)
      if (!user || user.role !== 'admin') return json({ error: 'Admin access required' }, 403)

      if (route === '/admin/stats' && method === 'GET') {
        const [farmers, buyers, products, orders] = await Promise.all([
          db.collection('users').countDocuments({ role: 'farmer' }),
          db.collection('users').countDocuments({ role: 'buyer' }),
          db.collection('produce').countDocuments({}),
          db.collection('orders').countDocuments({}),
        ])
        const allOrders = await db.collection('orders').find({}).toArray()
        const gmv = allOrders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.total_amount || o.total || 0), 0)
        return json({ farmers, buyers, products, orders, gmv })
      }
      if (route === '/admin/farmers' && method === 'GET') {
        const items = await db.collection('users').find({ role: 'farmer' }).sort({ created_at: -1 }).toArray()
        return json(items.map(publicUser))
      }
      if (route === '/admin/buyers' && method === 'GET') {
        const items = await db.collection('users').find({ role: 'buyer' }).sort({ created_at: -1 }).toArray()
        return json(items.map(publicUser))
      }
      if (route === '/admin/products' && method === 'GET') {
        const items = await db.collection('produce').find({}).sort({ created_at: -1 }).toArray()
        return json(items.map(({ _id, ...r }) => r))
      }
      if (route === '/admin/orders' && method === 'GET') {
        const items = await db.collection('orders').find({}).sort({ created_at: -1 }).toArray()
        return json(items.map(({ _id, ...r }) => r))
      }
    }

    return json({ error: `Route ${route} not found` }, 404)
  } catch (error) {
    console.error('API Error:', error)
    return json({ error: 'Internal server error' }, 500)
  }
}

export async function OPTIONS() { return handleCORS(new NextResponse(null, { status: 200 })) }
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
