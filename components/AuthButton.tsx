'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'

interface AuthButtonProps {
  user: User | null
}

export default function AuthButton({ user }: AuthButtonProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.refresh()
    } catch (error) {
      // Supabase not configured
      console.error('Error signing out:', error)
    }
  }

  if (user) {
    return (
      <button
        onClick={handleLogout}
        className="rounded-md bg-black px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
      >
        Sign Out
      </button>
    )
  }

  return (
    <Link
      href="/login"
      className="rounded-md bg-black px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
    >
      Sign In
    </Link>
  )
}

