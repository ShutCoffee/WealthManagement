import { getWaitlistCount } from './actions/waitlist'
import { WaitlistForm } from '@/components/waitlist-form'

import {
  BarChart3,
  TrendingUp,
  Coins,
  CreditCard,
  PieChart,
  Globe,
  Target,
  Sparkles,
  ArrowRight,
  Plus,
  RefreshCw,
  Eye,
} from 'lucide-react'

function SummaLogo({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 4H6l6 8-6 8h13" />
    </svg>
  )
}

const features = [
  {
    icon: PieChart,
    title: 'Portfolio Tracking',
    description: 'Stocks, ETFs, crypto, property, and bank accounts — all in one unified view.',
    gradient: 'from-violet-500/15 to-purple-500/15',
    iconColor: 'text-violet-500',
  },
  {
    icon: RefreshCw,
    title: 'Real-Time Prices',
    description: 'Automatic price updates for stocks and cryptocurrencies from trusted data sources.',
    gradient: 'from-cyan-500/15 to-blue-500/15',
    iconColor: 'text-cyan-500',
  },
  {
    icon: TrendingUp,
    title: 'Profit & Loss Analysis',
    description: 'FIFO cost basis tracking with realized and unrealized gain calculations.',
    gradient: 'from-emerald-500/15 to-green-500/15',
    iconColor: 'text-emerald-500',
  },
  {
    icon: Coins,
    title: 'Dividend Tracking',
    description: 'Complete dividend history, YTD income, and yield metrics at a glance.',
    gradient: 'from-amber-500/15 to-yellow-500/15',
    iconColor: 'text-amber-500',
  },
  {
    icon: CreditCard,
    title: 'Liability Management',
    description: 'Track mortgages, loans, and credit cards with automated payment rules.',
    gradient: 'from-rose-500/15 to-pink-500/15',
    iconColor: 'text-rose-500',
  },
  {
    icon: BarChart3,
    title: 'Net Worth Dashboard',
    description: 'See your total assets minus liabilities with beautiful charts and breakdowns.',
    gradient: 'from-blue-500/15 to-indigo-500/15',
    iconColor: 'text-blue-500',
  },
  {
    icon: Globe,
    title: 'Multi-Currency Support',
    description: 'Track your wealth across different currencies with automatic conversion.',
    gradient: 'from-teal-500/15 to-emerald-500/15',
    iconColor: 'text-teal-500',
  },
  {
    icon: Target,
    title: 'Goal-Based Planning',
    description: 'Set and track retirement, education, and savings milestones over time.',
    gradient: 'from-orange-500/15 to-red-500/15',
    iconColor: 'text-orange-500',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Insights',
    description: 'Intelligent suggestions to optimize your portfolio and financial strategy.',
    gradient: 'from-fuchsia-500/15 to-violet-500/15',
    iconColor: 'text-fuchsia-500',
  },
]

const steps = [
  {
    icon: Plus,
    number: '01',
    title: 'Add Your Assets & Liabilities',
    description: 'Connect your investment accounts, bank accounts, crypto wallets, and track your debts in one place.',
    gradient: 'from-violet-500 to-blue-500',
  },
  {
    icon: RefreshCw,
    number: '02',
    title: 'Automatic Tracking',
    description: 'Prices, dividends, and payments are tracked automatically. No manual updates needed.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Eye,
    number: '03',
    title: 'See Your Full Picture',
    description: 'Get a complete view of your net worth with detailed analytics, charts, and insights.',
    gradient: 'from-cyan-500 to-emerald-500',
  },
]

export default async function LandingPage() {
  const waitlistCount = await getWaitlistCount()

  return (
    <div className="min-h-screen bg-background relative landing-bg">

      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-blue-500 rounded-xl blur-sm opacity-60" />
              <div className="relative bg-gradient-to-br from-violet-500 to-blue-600 p-2 rounded-xl">
                <SummaLogo className="h-5 w-5 text-white" />
              </div>
            </div>
            <span className="text-lg font-bold tracking-tight">Summa</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="#waitlist"
              className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white px-4 py-2 text-sm font-medium hover:from-violet-500 hover:to-blue-500 transition-all duration-300 shadow-sm shadow-violet-500/20"
            >
              Join Waitlist
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-violet-500/15 dark:bg-violet-500/10 blur-[120px] animate-float" />
          <div className="absolute top-[10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/15 dark:bg-blue-500/10 blur-[120px] animate-float-delayed" />
          <div className="absolute bottom-[-10%] left-[30%] h-[400px] w-[400px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/8 blur-[120px] animate-float-slow" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,_rgba(120,120,140,0.08)_1px,_transparent_1px),_linear-gradient(to_bottom,_rgba(120,120,140,0.08)_1px,_transparent_1px)] dark:bg-[linear-gradient(to_right,_rgba(255,255,255,0.05)_1px,_transparent_1px),_linear-gradient(to_bottom,_rgba(255,255,255,0.05)_1px,_transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_at_center,_black_30%,_transparent_70%)]" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 sm:pt-32 sm:pb-28">
          <div className="flex flex-col items-center text-center">
            {/* Status badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 backdrop-blur-sm px-4 py-1.5 text-sm text-muted-foreground mb-8 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Now in early development
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
              Your Complete Wealth Picture,{' '}
              <span className="bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 dark:from-violet-400 dark:via-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                One Dashboard
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Track assets, liabilities, investments, and crypto in one place.
              Get real-time prices, dividend tracking, profit analysis, and a
              clear view of your net worth.
            </p>

            {/* Waitlist form with glow */}
            <div className="mt-10 w-full max-w-md relative" id="waitlist">
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-60" />
              <div className="relative bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm">
                <WaitlistForm large />
              </div>
            </div>

            {waitlistCount > 0 && (
              <p className="mt-5 text-sm text-muted-foreground">
                Join{' '}
                <span className="font-semibold bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400 bg-clip-text text-transparent">
                  {waitlistCount.toLocaleString()}+
                </span>{' '}
                {waitlistCount === 1 ? 'person' : 'people'} on the waitlist
              </p>
            )}

            {/* Decorative dashboard preview hint */}
            <div className="mt-16 w-full max-w-2xl">
              <div className="relative rounded-xl border border-border/50 bg-gradient-to-b from-background to-muted/30 p-1 shadow-2xl shadow-violet-500/5">
                <div className="rounded-lg bg-card/80 backdrop-blur-sm border border-border/30 p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-rose-400/60" />
                      <div className="h-3 w-3 rounded-full bg-amber-400/60" />
                      <div className="h-3 w-3 rounded-full bg-emerald-400/60" />
                    </div>
                    <div className="flex-1 h-5 bg-muted/50 rounded-md max-w-[200px]" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="h-16 sm:h-20 rounded-lg bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/10 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Net Worth</div>
                        <div className="text-sm sm:text-base font-bold bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400 bg-clip-text text-transparent">$284,500</div>
                      </div>
                    </div>
                    <div className="h-16 sm:h-20 rounded-lg bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/10 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Assets</div>
                        <div className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">$342,000</div>
                      </div>
                    </div>
                    <div className="h-16 sm:h-20 rounded-lg bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/10 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Liabilities</div>
                        <div className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400">$57,500</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 h-24 sm:h-32 rounded-lg bg-muted/30 border border-border/30 overflow-hidden relative">
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                          </linearGradient>
                        </defs>
                        <path d="M0,60 Q25,55 50,45 T100,35 T150,25 T200,20 L200,80 L0,80 Z" fill="url(#chartGrad)" />
                        <path d="M0,60 Q25,55 50,45 T100,35 T150,25 T200,20" fill="none" stroke="rgb(139, 92, 246)" strokeWidth="1.5" strokeOpacity="0.6" />
                      </svg>
                    </div>
                    <div className="w-24 sm:w-32 h-24 sm:h-32 rounded-lg bg-muted/30 border border-border/30 flex items-center justify-center">
                      <svg className="w-16 sm:w-20 h-16 sm:h-20" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="35" fill="none" stroke="rgb(139, 92, 246)" strokeWidth="10" strokeDasharray="70 30" strokeDashoffset="0" opacity="0.4" />
                        <circle cx="50" cy="50" r="35" fill="none" stroke="rgb(16, 185, 129)" strokeWidth="10" strokeDasharray="40 60" strokeDashoffset="-70" opacity="0.4" />
                        <circle cx="50" cy="50" r="35" fill="none" stroke="rgb(59, 130, 246)" strokeWidth="10" strokeDasharray="20 80" strokeDashoffset="-110" opacity="0.4" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none z-10 rounded-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[20%] right-[-5%] h-[400px] w-[400px] rounded-full bg-violet-500/8 dark:bg-violet-500/6 blur-[100px]" />
          <div className="absolute bottom-[10%] left-[-5%] h-[350px] w-[350px] rounded-full bg-blue-500/8 dark:bg-blue-500/6 blur-[100px]" />
          {/* Fine grid overlay for texture */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,_rgba(120,120,140,0.06)_1px,_transparent_1px),_linear-gradient(to_bottom,_rgba(120,120,140,0.06)_1px,_transparent_1px)] dark:bg-[linear-gradient(to_right,_rgba(255,255,255,0.04)_1px,_transparent_1px),_linear-gradient(to_bottom,_rgba(255,255,255,0.04)_1px,_transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_at_center,_black_50%,_transparent_80%)]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 dark:bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-700 dark:text-violet-300 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Everything you need to manage{' '}
              <span className="bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400 bg-clip-text text-transparent">
                your wealth
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              A comprehensive toolkit for tracking, analyzing, and growing your financial portfolio.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:border-border transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                </div>
                <div className="relative">
                  <div className={`mb-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} p-2.5 ring-1 ring-border/50`}>
                    <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-muted/30 dark:bg-muted/15" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/[0.06] via-transparent to-transparent dark:from-blue-500/[0.08]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-violet-500/[0.06] via-transparent to-transparent dark:from-violet-500/[0.08]" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 dark:bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300 mb-4">
              <RefreshCw className="h-3.5 w-3.5" />
              How It Works
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Get started in{' '}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                three simple steps
              </span>
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-violet-500/30 via-blue-500/30 to-cyan-500/30" />

            {steps.map((step) => (
              <div key={step.number} className="relative text-center group">
                <div className="mb-6 inline-flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-br from-violet-500/20 to-blue-500/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative h-16 w-16 rounded-2xl bg-card border border-border/50 flex items-center justify-center shadow-sm group-hover:border-violet-500/30 transition-colors duration-300">
                      <step.icon className="h-7 w-7 text-muted-foreground group-hover:text-violet-500 transition-colors duration-300" />
                    </div>
                    <span className={`absolute -top-2 -right-2 h-7 w-7 rounded-full bg-gradient-to-br ${step.gradient} text-white text-xs font-bold flex items-center justify-center shadow-md`}>
                      {step.number}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] rounded-full bg-violet-500/8 dark:bg-violet-500/6 blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,_rgba(120,120,140,0.06)_1px,_transparent_1px),_linear-gradient(to_bottom,_rgba(120,120,140,0.06)_1px,_transparent_1px)] dark:bg-[linear-gradient(to_right,_rgba(255,255,255,0.04)_1px,_transparent_1px),_linear-gradient(to_bottom,_rgba(255,255,255,0.04)_1px,_transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_at_center,_black_25%,_transparent_65%)]" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border border-border/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-blue-500/5 to-cyan-500/5" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
            <div className="relative p-8 sm:p-12 text-center">
              <div className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 p-3 mb-6 ring-1 ring-violet-500/20">
                <Sparkles className="h-6 w-6 text-violet-500" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Be the first to know{' '}
                <span className="bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400 bg-clip-text text-transparent">
                  when we launch
                </span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Sign up for early access and get notified as soon as Summa is ready.
              </p>
              <div className="mt-8 max-w-md mx-auto">
                <WaitlistForm large />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border/30 bg-muted/20 pt-16 pb-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-violet-500/[0.04] via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="bg-gradient-to-br from-violet-500 to-blue-600 p-1.5 rounded-lg">
                  <SummaLogo className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold tracking-tight">Summa</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Your complete wealth picture in one dashboard. Track, analyze, and grow your finances.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
                <li><a href="#waitlist" className="hover:text-foreground transition-colors">Join Waitlist</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Summa. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Built for smarter wealth management.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
