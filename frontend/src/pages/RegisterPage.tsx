import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { LogoMark } from '../components/layout/Logo'
import { Button } from '../components/ui/Button'
import { useRegister } from '../hooks/useAuth'
import { apiErrorMessage } from '../lib/api'
import { useAuthStore } from '../stores/auth'
import { AuthLayout } from './AuthLayout'

export function RegisterPage() {
  const access = useAuthStore((state) => state.access)
  const register = useRegister()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirm: '',
  })
  const [error, setError] = useState<string | null>(null)

  if (access) return <Navigate to="/" replace />

  const set =
    (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((value) => ({ ...value, [key]: event.target.value }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    register.mutate(
      {
        username: form.username,
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        password: form.password,
      },
      {
        onSuccess: () => navigate('/'),
        onError: (err) => setError(apiErrorMessage(err)),
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
        <h2 className="text-2xl font-extrabold">Create your account</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Join the network in less than a minute.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="first_name" className="mb-1.5 block text-sm font-medium">
                First name
              </label>
              <input
                id="first_name"
                value={form.first_name}
                onChange={set('first_name')}
                autoComplete="given-name"
                className="input-base"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="mb-1.5 block text-sm font-medium">
                Last name
              </label>
              <input
                id="last_name"
                value={form.last_name}
                onChange={set('last_name')}
                autoComplete="family-name"
                className="input-base"
              />
            </div>
          </div>
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              value={form.username}
              onChange={set('username')}
              autoComplete="username"
              required
              className="input-base"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              required
              className="input-base"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={set('password')}
                autoComplete="new-password"
                required
                className="input-base"
              />
            </div>
            <div>
              <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium">
                Confirm
              </label>
              <input
                id="confirm"
                type="password"
                value={form.confirm}
                onChange={set('confirm')}
                autoComplete="new-password"
                required
                className="input-base"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <Button type="submit" loading={register.isPending} className="w-full py-2.5">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already a member?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
