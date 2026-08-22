export const templateFeatures = {
  web: true,
  api: true,
  database: true,
  authentication: true,
  organizations: true,
  objectStorage: true,
  mobile: true,
  desktop: true,
  observability: true,
  docker: true,
  endToEndTests: true,
  containerReleases: true,
  nativeReleases: true,
} as const

export type TemplateFeature = keyof typeof templateFeatures
