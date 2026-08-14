/** 权限哨兵：后端 SUPER_ADMIN 的 myPermissions 返回通配符，代表拥有全部权限 */
export const PERMISSION_WILDCARD = '*'

/**
 * 判断用户是否拥有指定权限码（哨兵通配符视为全权限）
 * @param perms 用户权限码集合（可含 `*` 哨兵）
 * @param code 目标权限码
 * @returns 拥有与否
 */
export function hasPermission(perms: string[] | null | undefined, code: string): boolean {
  return !!perms && (perms.includes(PERMISSION_WILDCARD) || perms.includes(code))
}
