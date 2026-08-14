import { isAxiosError } from 'axios'

/**
 * 后端业务错误：HTTP 200 但信封 code 非成功码（约定 200）时抛出。
 * 携带业务码，供调用方区分业务失败与传输失败。
 */
export class ApiError extends Error {
  readonly code: number

  constructor(code: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

/**
 * 从接口错误中提取后端 message 文案，兜底返回通用错误提示
 * @param err 捕获到的异常（ApiError 或 axios 错误）
 * @param fallback 兜底文案（按业务场景传入）
 * @returns 展示给用户的错误信息
 */
export function readApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message
  if (isAxiosError(err)) {
    const msg = (err.response?.data as { message?: string } | undefined)?.message
    if (msg) return msg
  }
  return fallback
}
