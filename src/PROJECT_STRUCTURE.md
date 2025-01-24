# 项目结构说明文档

## 根目录文件

### middleware.ts
- Next.js 中间件文件
- 处理路由请求，实现认证和授权
- 配置路由重定向和请求头修改

## app 目录 (Next.js 13+ App Router)

### 根目录文件
- `favicon.ico`: 网站图标
- `globals.css`: 全局样式定义，包含 Tailwind CSS 配置
- `layout.tsx`: 根布局组件，提供全局布局结构
- `not-found.tsx`: 404 错误页面组件

### (auth) 目录
- `(signin)/page.tsx`: 登录页面组件，处理用户认证

### api 目录
- `auth/register/route.ts`: 用户注册 API 端点
- `auth/[...nextauth]/route.ts`: NextAuth.js 认证 API 路由

### dashboard 目录
- `layout.tsx`: 仪表盘布局组件
- `page.tsx`: 仪表盘首页

#### dashboard/kanban
- `page.tsx`: 看板视图页面，任务管理界面

#### dashboard/my-tasks
- `page.tsx`: 个人任务列表页面

#### dashboard/overview
- 数据概览页面，包含多个并行路由组件：
  - `@area_stats`: 区域统计图表
  - `@bar_stats`: 柱状图统计
  - `@pie_stats`: 饼图统计
  - `@sales`: 销售数据展示

#### dashboard/profile
- `page.tsx`: 用户档案页面

#### dashboard/tasks
- `page.tsx`: 任务列表页面
- `[id]/page.tsx`: 任务详情页面

#### dashboard/videos
- `page.tsx`: 视频列表页面
- `[id]/page.tsx`: 视频详情页面

## components 目录

### 根目录组件
- `breadcrumbs.tsx`: 面包屑导航组件
- `file-uploader.tsx`: 文件上传组件
- `form-card-skeleton.tsx`: 表单卡片加载骨架屏
- `icons.tsx`: 图标组件集合
- `mode-toggle.tsx`: 主题切换组件
- `nav-main.tsx`: 主导航组件
- `nav-projects.tsx`: 项目导航组件
- `nav-user.tsx`: 用户导航组件
- `search-input.tsx`: 搜索输入框组件
- `team-switcher.tsx`: 团队切换组件

### kbar 目录
命令面板相关组件：
- `index.tsx`: 命令面板主组件
- `render-result.tsx`: 结果渲染组件
- `result-item.tsx`: 结果项组件
- `use-theme-switching.tsx`: 主题切换 Hook

### layout 目录
布局相关组件：
- `app-sidebar.tsx`: 应用侧边栏
- `header.tsx`: 页面头部
- `page-container.tsx`: 页面容器
- `providers.tsx`: 上下文提供者
- `user-nav.tsx`: 用户导航
- `ThemeToggle/`: 主题切换相关组件

### modal 目录
- `alert-modal.tsx`: 警告弹窗组件

### providers 目录
- `theme-provider.tsx`: 主题提供者组件

### ui 目录
基础 UI 组件库，基于 shadcn/ui：
- 包含按钮、表单、对话框等基础组件
- 包含数据表格相关组件

## constants 目录
- `data.ts`: 静态数据常量
- `mock-api.ts`: 模拟 API 数据

## data 目录
- `videos.ts`: 视频相关数据

## features 目录

### auth
认证相关功能：
- `github-auth-button.tsx`: GitHub 认证按钮
- `sigin-view.tsx`: 登录视图
- `user-auth-form.tsx`: 用户认证表单

### kanban
看板功能相关组件：
- `board-column.tsx`: 看板列组件
- `column-action.tsx`: 列操作组件
- `kanban-board.tsx`: 看板主组件
- 其他看板相关组件和工具

### overview
数据概览相关组件：
- 各类图表组件
- 加载骨架屏
- 销售数据展示

### products
产品管理相关组件：
- 产品表单
- 产品列表
- 产品表格

### profile
用户档案相关组件：
- 档案创建表单
- 档案视图页面
- 表单验证schema

## hooks 目录
自定义 React Hooks：
- `use-breadcrumbs.tsx`: 面包屑导航 Hook
- `use-breakpoints.tsx`: 断点检测 Hook
- `use-callback-ref.tsx`: 回调引用 Hook
- `use-controllable-state.tsx`: 可控状态 Hook
- `use-debounce.tsx`: 防抖 Hook
- `use-mobile.tsx`: 移动设备检测 Hook
- `use-multistep-form.tsx`: 多步骤表单 Hook

## lib 目录
工具函数和配置：
- `auth.config.ts`: 认证配置
- `auth.ts`: 认证工具函数
- `db.ts`: 数据库配置
- `searchparams.ts`: URL 参数处理
- `utils.ts`: 通用工具函数

## 开发指南

### 1. 添加新页面
1. 在 `app` 目录下创建对应的路由目录
2. 添加 `page.tsx` 文件
3. 如需要，添加 `layout.tsx` 和 `loading.tsx`

### 2. 添加新功能
1. 在 `features` 目录下创建新功能目录
2. 添加相关组件和工具函数
3. 在页面中集成新功能

### 3. 添加新组件
1. 基础 UI 组件放在 `components/ui` 目录
2. 业务组件放在 `components/业务模块` 目录
3. 确保组件可复用性

### 4. 开发新 API
1. 在 `app/api` 目录下创建新的 API 路由
2. 实现请求处理逻辑
3. 添加适当的错误处理

## 最佳实践

1. **代码组织**
   - 相关代码放在一起
   - 保持目录结构清晰
   - 避免过深的嵌套

2. **组件开发**
   - 遵循单一职责原则
   - 保持组件可复用性
   - 添加适当的类型定义

3. **性能优化**
   - 实现组件懒加载
   - 优化数据获取
   - 使用适当的缓存策略

4. **安全性**
   - 实现适当的认证授权
   - 验证用户输入
   - 保护敏感信息

## 注意事项

1. 遵循项目的代码规范
2. 保持文档的及时更新
3. 编写必要的测试用例
4. 注意性能优化
5. 实现错误处理
