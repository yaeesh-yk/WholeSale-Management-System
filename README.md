# WholesalePro 🏪

A full-stack wholesale business management system built for a local business owner to replace manual paperwork and registers. Currently live in production and actively being used.

---

## 📌 Overview

WholesalePro digitizes the complete workflow of a wholesale business — from managing clients and inventory to generating bills and tracking payments. Built with the MERN stack and deployed on cloud infrastructure.

> Live link not shared to protect client's business data and privacy.

---

## ✨ Features

### 🏪 Shopkeeper (Client) Management
- Add, edit, and delete shopkeepers
- Store name, contact number, and address
- View individual purchase history and ledger
- Track outstanding balance per client

### 📦 Product & Inventory Management
- Add, edit, and delete products with categories
- Real-time stock tracking with auto-decrement on orders
- Low stock alerts when quantity falls below threshold

### 🧾 Order & Billing System
- Create orders by selecting shopkeeper and adding products
- Auto-generated invoice numbers (format: INV-YYYY-XXXX)
- Optional discount support
- Itemized bill with subtotal, discount, and grand total
- One-click PDF bill export — ready to share instantly

### 💰 Payment Tracking
- Payment status per order: `Unpaid` / `Partial` / `Paid`
- Record partial payments with notes
- Per-shopkeeper payment history and ledger
- Total outstanding balance always visible

### 📊 Dashboard & Analytics
- Today's sales, weekly sales, monthly sales
- Total outstanding across all clients
- Top 5 shopkeepers by purchase volume
- Top 5 products by quantity sold
- Low stock alerts panel
- Recent orders feed
- Sales bar chart (last 7 days)

### 🔒 Security
- JWT-based authentication (8-hour expiry)
- bcrypt password hashing (salt rounds: 12)
- Protected API routes with middleware
- Input validation on all routes
- CORS restricted to frontend origin
- Environment variables for all secrets

### ☁️ Backup System
- One-click full data export as JSON
- One-click restore from backup file
- Weekly backup routine for data safety

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React + Vite | UI framework |
| Tailwind CSS | Styling |
| shadcn/ui | Component library |
| Recharts | Dashboard charts |
| Zustand | State management |
| React Hook Form + Zod | Form handling and validation |
| jsPDF + jspdf-autotable | PDF bill generation |
| date-fns | Date formatting |
| React Router v6 | Client-side routing |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express.js | REST API server |
| MongoDB + Mongoose | Database and ODM |
| JWT | Authentication |
| bcrypt | Password hashing |
| express-validator | Input validation |
| express-rate-limit | Brute force protection |
| helmet | HTTP security headers |
| node-cron | Scheduled tasks |

### Infrastructure
| Service | Purpose |
|---|---|
| MongoDB Atlas | Cloud database (Asia Pacific - Mumbai) |
| Render | Backend hosting |
| Vercel | Frontend hosting |
| GitHub | Version control + auto-deploy |

---

## 📁 Project Structure

```
wholesalepro/
├── client/                   # React Vite frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Route-level pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Shopkeepers.jsx
│   │   │   ├── ShopkeeperDetail.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── NewOrder.jsx
│   │   │   ├── BillView.jsx
│   │   │   ├── OrdersHistory.jsx
│   │   │   └── Payments.jsx
│   │   ├── store/            # Zustand state
│   │   └── utils/            # Helpers and API calls
│   └── vite.config.js
│
└── server/                   # Express backend
    ├── models/               # Mongoose schemas
    │   ├── User.js
    │   ├── Shopkeeper.js
    │   ├── Product.js
    │   ├── Order.js
    │   └── Payment.js
    ├── routes/               # API route handlers
    │   ├── auth.js
    │   ├── shopkeepers.js
    │   ├── products.js
    │   ├── orders.js
    │   ├── payments.js
    │   ├── dashboard.js
    │   └── backup.js
    ├── middleware/
    │   └── verifyToken.js
    ├── .env                  # Environment variables (not committed)
    └── server.js
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js v18+
- MongoDB (local) or MongoDB Atlas account

### 1. Clone the repository
```bash
git clone https://github.com/yaeesh-yk/wholesalepro.git
cd wholesalepro
```

### 2. Backend setup
```bash
cd server
npm install
```

Create a `.env` file in `/server`:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_secret_key_here
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend setup
```bash
cd client
npm install
npm run dev
```

### 4. Default login
```
Username: admin
Password: admin123
```
> ⚠️ Change this password immediately after first login.

---

## 🌐 Deployment

### MongoDB Atlas
- Provider: AWS
- Region: Asia Pacific — Mumbai (ap-south-1)
- Tier: M0 Free (512MB)

### Backend → Render
- Connect GitHub repo
- Set environment variables in Render dashboard
- Auto-deploy enabled on push to `main`

### Frontend → Vercel
- Connect GitHub repo
- Set `VITE_API_URL` to Render backend URL
- Auto-deploy enabled on push to `main`

---

## 🔐 Security Notes

- `.env` file is in `.gitignore` — never committed
- JWT tokens expire after 8 hours
- All API routes except `/api/auth/login` require Bearer token
- Rate limiting enabled on login route
- CORS restricted to frontend domain only

---

## 📄 API Endpoints

```
POST   /api/auth/login
GET    /api/shopkeepers
POST   /api/shopkeepers
PUT    /api/shopkeepers/:id
DELETE /api/shopkeepers/:id
GET    /api/shopkeepers/:id/history
GET    /api/products
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
POST   /api/orders
GET    /api/orders
GET    /api/orders/:id
POST   /api/payments
GET    /api/payments/shopkeeper/:id
GET    /api/dashboard
GET    /api/backup
POST   /api/restore
GET    /api/health
```

---

## 👨‍💻 Author

**Yaeesh**
BS Software Engineering — FAST-NUCES Lahore
[GitHub](https://github.com/yaeesh-yk)

---

## 📝 License

This project is private and built for a specific client. Not open for redistribution.
