import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { LogoMark } from '../components/layout/Logo'
import { Button } from '../components/ui/Button'
import { useLogin } from '../hooks/useAuth'
import { apiErrorMessage } from '../lib/api'
import { useAuthStore } from '../stores/auth'
import { AuthLayout } from './AuthLayout'

export function LoginPage() {
  const access = useAuthStore((state) => state.access)
  const login = useLogin()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (access) return <Navigate to="/" replace />

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    login.mutate(
      { username, password },
      {
        onSuccess: () => navigate('/'),
        onError: (err) =>
          setError(apiErrorMessage(err, 'Invalid username or password.')),
      },
    )
  }

  return (
    <AuthLayout>
      <div className="card p-8">
        <div className="mb-6 flex items-center gap-3 lg:hidden">
          <LogoMark className="size-9" />
          <span className="text-xl font-extrabold tracking-tight">Network</span>
        </div>
        <h2 className="text-2xl font-extrabold">Welcome back</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Log in to catch up with your network.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              className="input-base"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="input-base"
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <Button type="submit" loading={login.isPending} className="w-full py-2.5">
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          New to Network?{' '}
          <Link
            to="/register"
            className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
