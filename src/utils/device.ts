import { getDeviceId } from '@/api/modules/request'

/**
 * 构造客户端设备信息（随登录 / 注册请求上报，后端按设备绑定会话）
 * deviceType：1-手机 2-平板 3-PC（Web 端按 UA 粗略判定）
 * @returns 设备信息对象
 */
export function buildDeviceInfo(): API.DeviceInfo {
  const ua = navigator.userAgent
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua)
  return {
    deviceType: isMobile ? '1' : '3',
    deviceOs: detectOs(ua),
    deviceId: getDeviceId(),
  }
}

/**
 * 识别登录 / 注册渠道（后端当前仅开放 H5 与 PC）
 * @returns '3'-H5（移动端 Web）/ '4'-PC（桌面端 Web）
 */
export function detectChannel(): '3' | '4' {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? '3' : '4'
}

/**
 * 从 UA 中识别操作系统
 * @param ua User-Agent 字符串
 * @returns 操作系统名，无法识别时返回 undefined
 */
function detectOs(ua: string): string | undefined {
  if (/Windows/i.test(ua)) return 'Windows'
  if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS'
  if (/Android/i.test(ua)) return 'Android'
  if (/iPhone|iPad|iOS/i.test(ua)) return 'iOS'
  if (/Linux/i.test(ua)) return 'Linux'
  return undefined
}
