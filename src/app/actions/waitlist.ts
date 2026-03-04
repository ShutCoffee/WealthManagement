'use server'

import { db } from '@/db'
import { waitlist } from '@/db/schema'
import { count } from 'drizzle-orm'

export async function joinWaitlist(email: string) {
  const trimmed = email.trim().toLowerCase()

  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  try {
    await db.insert(waitlist).values({ email: trimmed })
    return { success: true }
  } catch (err: unknown) {
    const isUnique = err instanceof Error && err.message.includes('unique')
    if (isUnique) {
      return { success: false, error: 'This email is already on the waitlist.' }
    }
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}

export async function getWaitlistCount() {
  const [result] = await db.select({ value: count() }).from(waitlist)
  return result.value
}
