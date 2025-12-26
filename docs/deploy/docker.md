# Docker 部署

使用 Docker 可以方便地在任何支持容器的环境中部署 StarHub。

## 优势

- ✅ **环境一致**：避免依赖问题
- ✅ **易于迁移**：一次构建，到处运行
- ✅ **便于扩展**：结合 K8s 等容器编排

## Dockerfile

在项目根目录创建 `Dockerfile`：

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

## Nginx 配置

创建 `nginx.conf`：

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # SPA 路由支持
        location / {
            try_files $uri $uri/ /index.html;
        }

        # 静态资源缓存
        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API 代理
        location /api/ {
            proxy_pass http://backend:7001/api/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

## Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    environment:
      - CLIENT_ID=${CLIENT_ID}
      - CLIENT_SECRET=${CLIENT_SECRET}
    ports:
      - "7001:7001"
    restart: unless-stopped
```

## 后端 Dockerfile

创建 `server/Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 7001

CMD ["node", "dev-server.js"]
```

---

## 部署命令

### 构建镜像

```bash
docker-compose build
```

### 启动服务

```bash
# 前台运行
docker-compose up

# 后台运行
docker-compose up -d
```

### 查看日志

```bash
docker-compose logs -f
```

### 停止服务

```bash
docker-compose down
```

---

## 环境变量

创建 `.env` 文件：

```env
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
```

---

## 常见问题

### 容器无法启动？

1. 检查端口是否被占用
2. 查看容器日志 `docker logs <container_id>`
3. 确认 Dockerfile 语法正确

### API 请求失败？

1. 检查后端容器是否正常运行
2. 确认网络配置正确
3. 检查环境变量是否传递

### 构建缓慢？

使用多阶段构建和 `.dockerignore` 优化：

```
node_modules
.git
dist
```

