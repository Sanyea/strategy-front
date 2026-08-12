// @ts-ignore
/* eslint-disable */
import request from '@/api/modules/request.ts'

/** 用户登录 账号密码登录，若开启 MFA 则返回 403 + 挑战凭证 POST /auth/login */
export async function login(body: API.LoginDTO, options?: { [key: string]: any }) {
  return request<API.RTokenVO>('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 登出 使当前 accessToken 失效，销毁 refreshToken 与会话 POST /auth/logout */
export async function logout(options?: { [key: string]: any }) {
  return request<API.RVoid>('/auth/logout', {
    method: 'POST',
    ...(options || {})
  })
}

/** MFA 二次验证 提交 TOTP 验证码完成二次认证，返回双 Token POST /auth/mfa/verify */
export async function verifyMfa(body: API.MfaVerifyDTO, options?: { [key: string]: any }) {
  return request<API.RTokenVO>('/auth/mfa/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 刷新 Token 使用 refreshToken 轮换新的双 Token（一次性） POST /auth/refresh */
export async function refresh(body: API.RefreshDTO, options?: { [key: string]: any }) {
  return request<API.RTokenVO>('/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 用户注册 创建新用户账号，返回 JWT 双 Token POST /auth/register */
export async function register(body: API.RegisterDTO, options?: { [key: string]: any }) {
  return request<API.RTokenVO>('/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}
