"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!r.ok) {
        const data = await r.json().catch(() => ({}))
        setError(data?.message ?? "Login failed")
        return
      }

      router.push("/admin")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="dark min-h-screen flex items-center justify-center bg-[oklch(0.13_0_0)]">
      <div className="w-full max-w-sm px-6">
        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-[oklch(0.58_0.22_25)] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12M10 4v12" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <h1 className="text-center text-[oklch(0.93_0_0)] text-xl font-semibold tracking-tight mb-1">
          Sign in
        </h1>
        <p className="text-center text-[oklch(0.55_0_0)] text-sm mb-8">
          Admin panel
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[oklch(0.72_0_0)] mb-1.5">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full h-9 rounded-md bg-[oklch(0.22_0_0)] border border-[oklch(1_0_0/8%)] px-3 text-sm text-[oklch(0.93_0_0)] placeholder:text-[oklch(0.45_0_0)] outline-none focus:border-[oklch(0.58_0.22_25)] focus:ring-1 focus:ring-[oklch(0.58_0.22_25)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[oklch(0.72_0_0)] mb-1.5">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full h-9 rounded-md bg-[oklch(0.22_0_0)] border border-[oklch(1_0_0/8%)] px-3 text-sm text-[oklch(0.93_0_0)] placeholder:text-[oklch(0.45_0_0)] outline-none focus:border-[oklch(0.58_0.22_25)] focus:ring-1 focus:ring-[oklch(0.58_0.22_25)] transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-[oklch(0.58_0.22_25)] bg-[oklch(0.58_0.22_25/10%)] border border-[oklch(0.58_0.22_25/20%)] rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 rounded-md bg-[oklch(0.58_0.22_25)] hover:bg-[oklch(0.53_0.22_25)] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  )
}
