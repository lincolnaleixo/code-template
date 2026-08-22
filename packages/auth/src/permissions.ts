import { createAccessControl } from 'better-auth/plugins/access'

export const accessStatements = {
  organization: ['update', 'delete'],
  member: ['create', 'update', 'delete'],
  invitation: ['create', 'cancel'],
  project: ['read', 'create', 'update', 'delete'],
} as const

export const accessControl = createAccessControl(accessStatements)

export const ownerRole = accessControl.newRole({
  organization: ['update', 'delete'],
  member: ['create', 'update', 'delete'],
  invitation: ['create', 'cancel'],
  project: ['read', 'create', 'update', 'delete'],
})

export const adminRole = accessControl.newRole({
  organization: ['update'],
  member: ['create', 'update', 'delete'],
  invitation: ['create', 'cancel'],
  project: ['read', 'create', 'update', 'delete'],
})

export const memberRole = accessControl.newRole({
  project: ['read', 'create'],
})

export const organizationRoles = {
  owner: ownerRole,
  admin: adminRole,
  member: memberRole,
}
