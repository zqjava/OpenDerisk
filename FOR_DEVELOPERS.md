# OpenDerisk 新人开发指南

## 你好！欢迎加入 OpenDerisk 🚀

你好！我是这个项目的设计和开发者之一。为了让你快速上手这个项目，我为你准备了这份指南。

---

## 一句话介绍 OpenDerisk

**OpenDerisk 是一个 AI-Native 风险智能系统**，简单说就是：
> 用 AI 来帮你自动分析系统故障、定位根因、生成诊断报告。

就像给每个系统配备了一个 **7×24 小时不眠不休的 SRE（站点可靠性工程师）**。

---

## 核心应用场景

| 场景 | 说明 | 示例 |
|------|------|------|
| **AI-SRE** | 智能根因分析 | "为什么服务响应变慢了？" |
| **Flame Graph** | 性能分析 | 上传火焰图，定位性能瓶颈 |
| **DataExpert** | 数据分析 | 对话式分析 Excel/日志/指标 |

---

## 二、为什么选择这个项目？

### 1. 技术栈现代
- **Python 3.10+**，使用 `uv` 作为包管理器
- **AsyncIO** 异步编程
- **Pydantic V2** 类型验证
- **ReAct 范式** Agent 实现

### 2. 架构设计优秀
- **多 Agent 协作**：主 Agent 调度子 Agent，各司其职
- **模块化设计**：核心/扩展分离，易于二次开发
- **授权系统**：安全的工具执行控制
- **可视化**：证据链、诊断过程全程可查看

### 3. 真实业务价值
- 基于微软 **OpenRCA** 数据集，已在真实场景验证
- 支持多种数据源：日志、链路追踪、指标、火焰图

---

## 三、核心概念（必须理解）

### 1. Agent（智能体）

Agent 是这个系统的核心执行单元。我设计了 **Think → Decide → Act** 循环：

```
用户输入 → Think(推理) → Decide(决策) → Act(执行) → 返回结果
```

每个 Agent 有以下特性：
- **状态**：IDLE / RUNNING / WAITING / COMPLETED / FAILED
- **能力**：CODE_ANALYSIS / PLANNING / REASONING 等
- **工具**：可以调用各种工具完成任务

```python
# 伪代码：Agent 执行流程
async for chunk in agent.run("分析这个日志"):
    print(chunk)  # 流式输出
```

### 2. 多 Agent 协作

这是项目的精髓所在：

```
                    ┌─────────────┐
                    │  用户问题   │
                    └──────┬──────┘
                           │
                           ▼
              ┌────────────────────────┐
              │    SRE-Agent (主)    │  ← 任务规划和调度
              └──────────┬───────────┘
                         │
     ┌───────────────────┼───────────────────┐
     │                   │                   │
     ▼                   ▼                   ▼
┌─────────┐       ┌─────────┐       ┌─────────┐
│ Code    │       │ Data    │       │ Vis     │
│ Agent   │       │ Agent   │       │ Agent   │
│ (代码)  │       │ (数据)  │       │ (可视化)│
└────┬────┘       └────┬────┘       └────┬────┘
     │                 │                 │
     └─────────────────┼─────────────────┘
                       │
                       ▼
              ┌────────────────────────┐
              │   ReportAgent (报告)   │  ← 生成诊断报告
              └────────────────────────┘
```

### 3. 工具系统（Tools）

Agent 通过工具来操作世界：

| 工具 | 功能 | 示例 |
|------|------|------|
| read_file | 读取文件 | 读取日志 |
| grep_search | 搜索内容 | 查找错误关键字 |
| bash_execute | 执行命令 | 运行分析脚本 |
| mysql_query | 查询数据库 | 获取指标数据 |

工具通过 **ToolRegistry** 注册和管理。

### 4. 授权系统（Authorization）

这是系统的安全屏障。每次 Agent 调用工具时：

```
1. 检查工具是否允许调用
2. 评估风险级别 (LOW/MEDIUM/HIGH/CRITICAL)
3. 必要时请求用户确认
4. 缓存授权结果
```

### 5. 交互协议（Interaction）

Agent 与用户对话的方式：

- **TEXT_INPUT**: 文本输入
- **CONFIRMATION**: 确认/拒绝
- **AUTHORIZATION**: 授权请求
- **SELECTION**: 选项选择
- **NOTIFICATION**: 通知推送

---

## 四、快速上手：我的第一个 Agent

### 1. 最简单的 Agent 示例

```python
from derisk.core.agent.base import AgentBase, AgentInfo, AgentState

# 1. 定义你的 Agent
class MyFirstAgent(AgentBase):
    async def think(self, message: str, **kwargs):
        yield f"我正在思考: {message}\n"
    
    async def decide(self, message: str, **kwargs):
        # 简单的决策：直接返回响应
        return {"type": "response", "content": f"我收到了: {message}"}
    
    async def act(self, action: dict, **kwargs):
        return action.get("content")

# 2. 创建 Agent 实例
agent_info = AgentInfo(
    name="hello_agent",
    description="我的第一个 Agent",
    max_steps=10,
    timeout=60,
)

agent = MyFirstAgent(info=agent_info)

# 3. 运行 Agent
async def main():
    async for chunk in agent.run("你好！"):
        print(chunk, end="")

# 运行
asyncio.run(main())
```

### 2. 调用工具的 Agent

```python
from derisk.core.agent.base import AgentBase, AgentInfo
from derisk.core.tools.base import tool_registry

class ToolAgent(AgentBase):
    async def think(self, message: str, **kwargs):
        yield f"我需要查找: {message}\n"
    
    async def decide(self, message: str, **kwargs):
        # 决定调用工具
        return {
            "type": "tool_call",
            "tool": "grep_search",
            "arguments": {"pattern": message}
        }
    
    async def act(self, action: dict, **kwargs):
        if action.get("type") == "tool_call":
            tool_name = action.get("tool")
            args = action.get("arguments", {})
            result = await self.execute_tool(tool_name, args)
            return result
        return None
```

---

## 五、开发实用技巧

### 1. 项目结构快速记忆

```
packages/derisk-core/src/derisk/
├── agent/           # Agent 核心实现 ← 重点看这里
│   ├── expand/       # 扩展 Agent
│   │   └── react_master_agent/  # ReActMasterAgent
│   └── core/        # 核心组件
├── tools/           # 工具定义
├── rag/             # RAG 知识检索
└── storage/         # 存储层
```

### 2. 常用开发命令

```bash
# 安装依赖（必须）
uv sync --all-packages --frozen --extra "base"

# 启动服务
uv run python packages/derisk-app/src/derisk_app/derisk_server.py \
    --config configs/derisk-proxy-aliyun.toml

# 运行测试
uv run pytest tests/test_agent_full_workflow.py -v

# 代码检查
uv run ruff check .

# 格式化
uv run ruff format .
```

### 3. 配置文件的秘密

最重要的配置：`configs/derisk-proxy-aliyun.toml`

```toml
# 1. 端口配置
[service.web]
port = 7777

# 2. LLM 配置（最关键！）
[[agent.llm.provider]]
provider = "openai"  # 或 zhipuai, qianfan, anthropic
api_base = "https://dashscope.aliyuncs.com/compatible-mode/v1"
api_key = "${DASHSCOPE_API_KEY_2:-sk-xxx}"  # 设置你的 API Key

# 3. 模型选择
[[agent.llm.provider.model]]
name = "deepseek-r1"  # 可以改成 qwen-plus, deepseek-v3 等
```

### 4. 如何添加新工具？

```python
# 1. 在 tools/ 目录下创建新工具
# packages/derisk-core/src/derisk/agent/tools/my_tool.py

from derisk.agent.resource import BaseTool

class MyCustomTool(BaseTool):
    name = "my_custom_tool"
    description = "这是一个自定义工具"
    
    async def execute(self, **kwargs):
        # 你的逻辑
        return {"result": "执行成功"}
    
    def get_schema(self):
        # 返回工具的 JSON Schema
        return {...}
```

### 5. 如何添加新 Agent？

```python
# 1. 继承 AgentBase
from derisk.core.agent.base import AgentBase, AgentInfo

class MyNewAgent(AgentBase):
    async def think(self, message: str, **kwargs):
        # 推理阶段
        yield "思考中...\n"
    
    async def decide(self, message: str, **kwargs):
        # 决策阶段 - 返回动作
        return {"type": "response", "content": "处理完成"}
    
    async def act(self, action: dict, **kwargs):
        # 执行阶段
        return action.get("content")
```

---

## 六、进阶特性（熟悉后看）

### 1. ReActMasterAgent 高级功能

这是我设计的增强版 Agent，包含很多实用特性：

```python
agent = ReActMasterAgent(
    enable_doom_loop_detection=True,  # 末日循环检测
    doom_loop_threshold=3,
    enable_session_compaction=True,   # 上下文压缩
    context_window=128000,
    enable_output_truncation=True,     # 输出截断
    enable_history_pruning=True,        # 历史修剪
    enable_kanban=True,                # Kanban 任务管理
)
```

### 2. Kanban 任务管理

支持结构化任务规划：

```python
# 创建看板
await agent.create_kanban(
    mission="分析系统故障",
    stages=["探索", "分析", "验证", "报告"]
)

# 提交交付物
await agent.submit_deliverable(
    stage_id="explore_1",
    deliverable={"发现": "数据库连接池耗尽"},
    reflection="需要进一步验证"
)

# 查看状态
status = await agent.get_kanban_status()
```

### 3. 报告生成

自动生成诊断报告：

```python
from derisk.agent.expand.react_master_agent import ReportGenerator

report_gen = ReportAgent()
report = await report_gen.generate(
    report_type=ReportType.FINAL,
    format=ReportFormat.MARKDOWN,
    data={...}  # 诊断数据
)
```

---

## 七、代码阅读路线（推荐）

### 第一阶段：理解核心（1-2天）

1. **derisk/core/agent/base.py**
   - 理解 AgentBase 的 TDA 循环
   - 理解状态管理

2. **derisk/core/authorization/engine.py**
   - 理解授权流程
   - 理解风险评估

3. **derisk/core/interaction/protocol.py**
   - 理解交互协议

### 第二阶段：深入实现（3-5天）

4. **packages/derisk-core/src/derisk/agent/expand/react_master_agent/**
   - ReActMasterAgent 实现
   - 各种保护机制

5. **packages/derisk-core/src/derisk/agent/core/**
   - 工具系统
   - 消息系统

### 第三阶段：扩展开发（1周+）

6. **packages/derisk-ext/src/derisk_ext/agent/agents/**
   - 业务 Agent 实现参考
   - OpenRCA / OpenTA

---

## 八、常见问题

### Q1: 运行时缺少依赖？
```bash
uv sync --all-packages --frozen --extra "base"
```

### Q2: API Key 怎么配置？
```bash
# 方式1: 环境变量
export DASHSCOPE_API_KEY_2=sk-xxx

# 方式2: 配置文件
vim configs/derisk-proxy-aliyun.toml
```

### Q3: 端口被占用？
```toml
[service.web]
port = 7778  # 改个端口
```

### Q4: 不会调试？
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

---

## 九、下一步？

1. **先跑起来**：按照 GETTING_STARTED.md 启动服务
2. **看代码**：从 AgentBase 开始阅读
3. **改代码**：尝试添加一个小功能
4. **写测试**：参考 tests/ 目录

---

## 十联系我

- GitHub: https://github.com/derisk-ai/OpenDerisk
- 文档: https://docs.derisk.ai
- Discord: 加入社区讨论

---

**祝开发愉快！** 🎉

如果有任何问题，随时问我！

---
*编写于 2026-03-15*
*By OpenDerisk Team*
