import {
  Alert,
  AlertDescription,
  AlertTitle,
  AppShell,
  Avatar,
  AvatarFallback,
  Badge,
  BuildingIcon,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CheckIcon,
  DensityToggle,
  Dialog,
  EmptyState,
  FolderIcon,
  FormField,
  InfoIcon,
  Input,
  Label,
  PageHeader,
  PaletteIcon,
  PlusIcon,
  Select,
  Separator,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  Skeleton,
  SparklesIcon,
  StatCard,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ThemeToggle,
  WarningIcon,
} from '@matrix/ui'
import { createFileRoute } from '@tanstack/react-router'
import { type CSSProperties, useState } from 'react'

export const Route = createFileRoute('/ui')({
  component: UiPlayground,
})

const colorTokens = [
  'background',
  'foreground',
  'card',
  'primary',
  'secondary',
  'muted',
  'accent',
  'destructive',
  'success',
  'warning',
  'info',
  'border',
] as const

function TokenSwatch({ token }: { token: (typeof colorTokens)[number] }) {
  const style = {
    background: `var(--${token})`,
    color: token === 'foreground' ? 'var(--background)' : 'var(--foreground)',
  } satisfies CSSProperties

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="h-20" style={style} />
      <div className="p-3">
        <p className="font-mono text-xs">--{token}</p>
      </div>
    </div>
  )
}

function UiPlayground() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [tab, setTab] = useState('overview')

  const sidebar = (
    <div className="flex min-h-full flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
          <PaletteIcon className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">UI Playground</p>
          <p className="text-xs text-muted-foreground">Semantic design tokens</p>
        </div>
      </div>
      <Separator />
      <SidebarSection>
        <SidebarLabel>Explore</SidebarLabel>
        <SidebarItem active icon={<PaletteIcon className="size-4" />}>
          Foundation
        </SidebarItem>
        <SidebarItem icon={<BuildingIcon className="size-4" />}>Patterns</SidebarItem>
        <SidebarItem icon={<FolderIcon className="size-4" />}>Components</SidebarItem>
      </SidebarSection>
      <div className="mt-auto">
        <Button asChild className="w-full" variant="outline">
          <a href="/">Back to product demo</a>
        </Button>
      </div>
    </div>
  )

  return (
    <AppShell
      header={
        <>
          <div>
            <p className="text-sm font-medium">Matrix UI foundation</p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Edit brand.css and inspect the entire system here.
            </p>
          </div>
          <div className="flex items-center gap-1">
            <DensityToggle />
            <ThemeToggle />
          </div>
        </>
      }
      sidebar={sidebar}
    >
      <div className="mx-auto max-w-6xl space-y-12">
        <PageHeader
          actions={
            <Button onClick={() => setDialogOpen(true)}>
              <PlusIcon className="size-4" />
              Open dialog
            </Button>
          }
          description="A neutral, shadcn-inspired foundation owned by the repository and customized through OKLCH semantic tokens."
          eyebrow="Development route"
          title="Clean UI, project-specific identity"
        />

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Color tokens</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Change the project hue and chroma in apps/web/src/brand.css.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {colorTokens.map((token) => (
              <TokenSwatch key={token} token={token} />
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Hierarchy comes from type, spacing, contrast, and alignment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Display
                </p>
                <p className="mt-2 text-4xl font-semibold tracking-[-0.04em]">
                  Build quietly premium products.
                </p>
              </div>
              <div>
                <p className="text-xl font-semibold tracking-tight">Section heading</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Readable body copy with a restrained measure and deliberate rhythm.
                </p>
              </div>
              <div className="typeset rounded-xl bg-muted/60 p-5">
                <h3>Rich content</h3>
                <p>
                  The optional <code>typeset</code> class styles prose, code, links, and lists without
                  imposing product layout.
                </p>
                <blockquote>
                  Use it for documentation, markdown, AI responses, and editorial content.
                </blockquote>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
              <CardDescription>
                Accessible defaults with semantic focus, error, and disabled states.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField
                description="A concise description belongs below the control."
                htmlFor="ui-name"
                label="Project name"
              >
                <Input id="ui-name" placeholder="New product" />
              </FormField>
              <FormField htmlFor="ui-type" label="Project type">
                <Select defaultValue="saas" id="ui-type">
                  <option value="saas">SaaS application</option>
                  <option value="mobile">Mobile application</option>
                  <option value="desktop">Desktop application</option>
                </Select>
              </FormField>
              <FormField htmlFor="ui-description" label="Description">
                <Textarea id="ui-description" placeholder="Describe the outcome, not the implementation." />
              </FormField>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="ui-notifications">Product notifications</Label>
                  <p className="mt-1 text-xs text-muted-foreground">A native switch with explicit state.</p>
                </div>
                <Switch checked={notifications} id="ui-notifications" onCheckedChange={setNotifications} />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Actions and status</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Variants describe meaning, not brand-specific colors.
            </p>
          </div>
          <Card>
            <CardContent className="space-y-6 p-6">
              <div className="flex flex-wrap gap-2">
                <Button>Primary action</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="success">
                  <CheckIcon className="size-4" />
                  Success
                </Button>
                <Button variant="destructive">Delete</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="success">Active</Badge>
                <Badge variant="warning">Attention</Badge>
                <Badge variant="destructive">Blocked</Badge>
                <Badge variant="info">Beta</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Feedback</h2>
            <p className="mt-1 text-sm text-muted-foreground">Stable patterns for expected system states.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Alert variant="info">
              <InfoIcon className="mb-1 size-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                Use this for neutral guidance that helps a user complete a task.
              </AlertDescription>
            </Alert>
            <Alert variant="warning">
              <WarningIcon className="mb-1 size-4" />
              <AlertTitle>Review required</AlertTitle>
              <AlertDescription>
                This action changes production configuration and needs approval.
              </AlertDescription>
            </Alert>
            <Alert variant="success">
              <CheckIcon className="mb-1 size-4" />
              <AlertTitle>Deployment complete</AlertTitle>
              <AlertDescription>The new version passed readiness checks.</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <WarningIcon className="mb-1 size-4" />
              <AlertTitle>Request failed</AlertTitle>
              <AlertDescription>Provide a stable error message and a useful recovery path.</AlertDescription>
            </Alert>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Patterns</h2>
            <p className="mt-1 text-sm text-muted-foreground">Composition primitives for product pages.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              description="Compared with the previous period"
              icon={<SparklesIcon className="size-5" />}
              label="Activation"
              value="72%"
            />
            <StatCard
              description="Across active organizations"
              icon={<BuildingIcon className="size-5" />}
              label="Workspaces"
              value="148"
            />
            <StatCard
              description="Protected by organization roles"
              icon={<FolderIcon className="size-5" />}
              label="Projects"
              value="392"
            />
          </div>
          <EmptyState
            action={
              <Button size="sm">
                <PlusIcon className="size-4" />
                Create project
              </Button>
            }
            description="Empty states should explain what belongs here and offer one clear next action."
            icon={<FolderIcon className="size-5" />}
            title="No archived projects"
          />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Tabs and loading</h2>
          </div>
          <Card>
            <CardContent className="p-6">
              <Tabs onValueChange={setTab} value={tab}>
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                  </div>
                </TabsContent>
                <TabsContent value="activity">
                  <p className="text-sm text-muted-foreground">
                    Tab content remains a product composition concern.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader className="flex-row items-center gap-4">
            <Avatar>
              <AvatarFallback>MT</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>Owned component source</CardTitle>
              <CardDescription>
                Adapt interactions when a project needs them, while preserving accessibility and tokens.
              </CardDescription>
            </div>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline">
              <a href="/">View product flow</a>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Dialog
        description="This native dialog demonstrates focus management, backdrop dismissal, and semantic styling without another runtime dependency."
        footer={
          <>
            <Button onClick={() => setDialogOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={() => setDialogOpen(false)}>Confirm</Button>
          </>
        }
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        title="Confirm project settings"
      >
        <p className="text-sm leading-6 text-muted-foreground">
          Reusable dialogs should keep their public API small and let product code own the business action.
        </p>
      </Dialog>
    </AppShell>
  )
}
