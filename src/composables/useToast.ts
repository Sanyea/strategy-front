import { reactive } from 'vue'

/** 轻量全局 toast：模块级单例状态，任何组件可推送，BaseToastHost 渲染 */
export type ToastType = 'success' | 'error'

export interface ToastItem {
  id: number
  message: string
  type: ToastType
}

const toasts = reactive<ToastItem[]>([])
let seq = 0

function removeAfter(id: number, ms: number): void {
  setTimeout(() => {
    const index = toasts.findIndex((t) => t.id === id)
    if (index >= 0) toasts.splice(index, 1)
  }, ms)
}

/**
 * 推送一条 toast 提示，自动消失
 * @param message 提示文案
 * @param type 类型：success 成功 / error 错误
 */
function pushToast(message: string, type: ToastType = 'success'): void {
  const id = ++seq
  toasts.push({ id, message, type })
  removeAfter(id, 2600)
}

/**
 * 全局 toast 句柄（模块级单例）
 */
export function useToast(): {
  toasts: ToastItem[]
  success: (message: string) => void
  error: (message: string) => void
} {
  return {
    toasts,
    success: (message: string) => pushToast(message, 'success'),
    error: (message: string) => pushToast(message, 'error'),
  }
}
