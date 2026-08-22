import {
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
  ErrorState,
  FormField,
  Input,
  Label,
  LoadingState,
  PageContainer,
  PageHeader,
  Pagination,
  SearchInput,
  SettingsSection,
  Sheet,
  Switch,
  Tooltip,
} from '@matrix/ui'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

export const Route = createFileRoute('/ui-advanced')({
  component: AdvancedUiPlayground,
})

interface TeamMember {
  email: string
  id: string
  name: string
  role: 'Admin' | 'Member' | 'Owner'
  status: 'Active' | 'Invited'
}

const members: TeamMember[] = [
  {
    email: 'ada@example.com',
    id: 'ada',
    name: 'Ada Lovelace',
    role: 'Owner',
    status: 'Active',
  },
  {
    email: 'grace@example.com',
    id: 'grace',
    name: 'Grace Hopper',
    role: 'Admin',
    status: 'Active',
  },
  {
    email: 'margaret@example.com',
    id: 'margaret',
    name: 'Margaret Hamilton',
    role: 'Member',
    status: 'Active',
  },
  {
    email: 'katherine@example.com',
    id: 'katherine',
    name: 'Katherine Johnson',
    role: 'Member',
    status: 'Invited',
  },
  {
    email: 'radia@example.com',
    id: 'radia',
    name: 'Radia Perlman',
    role: 'Admin',
    status: 'Active',
  },
]

const columns: Array<DataTableColumn<TeamMember>> = [
  {
    cell: (member) => (
      <div>
        <p className="font-medium">{member.name}</p>
        <p className="text-xs text-muted-foreground">{member.email}</p>
      </div>
    ),
    header: 'Member',
    id: 'member',
  },
  {
    cell: (member) => member.role,
    className: 'hidden sm:table-cell',
    header: 'Role',
    id: 'role',
  },
  {
    cell: (member) => (
      <Badge variant={member.status === 'Active' ? 'success' : 'warning'}>
        {member.status}
      </Badge>
    ),
    header: 'Status',
    id: 'status',
  },
]

function AdvancedUiPlayground() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [emailUpdates, setEmailUpdates] = useState(true)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [weeklyDigest, setWeeklyDigest] = useState(true)

  const filteredMembers = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return members

    return members.filter((member) =>
      [member.name, member.email, member.role, member.status]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    )
  }, [query])

  const pageSize = 3
  const pageCount = Math.max(1, Math.ceil(filteredMembers.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visibleMembers = filteredMembers.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <main className="min-h-dvh bg-background py-8 sm:py-12">
      <PageContainer>
        <PageHeader
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <a href="/ui">Core foundation</a>
              </Button>
              <Button onClick={() => setSheetOpen(true)}>Open settings</Button>
            </div>
          }
          description="Product-level patterns built from the same semantic tokens and repository-owned primitives."
          eyebrow="UI playground"
          title="Tables, settings, overlays, and system states"
        />

        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Data table</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A lightweight typed table for common product screens. TanStack Table remains available
                for advanced sorting, grouping, and virtualization.
              </p>
            </div>
            <SearchInput
              aria-label="Search members"
              className="sm:w-72"
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder="Search members"
              value={query}
            />
          </div>

          <DataTable
            columns={columns}
            empty="No members match this search."
            getRowKey={(member) => member.id}
            rows={visibleMembers}
          />
          <Pagination onPageChange={setPage} page={safePage} pageCount={pageCount} />
        </section>

        <section className="rounded-xl border bg-card px-5 sm:px-7">
          <SettingsSection
            actions={<Button size="sm">Save profile</Button>}
            description="Basic identity shown throughout the product."
            title="Profile"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField htmlFor="settings-name" label="Display name">
                <Input defaultValue="Ada Lovelace" id="settings-name" />
              </FormField>
              <FormField htmlFor="settings-email" label="Email">
                <Input defaultValue="ada@example.com" id="settings-email" type="email" />
              </FormField>
            </div>
          </SettingsSection>

          <SettingsSection
            description="Choose which product messages are useful to you."
            title="Notifications"
          >
            <label className="flex items-start gap-3 rounded-lg border p-4">
              <Checkbox
                checked={emailUpdates}
                onChange={(event) => setEmailUpdates(event.target.checked)}
              />
              <span>
                <span className="block text-sm font-medium">Email updates</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  Receive important changes to projects and memberships.
                </span>
              </span>
            </label>

            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <Label htmlFor="weekly-digest">Weekly digest</Label>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  A compact summary of product activity.
                </p>
              </div>
              <Switch
                checked={weeklyDigest}
                id="weekly-digest"
                onCheckedChange={setWeeklyDigest}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            actions={
              <Tooltip content="This opens a confirmation dialog." side="left">
                <Button
                  onClick={() => setConfirmOpen(true)}
                  size="sm"
                  variant="destructive"
                >
                  Delete workspace
                </Button>
              </Tooltip>
            }
            description="Destructive actions require clear language and explicit confirmation."
            title="Danger zone"
          >
            <p className="text-sm leading-6 text-muted-foreground">
              Deleting the workspace removes projects, memberships, and stored files.
            </p>
          </SettingsSection>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <LoadingState
            description="Use predictable skeletons while preserving the final layout."
            title="Loading project activity"
          />
          <ErrorState
            action={<Button variant="outline">Try again</Button>}
            description="Keep the message useful, avoid leaking implementation details, and provide one recovery action."
            title="Could not load activity"
          />
        </section>
      </PageContainer>

      <Sheet
        description="A focus-managed native dialog presented as a side panel."
        onOpenChange={setSheetOpen}
        open={sheetOpen}
        title="Workspace settings"
      >
        <div className="space-y-5">
          <FormField htmlFor="sheet-workspace" label="Workspace name">
            <Input defaultValue="Matrix Labs" id="sheet-workspace" />
          </FormField>
          <FormField
            description="This value appears in invitation links."
            htmlFor="sheet-slug"
            label="Workspace slug"
          >
            <Input defaultValue="matrix-labs" id="sheet-slug" />
          </FormField>
          <Button className="w-full" onClick={() => setSheetOpen(false)}>
            Save settings
          </Button>
        </div>
      </Sheet>

      <ConfirmDialog
        confirmLabel="Delete workspace"
        description="This action cannot be undone. The production implementation should also require server-side authorization."
        destructive
        onConfirm={() => setConfirmOpen(false)}
        onOpenChange={setConfirmOpen}
        open={confirmOpen}
        title="Delete this workspace?"
      >
        <p className="text-sm leading-6 text-muted-foreground">
          Type-safe UI does not replace a transactional backend deletion and an audit trail.
        </p>
      </ConfirmDialog>
    </main>
  )
}
