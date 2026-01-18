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
本项目默认使用 SQLite，且配置项较少，通常无需复杂的 `.env` 配置。
如果需要自定义端口，可以在启动时指定。

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
应用的数据存储在项目根目录下的 `grubpeek.db` SQLite 数据库文件中。
**重要提示：**
-   部署时请确保 `grubpeek.db` 文件所在目录具有**读写权限**。
-   **备份**：定期备份 `grubpeek.db` 文件即可完整备份所有菜单数据和系统设置。
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

### 8.3 数据持久化
Docker 部署默认将数据挂载在当前目录下的 `data` 文件夹中：
- `data/grubpeek.db`: 数据库文件
- `data/menu/`: 上传的 Excel 菜单文件

如需备份，直接备份 `data` 目录即可。

### 8.4 镜像更新
```bash
docker-compose pull
docker-compose up -d
```

