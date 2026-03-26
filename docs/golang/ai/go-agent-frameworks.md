---
order : 3
icon : carbon:ibm-cloud-pak-manta-automated-data-lineage
---

# 3. Go Agent 框架

## 为什么用 Go 构建 Agent

虽然 Python 在 AI 训练和原型开发中占主导地位，但 Go 在**生产级 Agent 系统**中展现出独特优势：

| 维度 | Python | Go |
|------|--------|-----|
| **并发模型** | asyncio / 多进程 | Goroutine，天然高并发 |
| **部署方式** | 依赖环境 + 依赖包 | 单一二进制文件，零依赖 |
| **内存占用** | 较高 | 低，GC 高效 |
| **启动速度** | 较慢 | 毫秒级冷启动 |
| **类型安全** | 动态类型 | 静态类型，编译期检查 |
| **云原生生态** | 一般 | Docker/K8s 原生语言 |

::: tip Go 更适合做 Agent 的「运行时引擎」—— 高并发地调度多个 Agent、管理工具调用、处理流式输出，而非训练模型本身。
:::

## 框架全景

```
Go Agent 框架生态（2026）

├── 综合型框架
│   ├── LangChainGo    — LangChain 的 Go 实现，社区活跃
│   ├── Eino           — 字节跳动出品，企业级
│   └── Genkit         — Google 出品，云原生集成
│
├── 轻量级框架
│   ├── Lingoose       — 管道式架构，模块化
│   └── CORTEX         — 极简，易于扩展
│
└── 专用工具
    ├── Ollama         — 本地模型运行
    └── LocalAI        — 本地 AI 推理服务
```

---

## LangChainGo

[GitHub](https://github.com/tmc/langchaingo) | 🌟 Stars 5k+ | Go 版 LangChain

LangChainGo 是 LangChain 的 Go 语言实现，提供了构建 LLM 应用的核心组件。

### 核心组件

```
LangChainGo 架构

┌─────────────────────────────────────────┐
│              应用层                      │
│   Chains │ Agents │ Callbacks            │
├─────────────────────────────────────────┤
│              能力层                      │
│   LLMs │ Embeddings │ VectorStores       │
│   Memory │ Tools │ DocumentLoaders       │
├─────────────────────────────────────────┤
│              集成层                      │
│   OpenAI │ Ollama │ Anthropic │ ...     │
│   Qdrant │ Pinecone │ pgvector │ ...    │
└─────────────────────────────────────────┘
```

### 基础使用

```go
package main

import (
    "context"
    "fmt"
    "github.com/tmc/langchaingo/llms"
    "github.com/tmc/langchaingo/llms/openai"
)

func main() {
    // 创建 LLM 客户端
    llm, err := openai.New(
        openai.WithModel("gpt-4"),
    )
    if err != nil {
        panic(err)
    }

    // 简单对话
    ctx := context.Background()
    response, err := llms.GenerateFromSinglePrompt(ctx, llm, 
        "用 Go 写一个 Hello World 程序")
    if err != nil {
        panic(err)
    }
    fmt.Println(response)
}
```

### 构建 RAG 应用

```go
package main

import (
    "context"
    "github.com/tmc/langchaingo/chains"
    "github.com/tmc/langchaingo/embeddings"
    "github.com/tmc/langchaingo/llms/openai"
    "github.com/tmc/langchaingo/schema"
    "github.com/tmc/langchaingo/vectorstores/qdrant"
)

func main() {
    ctx := context.Background()

    // 1. 初始化 Embedding 模型
    embedder, _ := embeddings.NewEmbedder(
        openai.New(openai.WithModel("text-embedding-3-small")),
    )

    // 2. 连接向量数据库
    store, _ := qdrant.New(
        qdrant.WithURL("http://localhost:6333"),
        qdrant.WithCollectionName("go-docs"),
        qdrant.WithEmbedder(embedder),
    )

    // 3. 索引文档
    docs := []schema.Document{
        {PageContent: "Go 的 goroutine 是轻量级线程..."},
        {PageContent: "channel 是 goroutine 之间通信的管道..."},
    }
    store.AddDocuments(ctx, docs)

    // 4. 构建检索问答链
    llm, _ := openai.New(openai.WithModel("gpt-4"))
    chain := chains.NewRetrievalQAFromLLM(llm, 
        vectorstores.ToRetriever(store, 5),
    )

    // 5. 提问
    answer, _ := chains.Run(ctx, chain, "Go 中如何实现并发？")
    fmt.Println(answer)
}
```

### 创建 Agent

```go
package main

import (
    "context"
    "github.com/tmc/langchaingo/agents"
    "github.com/tmc/langchaingo/llms/openai"
    "github.com/tmc/langchaingo/tools"
)

func main() {
    ctx := context.Background()
    llm, _ := openai.New(openai.WithModel("gpt-4"))

    // 注册工具
    agentTools := []tools.Tool{
        tools.Calculator{},          // 内置计算器工具
        NewWeatherTool(),            // 自定义天气工具
        NewSearchTool(),             // 自定义搜索工具
    }

    // 创建 Agent
    agent, _ := agents.Initialize(
        llm, 
        agentTools,
        agents.WithMaxIterations(5),   // 最大循环次数
    )

    // 运行
    result, _ := agents.Run(ctx, agent, 
        "北京今天的天气如何？气温换算成华氏度是多少？")
    fmt.Println(result)
}
```

---

## Eino（字节跳动）

[GitHub](https://github.com/cloudwego/eino) | 字节跳动开源 | 企业级 AI 框架

Eino 是字节跳动基于 CloudWeGo 生态推出的 Go AI 框架，专为企业级场景设计。

### 架构设计

```
Eino 五层架构

┌─────────────────────────────────────┐
│  组件层 (Component)                  │
│  ChatModel│Retriever│Tool│Embedding │
├─────────────────────────────────────┤
│  组合层 (Compose)                    │
│  Chain │ Graph │ Parallel            │
├─────────────────────────────────────┤
│  编排层 (Orchestration)              │
│  Agent │ MultiAgent│ StateGraph      │
├─────────────────────────────────────┤
│  运行时 (Runtime)                    │
│  Stream │ Callback │ Memory          │
├─────────────────────────────────────┤
│  评估层 (Evaluation)                 │
│  Benchmark │ Tracing │ Metrics       │
└─────────────────────────────────────┘
```

### 核心特点

- **统一模型接口**：支持 OpenAI、Claude、通义千问、豆包等多种模型
- **流式支持**：原生支持流式输入/输出，适合实时应用
- **Graph 编排**：通过有向图定义复杂 AI 工作流
- **状态管理**：内置中断与恢复、会话状态管理
- **可观测性**：Callback 机制贯穿全链路，支持追踪和调试

### 基础示例

```go
package main

import (
    "context"
    "github.com/cloudwego/eino/components/model"
    "github.com/cloudwego/eino-ext/components/model/openai"
)

func main() {
    ctx := context.Background()

    // 创建模型
    chatModel, _ := openai.NewChatModel(ctx, &openai.ChatModelConfig{
        Model:  "gpt-4",
        APIKey: "your-api-key",
    })

    // 对话
    messages := []*model.Message{
        model.SystemMessage("你是一个 Go 语言专家"),
        model.UserMessage("解释一下 Go 的接口"),
    }

    resp, _ := chatModel.Generate(ctx, messages)
    fmt.Println(resp.Content)
}
```

### Graph 编排

```go
// 使用 Graph 构建复杂工作流
graph := compose.NewGraph[string, string]()

// 添加节点
graph.AddNode("classifier", classifierNode)  // 意图分类
graph.AddNode("retriever", retrieverNode)    // 知识检索
graph.AddNode("generator", generatorNode)    // 回答生成

// 定义边（流转关系）
graph.AddEdge(compose.START, "classifier")
graph.AddConditionalEdge("classifier", func(ctx context.Context, input string) string {
    // 根据分类结果决定下一步
    if needRetrieval(input) {
        return "retriever"
    }
    return "generator"
})
graph.AddEdge("retriever", "generator")
graph.AddEdge("generator", compose.END)

// 编译并运行
app, _ := graph.Compile(ctx)
result, _ := app.Invoke(ctx, "Go 中 channel 的缓冲区大小怎么设置？")
```

---

## Genkit（Google）

[GitHub](https://github.com/firebase/genkit) | Google 出品 | 云原生 AI 框架

Genkit 是 Google 推出的开源 AI 框架，Go 1.0 已发布稳定版本。

### 核心特性

- **统一生成 API**：一套接口对接 Gemini、OpenAI、Ollama 等多种模型
- **AI Flows**：定义多步骤 AI 工作流，内置可观测性
- **结构化输出**：利用 Go 类型系统实现类型安全的结构化数据生成
- **开发者工具**：本地 CLI + Developer UI，支持调试和追踪
- **RAG 内置**：原生支持向量数据库索引和检索
- **部署灵活**：可部署为 HTTP 端点，兼容 Cloud Run / Firebase

### 基础使用

```go
package main

import (
    "context"
    "github.com/firebase/genkit/go/ai"
    "github.com/firebase/genkit/go/plugins/googlegenai"
)

func main() {
    ctx := context.Background()

    // 初始化 Gemini 模型
    g, _ := googlegenai.NewGoogleAI(ctx, nil)
    model := g.DefineModel("gemini-2.0-flash", nil)

    // 生成内容
    resp, _ := ai.Generate(ctx, model, ai.WithTextPrompt(
        "用 Go 实现一个简单的 HTTP 服务器",
    ))
    fmt.Println(resp.Text())
}
```

### 结构化输出

```go
// 利用 Go 结构体定义输出格式
type CodeReview struct {
    Score    int      `json:"score" jsonschema:"description=代码评分(1-10)"`
    Issues   []string `json:"issues" jsonschema:"description=发现的问题列表"`
    Suggest  string   `json:"suggest" jsonschema:"description=改进建议"`
}

// Genkit 自动将 LLM 文本响应转换为类型安全的结构体
resp, _ := ai.Generate(ctx, model,
    ai.WithTextPrompt("请审查以下 Go 代码..."),
    ai.WithOutputType[CodeReview](),
)

review := resp.Output().(CodeReview)
fmt.Printf("评分: %d/10\n", review.Score)
```

---

## Lingoose

[GitHub](https://github.com/henomis/lingoose) | 管道式架构 | 轻量模块化

Lingoose 采用 **管道（Pipeline）** 设计模式，通过链式组合完成复杂的 LLM 任务。

### 主要模块

| 模块 | 功能 |
|------|------|
| **LLM** | 对接 OpenAI、HuggingFace、Llama.cpp |
| **Prompt** | 模板引擎，支持变量注入 |
| **Pipeline** | 多步骤 LLM 任务编排 |
| **Embedder** | 文本向量化 |
| **Index** | 向量存储和检索 |
| **Loader** | 文档加载（PDF、文本、网页） |
| **Decoder** | 结构化输出（JSON、正则） |

### RAG 示例

```go
package main

import (
    "github.com/henomis/lingoose/index"
    "github.com/henomis/lingoose/llm/openai"
    "github.com/henomis/lingoose/rag"
)

func main() {
    // 创建 RAG 实例
    ragEngine := rag.New(
        index.New(
            openai.NewEmbedder(openai.AdaEmbeddingV2), 
            qdrantIndex,
        ),
    ).WithTopK(3)

    // 添加知识源
    ragEngine.AddSources(ctx, "Go 语言并发编程指南.pdf")

    // 检索增强问答
    answer, _ := ragEngine.Retrieve(ctx, 
        "Go 中 sync.Mutex 和 channel 该如何选择？",
        openai.New().WithModel(openai.GPT4),
    )
    fmt.Println(answer)
}
```

---

## 框架选型指南

### 对比总结

| 特性 | LangChainGo | Eino | Genkit | Lingoose |
|------|:-----------:|:----:|:------:|:--------:|
| **成熟度** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **社区活跃** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **模型支持** | 广泛 | 广泛 | Google 生态优先 | 有限 |
| **RAG 支持** | ✅ 完善 | ✅ 完善 | ✅ 内置 | ✅ 内置 |
| **Agent 能力** | ✅ 完善 | ✅ 强大 | ⚠️ 基础 | ⚠️ 基础 |
| **工作流编排** | Chain | Graph | Flow | Pipeline |
| **流式输出** | ✅ | ✅ | ✅ | ⚠️ |
| **开发者工具** | ⚠️ | ✅ Callback | ✅ Dev UI | ⚠️ |
| **企业背景** | 社区 | 字节跳动 | Google | 社区 |

### 选型建议

```
你的场景是什么？

├── 快速原型 / 熟悉 LangChain 生态
│   └── → LangChainGo
│
├── 企业级生产 / 复杂工作流
│   └── → Eino（字节跳动）
│
├── Google Cloud 生态 / 需要结构化输出
│   └── → Genkit
│
├── 轻量级 / 管道式任务 / 简单 RAG
│   └── → Lingoose
│
└── 极简自定义 / 学习目的
    └── → CORTEX 或自行封装
```

## 快速上手指南

不论选择哪个框架，入门 Go Agent 开发的步骤基本一致：

```bash
# 1. 创建项目
mkdir my-go-agent && cd my-go-agent
go mod init my-go-agent

# 2. 安装框架（以 LangChainGo 为例）
go get github.com/tmc/langchaingo

# 3. 准备 API Key
export OPENAI_API_KEY="sk-..."

# 4. 运行你的第一个 Agent
go run main.go
```

::: warning 注意事项
- 所有框架都在快速迭代中，API 可能有变化，请参考各框架的官方文档
- 生产环境务必做好 API Key 管理和错误处理
- 本地调试推荐使用 Ollama 运行开源模型，减少 API 调用成本
:::
