import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getServerEnv } from '@matrix/env/server'

const environment = getServerEnv()

export const storage = new S3Client({
  region: environment.S3_REGION,
  endpoint: environment.S3_ENDPOINT,
  forcePathStyle: Boolean(environment.S3_ENDPOINT),
  credentials: environment.S3_ACCESS_KEY
    ? {
        accessKeyId: environment.S3_ACCESS_KEY,
        // Runtime environment lookup only; no credential literal is committed.
        secretAccessKey: environment.S3_SECRET_KEY ?? '', // gitleaks:allow
      }
    : undefined,
})

export const bucket = environment.S3_BUCKET

export async function createUploadUrl(input: {
  key: string
  contentType: string
  expiresIn?: number
}): Promise<string> {
  return getSignedUrl(
    storage,
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.key,
      ContentType: input.contentType,
    }),
    { expiresIn: input.expiresIn ?? 300 },
  )
}

export async function createDownloadUrl(key: string, expiresIn = 300): Promise<string> {
  return getSignedUrl(storage, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn })
}

export async function deleteObject(key: string): Promise<void> {
  await storage.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}
