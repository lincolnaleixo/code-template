export interface SecureTokenStore {
  get(): Promise<string | null>
  set(token: string): Promise<void>
  remove(): Promise<void>
}

export type FetchImplementation = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export interface NativeAuthTransportOptions {
  baseUrl: string
  tokenStore: SecureTokenStore
  fetchImplementation?: FetchImplementation
}

function absoluteUrl(baseUrl: string, input: RequestInfo | URL): RequestInfo | URL {
  if (input instanceof Request || input instanceof URL) return input
  if (/^https?:\/\//i.test(input)) return input
  return new URL(input, baseUrl)
}

export function createNativeAuthFetch(options: NativeAuthTransportOptions): FetchImplementation {
  const request: FetchImplementation = options.fetchImplementation ?? fetch

  return async (input, init = {}) => {
    const headers = new Headers(init.headers)
    const token = await options.tokenStore.get()

    if (token && !headers.has('authorization')) {
      headers.set('authorization', `Bearer ${token}`)
    }

    const response = await request(absoluteUrl(options.baseUrl, input), {
      ...init,
      headers,
    })

    const replacementToken = response.headers.get('set-auth-token')
    if (replacementToken) await options.tokenStore.set(replacementToken)
    if (response.status === 401 && token) await options.tokenStore.remove()

    return response
  }
}
