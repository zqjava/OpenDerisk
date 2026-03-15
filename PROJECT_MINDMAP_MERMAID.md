# OpenDerisk 项目架构图 (Mermaid版本)

## 1. 项目整体架构

```mermaid
graph TB
    subgraph 用户层
        UI[Web UI:7777]
        API[API 接口]
    end
    
    subgraph 应用层
        APP[derisk-app<br/>应用服务]
        SERVE[derisk-serve<br/>服务层]
        CLIENT[derisk-client<br/>客户端]
    end
    
    subgraph 核心层
        subgraph derisk 包
            CORE_V2[derisk/core<br/>V2核心]
        end
        
        subgraph derisk-core
            subgraph Agent模块
                RA[ReActMasterAgent]
                BA[AgentBase]
                PA[PlanAgent]
                EA[ExploreAgent]
            end
            
            subgraph 扩展模块
                RM[ReportAgent]
                KM[KanbanManager]
                DM[DoomLoopDetector]
                SC[SessionCompaction]
            end
        end
        
        subgraph derisk-ext
            RCA[OpenRCA Agent]
            TA[OpenTA Agent]
            VIS[Vis-Agent]
        end
    end
    
    subgraph 基础设施
        TOOLS[Tools Registry]
        AUTH[Authorization Engine]
        INTER[Interaction Gateway]
        RAG[RAG Vector Store]
        STORAGE[Storage]
    end
    
    UI --> APP
    API --> APP
    APP --> SERVE
    SERVE --> CORE_V2
    CORE_V2 --> BA
    BA --> RA
    RA --> RM
    RA --> RCA
    RCA --> TA
    RCA --> VIS
    RA --> TOOLS
    RA --> AUTH
    RA --> INTER
```

## 2. Agent TDA 循环

```mermaid
sequenceDiagram
    participant U as User
    participant A as Agent
    participant T as Tools
    participant G as Gateway
    participant Auth as Authorization

    U->>A: Input Message
    A->>A: Think (推理)
    A->>A: Decide (决策)
    
    alt Decision: Response
        A->>U: Direct Response
    end
    
    alt Decision: Tool Call
        A->>Auth: Check Authorization
        Auth->>Auth: Risk Assessment
        
        alt Authorized
            Auth->>T: Execute Tool
            T->>A: Tool Result
            A->>A: Next Iteration
        else Need Confirmation
            Auth->>G: Request User Confirmation
            G->>U: Authorization Request
            U->>G: User Response
            G->>A: Authorization Result
        end
    end
    
    alt Decision: Complete
        A->>U: Final Response
    end
```

## 3. 多智能体协作

```mermaid
flowchart TD
    subgraph Input
        ALERT[告警/问题输入]
    end
    
    subgraph SRE[ SRE-Agent 主Agent ]
        SRE_P[任务规划]
        SRE_C[协调调度]
        SRE_E[证据整合]
    end
    
    subgraph Agents[ 子Agent群 ]
        direction TB
        CA[Code-Agent<br/>代码分析]
        DA[Data-Agent<br/>数据分析]
        VA[Vis-Agent<br/>可视化]
    end
    
    subgraph Report[ ReportAgent ]
        RG[报告生成]
        RR[根因总结]
        RR_Advice[建议输出]
    end
    
    ALERT --> SRE
    SRE --> SRE_P
    SRE_P --> SRE_C
    SRE_C -->|委派| CA
    SRE_C -->|委派| DA
    SRE_C -->|委派| VA
    CA -->|返回结果| SRE_E
    DA -->|返回结果| SRE_E
    VA -->|返回结果| SRE_E
    SRE_E --> RG
    RG --> RR
    RR --> RR_Advice
    RR_Advice --> Output[诊断报告]
```

## 4. 授权系统架构

```mermaid
flowchart LR
    subgraph Request[授权请求]
        T[Tool Call]
        A[Arguments]
        M[Metadata]
    end
    
    subgraph Engine[AuthorizationEngine]
        subgraph Decision[决策引擎]
            CM[Config Mode<br/>strict/medium/none]
            RL[Risk Level<br/>LOW/MEDIUM/HIGH/CRITICAL]
        end
        
        subgraph Assess[风险评估]
            RA[RiskAssessor]
            LL[LLM Judgment]
        end
        
        subgraph Cache[缓存机制]
            AC[AuthorizationCache]
        end
    end
    
    subgraph Response[授权结果]
        GR[GRANTED]
        DN[DENIED]
        NC[NEED_CONFIRMATION]
        CG[CACHED]
    end
    
    Request --> Engine
    CM --> RA
    RL --> RA
    RA --> LL
    LL --> AC
    AC --> Response
```

## 5. 交互协议

```mermaid
classDiagram
    class InteractionRequest {
        +request_id: str
        +type: InteractionType
        +title: str
        +message: str
        +options: List[InteractionOption]
        +session_id: str
        +authorization_context: Dict
        +create_authorization_request()
        +create_text_input_request()
        +create_confirmation_request()
        +create_selection_request()
    }
    
    class InteractionResponse {
        +request_id: str
        +choice: str
        +choices: List[str]
        +input_value: str
        +status: InteractionStatus
        +grant_scope: str
        +is_confirmed: bool
    }
    
    class InteractionType {
        <<enumeration>>
        TEXT_INPUT
        CONFIRMATION
        AUTHORIZATION
        SINGLE_SELECT
        MULTI_SELECT
        FILE_UPLOAD
        NOTIFICATION
        PROGRESS
    }
    
    class InteractionGateway {
        +send(request: InteractionRequest)
        +receive(response: InteractionResponse)
        +broadcast(event)
    }
    
    InteractionRequest --> InteractionGateway
    InteractionResponse --> InteractionGateway
    InteractionGateway ..> InteractionType
```

## 6. ReActMasterAgent 核心组件

```mermaid
graph TB
    subgraph ReActMasterAgent
        TDA[TDA Loop<br/>Think/Decide/Act]
        PH[Phase Manager<br/>阶段管理]
        KL[Kanban Manager<br/>任务看板]
        WL[WorkLog Manager<br/>工作日志]
        RG[Report Generator<br/>报告生成]
    end
    
    subgraph Protection[保护机制]
        DL[Doom Loop Detector<br/>末日循环检测]
        SC[Session Compaction<br/>上下文压缩]
        TP[Truncation<br/>输出截断]
        HP[History Pruner<br/>历史修剪]
    end
    
    TDA --> PH
    PH --> KL
    KL --> WL
    WL --> RG
    TDA -.-> DL
    TDA -.-> SC
    TDA -.-> TP
    TDA -.-> HP
```

## 7. 模块依赖关系

```mermaid
graph LR
    subgraph High[高层]
        SRE[SRE-Agent]
        RCA[OpenRCA]
    end
    
    subgraph Core[核心]
        BA[AgentBase]
        RA[ReActMasterAgent]
        PA[PlanAgent]
    end
    
    subgraph Infra[基础设施]
        TOOL[Tools]
        AUTH[Authorization]
        INT[Interaction]
        MSG[Messages]
    end
    
    SRE --> BA
    RCA --> RA
    RA --> BA
    PA --> BA
    
    BA --> TOOL
    BA --> AUTH
    BA --> INT
    BA --> MSG
```

## 8. 数据流架构

```mermaid
flowchart LR
    subgraph Data[数据源]
        LOG[Logs<br/>日志]
        TRACE[Traces<br/>链路]
        MET[Metrics<br/>指标]
        FILE[Files<br/>文件]
    end
    
    subgraph Process[处理层]
        RAG[RAG<br/>知识检索]
        ANALY[Analysis<br/>分析引擎]
    end
    
    subgraph Agent[Agent层]
        COORD[SRE-Agent<br/>协调调度]
        SUBA[Sub-Agents<br/>子Agent]
    end
    
    subgraph Output[输出层]
        VIS[Visualization<br/>可视化]
        REPORT[Report<br/>报告]
        ACTION[Action<br/>动作]
    end
    
    LOG --> RAG
    TRACE --> RAG
    MET --> ANALY
    FILE --> ANALY
    
    RAG --> COORD
    ANALY --> COORD
    
    COORD --> SUBA
    SUAB --> VIS
    SUBA --> REPORT
    SUBA --> ACTION
```

---
*使用说明: 可以将这些 Mermaid 代码复制到支持 Mermaid 的编辑器中查看可视化图表，如:*
- *VS Code: 安装 Mermaid 插件*
- *在线: https://mermaid.live/*
- *GitHub README: 原生支持 Mermaid 语法*
