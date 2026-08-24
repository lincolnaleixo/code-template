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
  CardContent,
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

function Home() {
  const session = useSession()
  const queryClient = useQueryClient()
  const [authMode, setAuthMode] = useState<AuthMode>('sign-up')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const user = session.data?.user
  const authenticated = Boolean(user)

  const organizationsQuery = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await authClient.organization.list()
      if (response.error) throw new Error(response.error.message)
      return (response.data ?? []) as OrganizationSummary[]
    },
    enabled: authenticated,
  })

  const organizations = useMemo(
    () => (organizationsQuery.data ?? []) as OrganizationSummary[],
    [organizationsQuery.data],
  )

  useEffect(() => {
    if (!selectedOrganizationId && organizations[0]?.id) {
      setSelectedOrganizationId(organizations[0].id)
    }
  }, [organizations, selectedOrganizationId])

  const projectsQuery = useQuery({
    queryKey: ['projects', selectedOrganizationId],
    queryFn: async () => {
      const { data, error: requestError } = await api.api.projects.get({
        query: { organizationId: selectedOrganizationId },
      })
      if (requestError) throw new Error('Unable to load projects.')
      return data as ProjectSummary[]
    },
    enabled: authenticated && Boolean(selectedOrganizationId),
  })

  const authMutation = useMutation({
    mutationFn: async () => {
      setError('')
      setNotice('')

      const result =
        authMode === 'sign-up'
          ? await signUp.email({ email, password, name: name || email.split('@')[0] || 'Member' })
          : await signIn.email({ email, password })

      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: async () => {
      setNotice(authMode === 'sign-up' ? 'Account created and signed in.' : 'Signed in successfully.')
      await session.refetch()
    },
    onError: (mutationError) => setError(messageFromError(mutationError)),
  })

  const createOrganizationMutation = useMutation({
    mutationFn: async () => {
      setError('')
      setNotice('')
      const result = await authClient.organization.create({
        name: organizationName,
        slug: createSlug(organizationName),
      })
      if (result.error) throw new Error(result.error.message)
      return result.data as OrganizationSummary
    },
    onSuccess: async (organization) => {
      setOrganizationName('')
      setSelectedOrganizationId(organization.id)
      setNotice('Organization created.')
      await queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
    onError: (mutationError) => setError(messageFromError(mutationError)),
  })

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      setError('')
      setNotice('')
      const { data, error: requestError } = await api.api.projects.post({
        name: projectName,
        organizationId: selectedOrganizationId,
      })
      if (requestError) throw new Error('Unable to create project.')
      return data as ProjectSummary
    },
    onSuccess: async () => {
      setProjectName('')
      setNotice('Project created with server-side authorization.')
      await queryClient.invalidateQueries({ queryKey: ['projects', selectedOrganizationId] })
    },
    onError: (mutationError) => setError(messageFromError(mutationError)),
  })

  async function handleSignOut() {
    setError('')
    const result = await signOut()
    if (result.error) {
      setError(result.error.message)
      return
    }
    setNotice('Signed out.')
    setSelectedOrganizationId('')
    queryClient.clear()
    await session.refetch()
  }

  const sidebar = (
    <div className="space-y-6">
      <SidebarSection>
        <SidebarLabel>Workspace</SidebarLabel>
        <SidebarItem active icon={<SparklesIcon className="size-4" />}>
          Product flow
        </SidebarItem>
        <SidebarItem icon={<PaletteIcon className="size-4" />} to="/ui">
          UI foundation
        </SidebarItem>
        <SidebarItem icon={<FolderIcon className="size-4" />} to="/ui-advanced">
          Product patterns
        </SidebarItem>
      </SidebarSection>
      <Separator />
      <SidebarSection>
        <SidebarLabel>Appearance</SidebarLabel>
        <div className="space-y-3 px-2">
          <ThemeToggle className="w-full justify-start" />
          <DensityToggle className="w-full justify-start" />
        </div>
      </SidebarSection>
    </div>
  )

  return (
    <AppShell
      actions={
        authenticated ? (
          <Button onClick={handleSignOut} size="sm" variant="outline">
            <LogOutIcon className="size-4" />
            Sign out
          </Button>
        ) : undefined
      }
      sidebar={sidebar}
      title="Matrix Template"
    >
      <div className="space-y-8">
        <PageHeader
          actions={
            <Button asChild variant="outline">
              <a href="/ui">
                Explore the UI
                <ArrowRightIcon className="size-4" />
              </a>
            </Button>
          }
          description="A production-oriented product baseline with one TypeScript domain across web, API, mobile, and desktop."
          eyebrow="Cross-platform product foundation"
          title="One coherent stack, with optional capabilities"
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {productCapabilities.map((capability, index) => (
            <StatCard
              key={capability}
              label={`Capability ${index + 1}`}
              value={capability}
            />
          ))}
        </div>

        {notice && (
          <Alert>
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!authenticated ? (
          <Card className="mx-auto max-w-xl">
            <CardHeader>
              <Badge className="w-fit" variant="secondary">
                Real product lifecycle
              </Badge>
              <CardTitle>Authenticate into the starter workspace</CardTitle>
              <CardDescription>
                Create an account, establish an organization, then create an authorized project through
                the typed API.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs onValueChange={(value) => setAuthMode(value as AuthMode)} value={authMode}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="sign-up">Create account</TabsTrigger>
                  <TabsTrigger value="sign-in">Sign in</TabsTrigger>
                </TabsList>
              </Tabs>
              <form
                className="mt-6 space-y-4"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault()
                  authMutation.mutate()
                }}
              >
                {authMode === 'sign-up' && (
                  <FormField label="Name">
                    <Input
                      autoComplete="name"
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Ada Lovelace"
                      value={name}
                    />
                  </FormField>
                )}
                <FormField label="Email">
                  <Input
                    autoComplete="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    type="email"
                    value={email}
                  />
                </FormField>
                <FormField label="Password">
                  <Input
                    autoComplete={authMode === 'sign-up' ? 'new-password' : 'current-password'}
                    minLength={8}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type="password"
                    value={password}
                  />
                </FormField>
                <Button className="w-full" disabled={authMutation.isPending} type="submit">
                  {authMutation.isPending
                    ? 'Working...'
                    : authMode === 'sign-up'
                      ? 'Create account'
                      : 'Sign in'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <Card>
              <CardHeader>
                <Badge className="w-fit" variant="secondary">
                  Signed in
                </Badge>
                <CardTitle>{user?.name ?? user?.email}</CardTitle>
                <CardDescription>
                  Browser sessions use secure cookies. Native wrappers use the signed bearer transport
                  contract.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form
                  className="space-y-4"
                  onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault()
                    createOrganizationMutation.mutate()
                  }}
                >
                  <FormField label="New organization">
                    <Input
                      onChange={(event) => setOrganizationName(event.target.value)}
                      placeholder="Research collective"
                      required
                      value={organizationName}
                    />
                  </FormField>
                  <Button disabled={createOrganizationMutation.isPending} type="submit">
                    <BuildingIcon className="size-4" />
                    Create organization
                  </Button>
                </form>

                {organizationsQuery.isPending ? (
                  <Skeleton className="h-10 w-full" />
                ) : organizations.length > 0 ? (
                  <FormField label="Active organization">
                    <select
                      className="h-[var(--control-height)] w-full rounded-md border bg-background px-3 text-sm"
                      onChange={(event) => setSelectedOrganizationId(event.target.value)}
                      value={selectedOrganizationId}
                    >
                      {organizations.map((organization) => (
                        <option key={organization.id} value={organization.id}>
                          {organization.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                ) : (
                  <EmptyState
                    description="Create an organization before adding protected project data."
                    icon={<BuildingIcon className="size-5" />}
                    title="No organizations yet"
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Authorized projects</CardTitle>
                <CardDescription>
                  Project routes verify both organization membership and explicit permissions on the
                  server.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedOrganizationId && (
                  <form
                    className="flex flex-col gap-3 sm:flex-row"
                    onSubmit={(event: FormEvent<HTMLFormElement>) => {
                      event.preventDefault()
                      createProjectMutation.mutate()
                    }}
                  >
                    <Input
                      className="flex-1"
                      onChange={(event) => setProjectName(event.target.value)}
                      placeholder="First protected project"
                      required
                      value={projectName}
                    />
                    <Button disabled={createProjectMutation.isPending} type="submit">
                      <PlusIcon className="size-4" />
                      Add project
                    </Button>
                  </form>
                )}

                {projectsQuery.isPending && selectedOrganizationId ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : (projectsQuery.data?.length ?? 0) > 0 ? (
                  <div className="space-y-3">
                    {projectsQuery.data?.map((project) => (
                      <div
                        className="flex items-center justify-between gap-4 rounded-lg border bg-muted/35 p-4"
                        key={project.id}
                      >
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(project.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline">Authorized</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    description="Select an organization and create the first project."
                    icon={<FolderIcon className="size-5" />}
                    title="No projects yet"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  )
}
