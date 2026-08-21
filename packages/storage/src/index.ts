import { S3Client } from '@aws-sdk/client-s3'

export const storage = new S3Client({
  region: process.env.S3_REGION ?? 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: Boolean(process.env.S3_ENDPOINT),
  credentials: process.env.S3_ACCESS_KEY
    ? {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY ?? '',
      }
    : undefined,
})

export const bucket = process.env.S3_BUCKET ?? 'matrix'
