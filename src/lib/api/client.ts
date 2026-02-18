import { z } from 'zod'
import {
  createGhostEnvelopeSchema,
  ghostMetaSchema,
  type GhostMeta,
} from './types'

type ApiRequestOptions<TData> = {
  path: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: BodyInit | null
  headers?: HeadersInit
  requestId: string
  dataSchema: z.ZodType<TData>
}

type ApiErrorOptions = {
  status?: number
  requestId?: string
  details?: unknown
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

const errorBodySchema = z
  .object({
    detail: z.string().optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  })
  .partial()

const envelopeMetaSchema = z
  .object({
    meta: ghostMetaSchema.optional(),
  })
  .passthrough()

const getMetaRequestId = (payload: unknown): string | undefined => {
  const parsed = envelopeMetaSchema.safeParse(payload)

  if (!parsed.success) {
    return undefined
  }

  return parsed.data.meta?.request_id
}

const getErrorMessage = (payload: unknown, status: number): string => {
  const parsed = errorBodySchema.safeParse(payload)

  if (parsed.success) {
    return (
      parsed.data.detail ||
      parsed.data.error ||
      parsed.data.message ||
      `Request failed with status ${status}.`
    )
  }

  return `Request failed with status ${status}.`
}

const parseResponseBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    return null
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

const logRequestIdOnError = (requestId: string | undefined): void => {
  if (!requestId) {
    return
  }

  // Required by Ghost envelope contract for cross-system tracing.
  console.error('[echo-notes-web] API error request_id:', requestId)
}

export class ApiError extends Error {
  status?: number

  requestId?: string

  details?: unknown

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status
    this.requestId = options.requestId
    this.details = options.details
  }
}

export const isApiError = (value: unknown): value is ApiError => {
  return value instanceof ApiError
}

export const getApiBaseUrl = (): string => {
  if (!API_BASE_URL) {
    throw new ApiError('Missing NEXT_PUBLIC_API_BASE_URL configuration.')
  }

  return API_BASE_URL
}

const buildUrl = (path: string): string => {
  return new URL(path, getApiBaseUrl()).toString()
}

export const requestGhostData = async <TData>({
  path,
  method = 'GET',
  body,
  headers,
  requestId,
  dataSchema,
}: ApiRequestOptions<TData>): Promise<{ data: TData; meta: GhostMeta }> => {
  const requestHeaders = new Headers(headers)
  requestHeaders.set('X-Request-Id', requestId)

  if (body && !(body instanceof FormData) && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  let response: Response

  try {
    response = await fetch(buildUrl(path), {
      method,
      headers: requestHeaders,
      body,
    })
  } catch (error) {
    throw new ApiError('Unable to reach the Echo Notes API.', {
      requestId,
      details: error,
    })
  }

  const payload = await parseResponseBody(response)
  const metaRequestId = getMetaRequestId(payload)
  const responseRequestId = response.headers.get('x-request-id') ?? undefined
  const resolvedRequestId = metaRequestId ?? responseRequestId ?? requestId

  if (!response.ok) {
    logRequestIdOnError(metaRequestId)

    throw new ApiError(getErrorMessage(payload, response.status), {
      status: response.status,
      requestId: resolvedRequestId,
      details: payload,
    })
  }

  const envelopeSchema = createGhostEnvelopeSchema(dataSchema)
  const parsedEnvelope = envelopeSchema.safeParse(payload)

  if (!parsedEnvelope.success) {
    logRequestIdOnError(metaRequestId)

    throw new ApiError('Received an invalid API response shape.', {
      status: response.status,
      requestId: resolvedRequestId,
      details: parsedEnvelope.error.flatten(),
    })
  }

  return {
    data: parsedEnvelope.data.data,
    meta: parsedEnvelope.data.meta,
  }
}
