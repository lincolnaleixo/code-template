import { app } from './app'

const port = Number(process.env.PORT ?? 3001)
const hostname = process.env.HOST ?? '0.0.0.0'

app.listen({ port, hostname })

console.log(`API listening at http://${hostname}:${String(port)}`)
