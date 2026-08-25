import { type ProjectAction, roleCanManageProject } from '@matrix/auth/permissions'
import { db, member } from '@matrix/db'
import type { ProjectAuthorizer, ProjectPermission } from '@matrix/domain'
import { and, eq } from 'drizzle-orm'

function actionFromPermission(permission: ProjectPermission): ProjectAction {
  return permission.slice('project:'.length) as ProjectAction
}

export class DrizzleProjectAuthorizer implements ProjectAuthorizer {
  async hasPermission(input: {
    userId: string
    organizationId: string
    permission: ProjectPermission
  }): Promise<boolean> {
    const [membership] = await db
      .select({ role: member.role })
      .from(member)
      .where(and(eq(member.userId, input.userId), eq(member.organizationId, input.organizationId)))
      .limit(1)

    return membership ? roleCanManageProject(membership.role, actionFromPermission(input.permission)) : false
  }
}
