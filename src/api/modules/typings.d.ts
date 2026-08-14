declare namespace API {
  type checkParams = {
    id: number
    permission: string
  }

  type delete1Params = {
    id: number
  }

  type deleteUsingDELETEParams = {
    id: number
  }

  type detailParams = {
    id: number
  }

  type DeviceInfo = {
    /** 设备类型：1-手机 2-平板 3-PC 4-小程序 */
    deviceType?: '1' | '2' | '3' | '4'
    /** 操作系统 */
    deviceOs?: string
    /** 设备品牌 */
    deviceBrand?: string
    /** 设备型号 */
    deviceModel?: string
    /** 设备唯一ID */
    deviceId: string
    /** APP 版本号 */
    appVersion?: string
  }

  type effectiveParams = {
    id: number
  }

  type evictBatchParams = {
    roleId: number
    mode?: string
  }

  type EvictTaskVO = {
    /** 任务 ID（evict_ + 12 位随机串） */
    taskId?: string
    /** 任务来源描述（如角色到期定时清理） */
    sourceDesc?: string
    /** 任务状态 PENDING/RUNNING/SUCCESS/FAILED */
    status?: string
    /** 踢中会话数（成功时） */
    kicked?: number
    /** 失败原因（失败时） */
    error?: string
    createdAt?: string
    /** 完成时间（成功/失败均回填；null=进行中/待执行） */
    doneAt?: string
  }

  type evictUserParams = {
    id: number
  }

  type expiringParams = {
    query: UserRoleExpiringQueryDTO
  }

  type grantParams = {
    id: number
  }

  type IBasePageRoleVO = {
    pages?: number
    size?: number
    total?: number
    records?: RoleVO[]
    current?: number
  }

  type IBasePageUserRoleVO = {
    pages?: number
    size?: number
    total?: number
    records?: UserRoleVO[]
    current?: number
  }

  type importRolesParams = {
    overwrite?: boolean
  }

  type LoginDTO = {
    /** 账号（当前仅支持用户名，语义由 loginType 决定） */
    account: string
    /** 明文密码 */
    password: string
    /** 登入方式：3-账号密码（当前仅开放） */
    loginType: '1' | '2' | '3' | '4'
    /** 登录渠道：3-H5 4-PC（当前仅开放这两个） */
    registerChannel: '3' | '4'
    /** 客户端设备信息 */
    deviceInfo: DeviceInfo
  }

  type MfaVerifyDTO = {
    /** 挑战凭证（登录 403 响应中获取） */
    tempToken: string
    /** 6 位 TOTP 验证码 */
    code: string
    /** 客户端设备信息 */
    deviceInfo: DeviceInfo
  }

  type pageParams = {
    query: RoleQueryDTO
  }

  type PermissionDTO = {
    /** 父资源 ID，0-根 */
    parentId?: number
    permissionName?: string
    /** 前端标题 */
    title?: string
    /** 资源类型 1-目录 2-菜单 3-按钮 4-接口 */
    permissionType?: 'DIRECTORY' | 'MENU' | 'BUTTON' | 'INTERFACE'
    /** 权限标识，如 system:user:create（按钮/接口用，可空） */
    permissionCode?: string
    routePath?: string
    componentPath?: string
    /** 接口请求方法 GET/POST/PUT/DELETE/PATCH */
    apiMethod?: string
    /** 接口路径，如 /api/system/user */
    apiPath?: string
    icon?: string
    /** 显示顺序 */
    sortOrder?: number
    /** 是否显示（按钮/接口忽略） */
    isVisible?: 'NO' | 'YES'
    /** 是否需要权限控制 0-否 1-是 */
    requiresAuth?: 'NO' | 'YES'
    remark?: string
  }

  type PermissionQueryDTO = {
    /** 资源名称（模糊匹配，可空） */
    permissionName?: string
    /** 资源类型 1-目录 2-菜单 3-按钮 4-接口（可空） */
    permissionType?: 'DIRECTORY' | 'MENU' | 'BUTTON' | 'INTERFACE'
    /** 权限标识（精确匹配，可空） */
    permissionCode?: string
    /** 页码（从 1 起，默认 1） */
    page?: number
    /** 每页行数（默认 10） */
    size?: number
  }

  type permissionsParams = {
    id: number
  }

  type PermissionVO = {
    id?: number
    /** 父资源 ID，0-根 */
    parentId?: number
    permissionName?: string
    /** 前端标题 */
    title?: string
    /** 资源类型 1-目录 2-菜单 3-按钮 4-接口 */
    permissionType?: 'DIRECTORY' | 'MENU' | 'BUTTON' | 'INTERFACE'
    /** 权限标识，如 system:user:create */
    permissionCode?: string
    routePath?: string
    componentPath?: string
    /** 接口请求方法 GET/POST/PUT/DELETE/PATCH */
    apiMethod?: string
    apiPath?: string
    icon?: string
    /** 显示顺序 */
    sortOrder?: number
    /** 是否显示（按钮/接口忽略） */
    isVisible?: 'NO' | 'YES'
    /** 资源状态 0-停用 1-正常 */
    status?: 'DISABLED' | 'NORMAL'
    /** 是否内置资源 */
    isBuiltIn?: 'NO' | 'YES'
    /** 是否需要权限控制 0-否 1-是 */
    requiresAuth?: 'NO' | 'YES'
    remark?: string
    createTime?: string
    updateTime?: string
    /** 子节点列表（树结构） */
    children?: any
  }

  type RBoolean = {
    code?: number
    message?: string
    data?: boolean
    timestamp?: string
  }

  type RefreshDTO = {
    /** 不透明 refreshToken */
    refreshToken: string
    /** 设备唯一ID，与会话行比对防跨设备盗用 */
    deviceId: string
  }

  type RegisterDTO = {
    /** 登录账号 */
    username: string
    /** 明文密码 */
    password: string
    /** 手机号（可选） */
    phone?: string
    /** 邮箱（可选） */
    email?: string
    /** 昵称（可选，缺省回落用户名） */
    nickname?: string
    /** 注册渠道：3-H5 4-PC（当前仅开放这两个） */
    registerChannel: '3' | '4'
    /** 客户端设备信息 */
    deviceInfo: DeviceInfo
  }

  type renewParams = {
    id: number
    roleId: number
  }

  type replace1Params = {
    id: number
  }

  type replaceParams = {
    id: number
  }

  type REvictTaskVO = {
    code?: number
    message?: string
    data?: EvictTaskVO
    timestamp?: string
  }

  type revokeParams = {
    id: number
  }

  type RIBasePageRoleVO = {
    code?: number
    message?: string
    data?: IBasePageRoleVO
    timestamp?: string
  }

  type RIBasePageUserRoleVO = {
    code?: number
    message?: string
    data?: IBasePageUserRoleVO
    timestamp?: string
  }

  type RInteger = {
    code?: number
    message?: string
    data?: number
    timestamp?: string
  }

  type RListMapStringObject = {
    code?: number
    message?: string
    data?: Record<string, any>[]
    timestamp?: string
  }

  type RListPermissionVO = {
    code?: number
    message?: string
    data?: PermissionVO[]
    timestamp?: string
  }

  type RListString = {
    code?: number
    message?: string
    data?: string[]
    timestamp?: string
  }

  type RListUserRoleVO = {
    code?: number
    message?: string
    data?: UserRoleVO[]
    timestamp?: string
  }

  type RLong = {
    code?: number
    message?: string
    data?: number
    timestamp?: string
  }

  type RoleCloneDTO = {
    /** 源角色 ID（必填） */
    sourceRoleId: number
  }

  type RoleDTO = {
    /** 角色编码（必填），如 SUPER_ADMIN */
    roleCode: string
    roleName?: string
    /** 数据权限范围 1-全部 2-仅本人 3-本部门 4-本部门及以下 5-自定义 */
    dataScope?: number
    /** 显示顺序 */
    sortOrder?: number
    remark?: string
  }

  type RolePermissionAssignDTO = {
    /** 权限资源 ID 列表（可为空——覆盖语义下清空角色权限） */
    permissionIds: number[]
  }

  type RoleQueryDTO = {
    /** 角色编码（精确匹配，可空） */
    roleCode?: string
    /** 角色名称（模糊匹配，可空） */
    roleName?: string
    /** 角色状态 0-停用 1-正常（可空） */
    status?: number
    /** 页码（从 1 起，默认 1） */
    page?: number
    /** 每页行数（默认 10） */
    size?: number
    /** 排序字段（白名单：role_code/role_name/sort_order/create_time） */
    sortField?: string
    /** 排序方向 asc/desc（默认 asc） */
    sortOrder?: string
  }

  type RoleVO = {
    id?: number
    roleCode?: string
    roleName?: string
    /** 数据权限范围 1-全部 2-仅本人 3-本部门 4-本部门及以下 5-自定义 */
    dataScope?: 'ALL' | 'SELF' | 'DEPT' | 'DEPT_AND_BELOW' | 'CUSTOM'
    /** 显示顺序 */
    sortOrder?: number
    /** 角色状态 0-停用 1-正常 */
    status?: 'DISABLED' | 'NORMAL'
    /** 是否内置角色 */
    isBuiltIn?: 'NO' | 'YES'
    remark?: string
    /** 当前生效权限码列表（仅详情端点填充，分页为 null） */
    permissionCodes?: string[]
    createTime?: string
    updateTime?: string
  }

  type RRoleVO = {
    code?: number
    message?: string
    data?: RoleVO
    timestamp?: string
  }

  type RSetString = {
    code?: number
    message?: string
    data?: string[]
    timestamp?: string
  }

  type RSyncReport = {
    code?: number
    message?: string
    data?: SyncReport
    timestamp?: string
  }

  type RTokenVO = {
    code?: number
    message?: string
    data?: TokenVO
    timestamp?: string
  }

  type RVoid = {
    code?: number
    message?: string
    data?: Record<string, any>
    timestamp?: string
  }

  type StatusDTO = {
    /** 状态码 0-停用 1-正常（必填） */
    status: number
  }

  type syncParams = {
    dryRun?: boolean
  }

  type SyncReport = {
    added?: string[]
    revived?: string[]
    deprecated?: string[]
    ignored?: string[]
  }

  type taskParams = {
    taskId: string
  }

  type TokenVO = {
    /** JWT accessToken（有效期 30 分钟） */
    accessToken?: string
    /** 不透明 refreshToken（14 天有效期，一次性） */
    refreshToken?: string
    /** accessToken 有效期（秒），供客户端预判刷新时机 */
    accessExpiresIn?: number
  }

  type treeParams = {
    query: PermissionQueryDTO
  }

  type unbindParams = {
    id: number
    roleId: number
  }

  type update1Params = {
    id: number
  }

  type updateParams = {
    id: number
  }

  type updateStatus1Params = {
    id: number
  }

  type updateStatusParams = {
    id: number
  }

  type UserRoleAssignDTO = {
    /** 角色 ID */
    roleId?: number
    /** 角色生效开始时间（NULL=不限制） */
    beginTime?: string
    /** 角色生效结束时间（NULL=不限制） */
    endTime?: string
  }

  type UserRoleBatchAssignDTO = {
    /** 目标用户 ID 列表（非空） */
    userIds: number[]
    /** 角色 ID */
    roleId: number
    /** 角色生效开始时间（NULL=不限制） */
    beginTime?: string
    /** 角色生效结束时间（NULL=不限制） */
    endTime?: string
  }

  type UserRoleExpiringQueryDTO = {
    /** 到期预警时间窗（天，默认 7） */
    days?: number
    /** 页码（从 1 起，默认 1） */
    page?: number
    /** 每页行数（默认 10） */
    size?: number
  }

  type UserRoleRenewDTO = {
    /** 绑定行 ID 列表（ums_user_role.id，非空） */
    bindIds: number[]
    /** 新的结束时间（非空） */
    endTime: string
  }

  type UserRoleRenewSingleDTO = {
    /** 新的结束时间（非空） */
    endTime: string
  }

  type userRolesParams = {
    id: number
  }

  type UserRoleVO = {
    /** 绑定行 ID（ums_user_role.id，批量续期/解绑引用） */
    id?: number
    userId?: number
    roleId?: number
    /** 角色编码（装配，缺失为 null） */
    roleCode?: string
    /** 角色名称（装配，缺失为 null） */
    roleName?: string
    /** 角色生效开始时间（NULL=不限制） */
    beginTime?: string
    /** 角色生效结束时间（NULL=不限制） */
    endTime?: string
    /** 授权人 ID */
    assignerId?: number
    createTime?: string
  }
}
