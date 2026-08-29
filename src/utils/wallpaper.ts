/**
 * 16:9 水墨壁纸随机背景：会话内随机选一张，写入 `--wash-wallpaper-bg` 变量供全局 body 背景消费。
 * 背景 = 宣纸色渐变纱罩 + 壁纸，一次写入两个图层，避免 `url(var(...))` 与构建期 CSS 压缩冲突。
 */

const WALLPAPER_DIR = '/washpaintingstyle/16-9'
const WALLPAPER_KEY = 'wash-wallpaper'

/** 各分类图片数量：静态资源构建期不可枚举，新增/删除图片时同步此表 */
const CATEGORIES = [
  { name: 'animal', count: 17 },
  { name: 'city', count: 13 },
  { name: 'scenery', count: 24 },
] as const

/** 宣纸色渐变纱罩（透明度保证表单 / 内容可读，随主题 --color-bg 换色；强度由 --veil-strength 倍率调节） */
function veil(): string {
  return [
    'linear-gradient(to bottom,',
    '  color-mix(in srgb, var(--color-bg) calc(84% * var(--veil-strength)), transparent),',
    '  color-mix(in srgb, var(--color-bg) calc(90% * var(--veil-strength)), transparent)',
    ')',
  ].join('\n')
}

/**
 * 取当前会话壁纸 URL。
 * 首次访问随机一张并记忆到 sessionStorage，同一会话内保持稳定（SPA 切换页面不闪烁）。
 * @returns 壁纸绝对路径，如 `/washpaintingstyle/16-9/scenery/7.avif`
 */
function getWallpaperUrl(): string {
  const saved = sessionStorage.getItem(WALLPAPER_KEY)
  if (saved) return saved

  const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
  const index = Math.floor(Math.random() * cat.count) + 1
  const url = `${WALLPAPER_DIR}/${cat.name}/${index}.avif`
  sessionStorage.setItem(WALLPAPER_KEY, url)
  return url
}

/**
 * 将「纱罩 + 随机壁纸」整体写入 `--wash-wallpaper-bg`（html 根元素），应用前调用一次即可。
 */
export function applyWallpaper(): void {
  const bg = `${veil()},\nurl('${getWallpaperUrl()}')`
  document.documentElement.style.setProperty('--wash-wallpaper-bg', bg)
}
