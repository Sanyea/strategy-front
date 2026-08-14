<script setup lang="ts">
import { useRouter } from 'vue-router'
import ThemeIsland from '@/components/business/ThemeIsland.vue'

/** 404 兜底页：水墨风格，整屏居中，保留灵动岛主题切换，回首页 / 回上一页 */

const router = useRouter()

const goHome = () => router.push('/')

const goBack = () => {
  // 无可回退历史（如直接落地）时回首页，避免死循环
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<template>
  <div class="notfound">
    <ThemeIsland />
    <div class="notfound__card">
      <div class="notfound__wash">
        <span class="notfound__code">
          <span class="notfound__num">4</span><span class="notfound__num">0</span><span class="notfound__num">4</span>
        </span>
      </div>

      <h1 class="notfound__title">此页散入烟云</h1>
      <p class="notfound__desc text--secondary">
        您访问的页面不存在，或已被墨迹掩去。
        <br />
        不如归去，重寻来路。
      </p>

      <div class="notfound__actions">
        <button class="btn btn--primary" type="button" @click="goHome">回到首页</button>
        <button class="btn btn--ghost" type="button" @click="goBack">返回上一页</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notfound {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
}

.notfound__card {
  text-align: center;
}

/* 背后淡墨圆晕：径向透明渐变，无硬边实色块 */
.notfound__wash {
  position: relative;
  width: 300px;
  height: 300px;
  margin: 0 auto var(--space-7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.notfound__wash::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle, var(--wash-mist-2), transparent 68%);
}

/* 楷体数字，墨色逐位晕淡，模拟落笔渐收 */
.notfound__code {
  position: relative;
  display: flex;
  gap: var(--space-2);
  font-family: var(--font-display);
  font-size: clamp(72px, 14vw, 128px);
  line-height: 1;
  color: var(--color-ink);
}

.notfound__num:nth-child(1) {
  opacity: 1;
}

.notfound__num:nth-child(2) {
  opacity: 0.62;
}

.notfound__num:nth-child(3) {
  opacity: 0.34;
}

.notfound__title {
  margin: 0 0 var(--space-3);
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  color: var(--color-ink);
}

.notfound__desc {
  margin: 0 0 var(--space-6);
  font-size: var(--text-base);
  line-height: 1.9;
}

.notfound__actions {
  display: flex;
  justify-content: center;
  gap: var(--space-3);
}

@media (max-width: 768px) {
  .notfound__wash {
    width: 220px;
    height: 220px;
    margin-bottom: var(--space-6);
  }
}
</style>
