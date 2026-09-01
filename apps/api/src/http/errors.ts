import type { DomainError } from '@matrix/domain'

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    requestId: string
    details?: Record<string, unknown>
  }
}

export function createApiError(
  requestId: string,
  code: string,
  message: string,
  details?: Record<string, unknown>,
): ApiErrorBody {
  return {
    error: {
      code,
      message,
      requestId,
      ...(details ? { details } : {}),
    },
  }
}

export function getDomainErrorStatus(error: DomainError): number {
  switch (error.code) {
    case 'AUTHENTICATION_REQUIRED':
      return 401
    case 'PERMISSION_DENIED':
      return 403
    case 'RESOURCE_NOT_FOUND':
      return 404
    case 'CONFLICT':
      return 409
    case 'VALIDATION_FAILED':
      return 422
  }
}
