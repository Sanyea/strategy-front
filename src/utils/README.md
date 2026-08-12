# src/utils

工具函数目录，纯函数、无业务依赖。

## 存放内容
- `storage.ts`：localStorage/sessionStorage 封装（支持过期时间、JSON 序列化）
- `date.ts`：日期时间格式化
- `validate.ts`：表单校验规则（手机号、邮箱、身份证）
- `auth.ts`：Token 存取
- `download.ts`：文件下载

## 设计原则
- 纯函数，不依赖 Vue 实例、不依赖业务代码
- 输入明确，输出可预测
- 相同输入永远返回相同输出
- 可被项目任意位置调用
