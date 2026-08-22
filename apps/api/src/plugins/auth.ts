import { auth } from '@matrix/auth'
import { Elysia } from 'elysia'
import { createApiError } from '../http/errors'
import { getRequestContext } from '../http/request-context'

export const betterAuthPlugin = new Elysia({ name: 'better-auth' })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ request, status }) {
        const session = await auth.api.getSession({ headers: request.headers })

        if (!session) {
          return status(
            401,
            createApiError(
              getRequestContext(request).requestId,
              'AUTHENTICATION_REQUIRED',
              'Authentication is required for this endpoint.',
            ),
          )
        }

        return {
          user: session.user,
          session: session.session,
        }
      },
    },
  })
