import { createAccessControl } from 'better-auth/plugins/access'

export const accessStatements = {
  organization: ['update', 'delete'],
  member: ['create', 'update', 'delete'],
  invitation: ['create', 'cancel'],
  project: ['read', 'create', 'update', 'delete'],
} as const

export type OrganizationRoleName = 'owner' | 'admin' | 'member'
export type ProjectAction = (typeof accessStatements.project)[number]

export const projectActionsByRole: Record<OrganizationRoleName, readonly ProjectAction[]> = {
  owner: ['read', 'create', 'update', 'delete'],
  admin: ['read', 'create', 'update', 'delete'],
  member: ['read', 'create'],
}

export const accessControl = createAccessControl(accessStatements)

export const ownerRole = accessControl.newRole({
  organization: ['update', 'delete'],
  member: ['create', 'update', 'delete'],
  invitation: ['create', 'cancel'],
  project: [...projectActionsByRole.owner],
})

export const adminRole = accessControl.newRole({
  organization: ['update'],
  member: ['create', 'update', 'delete'],
  invitation: ['create', 'cancel'],
  project: [...projectActionsByRole.admin],
})

export const memberRole = accessControl.newRole({
  project: [...projectActionsByRole.member],
})

export const organizationRoles = {
  owner: ownerRole,
  admin: adminRole,
  member: memberRole,
}

export function roleCanManageProject(role: string, action: ProjectAction): boolean {
  return role
    .split(',')
    .map((value) => value.trim())
    .some((value) =>
      value in projectActionsByRole
        ? projectActionsByRole[value as OrganizationRoleName].includes(action)
        : false,
    )
}
