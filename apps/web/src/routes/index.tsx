import { api } from '@matrix/api-client'
import { authClient, signIn, signOut, signUp, useSession } from '@matrix/auth/client'
import {
  Alert,
  AlertDescription,
  AppShell,
  ArrowRightIcon,
  Badge,
  BuildingIcon,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  DensityToggle,
  EmptyState,
  FolderIcon,
  FormField,
  Input,
  LogOutIcon,
  PageHeader,
  PaletteIcon,
  PlusIcon,
  Separator,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  Skeleton,
  SparklesIcon,
  StatCard,
  Tabs,
  TabsList,
  TabsTrigger,
  ThemeToggle,
} from '@matrix/ui'
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

const productCapabilities = [
  'Typed React and Elysia contracts',
  'PostgreSQL migrations and authorization',
  'Capacitor and Tauri native packaging',
  'Docker, observability, security, and releases',
]

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <SparklesIcon className="size-4" />
      </div>
      <div>
        <p className="text-sm font-semibold tracking-tight">Matrix Template</p>
        <p className="text-xs text-muted-foreground">TypeScript product foundation</p>
      </div>
    </div>
  )
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
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_56%)]" />
      <header className="relative z-10 flex h-20 items-center justify-between px-[var(--page-gutter)]">
        <BrandMark />
        <div className="flex items-center gap-1">
          <Button asChild size="sm" variant="ghost">
            <a href="/ui">
              <PaletteIcon className="size-4" />
              UI lab
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="ui-container relative z-10 grid min-h-[calc(100dvh-5rem)] items-center gap-10 py-10 lg:grid-cols-[1.08fr_0.92fr] lg:py-16">
        <section className="max-w-2xl">
          <Badge className="mb-6" variant="outline">
            Production-ready, modular, self-hostable
          </Badge>
          <h1 className="ui-balance text-4xl font-semibold tracking-[-0.045em] sm:text-5xl lg:text-6xl">
            One TypeScript product across web, API, mobile and desktop.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            A clean product foundation with typed contracts, secure identity, replaceable infrastructure,
            and a design system that adapts through semantic tokens.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {productCapabilities.map((capability) => (
              <div className="flex items-start gap-3 rounded-xl border bg-card/70 p-4 shadow-xs backdrop-blur" key={capability}>
                <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <ArrowRightIcon className="size-3.5" />
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{capability}</p>
              </div>
            ))}
          </div>
        </section>

        <Card className="mx-auto w-full max-w-md border-border/80 bg-card/92 shadow-xl shadow-foreground/5 backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">Start with the complete flow</CardTitle>
            <CardDescription>
              Create an account, organization, and protected project against the real API and database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs onValueChange={(value) => setMode(value as AuthMode)} value={mode}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sign-up">Create account</TabsTrigger>
                <TabsTrigger value="sign-in">Sign in</TabsTrigger>
              </TabsList>
            </Tabs>

            <form className="mt-5 space-y-4" onSubmit={submit}>
              {mode === 'sign-up' && (
                <FormField htmlFor="auth-name" label="Name">
                  <Input
                    autoComplete="name"
                    id="auth-name"
                    minLength={2}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ada Lovelace"
                    required
                    value={name}
                  />
                </FormField>
              )}

              <FormField htmlFor="auth-email" label="Email">
                <Input
                  autoComplete="email"
                  id="auth-email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ada@example.com"
                  required
                  type="email"
                  value={email}
                />
              </FormField>

              <FormField
                description={mode === 'sign-up' ? 'Use at least 12 characters.' : undefined}
                htmlFor="auth-password"
                label="Password"
              >
                <Input
                  autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                  id="auth-password"
                  minLength={12}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </FormField>

              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <Button className="w-full" disabled={authenticate.isPending} type="submit">
                {authenticate.isPending ? 'Working...' : mode === 'sign-up' ? 'Create account' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
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

  const sidebar = (
    <div className="flex min-h-full flex-col gap-6">
      <BrandMark />
      <Separator />

      <div>
        <p className="text-xs text-muted-foreground">Signed in as</p>
        <h1 className="mt-1 truncate text-lg font-semibold tracking-tight">{session.data?.user.name}</h1>
        <p className="truncate text-xs text-muted-foreground">{session.data?.user.email}</p>
      </div>

      <SidebarSection>
        <SidebarLabel>Organizations</SidebarLabel>
        {organizations.isPending && (
          <div className="space-y-2 px-2">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
        )}
        {organizations.data?.map((item) => (
          <SidebarItem
            active={activeOrganizationId === item.id}
            icon={<BuildingIcon className="size-4" />}
            key={item.id}
            onClick={() => setActiveOrganizationId(item.id)}
          >
            {item.name}
          </SidebarItem>
        ))}
      </SidebarSection>

      <form
        className="space-y-3 rounded-xl border bg-background/55 p-3"
        onSubmit={(event) => {
          event.preventDefault()
          createOrganization.mutate()
        }}
      >
        <FormField htmlFor="organization-name" label="New organization">
          <Input
            id="organization-name"
            minLength={2}
            onChange={(event) => setOrganizationName(event.target.value)}
            placeholder="Matrix Labs"
            required
            value={organizationName}
          />
        </FormField>
        <Button className="w-full" disabled={createOrganization.isPending} size="sm" type="submit" variant="secondary">
          <PlusIcon className="size-3.5" />
          {createOrganization.isPending ? 'Creating...' : 'Create organization'}
        </Button>
      </form>

      <div className="mt-auto space-y-1">
        <Button asChild className="w-full justify-start" variant="ghost">
          <a href="/ui">
            <PaletteIcon className="size-4" />
            UI playground
          </a>
        </Button>
      </div>
    </div>
  )

  return (
    <AppShell
      header={
        <>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{activeOrganization?.name ?? 'Workspace setup'}</p>
            <p className="hidden text-xs text-muted-foreground sm:block">Authenticated product skeleton</p>
          </div>
          <div className="flex items-center gap-1">
            <DensityToggle />
            <ThemeToggle />
            <Button onClick={logOut} size="sm" type="button" variant="outline">
              <LogOutIcon className="size-4" />
              Sign out
            </Button>
          </div>
        </>
      }
      sidebar={sidebar}
    >
      <div className="mx-auto max-w-6xl space-y-[var(--section-gap)]">
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {!activeOrganization ? (
          <EmptyState
            description="Create an organization in the sidebar. It becomes the security boundary for projects and members."
            icon={<BuildingIcon className="size-5" />}
            title="Create your first organization"
          />
        ) : (
          <>
            <PageHeader
              actions={
                <form
                  className="flex w-full gap-2 sm:w-auto"
                  onSubmit={(event) => {
                    event.preventDefault()
                    createProject.mutate()
                  }}
                >
                  <Input
                    aria-label="Project name"
                    className="min-w-0 sm:w-56"
                    minLength={2}
                    onChange={(event) => setProjectName(event.target.value)}
                    placeholder="New product"
                    required
                    value={projectName}
                  />
                  <Button disabled={createProject.isPending} type="submit">
                    <PlusIcon className="size-4" />
                    {createProject.isPending ? 'Creating...' : 'Add project'}
                  </Button>
                </form>
              }
              description="Projects are scoped by organization membership and server-side permission checks."
              eyebrow="Active organization"
              title={activeOrganization.name}
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                description="Loaded from the protected API"
                icon={<FolderIcon className="size-5" />}
                label="Projects"
                value={projects.data?.length ?? 0}
              />
              <StatCard
                description="Cookie session with API authorization"
                icon={<BuildingIcon className="size-5" />}
                label="Security boundary"
                value="Organization"
              />
              <StatCard
                description="One shared UI and domain layer"
                icon={<SparklesIcon className="size-5" />}
                label="Delivery targets"
                value="6 platforms"
              />
            </div>

            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Projects</h2>
                  <p className="text-sm text-muted-foreground">A clean card grid ready for real product data.</p>
                </div>
                <Badge variant="secondary">{projects.data?.length ?? 0} total</Badge>
              </div>

              {projects.isPending ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {['project-a', 'project-b', 'project-c'].map((placeholder) => (
                    <Card key={placeholder}>
                      <CardHeader>
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : projects.data?.length === 0 ? (
                <EmptyState
                  description="Use the project form above to exercise the typed, authorized API flow."
                  icon={<FolderIcon className="size-5" />}
                  title="No projects yet"
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {projects.data?.map((item) => (
                    <Card className="group transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md" key={item.id}>
                      <CardHeader>
                        <div className="mb-3 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                          <FolderIcon className="size-5" />
                        </div>
                        <CardTitle>{item.name}</CardTitle>
                        <CardDescription>
                          Created {new Date(item.createdAt).toLocaleString()}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}

function Home() {
  const session = useSession()

  if (session.isPending) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <div className="w-full max-w-sm space-y-4 px-6">
          <Skeleton className="mx-auto size-12 rounded-xl" />
          <Skeleton className="mx-auto h-6 w-48" />
          <Skeleton className="mx-auto h-4 w-64" />
        </div>
      </div>
    )
  }

  return session.data ? <Workspace /> : <AuthPanel />
}
