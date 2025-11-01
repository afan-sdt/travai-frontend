import { createClient } from '@/lib/supabase/server'
import AuthButton from '@/components/AuthButton'
import VoiceAssistant from '@/components/VoiceAssistant'

export default async function Home() {
  let user = null
  
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (error) {
    // Supabase not configured yet - user will be null
  }

  // Show voice assistant UI if signed in
  if (user) {
    return (
      <div className="relative min-h-screen">
        <div className="absolute top-4 right-4 z-10">
          <AuthButton user={user} />
        </div>
        <VoiceAssistant user={user} />
      </div>
    )
  }

  // Show login page if not signed in
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Travai
          </h1>
          <AuthButton user={user} />
        </div>

        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h2 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Welcome
          </h2>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Sign in to get started with your account.
          </p>
        </div>
      </main>
    </div>
  )
}
