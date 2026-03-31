"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { ShieldAlert, ServerCog, User as UserIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/routing"

export default function LoginPage() {
  const t = useTranslations('Auth')
  const router = useRouter()
  const [loginMethod, setLoginMethod] = useState<"LDAP" | "LOCAL">("LDAP")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const payload = Object.fromEntries(formData)

    const result = await signIn(
      loginMethod === "LDAP" ? "ldap-login" : "local-login",
      {
        redirect: false,
        ...payload
      }
    )

    if (result?.error) {
      setError("Invalid credentials. For LDAP stub try corp\\admin | admin")
    } else {
      router.push("/")
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden p-8 transition-colors">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 mb-6 border border-indigo-100 dark:border-transparent">
            <ShieldAlert className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('secure_access')}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">{t('subtitle')}</p>
        </div>

        <div className="flex rounded-lg bg-slate-100 dark:bg-slate-950 p-1 mb-8 border border-slate-200 dark:border-transparent">
          <button
            onClick={() => { setLoginMethod("LDAP"); setError("") }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${loginMethod === 'LDAP' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 cursor-default shadow-sm dark:shadow-none' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <ServerCog className="w-4 h-4" /> LDAP 
          </button>
          <button
            onClick={() => { setLoginMethod("LOCAL"); setError("") }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${loginMethod === 'LOCAL' ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 cursor-default shadow-sm dark:shadow-none' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <UserIcon className="w-4 h-4" /> {t('local_db')}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 focus-within:text-indigo-600 dark:focus-within:text-indigo-400 transition-colors">
              {loginMethod === "LDAP" ? t('username') : t('email')}
            </label>
            <input
              name={loginMethod === "LDAP" ? "username" : "email"}
              type={loginMethod === "LDAP" ? "text" : "email"}
              required
              placeholder={loginMethod === "LDAP" ? "corp\\username" : "admin@domain.com"}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-indigo-500/50 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner dark:shadow-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 focus-within:text-indigo-600 dark:focus-within:text-indigo-400 transition-colors">
              {t('password')}
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-indigo-500/50 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all shadow-inner dark:shadow-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-semibold py-3 rounded-lg disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('authenticating') : t('login_btn')}
          </button>
        </form>
      </div>
    </div>
  )
}
