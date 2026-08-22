import { getServerEnv } from '@matrix/env/server'
import { app } from './app'
import { getRootLogger } from './http/request-context'

const environment = getServerEnv()
const logger = getRootLogger()

app.listen({
  port: environment.PORT,
  hostname: environment.HOST,
})

logger.info('api.started', {
  hostname: environment.HOST,
  port: environment.PORT,
  environment: environment.NODE_ENV,
})
