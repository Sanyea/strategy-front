<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ThemeIsland from '@/components/business/ThemeIsland.vue'
import AuthModeSwitch from './components/AuthModeSwitch.vue'
import LoginCard from './components/LoginCard.vue'
import RegisterCard from './components/RegisterCard.vue'

/** 登入 / 注册页：单卡片展示一张表单，顶部开关 + 卡片内事件链切换模式 */

const router = useRouter()

const mode = ref<'login' | 'register'>('login')
const prefillAccount = ref('')

/** 登入成功（含注册后自动登入）：回到工作台 */
function handleAuthSuccess(): void {
  void router.replace('/')
}

/** 切换至注册 */
function goToRegister(): void {
  mode.value = 'register'
}

/** 切换至登入；注册完成时预填账号 */
function goToLogin(account?: string): void {
  if (account) prefillAccount.value = account
  mode.value = 'login'
}
</script>

<template>
  <div class="auth-page">
    <ThemeIsland />

    <!-- 品牌字标 -->
    <p class="auth-page__brand" aria-label="云岫工作台">云岫</p>

    <main class="auth-page__main">
      <header class="auth-page__lead">
        <p class="auth-page__eyebrow">云岫 · 个人工作台</p>
        <h1 class="auth-page__title">归砚入席</h1>
        <p class="auth-page__subtitle text--secondary">
          已有账号则登入，初来者注册；几步之间，回到你的工作台。
        </p>
      </header>

      <div class="card auth-page__card">
        <AuthModeSwitch v-model="mode" />

        <LoginCard
          v-if="mode === 'login'"
          :prefill-account="prefillAccount"
          @success="handleAuthSuccess"
          @go-register="goToRegister"
        />
        <RegisterCard
          v-else
          @success="handleAuthSuccess"
          @go-login="goToLogin"
        />
      </div>
    </main>

    <footer class="auth-page__foot">
      <p class="text--weak">© 2026 云岫工作台 · 保留所有权利</p>
    </footer>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  /* 背景由全局 body 提供（16:9 水墨壁纸 + 宣纸纱罩，applyWallpaper 随机） */
}

.auth-page__brand {
  position: fixed;
  top: var(--space-4);
  left: 32px;
  z-index: 45;
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  letter-spacing: 0.1em;
  color: var(--color-ink);
}

.auth-page__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-6);
  padding: var(--space-8) var(--space-5);
}

.auth-page__lead {
  text-align: center;
}

.auth-page__eyebrow {
  font-size: var(--text-xs);
  letter-spacing: 0.3em;
  color: var(--color-text-secondary);
}

.auth-page__title {
  margin-top: var(--space-3);
  font-family: var(--font-display);
  font-size: var(--text-display);
  letter-spacing: 0.1em;
}

.auth-page__subtitle {
  margin-top: var(--space-3);
  font-size: var(--text-sm);
}

.auth-page__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  max-width: 460px;
  padding: var(--space-6);
}

.auth-page__foot {
  padding-block: var(--space-4);
  text-align: center;
  font-size: var(--text-xs);
}

@media (max-width: 600px) {
  .auth-page__main {
    padding-top: var(--space-7);
    gap: var(--space-5);
  }

  .auth-page__title {
    font-size: var(--text-2xl);
  }
}
</style>
