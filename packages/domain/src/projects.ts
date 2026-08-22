import { PermissionDeniedError, ValidationError } from './errors'

export type ProjectPermission = 'project:read' | 'project:create' | 'project:update' | 'project:delete'

export interface Project {
  id: string
  organizationId: string
  name: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateProjectRecord {
  organizationId: string
  name: string
  createdBy: string
}

export interface ProjectRepository {
  create(input: CreateProjectRecord): Promise<Project>
  listByOrganization(organizationId: string): Promise<Project[]>
}

export interface ProjectAuthorizer {
  hasPermission(input: {
    userId: string
    organizationId: string
    permission: ProjectPermission
  }): Promise<boolean>
}

export interface ProjectService {
  create(input: { organizationId: string; userId: string; name: string }): Promise<Project>
  list(input: { organizationId: string; userId: string }): Promise<Project[]>
}

function normalizeProjectName(value: string): string {
  const normalized = value.trim().replace(/\s+/g, ' ')

  if (normalized.length < 2 || normalized.length > 100) {
    throw new ValidationError('Project name must contain between 2 and 100 characters.', {
      field: 'name',
    })
  }

  return normalized
}

async function requirePermission(
  authorizer: ProjectAuthorizer,
  input: { userId: string; organizationId: string; permission: ProjectPermission },
): Promise<void> {
  if (!(await authorizer.hasPermission(input))) {
    throw new PermissionDeniedError(input.permission)
  }
}

export function createProjectService(
  repository: ProjectRepository,
  authorizer: ProjectAuthorizer,
): ProjectService {
  return {
    async create(input) {
      await requirePermission(authorizer, { ...input, permission: 'project:create' })

      return repository.create({
        organizationId: input.organizationId,
        createdBy: input.userId,
        name: normalizeProjectName(input.name),
      })
    },

    async list(input) {
      await requirePermission(authorizer, { ...input, permission: 'project:read' })
      return repository.listByOrganization(input.organizationId)
    },
  }
}
