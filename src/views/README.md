# src/views

业务页面目录，所有用户可见的页面组件。

## 目录组织
按业务模块聚合，每个模块独立文件夹：
```
views/
├── login/          # 登录模块
├── dashboard/      # 仪表盘
└── user/           # 用户管理
    ├── components/ # 该模块独有的业务组件
    ├── list.vue    # 用户列表页
    └── detail.vue  # 用户详情页
```

## 规范
- 页面组件只负责渲染和交互，复杂逻辑抽离到 composables
- 接口调用通过 `src/api/` 层，不直接写 axios
- 模块独有的组件放在模块内 `components/`，不放全局
- 页面文件命名：列表页 `list.vue`，详情页 `detail.vue`，表单页 `form.vue`
