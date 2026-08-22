import { api } from '@matrix/api-client'
import { authClient, signIn, signOut, signUp, useSession } from '@matrix/auth/client'
import { Button } from '@matrix/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { type FormEvent, useEffect, useMemo, useState } from 'react'

export const Route = createFileRoute('/')({
  component: Home,
})

type AuthMode = 'sign-in' | 'sign-up'

interface OrganizationSummary {
  id: string
  name: string
  slug: string
}

interface ProjectSummary {
  id: string
  name: string
  organizationId: string
  createdAt: string
}

function messageFromError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error && 'message' in error) return String(error.message)
  return 'The request could not be completed.'
}

function createSlug(name: string): string {
  const normalized = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return `${normalized || 'workspace'}-${crypto.randomUUID().slice(0, 8)}`
}

function AuthPanel() {
  const queryClient = useQueryClient()
  const session = useSession()
  const [mode, setMode] = useState<AuthMode>('sign-up')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const authenticate = useMutation({
    mutationFn: async () => {
      setErrorMessage('')

      const response =
        mode === 'sign-up'
          ? await signUp.email({ name, email, password })
          : await signIn.email({ email, password })

      if (response.error) throw new Error(response.error.message)
      return response.data
    },
    onSuccess: async () => {
      await session.refetch()
      await queryClient.invalidateQueries()
    },
    onError: (error) => setErrorMessage(messageFromError(error)),
  })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    authenticate.mutate()
  }

  return (
    <section className="grid gap-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:grid-cols-[1.1fr_0.9fr] md:p-10">
      <div className="space-y-5">
        <span className="inline-flex rounded-full border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700">
          Production-ready starter
        </span>
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
          One TypeScript product across web, API, mobile and desktop.
        </h1>
        <p className="max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Create an account to exercise Better Auth, organizations, permission checks, Eden, Elysia,
          Drizzle and PostgreSQL through one tested flow.
        </p>
        <div className="grid gap-3 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
          <p className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900">Self-hosted PostgreSQL and S3-compatible storage</p>
          <p className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900">Cookie sessions for web and signed bearer sessions for native clients</p>
          <p className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900">Organization roles enforced by the API</p>
          <p className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900">Docker, E2E, observability and release automation included</p>
        </div>
      </div>

      <form className="space-y-4 rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-900" onSubmit={submit}>
        <div className="flex rounded-xl bg-zinc-200 p-1 dark:bg-zinc-800">
          {(['sign-up', 'sign-in'] as const).map((value) => (
            <button
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                mode === value ? 'bg-white shadow-sm dark:bg-zinc-950' : 'text-zinc-600 dark:text-zinc-400'
              }`}
              key={value}
              onClick={() => setMode(value)}
              type="button"
            >
              {value === 'sign-up' ? 'Create account' : 'Sign in'}
            </button>
          ))}
        </div>

        {mode === 'sign-up' && (
          <label className="grid gap-2 text-sm font-medium">
            Name
            <input
              autoComplete="name"
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 outline-none ring-zinc-900 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:ring-zinc-100"
              minLength={2}
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </label>
        )}

        <label className="grid gap-2 text-sm font-medium">
          Email
          <input
            autoComplete="email"
            className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 outline-none ring-zinc-900 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:ring-zinc-100"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Password
          <input
            autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 outline-none ring-zinc-900 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:ring-zinc-100"
            minLength={12}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        {errorMessage && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{errorMessage}</p>}

        <Button className="w-full" disabled={authenticate.isPending} type="submit">
          {authenticate.isPending ? 'Working...' : mode === 'sign-up' ? 'Create account' : 'Sign in'}
        </Button>
      </form>
    </section>
  )
}

function Workspace() {
  const queryClient = useQueryClient()
  const session = useSession()
  const [activeOrganizationId, setActiveOrganizationId] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const organizations = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await authClient.organization.list()
      if (response.error) throw new Error(response.error.message)
      return (response.data ?? []) as OrganizationSummary[]
    },
  })

  useEffect(() => {
    if (!activeOrganizationId && organizations.data?.[0]) {
      setActiveOrganizationId(organizations.data[0].id)
    }
  }, [activeOrganizationId, organizations.data])

  const activeOrganization = useMemo(
    () => organizations.data?.find((item) => item.id === activeOrganizationId),
    [activeOrganizationId, organizations.data],
  )

  const projects = useQuery({
    enabled: Boolean(activeOrganizationId),
    queryKey: ['projects', activeOrganizationId],
    queryFn: async () => {
      const response = await api.api.organizations({ organizationId: activeOrganizationId }).projects.get()
      if (response.error) throw new Error('Unable to load projects for this organization.')
      return (response.data ?? []) as ProjectSummary[]
    },
  })

  const createOrganization = useMutation({
    mutationFn: async () => {
      setErrorMessage('')
      const response = await authClient.organization.create({
        name: organizationName,
        slug: createSlug(organizationName),
      })
      if (response.error) throw new Error(response.error.message)
      return response.data as OrganizationSummary
    },
    onSuccess: async (created) => {
      setOrganizationName('')
      setActiveOrganizationId(created.id)
      await queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
    onError: (error) => setErrorMessage(messageFromError(error)),
  })

  const createProject = useMutation({
    mutationFn: async () => {
      setErrorMessage('')
      const response = await api.api.organizations({ organizationId: activeOrganizationId }).projects.post({
        name: projectName,
      })
      if (response.error) throw new Error('Unable to create the project.')
      return response.data
    },
    onSuccess: async () => {
      setProjectName('')
      await queryClient.invalidateQueries({ queryKey: ['projects', activeOrganizationId] })
    },
    onError: (error) => setErrorMessage(messageFromError(error)),
  })

  const logOut = async () => {
    await signOut()
    await session.refetch()
    queryClient.clear()
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col justify-between gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-zinc-500">Signed in as</p>
          <h1 className="text-2xl font-semibold">{session.data?.user.name}</h1>
          <p className="text-sm text-zinc-500">{session.data?.user.email}</p>
        </div>
        <Button onClick={logOut} variant="outline">Sign out</Button>
      </header>

      {errorMessage && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{errorMessage}</p>}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <h2 className="text-lg font-semibold">Organizations</h2>
            <p className="mt-1 text-sm text-zinc-500">Every project is isolated by membership and role.</p>
          </div>

          <div className="space-y-2">
            {organizations.isPending && <p className="text-sm text-zinc-500">Loading organizations...</p>}
            {organizations.data?.map((item) => (
              <button
                className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition ${
                  activeOrganizationId === item.id
                    ? 'border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950'
                    : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900'
                }`}
                key={item.id}
                onClick={() => setActiveOrganizationId(item.id)}
                type="button"
              >
                <span className="block font-medium">{item.name}</span>
                <span className="block text-xs opacity-70">{item.slug}</span>
              </button>
            ))}
          </div>

          <form
            className="space-y-3 border-t border-zinc-200 pt-5 dark:border-zinc-800"
            onSubmit={(event) => {
              event.preventDefault()
              createOrganization.mutate()
            }}
          >
            <label className="grid gap-2 text-sm font-medium">
              New organization
              <input
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 outline-none ring-zinc-900 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:ring-zinc-100"
                minLength={2}
                onChange={(event) => setOrganizationName(event.target.value)}
                placeholder="Matrix Labs"
                required
                value={organizationName}
              />
            </label>
            <Button className="w-full" disabled={createOrganization.isPending} type="submit" variant="secondary">
              {createOrganization.isPending ? 'Creating...' : 'Create organization'}
            </Button>
          </form>
        </aside>

        <main className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8">
          {!activeOrganization ? (
            <div className="grid min-h-80 place-items-center text-center">
              <div>
                <h2 className="text-2xl font-semibold">Create your first organization</h2>
                <p className="mt-2 text-zinc-500">It becomes the security boundary for projects and members.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm text-zinc-500">Active organization</p>
                  <h2 className="text-3xl font-semibold">{activeOrganization.name}</h2>
                </div>
                <form
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    createProject.mutate()
                  }}
                >
                  <input
                    aria-label="Project name"
                    className="min-w-0 rounded-xl border border-zinc-300 bg-white px-3 py-2.5 outline-none ring-zinc-900 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:ring-zinc-100"
                    minLength={2}
                    onChange={(event) => setProjectName(event.target.value)}
                    placeholder="New product"
                    required
                    value={projectName}
                  />
                  <Button disabled={createProject.isPending} type="submit">
                    {createProject.isPending ? 'Creating...' : 'Add project'}
                  </Button>
                </form>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {projects.isPending && <p className="text-sm text-zinc-500">Loading projects...</p>}
                {projects.data?.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
                    No projects yet. Create one above.
                  </div>
                )}
                {projects.data?.map((item) => (
                  <article className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800" key={item.id}>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="mt-2 text-xs text-zinc-500">Created {new Date(item.createdAt).toLocaleString()}</p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </section>
  )
}

function Home() {
  const session = useSession()

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {session.isPending ? (
          <div className="grid min-h-[60vh] place-items-center text-zinc-500">Loading session...</div>
        ) : session.data ? (
          <Workspace />
        ) : (
          <AuthPanel />
        )}
      </div>
    </div>
  )
}
