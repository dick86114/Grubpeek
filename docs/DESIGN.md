# GrubPeek 设计文档

## 1. 系统架构
本项目采用现代化的 Web 全栈架构，基于 Next.js 框架构建。

### 1.1 技术栈
-   **前端框架**：Next.js 16 (React 19) - 提供服务端渲染 (SSR) 和静态生成 (SSG) 能力。
-   **UI 库**：Tailwind CSS v4 - 原子化 CSS 框架，快速构建响应式和深色模式界面。
-   **图标库**：Lucide React - 轻量级、风格统一的 SVG 图标。
-   **数据库**：SQLite (via `better-sqlite3`) - 轻量级嵌入式关系型数据库，适合单体应用部署，无需单独维护数据库服务。
-   **文件解析**：SheetJS (xlsx) - 用于解析 Excel (.xlsx, .xls) 和 WPS (.et) 表格文件。
-   **时间处理**：date-fns - 现代 JavaScript 日期工具库。

### 1.2 目录结构
```
/
├── menu/                 # 存放原始 Excel 菜单文件（归档用）
├── web/                  # Web 应用程序根目录
│   ├── app/              # Next.js App Router
│   │   ├── api/          # 后端 API 路由 (RESTful)
│   │   ├── admin/        # 管理后台页面
│   │   ├── icon.tsx      # 动态 Favicon 生成
│   │   ├── layout.tsx    # 全局布局 (包含 ThemeProvider)
│   │   └── page.tsx      # 首页 (C端展示)
│   ├── components/       # React 组件 (Calendar, DailyMenu, HeaderControls 等)
│   ├── lib/              # 核心逻辑库
│   │   ├── db.ts         # 数据库连接与初始化
│   │   └── parser.ts     # Excel 解析核心算法
│   ├── public/           # 静态资源
│   ├── scripts/          # 维护脚本
│   └── types/            # TypeScript 类型定义
└── docs/                 # 项目文档
```

## 2. 数据库设计

### 2.1 数据库选型
选用 **SQLite**。理由：文件型数据库，零配置，易备份，性能足以支撑企业内部食堂菜单查询的高并发读取（读多写少场景）。

### 2.2 数据表结构
主要包含 `menus` 表和 `settings` 表。

#### 表名：`menus`
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | INTEGER PRIMARY KEY | 自增主键 |
| `date` | TEXT | 日期 (YYYY-MM-DD) |
| `type` | TEXT | 餐别 (breakfast, lunch, dinner, takeaway) |
| `category` | TEXT | 分类 (如：热菜, 凉菜, 档口特色) |
| `name` | TEXT | 菜品名称 |
| `is_featured` | INTEGER | 是否特色菜 (0/1) |
| `price` | REAL | 价格 |

#### 表名：`settings`
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `key` | TEXT PRIMARY KEY | 配置键 (如 admin_password) |
| `value` | TEXT | 配置值 |

## 3. 核心模块设计

### 3.1 菜单解析器 (`lib/parser.ts`)
-   **功能**：读取 Excel Buffer，识别表头日期，解析各餐别区域。
-   **算法逻辑**：
    1.  从文件名提取“基准日期”（如 `2026年1月4日-9日.xlsx` -> `2026-01-04`）。
    2.  遍历 Sheet 行，通过关键词（"早餐", "午餐", "晚餐"）定位餐别区块。
    3.  识别表头行（包含“星期一”、“星期二”等），计算列索引对应的具体日期。
    4.  读取数据行，将单元格内容映射为 `Menu` 对象。

### 3.2 首页交互设计
-   **状态管理**：使用 `useState` 管理 `selectedDate`（当前选中日期）和 `currentMonth`（日历视图月份）。
-   **数据获取**：根据当前月份范围（`start` ~ `end`）调用 `/api/menus` 接口预加载整月数据，减少日历切换时的请求延迟。
-   **主题系统**：基于 `next-themes` 或自定义 Context 实现，通过修改 `<html>` 标签的 class (`dark`) 触发 Tailwind 的 dark 变体样式。

### 3.3 管理后台设计
-   **鉴权**：API 路由中校验 POST 请求体中的 password 是否匹配数据库 `settings.admin_password`。
-   **文件上传**：使用 HTML `<input type="file">` 和 `FormData` 提交到 `/api/upload`。后端接收文件后暂存并调用解析器，解析成功后写入数据库。

## 4. UI/UX 设计风格
-   **色调**：
    -   浅色模式：暖橙色（Warm Orange）为主色调，营造食欲和温馨感。背景使用米白色。
    -   深色模式：深灰色（Dark Gray）背景，搭配低饱和度的橙色/琥珀色文字，确保夜间查阅不刺眼。
-   **布局**：
    -   响应式 Grid 布局。
    -   移动端：单列流式卡片。
    -   桌面端：多列并排展示，日历侧边悬浮或顶部展开。
