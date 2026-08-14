<script setup lang="ts">
import { reactive, ref } from 'vue'
import { register } from '@/api/modules/auth/auth'
import { setToken } from '@/api/modules/request'
import { useUserStore } from '@/stores/modules/user'
import { buildDeviceInfo, detectChannel } from '@/utils/device'
import { readApiErrorMessage } from '@/utils/error'
import AuthMethodSelect from './AuthMethodSelect.vue'

const userStore = useUserStore()

/** 注册卡片：第一步选方式，再分步填表（账号 → 资料 → 完成），一屏只做一件事 */

const emit = defineEmits<{
  success: []
  goLogin: [account: string]
}>()

// 注册方式：当前仅账号注册开放，其余置灰（注册接口尚无方式字段）
const registerMethods = [
  { key: 'account', label: '账号注册', desc: '自定账号与密码', available: true },
  { key: 'phone', label: '手机号注册', desc: '手机号 + 短信验证码' },
  { key: 'email', label: '邮箱注册', desc: '邮箱 + 邮件验证码' },
]

/** 步骤进度以 印章 + 墨线 呈现，完成即盖章（方式 → 账号 → 资料 → 完成） */
const steps = [
  { key: 0, label: '方式' },
  { key: 1, label: '账号' },
  { key: 2, label: '资料' },
  { key: 3, label: '完成' },
]

const step = ref<0 | 1 | 2 | 3>(0)
const loading = ref(false)
const formError = ref('')

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
const PHONE_RE = /^1[3-9]\d{9}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  phone: '',
  email: '',
})

interface Step1Errors {
  username?: string
  password?: string
  confirm?: string
}
interface Step2Errors {
  nickname?: string
  phone?: string
  email?: string
}

const step1Errors = reactive<Step1Errors>({})
const step2Errors = reactive<Step2Errors>({})

function stepState(key: number): string {
  if (step.value > key) return 'is-done'
  if (step.value === key) return 'is-active'
  return 'is-pending'
}

function validateStep1(): boolean {
  step1Errors.username = undefined
  step1Errors.password = undefined
  step1Errors.confirm = undefined
  let ok = true

  const name = form.username.trim()
  if (!name) {
    step1Errors.username = '请填写登录账号'
    ok = false
  } else if (!USERNAME_RE.test(name)) {
    step1Errors.username = '账号可用字母、数字与下划线，3–20 位'
    ok = false
  }

  if (!form.password) {
    step1Errors.password = '请设置密码'
    ok = false
  } else if (!PASSWORD_RE.test(form.password)) {
    step1Errors.password = '密码至少 8 位，且同时包含字母与数字'
    ok = false
  }

  if (!form.confirmPassword) {
    step1Errors.confirm = '请再次输入密码'
    ok = false
  } else if (form.confirmPassword !== form.password) {
    step1Errors.confirm = '两次输入的密码不一致'
    ok = false
  }

  return ok
}

function validateStep2(): boolean {
  step2Errors.nickname = undefined
  step2Errors.phone = undefined
  step2Errors.email = undefined
  let ok = true

  if (form.nickname.trim().length > 20) {
    step2Errors.nickname = '昵称最多 20 字'
    ok = false
  }

  const phone = form.phone.trim()
  if (phone && !PHONE_RE.test(phone)) {
    step2Errors.phone = '手机号格式不正确'
    ok = false
  }

  const email = form.email.trim()
  if (email && !EMAIL_RE.test(email)) {
    step2Errors.email = '邮箱格式不正确'
    ok = false
  }

  return ok
}

function handleNext(): void {
  if (step.value !== 1) return
  if (validateStep1()) step.value = 2
}

function handleBack(): void {
  if (step.value === 2) step.value = 1
  else if (step.value === 1) step.value = 0
}

function handleSubmit(): void {
  formError.value = ''
  if (!validateStep2()) return
  void submitRegister()
}

async function submitRegister(): Promise<void> {
  loading.value = true
  try {
    const res = await register({
      username: form.username.trim(),
      password: form.password,
      nickname: form.nickname.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      registerChannel: detectChannel(),
      deviceInfo: buildDeviceInfo(),
    })
    // 后端注册即返回双 Token，注册成功自动登入
    if (res.data) setToken(res.data)
    userStore.setUser({
      username: form.username.trim(),
      nickname: form.nickname.trim() || form.username.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
    })
    step.value = 3
  } catch (err) {
    formError.value = readApiErrorMessage(err, '注册失败，请稍后再试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="register">
    <!-- 第一步：选择注册方式（仅账号注册可用，其余置灰） -->
    <AuthMethodSelect
      v-if="step === 0"
      :methods="registerMethods"
      title="选择注册方式"
      desc="当前开放账号注册，其余方式陆续接入"
      @select="step = 1"
    />

    <!-- 印章步骤条 -->
    <ol class="reg-steps" aria-label="注册步骤">
      <template v-for="(s, i) in steps" :key="s.key">
        <li class="reg-step" :class="stepState(s.key)">
          <span class="reg-step__seal" aria-hidden="true">{{ s.key + 1 }}</span>
          <span class="reg-step__label">{{ s.label }}</span>
        </li>
        <span
          v-if="i < steps.length - 1"
          class="reg-step__line"
          :class="{ 'is-inked': step > s.key }"
          aria-hidden="true"
        />
      </template>
    </ol>

    <!-- 第一步：账号 -->
    <form v-if="step === 1" class="register__form" novalidate @submit.prevent="handleNext">
      <div class="field">
        <label class="field__label" for="reg-username">登录账号</label>
        <input
          id="reg-username"
          v-model="form.username"
          class="input"
          type="text"
          name="username"
          autocomplete="username"
          placeholder="3–20 位，字母 / 数字 / 下划线"
          spellcheck="false"
        />
        <p v-if="step1Errors.username" class="field__error">{{ step1Errors.username }}</p>
      </div>

      <div class="field">
        <label class="field__label" for="reg-password">密码</label>
        <input
          id="reg-password"
          v-model="form.password"
          class="input"
          type="password"
          name="password"
          autocomplete="new-password"
          placeholder="至少 8 位，含字母与数字"
        />
        <p v-if="step1Errors.password" class="field__error">{{ step1Errors.password }}</p>
      </div>

      <div class="field">
        <label class="field__label" for="reg-confirm">确认密码</label>
        <input
          id="reg-confirm"
          v-model="form.confirmPassword"
          class="input"
          type="password"
          name="confirmPassword"
          autocomplete="new-password"
          placeholder="再次输入密码"
        />
        <p v-if="step1Errors.confirm" class="field__error">{{ step1Errors.confirm }}</p>
      </div>

      <div class="register__actions">
        <button type="button" class="btn btn--ghost" @click="handleBack">返回</button>
        <button type="submit" class="btn btn--primary register__next">下一步</button>
      </div>
    </form>

    <!-- 第二步：资料 -->
    <form v-else-if="step === 2" class="register__form" novalidate @submit.prevent="handleSubmit">
      <div class="field">
        <label class="field__label" for="reg-nickname">昵称 <span class="field__optional">选填</span></label>
        <input
          id="reg-nickname"
          v-model="form.nickname"
          class="input"
          type="text"
          name="nickname"
          autocomplete="nickname"
          placeholder="别人怎么称呼你"
          spellcheck="false"
        />
        <p v-if="step2Errors.nickname" class="field__error">{{ step2Errors.nickname }}</p>
      </div>

      <div class="field">
        <label class="field__label" for="reg-phone">手机号 <span class="field__optional">选填</span></label>
        <input
          id="reg-phone"
          v-model="form.phone"
          class="input"
          type="tel"
          name="phone"
          autocomplete="tel"
          inputmode="numeric"
          placeholder="用于找回账号"
        />
        <p v-if="step2Errors.phone" class="field__error">{{ step2Errors.phone }}</p>
      </div>

      <div class="field">
        <label class="field__label" for="reg-email">邮箱 <span class="field__optional">选填</span></label>
        <input
          id="reg-email"
          v-model="form.email"
          class="input"
          type="email"
          name="email"
          autocomplete="email"
          placeholder="用于找回账号"
        />
        <p v-if="step2Errors.email" class="field__error">{{ step2Errors.email }}</p>
      </div>

      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>

      <div class="register__actions">
        <button type="button" class="btn btn--ghost" :disabled="loading" @click="handleBack">
          上一步
        </button>
        <button
          type="submit"
          class="btn btn--primary register__create"
          :disabled="loading"
        >
          {{ loading ? '创建中…' : '创建账号' }}
        </button>
      </div>
    </form>

    <!-- 第三步：完成（仅后端注册成功后进入） -->
    <div v-else-if="step === 3" class="reg-success">
      <span class="reg-success__seal">已立</span>
      <h3 class="reg-success__title">注册成功</h3>
      <p class="reg-success__desc text--secondary">
        已为你登入「{{ form.username }}」，现在就可以开始。
      </p>
      <button type="button" class="btn btn--primary btn--lg reg-success__cta" @click="emit('success')">
        进入工作台
      </button>
      <button
        type="button"
        class="reg-success__alt"
        @click="emit('goLogin', form.username)"
      >
        仍去登入
      </button>
    </div>

    <footer v-if="step !== 3" class="auth-switch">
      <span class="text--secondary">已有账号？</span>
      <button type="button" class="auth-switch__link" @click="emit('goLogin', form.username)">
        去登入
      </button>
    </footer>
  </section>
</template>

<style scoped>
.register {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* ========== 印章步骤条 ========== */
.reg-steps {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: var(--space-2);
  padding-block: var(--space-2);
}

.reg-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.reg-step__seal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-xs);
  font-family: var(--font-serif);
  font-size: var(--text-base);
  transition:
    background-color 0.25s ease,
    color 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

.reg-step__label {
  font-size: var(--text-xs);
  color: var(--color-text-weak);
  transition: color 0.25s ease;
}

/* 未到：空心墨框 */
.reg-step.is-pending .reg-step__seal {
  color: var(--color-text-weak);
}

/* 当前：实心印章 + 淡墨光圈 */
.reg-step.is-active .reg-step__seal {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-on-primary);
  box-shadow: 0 0 0 4px var(--color-primary-soft);
}

.reg-step.is-active .reg-step__label {
  color: var(--color-ink);
}

/* 已过：实心墨印，淡显 */
.reg-step.is-done .reg-step__seal {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-on-primary);
  opacity: 0.55;
}

/* 连接墨线 */
.reg-step__line {
  width: 44px;
  height: 1px;
  margin-top: 17px;
  background-color: var(--color-border-soft);
  transition: background-color 0.25s ease;

  &.is-inked {
    background-color: var(--color-primary);
  }
}

/* ========== 分步表单 ========== */
.register__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.register__actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.register__create {
  flex: 1;
}

.register__next {
  flex: 1;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field__label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.field__optional {
  font-size: var(--text-xs);
  color: var(--color-text-weak);
}

.field__error {
  font-size: var(--text-xs);
  color: var(--color-danger);
}

.form-error {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-danger-soft);
  border-radius: var(--radius-sm);
  background-color: var(--color-danger-soft);
  color: var(--color-danger);
  font-size: var(--text-sm);
}

/* ========== 完成态：朱砂印章 ========== */
.reg-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding-block: var(--space-5);
  text-align: center;
}

.reg-success__seal {
  display: inline-block;
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--color-accent);
  border-radius: var(--radius-xs);
  color: var(--color-accent);
  font-family: var(--font-display);
  font-size: var(--text-xl);
  letter-spacing: 0.24em;
  text-indent: 0.24em;
  transform: rotate(-4deg);
  opacity: 0.92;
}

.reg-success__title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  letter-spacing: 0.08em;
}

.reg-success__desc {
  font-size: var(--text-sm);
}

.reg-success__cta {
  width: 100%;
  margin-top: var(--space-2);
}

.reg-success__alt {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);

  &:hover {
    color: var(--color-primary);
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
  .reg-step__seal,
  .reg-step__label,
  .reg-step__line,
  .auth-switch__link,
  .reg-success__alt {
    transition: none;
  }
}
</style>
