/**
 * @umijs/openapi 生成器配置
 * 从后端 SpringDoc 暴露的 OpenAPI spec 生成 TypeScript 请求代码。
 * 运行 `npm run api:gen` 触发。
 *
 * - serversPath './.api-gen' + projectName 'api'：产物先生成到根目录临时目录，
 *   再手动按业务移动到 src/api/modules/<模块>/（生成器会清空输出目录，勿直接输出到 src/api/）
 * - requestLibPath '@/api/modules/request'：生成代码复用自定义 axios 封装（src/api/modules/request.ts）
 */
export default {
  schemaPath: 'http://localhost:8080/v3/api-docs',
  serversPath: './.api-gen',
  projectName: 'api',
  requestLibPath: '@/api/modules/request',
}
