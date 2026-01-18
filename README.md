# GrubPeek (今天有什么好吃的)

GrubPeek 是一个现代化的食堂菜单展示系统，旨在为用户提供清晰、便捷的每日菜单查询体验。项目采用 Next.js 16 + React 19 构建，支持响应式设计，适配桌面端和移动端。

## 📖 效果图导航

效果图请参阅 `imgs` 目录：

首页
![alt text](imgs/index.png)
暗黑模式
![alt text](imgs/index2.png)
模式切换
![alt text](imgs/change.png)
后台管理
![alt text](imgs/system.png)

## 📖 文档导航

详细的项目文档请参阅 `docs` 目录：

*   [需求文档 (Requirements)](docs/REQUIREMENTS.md)
*   [设计文档 (Design)](docs/DESIGN.md)
*   [使用手册 (User Manual)](docs/USER_MANUAL.md)
*   [部署手册 (Deployment)](docs/DEPLOYMENT.md)

## ✨ 主要功能

*   **每日菜单展示**：直观展示早餐、午餐、晚餐及外卖包点。
*   **智能日期识别**：自动展示当天菜单，支持查看其他日期。
*   **后台管理系统**：
    *   支持 Excel 菜单文件上传/下载/删除。
    *   支持在线编辑菜单内容。
    *   自动同步 Excel 数据到数据库。
*   **响应式设计**：完美适配手机、平板和桌面设备。
*   **动态图标**：基于 SVG 的动态 Favicon。

## 🛠️ 技术栈

*   **前端框架**: Next.js 16 (App Router)
*   **UI 库**: React 19, Tailwind CSS v4
*   **数据库**: SQLite (better-sqlite3)
*   **工具库**: 
    *   `xlsx` (Excel 处理)
    *   `date-fns` (日期处理)
    *   `lucide-react` (图标)

## 🚀 快速开始

### 环境要求

*   Node.js >= 20
*   npm / pnpm / yarn

### 安装依赖

```bash
cd web
npm install
```

### 开发环境运行

```bash
npm run dev
```
访问 `http://localhost:3000` 查看效果。

### 生产环境部署

#### Docker 部署 (推荐)

只需一个命令即可启动：

```bash
docker-compose up -d
```

默认运行在 `2618` 端口。详细说明请参考 [部署手册](docs/DEPLOYMENT.md)。

#### 常规部署

请参考 [部署手册](docs/DEPLOYMENT.md)。

## 📂 目录结构

```
grubpeek/
├── docs/           # 项目文档
├── scripts/        # 辅助脚本
├── web/            # Next.js 应用程序
│   ├── app/        # 页面逻辑
│   ├── components/ # UI 组件
│   ├── lib/        # 工具函数
│   ├── types/      # 类型定义
│   └── ...
└── ...
```

## 📝 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新历史。

## 📄 许可证

MIT License
