import { createProjectService, type Project } from '@matrix/domain'
import { Elysia, t } from 'elysia'
import { requireAuthPlugin } from '../../plugins/auth'
import { DrizzleProjectAuthorizer } from './drizzle-project-authorizer'
import { DrizzleProjectRepository } from './drizzle-project-repository'

const projectService = createProjectService(new DrizzleProjectRepository(), new DrizzleProjectAuthorizer())

function serializeProject(project: Project) {
  return {
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }
}

const organizationParams = t.Object({
  organizationId: t.String({ minLength: 1 }),
})

const projectResponse = t.Object({
  id: t.String(),
  organizationId: t.String(),
  name: t.String(),
  createdBy: t.String(),
  createdAt: t.String({ format: 'date-time' }),
  updatedAt: t.String({ format: 'date-time' }),
})

export const projectRoutes = new Elysia({ name: 'project-routes' })
  .use(requireAuthPlugin)
  .get(
    '/api/organizations/:organizationId/projects',
    async ({ params, user }) => {
      const projects = await projectService.list({
        organizationId: params.organizationId,
        userId: user.id,
      })
      return projects.map(serializeProject)
    },
    {
      auth: true,
      params: organizationParams,
      response: t.Array(projectResponse),
      detail: {
        tags: ['Projects'],
        summary: 'List projects for an organization',
      },
    },
  )
  .post(
    '/api/organizations/:organizationId/projects',
    async ({ body, params, set, user }) => {
      const project = await projectService.create({
        organizationId: params.organizationId,
        userId: user.id,
        name: body.name,
      })
      set.status = 201
      return serializeProject(project)
    },
    {
      auth: true,
      params: organizationParams,
      body: t.Object({
        name: t.String({ minLength: 2, maxLength: 100 }),
      }),
      response: projectResponse,
      detail: {
        tags: ['Projects'],
        summary: 'Create a project in an organization',
      },
    },
  )
