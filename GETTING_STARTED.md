# OpenDerisk 目录结构与本地启动指南

## 一、项目目录结构

```
OpenDerisk/                           # 项目根目录
│
├── 📁 derisk/                        # V2 核心架构 (新架构)
│   ├── core/                        # 核心模块
│   │   ├── agent/                   # 智能体基类和实现
│   │   │   ├── base.py              # AgentBase - Think/Decide/Act 循环
│   │   │   ├── info.py              # AgentInfo, AgentCapability
│   │   │   ├── production.py         # 生产环境智能体
│   │   │   └── builtin/             # 内置智能体
│   │   │       ├── plan.py          # PlanAgent (只读规划)
│   │   │       └── explore.py       # ExploreSubagent, CodeSubagent
│   │   │
│   │   ├── authorization/            # 授权系统
│   │   │   ├── engine.py            # 授权引擎核心
│   │   │   ├── model.py             # 授权模型定义
│   │   │   ├── risk_assessor.py     # 风险评估器
│   │   │   └── cache.py             # 授权缓存
│   │   │
│   │   ├── interaction/              # 交互协议
│   │   │   ├── protocol.py          # 交互请求/响应协议
│   │   │   └── gateway.py           # 交互网关
│   │   │
│   │   └── tools/                   # 工具系统
│   │       ├── base.py              # ToolRegistry, ToolResult
│   │       └── metadata.py          # 工具元数据, 风险级别
│   │
│   └── context/                     # 上下文管理
│       ├── config_loader.py          # 配置加载
│       ├── gray_release_controller.py  # 灰度发布控制
│       └── unified_context_middleware.py  # 统一上下文
│
├── 📁 packages/                     # 核心扩展包
│   ├── derisk-core/                 # 核心实现
│   │   └── src/derisk/
│   │       ├── agent/               # Agent 实现
│   │       │   ├── expand/          # 扩展 Agent
│   │       │   │   └── react_master_agent/  # ReActMasterAgent
│   │       │   │       ├── react_master_agent.py  # 主 Agent
│   │       │   │       ├── report_generator.py   # ReportAgent
│   │       │   │       ├── phase_manager.py      # 阶段管理
│   │       │   │       ├── doom_loop_detector.py # 末日循环检测
│   │       │   │       ├── session_compaction.py # 上下文压缩
│   │       │   │       ├── kanban_manager.py     # Kanban 任务管理
│   │       │   │       ├── truncation.py         # 输出截断
│   │       │   │       └── prune.py              # 历史修剪
│   │       │   │
│   │       │   ├── core_v2/         # V2 核心架构
│   │       │   ├── tools/           # 工具集
│   │       │   ├── memory/         # 记忆系统
│   │       │   └── visualization/  # 可视化
│   │       │
│   │       ├── channel/             # 通信通道 (飞书/钉钉)
│   │       ├── rag/                 # RAG 知识检索
│   │       ├── storage/            # 存储 (向量数据库)
│   │       └── vis/                # 可视化组件
│   │
│   ├── derisk-app/                  # 应用服务 (Web UI)
│   │   └── src/derisk_app/
│   │       ├── derisk_server.py    # 服务入口
│   │       └── static/web/         # 前端页面
│   │
│   ├── derisk-client/               # 客户端 SDK
│   ├── derisk-ext/                  # 扩展
│   │   └── src/derisk_ext/
│   │       ├── agent/agents/        # 业务 Agent
│   │       │   ├── open_rca/        # 根因分析 Agent
│   │       │   └── open_ta/         # 火焰图/Excel 分析
│   │       └── vis/                # 可视化扩展
│   │
│   └── derisk-serve/                # 服务层
│
├── 📁 configs/                      # 配置文件
│   ├── derisk-proxy-aliyun.toml    # 阿里云配置 (常用)
│   ├── derisk-proxy-openai.toml    # OpenAI 配置
│   ├── derisk-distributed.toml     # 分布式配置
│   └── agents/                     # Agent 配置
│
├── 📁 pilot/                        # 数据和元数据
│   ├── meta_data/                  # SQLite 数据库
│   └── datasets/                   # 测试数据集 (OpenRCA)
│
├── 📁 web/                         # Next.js 前端
│   ├── src/                        # 前端源码
│   └── package.json                # 前端依赖
│
├── 📁 docs/                        # 文档 (Docusaurus)
│
├── 📁 tests/                       # 测试用例
│   ├── e2e/                        # E2E 测试
│   └── channel/                    # 通道测试
│
├── 📁 scripts/                      # 工具脚本
│
├── 📁 examples/                     # 示例代码
│
└── pyproject.toml                  # 项目配置 (uv workspace)
```

## 二、依赖说明

### 核心依赖 (通过 pyproject.toml 管理)

**Python 版本**: >= 3.10

**核心包** (derisk-core):
- `aiohttp` - 异步 HTTP
- `pydantic>=2.6.0` - 数据验证
- `orjson` - 高性能 JSON
- `asyncmy` - 异步 MySQL
- `greenlet` - 协程
- 其他基础依赖

**可选依赖组** (通过 `--extra` 安装):
```bash
# 基础 (必选)
base = derisk[client,cli,agent,simple_framework,framework,code]

# 客户端
client = httpx, fastapi, tenacity

# CLI
cli = prettytable, click, psutil, colorama, tomlkit, rich

# Agent
agent = termcolor, pandas, numpy, mcp, circuitbreaker, diskcache

# 框架
framework = coloredlogs, seaborn, pymysql, openpyxl, aiofiles, GitPython, graphviz

# RAG
rag = (向量数据库相关)

# 存储
storage_chromadb = chromadb
storage_oss2 = oss2

# 代理
proxy_openai = openai, tiktoken, httpx[socks]
proxy_zhipuai = zhipuai
proxy_tongyi = openai
proxy_qianfan = qianfan
proxy_anthropic = anthropic

# 扩展
ext_base = (扩展基础依赖)
```

## 三、本地启动指南

### 方式一: 使用安装脚本 (推荐)

```bash
# 自动安装 (推荐)
curl -fsSL https://raw.githubusercontent.com/derisk-ai/OpenDerisk/main/install.sh | bash

# 安装完成后配置
vim ~/.openderisk/configs/derisk-proxy-aliyun.toml

# 启动服务
openderisk-server
```

### 方式二: 手动安装 (开发模式)

#### 1. 克隆项目
```bash
git clone https://github.com/derisk-ai/OpenDerisk.git
cd OpenDerisk
```

#### 2. 安装 uv (Python 包管理器)
```bash
# Linux/macOS
curl -LsSf https://astral.sh/uv/install.sh | sh

# 或使用 pip
pip install uv
```

#### 3. 安装依赖
```bash
# 安装所有依赖
uv sync --all-packages --frozen \
    --extra "base" \
    --extra "proxy_openai" \
    --extra "rag" \
    --extra "storage_chromadb" \
    --extra "derisks" \
    --extra "storage_oss2" \
    --extra "client" \
    --extra "ext_base"

# 或安装基础依赖 (如只需基本功能)
uv sync --all-packages --frozen --extra "base"
```

#### 4. 配置 API Key

```bash
# 复制配置文件
cp configs/derisk-proxy-aliyun.toml ~/.openderisk/derisk-proxy-aliyun.toml

# 编辑配置文件，设置 API Key
vim ~/.openderisk/derisk-proxy-aliyun.toml
```

配置文件关键配置:
```toml
[service.web]
host = "0.0.0.0"
port = 7777

[agent.llm]
temperature = 0.5

[[agent.llm.provider]]
provider = "openai"
api_base = "https://dashscope.aliyuncs.com/compatible-mode/v1"  # 阿里云
api_key = "${DASHSCOPE_API_KEY_2:-sk-xxx}"  # 设置你的 API Key

[[agent.llm.provider.model]]
name = "deepseek-r1"  # 或 qwen-plus, deepseek-v3 等
temperature = 0.7
max_new_tokens = 4096
```

#### 5. 启动服务

```bash
# 方式1: 使用 uv 运行
uv run python packages/derisk-app/src/derisk_app/derisk_server.py \
    --config configs/derisk-proxy-aliyun.toml

# 方式2: 使用 derisk CLI
uv run derisk start webserver --config configs/derisk-proxy-aliyun.toml

# 方式3: 前台运行
uv run derisk start webserver -c configs/derisk-proxy-aliyun.toml
```

#### 6. 访问 Web UI

```
浏览器打开: http://localhost:7777
```

### 方式三: Docker 启动 (推荐生产环境)

```bash
# 克隆项目
git clone https://github.com/derisk-ai/OpenDerisk.git
cd OpenDerisk/docs

# 构建镜像
docker build -t openderisk:latest .

# 运行容器
docker run -d \
    -p 7777:7777 \
    -v ~/.openderisk:/app/config \
    -e DASHSCOPE_API_KEY_2=your_api_key \
    openderisk:latest
```

## 四、验证安装

```bash
# 检查版本
uv run derisk --version

# 查看帮助
uv run derisk --help

# 测试配置
uv run python scripts/derisk_config.py
```

## 五、常见问题

### 1. 依赖安装失败
```bash
# 清理缓存重试
rm -rf .venv uv.lock
uv sync --all-packages --frozen --extra "base"
```

### 2. API Key 配置错误
确保配置文件中的 `api_key` 正确设置，可以使用环境变量:
```bash
export DASHSCOPE_API_KEY_2=sk-xxx
uv run derisk start webserver -c configs/derisk-proxy-aliyun.toml
```

### 3. 端口被占用
修改配置文件中的端口:
```toml
[service.web]
port = 7778  # 改为其他端口
```

### 4. 前端资源加载失败
需要先构建前端:
```bash
cd web
npm install
npm run build
# 或者开发模式
npm run dev
```

## 六、开发相关命令

```bash
# 运行测试
uv run pytest tests/

# 运行特定测试
uv run pytest tests/test_agent_full_workflow.py -v

# 代码检查
uv run ruff check .

# 代码格式化
uv run ruff format .

# 类型检查
uv run mypy derisk/
```

## 七、目录结构快速记忆

| 目录 | 用途 |
|------|------|
| `derisk/core` | V2 核心架构 (Agent/Auth/Interaction) |
| `packages/derisk-core` | 主要 Agent 实现 (ReActMasterAgent 等) |
| `packages/derisk-app` | Web 服务入口 |
| `packages/derisk-ext` | 业务扩展 (OpenRCA/OpenTA) |
| `configs/` | 配置文件 |
| `pilot/` | 数据和元数据存储 |
| `tests/` | 测试用例 |

---
*更新时间: 2026-03-15*
