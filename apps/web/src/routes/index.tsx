import { api } from '@matrix/api-client'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const users = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await api.api.users.get()
      if (error) throw new Error('Failed to load users')
      return data ?? []
    },
  })

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-16">
      <section className="space-y-4">
        <span className="rounded-full border px-3 py-1 text-sm">Matrix code-template</span>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight">One TypeScript stack for web, API, mobile and desktop.</h1>
        <p className="max-w-2xl text-lg text-zinc-500">TanStack Start + Elysia + Bun + PostgreSQL + Drizzle, wrapped by Capacitor and Tauri where native packaging is needed.</p>
      </section>

      <section className="rounded-2xl border p-6">
        <h2 className="mb-4 text-xl font-medium">Typed API example</h2>
        {users.isPending && <p>Loading users…</p>}
        {users.isError && <p>Start PostgreSQL and the API to load users.</p>}
        {users.data && users.data.length === 0 && <p>No users yet. POST to /api/users to create one.</p>}
        <ul className="space-y-2">
          {users.data?.map((user) => (
            <li key={user.id} className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-900">
              {user.name ?? user.email}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
