<script setup lang="ts">
import GlassControl from '@/components/business/GlassControl.vue'
import BaseToastHost from '@/components/base/BaseToastHost.vue'

/** 全局单例 UI：视觉调节齿轮 + toast 宿主。toast 放根级，任何路由（含登入页）均可见 */
</script>

<template>
  <RouterView />
  <GlassControl />
  <BaseToastHost />
</template>
