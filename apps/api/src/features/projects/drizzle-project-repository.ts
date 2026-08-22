import { db, project } from '@matrix/db'
import type { CreateProjectRecord, Project, ProjectRepository } from '@matrix/domain'
import { desc, eq } from 'drizzle-orm'

function toDomainProject(record: typeof project.$inferSelect): Project {
  return {
    id: record.id,
    organizationId: record.organizationId,
    name: record.name,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

export class DrizzleProjectRepository implements ProjectRepository {
  async create(input: CreateProjectRecord): Promise<Project> {
    const [created] = await db
      .insert(project)
      .values({
        id: crypto.randomUUID(),
        organizationId: input.organizationId,
        name: input.name,
        createdBy: input.createdBy,
      })
      .returning()

    if (!created) throw new Error('PostgreSQL did not return the created project.')
    return toDomainProject(created)
  }

  async listByOrganization(organizationId: string): Promise<Project[]> {
    const records = await db
      .select()
      .from(project)
      .where(eq(project.organizationId, organizationId))
      .orderBy(desc(project.createdAt))

    return records.map(toDomainProject)
  }
}
