import { describe, expect, test } from 'bun:test'
import {
  type CreateProjectRecord,
  createProjectService,
  PermissionDeniedError,
  type Project,
  type ProjectAuthorizer,
  type ProjectRepository,
} from '../src'

class InMemoryProjectRepository implements ProjectRepository {
  readonly projects: Project[] = []

  async create(input: CreateProjectRecord): Promise<Project> {
    const now = new Date('2026-08-22T00:00:00.000Z')
    const project: Project = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: now,
      updatedAt: now,
    }
    this.projects.push(project)
    return project
  }

  async listByOrganization(organizationId: string): Promise<Project[]> {
    return this.projects.filter((project) => project.organizationId === organizationId)
  }
}

const allowAll: ProjectAuthorizer = {
  async hasPermission() {
    return true
  },
}

describe('project service', () => {
  test('normalizes and creates an organization-scoped project', async () => {
    const repository = new InMemoryProjectRepository()
    const service = createProjectService(repository, allowAll)

    const project = await service.create({
      organizationId: 'org-1',
      userId: 'user-1',
      name: '  New   Product  ',
    })

    expect(project.name).toBe('New Product')
    expect(project.organizationId).toBe('org-1')
    expect(project.createdBy).toBe('user-1')
  })

  test('rejects calls without permission', async () => {
    const repository = new InMemoryProjectRepository()
    const service = createProjectService(repository, {
      async hasPermission() {
        return false
      },
    })

    expect(
      service.create({ organizationId: 'org-1', userId: 'user-1', name: 'Project' }),
    ).rejects.toBeInstanceOf(PermissionDeniedError)
  })
})
