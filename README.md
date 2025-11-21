# WealthManager

A modern net worth and portfolio tracking application, inspired by **Kubera**, built with Next.js 16, TypeScript, and PostgreSQL.

## 📊 What is this?

WealthManager is a comprehensive wealth tracking platform that helps you monitor your entire financial portfolio in one place. Track all your assets - from bank accounts and investments to real estate, crypto, and vehicles - with a clean, spreadsheet-like interface.

### Key Features

- **Multi-Asset Tracking**: Bank accounts, investments, properties, cryptocurrencies, vehicles, and more
- **Manual Asset Management**: Add, view, and track assets with custom categorization
- **Automatic Stock Price Updates**: Real-time price fetching via Finnhub API (60 calls/minute free!)
- **Intelligent Stock Search**: Search by ticker or company name with auto-complete
- **Multi-Currency Support**: Track assets in USD, EUR, GBP, CHF, JPY, and more
- **Real-Time Net Worth Calculation**: Automatic calculation of total assets and liabilities
- **Clean, Modern UI**: Kubera-inspired design with a focus on simplicity and usability
- **Secure Data Storage**: PostgreSQL database hosted on Neon with encrypted connections

### Planned Features

- 🔗 Bank & Brokerage Integration (Plaid API)
- 📈 Investment Performance Tracking
- 💰 Cryptocurrency Wallet Sync
- 📊 Interactive Charts & Analytics
- 📱 Responsive Mobile Design
- 🏠 Automated Property Valuation (Zillow API)
- 🔔 Alerts & Notifications
- 📥 Import/Export (CSV, Excel)

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL ([Neon](https://neon.tech))
- **ORM**: [Drizzle ORM](https://orm.drizzle.team)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com)
- **Styling**: Tailwind CSS 4
- **Icons**: [Lucide React](https://lucide.dev)

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ installed
- A free [Neon](https://console.neon.tech) account (for PostgreSQL database)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the root directory:

```bash
DATABASE_URL=postgresql://user:password@host.region.neon.tech/dbname?sslmode=require
FINNHUB_API_KEY=your_api_key_here
```

- Get your database URL from [Neon Console](https://console.neon.tech) → Your Project → Connection Details
- Get your free Finnhub API key from [finnhub.io/register](https://finnhub.io/register)

4. Push the database schema:

```bash
npm run db:push
```

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## 📖 Documentation

For detailed setup instructions, see [SETUP.md](./SETUP.md)

## 🎯 Project Status

Currently in **active development**. Core features implemented:
- ✅ Manual asset creation
- ✅ Net worth dashboard
- ✅ Multi-currency support
- ✅ Database schema & ORM setup
- ✅ **NEW**: Stock price API integration (Alpha Vantage)
- ✅ **NEW**: Automatic portfolio value updates

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

## 📄 License

MIT License - feel free to use this project as inspiration for your own wealth tracking app.

## 🙏 Inspiration

This project is inspired by [Kubera](https://www.kubera.com), one of the best net worth trackers available. We're building an open-source alternative with similar functionality.

## 🔗 Alternatives & Competitors

- **Kubera** - Premium net worth tracker (our inspiration)
- **Empower (Personal Capital)** - Free, retirement-focused
- **Monarch Money** - Budget + net worth tracking
- **Tiller Money** - Spreadsheet-based tracking
- **Vyzer** - High net worth focused

---

**Note**: This project is not affiliated with or endorsed by Kubera.
