---
order : 1
icon : carbon:machine-learning-model
---

# 1. Agent 核心概念

## 什么是 AI Agent

AI Agent（智能体）是一种能够**感知环境、自主决策、执行行动**的软件系统。与传统的聊天机器人不同，Agent 拥有目标导向的行为能力，能够分解复杂任务、调用外部工具、并根据执行反馈动态调整策略。

```
用户指令 → [感知] → [推理/规划] → [行动] → [观察结果] → [循环/完成]
```

### Agent 的核心要素

| 要素 | 说明 | 示例 |
|------|------|------|
| **LLM（大脑）** | 负责理解、推理和决策的大语言模型 | GPT-4、Claude、Gemini、Qwen |
| **Prompt（指令）** | 定义 Agent 角色、行为规则和输出格式 | System Prompt、Few-shot 示例 |
| **Memory（记忆）** | 短期/长期记忆，维持上下文连续性 | 对话历史、向量存储 |
| **Tools（工具）** | Agent 可调用的外部能力 | API 调用、数据库查询、代码执行 |
| **Planning（规划）** | 任务分解与执行计划制定 | ReAct、Chain-of-Thought |

## Agent 的运行模式

### ReAct 模式

ReAct（Reasoning + Acting）是目前最主流的 Agent 运行范式，交替执行 **思考** 和 **行动**：

```
循环开始:
  1. Thought（思考）: 分析当前状态，决定下一步
  2. Action（行动）: 调用工具或执行操作
  3. Observation（观察）: 获取行动结果
  4. 判断：是否完成目标？
     - 是 → 返回最终结果
     - 否 → 回到步骤 1
```

**示例流程**：用户问「北京今天天气如何？适合穿什么？」

```
Thought: 用户想知道北京天气和穿衣建议，我需要先查询天气
Action: 调用天气 API，参数 {"city": "北京"}
Observation: 晴天，气温 12-22°C，微风

Thought: 已获取天气数据，现在可以给出穿衣建议
Action: 生成最终回答
Output: 北京今天晴天，12-22°C。建议早晚穿薄外套，中午可穿长袖...
```

### 多 Agent 协作

复杂任务可以由多个专业 Agent 协作完成：

```
┌──────────────┐
│  协调者 Agent  │ ← 负责任务分配和结果汇总
└──────┬───────┘
       │
  ┌────┼────┐
  ▼    ▼    ▼
┌───┐┌───┐┌───┐
│搜索││分析││编码│ ← 各自擅长不同领域
│Agent││Agent││Agent│
└───┘└───┘└───┘
```

## Function Calling（函数调用）

Function Calling 是 Agent 调用外部工具的核心机制。开发者通过 JSON Schema 描述工具的功能和参数，LLM 在推理时决定是否调用以及如何调用。

### 工作流程

```
1. 定义工具：声明函数名称、描述、参数Schema
2. 模型推理：LLM 根据对话上下文决定调用哪个工具
3. 执行调用：应用层解析 LLM 返回的调用指令，执行函数
4. 返回结果：将函数执行结果送回 LLM 继续推理
```

### Go 语言示例

```go
// 定义工具
type WeatherTool struct {
    Name        string `json:"name"`
    Description string `json:"description"`
}

// 工具注册
tools := []Tool{
    {
        Name:        "get_weather",
        Description: "获取指定城市的天气信息",
        Parameters: map[string]interface{}{
            "type": "object",
            "properties": map[string]interface{}{
                "city": map[string]string{
                    "type":        "string",
                    "description": "城市名称",
                },
            },
            "required": []string{"city"},
        },
    },
}

// 当 LLM 返回 tool_call 时，执行对应函数
func handleToolCall(call ToolCall) string {
    switch call.Name {
    case "get_weather":
        return queryWeatherAPI(call.Args["city"])
    default:
        return "未知工具"
    }
}
```

## Embedding 与向量化

Embedding（嵌入）是将文本转换为高维向量的技术，让计算机能够理解文本的**语义相似度**。

### 核心原理

```
"Go 是一门编程语言"  → [0.12, -0.34, 0.56, ..., 0.78]  (1536维向量)
"Golang 用于开发"    → [0.11, -0.33, 0.55, ..., 0.77]  (语义相近，向量接近)
"今天天气很好"       → [0.89, 0.12, -0.45, ..., 0.23]  (语义不同，向量差异大)
```

### 相似度计算

常用 **余弦相似度** 衡量两个向量的接近程度：

```
相似度 = cos(θ) = (A · B) / (|A| × |B|)

值域：[-1, 1]
  1  → 完全相同
  0  → 完全无关
 -1  → 完全相反
```

### 主流 Embedding 模型

| 模型 | 维度 | 提供方 | 特点 |
|------|------|--------|------|
| text-embedding-3-small | 1536 | OpenAI | 性价比高 |
| text-embedding-3-large | 3072 | OpenAI | 精度更高 |
| mxbai-embed-large | 1024 | Mixedbread | 开源可本地部署 |
| bge-m3 | 1024 | BAAI | 中文效果优秀 |

## 向量数据库

向量数据库专为存储和检索高维向量而设计，是 RAG 系统的核心组件。

### 主流向量数据库对比

| 数据库 | 类型 | Go SDK | 特点 |
|--------|------|--------|------|
| **Qdrant** | 专用向量数据库 | ✅ | 高性能，支持过滤 |
| **Milvus** | 专用向量数据库 | ✅ | 分布式，大规模场景 |
| **Weaviate** | 专用向量数据库 | ✅ | 内置模块化，多模态 |
| **pgvector** | PostgreSQL 扩展 | ✅ | 利用现有 PG 基础设施 |
| **Chroma** | 轻量级嵌入数据库 | ✅ | 简单易用，适合原型 |

### 核心操作

```go
// 向量数据库的基本操作流程
// 1. 文本 → Embedding → 存入向量数据库
// 2. 查询 → Embedding → 相似度搜索 → 返回 Top-K 结果

// 存储
vectorDB.Insert(ctx, Document{
    ID:       "doc-001",
    Content:  "Go 语言并发编程指南",
    Vector:   embedding,   // [0.12, -0.34, ...]
    Metadata: map[string]string{"category": "golang"},
})

// 检索
results := vectorDB.Search(ctx, SearchRequest{
    Vector: queryEmbedding,
    TopK:   5,
    Filter: map[string]string{"category": "golang"},
})
```

## 小结

| 概念 | 一句话理解 |
|------|-----------|
| Agent | 能自主推理、调用工具完成任务的 AI 系统 |
| ReAct | 思考→行动→观察的循环推理模式 |
| Function Calling | LLM 调用外部函数/API 的桥梁 |
| Embedding | 将文本转为向量以计算语义相似度 |
| 向量数据库 | 存储和检索向量的专用数据库 |

::: tip 掌握这些核心概念后，接下来可以深入学习 RAG 技术和 Go 语言的 Agent 框架。
:::
