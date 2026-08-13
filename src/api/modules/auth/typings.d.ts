declare namespace API {
  type DeviceInfo = {
    /** 设备类型：1-手机 2-平板 3-PC 4-小程序 */
    deviceType?: '1' | '2' | '3' | '4'
    /** 操作系统 */
    deviceOs?: string
    /** 设备品牌 */
    deviceBrand?: string
    /** 设备型号 */
    deviceModel?: string
    /** 设备唯一ID */
    deviceId: string
    /** APP 版本号 */
    appVersion?: string
  }

  type LoginDTO = {
    /** 账号（手机号/邮箱/用户名） */
    account: string
    /** 明文密码 */
    password: string
    /** 登入方式：3-账号密码（当前仅开放） */
    loginType: '1' | '2' | '3' | '4'
    /** 登录渠道：3-H5 4-PC（当前仅开放这两个） */
    registerChannel: '3' | '4'
    /** 客户端设备信息 */
    deviceInfo: DeviceInfo
  }

  type MfaVerifyDTO = {
    /** 挑战凭证（登录 403 响应中获取） */
    tempToken: string
    /** 6 位 TOTP 验证码 */
    code: string
    /** 客户端设备信息 */
    deviceInfo: DeviceInfo
  }

  type RefreshDTO = {
    /** 不透明 refreshToken */
    refreshToken: string
    /** 设备唯一ID，与会话行比对防跨设备盗用 */
    deviceId: string
  }

  type RegisterDTO = {
    /** 登录账号 */
    username: string
    /** 明文密码 */
    password: string
    /** 手机号（可选） */
    phone?: string
    /** 邮箱（可选） */
    email?: string
    /** 昵称（可选，缺省回落用户名） */
    nickname?: string
    /** 注册渠道：3-H5 4-PC（当前仅开放这两个） */
    registerChannel: '3' | '4'
    /** 客户端设备信息 */
    deviceInfo: DeviceInfo
  }

  type RTokenVO = {
    code?: number
    message?: string
    data?: TokenVO
    timestamp?: string
  }

  type RVoid = {
    code?: number
    message?: string
    data?: Record<string, any>
    timestamp?: string
  }

  type TokenVO = {
    /** JWT accessToken（有效期 30 分钟） */
    accessToken?: string
    /** 不透明 refreshToken（14 天有效期，一次性） */
    refreshToken?: string
    /** accessToken 有效期（秒），供客户端预判刷新时机 */
    accessExpiresIn?: number
  }
}
