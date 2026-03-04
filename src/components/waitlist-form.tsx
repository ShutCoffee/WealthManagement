'use client'

import { useState, useTransition } from 'react'
import { joinWaitlist } from '@/app/actions/waitlist'
import { ArrowRight, Check, Loader2 } from 'lucide-react'

interface WaitlistFormProps {
  large?: boolean
}

export function WaitlistForm({ large = false }: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    startTransition(async () => {
      const res = await joinWaitlist(email)
      setResult(res)
      if (res.success) setEmail('')
    })
  }

  if (result?.success) {
    return (
      <div className={`flex items-center justify-center gap-2.5 ${large ? 'text-base py-2' : 'text-sm'}`}>
        <div className="bg-emerald-500/10 p-1.5 rounded-full ring-1 ring-emerald-500/20">
          <Check className="h-4 w-4 text-emerald-500" />
        </div>
        <span className="font-medium text-emerald-600 dark:text-emerald-400">You&apos;re on the list! We&apos;ll be in touch.</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`flex ${large ? 'flex-col sm:flex-row' : 'flex-row'} gap-2`}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className={`flex-1 rounded-lg border border-border bg-background/80 px-4 ${large ? 'py-3 text-base' : 'py-2.5 text-sm'} text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 transition-all`}
        />
        <button
          type="submit"
          disabled={isPending}
          className={`inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white font-medium ${large ? 'px-6 py-3 text-base' : 'px-5 py-2.5 text-sm'} hover:from-violet-500 hover:to-blue-500 disabled:opacity-50 transition-all duration-300 shadow-sm shadow-violet-500/20 shrink-0`}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Join Waitlist
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
      {result?.error && (
        <p className="mt-2 text-sm text-destructive">{result.error}</p>
      )}
    </form>
  )
}
