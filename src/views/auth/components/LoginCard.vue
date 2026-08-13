<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { isAxiosError } from 'axios'
import { login, verifyMfa } from '@/api/modules/auth/auth'
import { setToken } from '@/api/modules/request'
import { buildDeviceInfo, detectChannel } from '@/utils/device'
import { readApiErrorMessage } from '@/utils/error'
import AuthMethodSelect from './AuthMethodSelect.vue'

/** 登入卡片：第一步选方式，选中后填表；命中 MFA 时原地切换二次验证（一屏一事） */

const props = defineProps<{ prefillAccount?: string }>()

const emit = defineEmits<{
  success: []
  goRegister: []
}>()

// 登入方式：当前仅账号密码开放，其余置灰待后端开放
const loginMethods = [
  { key: 'password', label: '账号密码', desc: '用户名 / 手机号 / 邮箱 + 密码', available: true },
  { key: 'sms', label: '手机验证码', desc: '手机号 + 短信验证码' },
  { key: 'email', label: '邮箱验证码', desc: '邮箱 + 邮件验证码' },
  { key: 'qr', label: '扫码登入', desc: '手机扫码确认' },
]

/** 第一步：选择登入方式；选中后进入填表 */
const methodStep = ref(true)

const account = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

// —— MFA 二次验证态 ——
const mfaMode = ref(false)
const mfaCode = ref('')
const challengeToken = ref('')

const canSubmit = computed(
  () => account.value.trim().length > 0 && password.value.length > 0,
)
const canVerifyMfa = computed(() => /^\d{6}$/.test(mfaCode.value))

// 注册成功后预填账号，直接登入
watch(
  () => props.prefillAccount,
  (val) => {
    if (val) {
      account.value = val
      errorMsg.value = ''
    }
  },
)

function handleSubmit(): void {
  errorMsg.value = ''
  if (!canSubmit.value) {
    errorMsg.value = '请填写账号与密码'
    return
  }
  void submitLogin()
}

async function submitLogin(): Promise<void> {
  loading.value = true
  try {
    const res = await login({
      account: account.value.trim(),
      password: password.value,
      // 当前仅开放账号密码登入
      loginType: '3',
      registerChannel: detectChannel(),
      deviceInfo: buildDeviceInfo(),
    })
    if (res.data) setToken(res.data)
    emit('success')
  } catch (err) {
    // 后端约定：开启 MFA 时登录返回 403 + 挑战凭证
    if (isAxiosError(err) && err.response?.status === 403) {
      challengeToken.value = extractChallengeToken(err)
      mfaCode.value = ''
      mfaMode.value = true
      return
    }
    errorMsg.value = readApiErrorMessage(err, '登入失败，请稍后再试')
  } finally {
    loading.value = false
  }
}

function handleMfaSubmit(): void {
  errorMsg.value = ''
  if (!canVerifyMfa.value) {
    errorMsg.value = '请输入 6 位验证码'
    return
  }
  void submitMfa()
}

async function submitMfa(): Promise<void> {
  loading.value = true
  try {
    const res = await verifyMfa({
      tempToken: challengeToken.value,
      code: mfaCode.value,
      deviceInfo: buildDeviceInfo(),
    })
    if (res.data) setToken(res.data)
    emit('success')
  } catch (err) {
    errorMsg.value = readApiErrorMessage(err, '验证失败，请重新输入')
  } finally {
    loading.value = false
  }
}

function backToCredentials(): void {
  mfaMode.value = false
  mfaCode.value = ''
  errorMsg.value = ''
}

function extractChallengeToken(err: unknown): string {
  const data = (isAxiosError(err) ? err.response?.data : undefined) as
    | { data?: { tempToken?: string }; tempToken?: string }
    | undefined
  return data?.data?.tempToken ?? data?.tempToken ?? ''
}
</script>

<template>
  <section class="login">
    <!-- 第一步：选择登入方式（仅账号密码可用，其余置灰） -->
    <AuthMethodSelect
      v-if="methodStep && !mfaMode"
      :methods="loginMethods"
      title="选择登入方式"
      desc="当前开放账号密码登入，其余方式陆续接入"
      @select="methodStep = false"
    />

    <!-- 第二步：账号密码登入 -->
    <form v-else-if="!mfaMode" class="login__form" novalidate @submit.prevent="handleSubmit">
      <div class="login__back">
        <button type="button" class="login__back-link" @click="methodStep = true">
          选择其它方式
        </button>
      </div>
      <div class="field">
        <label class="field__label" for="login-account">账号</label>
        <input
          id="login-account"
          v-model="account"
          class="input"
          type="text"
          name="account"
          autocomplete="username"
          placeholder="手机号 / 邮箱 / 用户名"
          spellcheck="false"
        />
      </div>

      <div class="field">
        <label class="field__label" for="login-password">密码</label>
        <div class="field__wrap">
          <input
            id="login-password"
            v-model="password"
            class="input field__input"
            :type="showPassword ? 'text' : 'password'"
            name="password"
            autocomplete="current-password"
            placeholder="至少 8 位，含字母与数字"
          />
          <button
            type="button"
            class="field__toggle"
            :aria-label="showPassword ? '隐藏密码' : '显示密码'"
            @click="showPassword = !showPassword"
          >
            <svg
              v-if="!showPassword"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <svg
              v-else
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M17.9 17.1A10.9 10.9 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5-4.9M9.9 4.2A9.4 9.4 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.5 3.8M2 2l20 20" />
            </svg>
          </button>
        </div>
      </div>

      <p v-if="errorMsg" class="form-error" role="alert">{{ errorMsg }}</p>

      <button type="submit" class="btn btn--primary btn--lg login__submit" :disabled="loading">
        {{ loading ? '登入中…' : '登入' }}
      </button>
    </form>

    <!-- MFA 二次验证 -->
    <form v-else class="login__form" novalidate @submit.prevent="handleMfaSubmit">
      <div class="mfa">
        <span class="mfa__seal">验</span>
        <div class="mfa__text">
          <h3 class="mfa__title">二次验证</h3>
          <p class="mfa__desc text--secondary">
            输入账号绑定器上的 6 位动态码，完成身份确认
          </p>
        </div>
      </div>

      <div class="field">
        <label class="field__label" for="login-mfa">动态验证码</label>
        <input
          id="login-mfa"
          v-model="mfaCode"
          class="input mfa__code"
          type="text"
          name="code"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="6"
          placeholder="6 位数字"
        />
      </div>

      <p v-if="errorMsg" class="form-error" role="alert">{{ errorMsg }}</p>

      <button
        type="submit"
        class="btn btn--primary btn--lg login__submit"
        :disabled="loading || !canVerifyMfa"
      >
        {{ loading ? '验证中…' : '完成验证' }}
      </button>

      <button type="button" class="mfa__back" :disabled="loading" @click="backToCredentials">
        返回账号密码
      </button>
    </form>

    <footer class="auth-switch">
      <span class="text--secondary">还没有账号？</span>
      <button type="button" class="auth-switch__link" @click="emit('goRegister')">
        去注册
      </button>
    </footer>
  </section>
</template>

<style scoped>
.login {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.login__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.login__back {
  display: flex;
  justify-content: flex-end;
  margin-top: calc(-1 * var(--space-2));
}

.login__back-link {
  font-size: var(--text-xs);
  color: var(--color-text-weak);

  &:hover {
    color: var(--color-primary);
  }
}

.login__submit {
  width: 100%;
  margin-top: var(--space-2);

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

/* 输入字段 */
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field__label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.field__wrap {
  position: relative;
}

.field__input {
  padding-right: 40px;
}

.field__toggle {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  padding: 4px;
  color: var(--color-text-weak);

  & svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    color: var(--color-text-secondary);
  }
}

/* 错误提示 */
.form-error {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-danger-soft);
  border-radius: var(--radius-sm);
  background-color: var(--color-danger-soft);
  color: var(--color-danger);
  font-size: var(--text-sm);
}

/* MFA 二次验证 */
.mfa {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  background-color: var(--color-bg);
}

.mfa__seal {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1.5px solid var(--color-accent);
  border-radius: var(--radius-xs);
  color: var(--color-accent);
  font-family: var(--font-display);
  font-size: var(--text-lg);
  transform: rotate(-6deg);
}

.mfa__title {
  font-family: var(--font-display);
  font-size: var(--text-md);
  letter-spacing: 0.06em;
}

.mfa__desc {
  margin-top: 2px;
  font-size: var(--text-xs);
  line-height: 1.6;
}

.mfa__code {
  text-align: center;
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  letter-spacing: 0.5em;
  text-indent: 0.5em;
}

.mfa__back {
  align-self: center;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);

  &:hover {
    color: var(--color-primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* 底部切换链接 */
.auth-switch {
  margin-top: var(--space-2);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-soft);
  text-align: center;
  font-size: var(--text-sm);
}

.auth-switch__link {
  margin-left: var(--space-1);
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    opacity: 0.75;
  }
}

@media (prefers-reduced-motion: reduce) {
  .field__toggle,
  .mfa__back,
  .auth-switch__link {
    transition: none;
  }
}
</style>
