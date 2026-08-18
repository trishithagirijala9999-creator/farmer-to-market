# 🌾 AgriDirect – West Godavari

### Direct Digital Marketplace for Farmers and Buyers

AgriDirect is a digital farmer-to-market platform designed to connect **farmers directly with buyers**, helping farmers sell their agricultural produce without unnecessary middlemen.

The platform focuses on agricultural communities in **West Godavari, Andhra Pradesh**, providing a simple, bilingual, mobile-friendly marketplace where farmers can list their produce and buyers can discover and order fresh products directly from them.

---

## 🎯 Problem Statement

Farmers often depend on multiple intermediaries to sell their agricultural products. This can result in:

* Lower earnings for farmers
* Higher prices for buyers
* Limited market access
* Lack of price transparency
* Difficulty finding direct customers
* Limited digital tools for rural farmers

AgriDirect aims to reduce these problems by creating a direct digital connection between farmers and buyers.

---

## 💡 Solution

AgriDirect provides a single platform where:

**👨‍🌾 Farmer → 🛒 AgriDirect Marketplace → 🧑‍💼 Buyer**

Farmers can list their products, manage stock and orders, while buyers can browse, search, filter and purchase agricultural produce.

---

## ✨ Key Features

### 👨‍🌾 Farmer Features

* Farmer registration and login
* Farmer dashboard
* Add agricultural produce
* Edit and delete products
* Update product availability
* Manage quantity and pricing
* Add product images
* View incoming orders
* Accept or reject orders
* Update order status
* Track earnings
* View active listings
* Product information in English and Telugu

### 🛒 Buyer Features

* Buyer registration and login
* Browse agricultural products
* Search products
* Search using English and Telugu names
* Filter by category
* Filter by mandal
* Filter by price
* Sort products by price
* View detailed product information
* View farmer information
* Add products to wishlist
* Place orders
* Track orders
* View order history
* Cancel eligible orders

### 👨‍💼 Admin Features

* Admin authentication
* Admin dashboard
* View platform statistics
* Manage farmers
* Manage buyers
* Manage products
* Manage orders
* Monitor marketplace activity

---

## 🥭 Real-World Produce Images

The marketplace uses real photographs for agricultural products instead of generic placeholders.

Current produce examples include:

* 🍅 Tomato
* 🍌 Banana
* 🥥 Coconut
* 🍆 Brinjal
* 🌾 Paddy
* 🌱 Sugarcane
* 🌶️ Green Chilli
* 🥬 Spinach / Leafy Greens
* 🥒 Okra / Bendakaya

Product images are connected to the actual product data and displayed across marketplace and product-detail pages.

---

## 📦 Order Management

AgriDirect provides an end-to-end order workflow.

### Buyer

1. Browse products
2. Select a product
3. Place an order
4. Receive order confirmation
5. Track order status

### Farmer

1. Receive the order
2. Review order details
3. Accept or reject the order
4. Process the order
5. Mark it as ready
6. Complete the order

### Order Status

```text
Pending
   ↓
Accepted / Rejected
   ↓
Processing
   ↓
Ready
   ↓
Completed
```

Buyers can cancel orders when cancellation is permitted.

---

## 📊 Inventory Management

The platform manages product stock during ordering.

When a buyer places an order:

* Available stock is checked
* Orders exceeding available stock are blocked
* Product quantity is automatically reduced
* Unavailable products cannot be ordered

---

## 🔐 Security & Role-Based Access

AgriDirect implements role-based access control for:

* Farmers
* Buyers
* Administrators

Users can only access features authorized for their role.

The backend also verifies product ownership and prevents one farmer from modifying another farmer's products or orders.

Authentication uses **JWT with HTTP-only cookies**.

---

## 🌐 Bilingual Support

AgriDirect supports:

* 🇬🇧 English
* 🇮🇳 Telugu (తెలుగు)

This makes the platform more accessible to farmers and buyers in Andhra Pradesh.

---

## 📱 Responsive Design

The application follows a mobile-first approach and is designed to work across:

* 📱 Mobile phones
* 📲 Tablets
* 💻 Laptops
* 🖥️ Desktop computers

---

## 🧪 Testing

Backend functionality has been tested across important application flows.

### Backend Test Result

**61/61 tests passed**

Tests include:

* Authentication
* Role separation
* Farmer ownership
* Product management
* Stock management
* Order creation
* Order status validation
* Product filtering
* Wishlist functionality
* Admin authentication

### Frontend Testing

Full automated UI testing is planned for:

* Farmer workflows
* Buyer workflows
* Admin workflows
* Authentication
* Marketplace
* Orders
* Wishlist
* English/Telugu switching
* Mobile responsiveness

---

## 🚀 Planned Enhancements

The following features are planned for future versions:

### 🔔 Real-Time Order Notifications

Farmers will receive:

* Live notification badge
* New-order toast notification
* Notification history
* Unread notification count

Example:

```text
🔔 New Order Received!

Ravi Kumar ordered
10 kg Fresh Tomatoes.

Order #ORD1024
```

### 📊 Farmer Price Insights

Farmers will be able to view:

* Average listed price
* Current selling price
* Price comparison
* Price trends
* Competitive pricing suggestions

### 📸 Farmer Produce Photo Upload

Farmers will be able to:

* Capture a photo using their phone
* Upload produce images
* Replace existing product images

### 🔍 Product Image Zoom

Buyers will be able to open product images in a larger view before ordering.

### 🍉 More Produce

Future listings can include:

* Mango
* Guava
* Watermelon
* Papaya
* Pineapple
* Other regional agricultural products

---

## 🛠️ Technology Stack

### Frontend

* Next.js
* React
* JavaScript
* Tailwind CSS
* Responsive UI

### Backend

* Next.js API Routes
* Node.js
* MongoDB

### Authentication

* JWT
* HTTP-only cookies
* Role-based authorization

### Testing

* Python-based backend testing
* Automated API validation
* Frontend UI testing planned

---

## 🏗️ Project Architecture

```text
farmer-to-market/
│
├── app/
│   ├── api/
│   ├── marketplace/
│   ├── farmer/
│   ├── buyer/
│   ├── admin/
│   └── ...
│
├── components/
│   └── ui/
│
├── hooks/
│
├── lib/
│
├── memory/
│
├── tests/
│
├── test_reports/
│
├── backend_test.py
├── test_result.md
├── package.json
├── next.config.js
├── tailwind.config.js
└── README.md
```

---

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/trishithagirijala9999-creator/farmer-to-market.git
```

### 2. Open the project

```bash
cd farmer-to-market
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env.local` file and configure the required MongoDB and authentication environment variables.

Do not commit private credentials or secret keys to GitHub.

### 5. Start the development server

```bash
npm run dev
```

The application should then be available at:

```text
http://localhost:3000
```

---

## 👥 Demo Accounts

For development/testing, the project currently includes demo accounts:

### Farmer

```text
Email: farmer@agridirect.in
Password: farmer123
```

### Buyer

```text
Email: buyer@agridirect.in
Password: buyer123
```

### Admin

```text
Email: admin@agridirect.in
Password: admin123
```

> ⚠️ These credentials are intended only for development/demo purposes. Do not use them in a production deployment.

---

## 🎯 Project Goals

The main goals of AgriDirect are to:

* Increase farmer market access
* Reduce unnecessary intermediaries
* Improve price transparency
* Help farmers reach direct customers
* Make agricultural products easier to discover
* Provide a simple digital marketplace
* Support local-language users
* Encourage digital adoption among farmers

---

## 🌱 Future Vision

AgriDirect can eventually evolve into a larger agricultural ecosystem with:

* 🤖 AI-based crop price prediction
* 📈 Market demand forecasting
* 🌦️ Weather-based farming insights
* 🗺️ Location-based farmer discovery
* 🚚 Delivery partner integration
* 💳 Online payments
* 📊 Advanced farmer analytics
* 🧠 AI crop recommendations
* 🗣️ Telugu AI farming assistant
* 📱 Progressive Web App / mobile application

---

## 🏆 Project Type

**Academic / Hackathon Project**

**Domain:** Agriculture + E-Commerce + Digital Transformation

**Target Region:** West Godavari, Andhra Pradesh, India

**Primary Users:**

* Farmers
* Buyers
* Administrators

---

## 👩‍💻 Developer

**Trishitha Girijala**

B.Tech – Computer Science / AI & ML

---

## 📄 License

This project is currently intended for **academic and educational purposes**.

---

## ⭐ Support the Project

If you find the project useful, consider giving the repository a ⭐ on GitHub.

**AgriDirect – Connecting Farmers Directly to Their Markets. 🌾**
