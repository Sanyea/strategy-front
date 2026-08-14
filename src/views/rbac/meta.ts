/** rbac 模块元数据：后端字符串枚举 → 中文展示映射（页面共用，勿在此放业务逻辑） */

export const PERMISSION_TYPE_LABEL: Record<string, string> = {
  DIRECTORY: '目录',
  MENU: '菜单',
  BUTTON: '按钮',
  INTERFACE: '接口',
}

export const DATA_SCOPE_LABEL: Record<string, string> = {
  ALL: '全部',
  SELF: '仅本人',
  DEPT: '本部门',
  DEPT_AND_BELOW: '本部门及以下',
  CUSTOM: '自定义',
}

/**
 * 状态文本：后端 VO 用 NORMAL/DISABLED，查询用 1/0，统一转展示
 * @param status 状态值（字符串或数字）
 * @returns 中文文案与是否启用
 */
export function statusMeta(status?: string | number | null): { text: string; ok: boolean } {
  if (status === 'NORMAL' || status === 1 || status === '1') {
    return { text: '启用', ok: true }
  }
  return { text: '停用', ok: false }
}

/**
 * ISO 时间转本地展示（去掉 T 与秒）
 * @param value 后端时间字符串
 * @returns `YYYY-MM-DD HH:mm`，空值返回 —
 */
export function formatTime(value?: string | null): string {
  if (!value) return '—'
  return value.replace('T', ' ').slice(0, 16)
}

/**
 * datetime-local 值转后端 ISO 字符串
 * @param value `<input type="datetime-local">` 的值
 * @returns ISO 字符串或 undefined（空）
 */
export function toIso(value?: string): string | undefined {
  if (!value) return undefined
  return new Date(value).toISOString()
}

/**
 * 后端 ISO 转 datetime-local 显示值
 * @param value 后端时间字符串
 * @returns datetime-local 值或 undefined
 */
export function toLocalInput(value?: string | null): string | undefined {
  if (!value) return undefined
  return value.slice(0, 16)
}
