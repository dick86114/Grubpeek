# GrubPeek 部署手册

本手册详细说明如何在生产环境中部署 GrubPeek 应用。

## 1. 环境要求
-   **操作系统**：Linux (Ubuntu/CentOS), macOS, 或 Windows Server
-   **Node.js**：v18.17.0 或更高版本
-   **包管理器**：npm (v9+) 或 pnpm / yarn

## 2. 获取代码
```bash
git clone https://github.com/dick86114/Grubpeek.git
cd Grubpeek/web
```

## 3. 安装依赖
```bash
npm install
# 或者
npm ci
```

## 4. 环境变量配置
本项目使用 PostgreSQL 数据库，可以通过环境变量进行配置。

主要环境变量：
- `DATABASE_URL`: 数据库连接字符串 (例如: `postgresql://user:password@host:port/dbname`)
- `ADMIN_PASSWORD`: 管理员后台登录密码 (默认: `admin888`)
- `MENU_DIR`: 菜单文件存储目录 (默认: `../menu` 或 `/app/data/menu`)

## 5. 构建与启动

### 5.1 开发模式（调试用）
```bash
npm run dev
# 访问 http://localhost:3000
```

### 5.2 生产模式部署（推荐）

**步骤 1：构建应用**
```bash
npm run build
```
*构建过程会生成 `.next` 目录，其中包含优化后的生产环境代码。*

**步骤 2：启动服务**
```bash
npm start
```
默认运行在 `3000` 端口。

**自定义端口启动：**
```bash
npm start -- -p 8080
```

## 6. 进程守护（PM2）
在生产服务器上，建议使用 PM2 来管理 Node.js 进程，确保应用崩溃自动重启。

**安装 PM2：**
```bash
npm install -g pm2
```

**启动应用：**
```bash
pm2 start npm --name "grubpeek" -- start
```

**查看状态：**
```bash
pm2 list
pm2 logs grubpeek
```

## 7. 数据持久化
本项目使用 PostgreSQL 数据库存储数据。
**重要提示：**
-   Docker 部署中，数据库数据默认存储在 `./data/postgres` 目录下。
-   **备份**：定期备份该目录或使用 `pg_dump` 导出数据。
-   `menu/` 目录用于临时存放上传的 Excel 文件，建议也定期备份。

## 8. Docker 部署 (推荐)

本项目支持 Docker 部署，提供了 `docker-compose.yml` 文件一键启动。

### 8.1 准备工作
1. 确保服务器已安装 Docker 和 Docker Compose。
2. 创建一个部署目录（例如 `grubpeek_deploy`），并将 `docker-compose.yml` 文件放入该目录。

### 8.2 启动服务
在部署目录下运行：
```bash
docker-compose up -d
```
服务启动后，默认运行在 **2618** 端口。您可以通过浏览器访问 `http://服务器IP:2618`。

如果需要修改端口，请编辑 `docker-compose.yml` 文件中的 `ports` 映射，例如将 `2618:2618` 改为 `8080:2618`。

### 8.3 数据持久化
Docker 部署默认将数据挂载在当前目录下的 `data` 文件夹中：
- `data/postgres/`: PostgreSQL 数据库数据
- `data/menu/`: 上传的 Excel 菜单文件

如需备份，直接备份 `data` 目录即可。

### 8.4 镜像更新
```bash
docker-compose pull
docker-compose up -d
```

### 8.5 环境变量说明

在 `docker-compose.yml` 中可以配置以下环境变量：

*   `DATABASE_URL`: PostgreSQL 数据库连接字符串。
    *   格式：`postgresql://user:password@host:port/dbname`
    *   默认使用内置数据库：`postgresql://grubpeek:grubpeek@db:5432/grubpeek`
*   `MENU_DIR`: 菜单文件存储路径，建议指向 `/app/data/menu`。
*   `ADMIN_PASSWORD`: **初始管理员密码**。仅在数据库首次初始化时生效，后续修改密码请在后台管理界面进行。默认值为 `admin888`。
*   `TZ`: 时区设置，建议设置为 `Asia/Shanghai`。

### 8.6 自动初始化

容器启动时会自动检查数据库连接：
1. 如果数据库表不存在，会自动创建并初始化。
2. 自动应用 `ADMIN_PASSWORD` 设置的初始密码。


