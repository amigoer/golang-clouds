---
order : 2
icon : vscode-icons:file-type-config
---

# 2. 开发环境搭建

## 前置准备

在开始 Agent 开发之前，确保你已具备以下基础：

- Go 1.21+（推荐 1.22+）
- 基本的 Go 语法知识
- 一个趁手的编辑器（VS Code / GoLand）

## 项目初始化

```bash
# 创建项目
mkdir go-agent-lab && cd go-agent-lab
go mod init go-agent-lab

# 目录结构
mkdir -p cmd internal/agent internal/tools internal/memory
```

推荐的项目结构：

```
go-agent-lab/
├── cmd/
│   └── main.go              # 入口
├── internal/
│   ├── agent/                # Agent 核心逻辑
│   │   ├── agent.go
│   │   └── react.go
│   ├── tools/                # 工具集
│   │   ├── weather.go
│   │   └── search.go
│   └── memory/               # 记忆管理
│       ├── buffer.go
│       └── vector.go
├── configs/
│   └── config.yaml           # 配置文件
├── go.mod
└── go.sum
```

## 本地模型部署（Ollama）

[Ollama](https://ollama.ai) 让你在本地免费运行开源大模型，无需 API Key，是开发调试的最佳选择。

### 安装 Ollama

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# 启动服务
ollama serve
```

### 下载模型

```bash
# 推荐模型（按大小排列）
ollama pull qwen2.5:7b          # 通义千问 7B，中文能力强
ollama pull llama3.2:8b         # Meta Llama 3.2 8B
ollama pull mistral:7b          # Mistral 7B，性能均衡
ollama pull deepseek-r1:8b      # DeepSeek R1 8B，推理能力强

# 支持 Function Calling 的模型（Agent 必备）
ollama pull qwen2.5:7b          # ✅ 支持 Tool Calling
ollama pull llama3.2:8b         # ✅ 支持 Tool Calling
ollama pull mistral:7b          # ✅ 支持 Tool Calling

# Embedding 模型（RAG 必备）
ollama pull mxbai-embed-large   # 1024维，英文优秀
ollama pull bge-m3              # 1024维，中文优秀

# 测试模型
ollama run qwen2.5:7b "你好，请用Go写一个Hello World"
```

### Ollama API

Ollama 提供了 REST API，默认运行在 `http://localhost:11434`：

```bash
# 对话接口
curl http://localhost:11434/api/chat -d '{
  "model": "qwen2.5:7b",
  "messages": [{"role": "user", "content": "你好"}],
  "stream": false
}'

# Embedding 接口
curl http://localhost:11434/api/embeddings -d '{
  "model": "mxbai-embed-large",
  "prompt": "Go 语言并发编程"
}'
```

## 云端 API 配置

### OpenAI

```bash
# 注册获取 API Key: https://platform.openai.com/api-keys
export OPENAI_API_KEY="sk-..."

# 可选：使用代理
export OPENAI_BASE_URL="https://your-proxy.com/v1"
```

### Google Gemini

```bash
# 获取 API Key: https://aistudio.google.com/apikey
export GOOGLE_API_KEY="AIza..."
```

### 通义千问

```bash
# 获取 API Key: https://dashscope.console.aliyun.com/apiKey
export DASHSCOPE_API_KEY="sk-..."
```

## 第一个 LLM 调用

### 方式一：原生 HTTP 调用

不依赖任何框架，直接调用 Ollama API：

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

// 请求结构
type ChatRequest struct {
    Model    string    `json:"model"`
    Messages []Message `json:"messages"`
    Stream   bool      `json:"stream"`
}

type Message struct {
    Role    string `json:"role"`
    Content string `json:"content"`
}

// 响应结构
type ChatResponse struct {
    Message Message `json:"message"`
}

func main() {
    req := ChatRequest{
        Model: "qwen2.5:7b",
        Messages: []Message{
            {Role: "system", Content: "你是一个 Go 语言专家"},
            {Role: "user", Content: "用一句话解释 goroutine"},
        },
        Stream: false,
    }

    body, _ := json.Marshal(req)
    resp, err := http.Post(
        "http://localhost:11434/api/chat",
        "application/json",
        bytes.NewReader(body),
    )
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    data, _ := io.ReadAll(resp.Body)
    var chatResp ChatResponse
    json.Unmarshal(data, &chatResp)

    fmt.Println(chatResp.Message.Content)
}
```

### 方式二：使用 LangChainGo

```bash
go get github.com/tmc/langchaingo
```

```go
package main

import (
    "context"
    "fmt"
    "github.com/tmc/langchaingo/llms"
    "github.com/tmc/langchaingo/llms/ollama"
)

func main() {
    // 连接本地 Ollama
    llm, err := ollama.New(ollama.WithModel("qwen2.5:7b"))
    if err != nil {
        panic(err)
    }

    ctx := context.Background()
    
    // 简单调用
    response, err := llms.GenerateFromSinglePrompt(ctx, llm,
        "用 Go 实现一个并发安全的计数器",
        llms.WithTemperature(0.7),  // 创造性控制
        llms.WithMaxTokens(500),     // 最大输出长度
    )
    if err != nil {
        panic(err)
    }

    fmt.Println(response)
}
```

### 方式三：使用 OpenAI API

```go
package main

import (
    "context"
    "fmt"
    "github.com/tmc/langchaingo/llms"
    "github.com/tmc/langchaingo/llms/openai"
)

func main() {
    // 连接 OpenAI（自动读取 OPENAI_API_KEY 环境变量）
    llm, err := openai.New(openai.WithModel("gpt-4o"))
    if err != nil {
        panic(err)
    }

    ctx := context.Background()
    response, err := llms.GenerateFromSinglePrompt(ctx, llm,
        "解释 Go 语言的 interface 设计哲学")
    if err != nil {
        panic(err)
    }

    fmt.Println(response)
}
```

## 流式输出

在实际应用中，流式输出能大幅提升用户体验，让回答「逐字打出」而非等待全部生成完毕。

### 原生 HTTP 流式

```go
package main

import (
    "bufio"
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

type StreamResponse struct {
    Message struct {
        Content string `json:"content"`
    } `json:"message"`
    Done bool `json:"done"`
}

func main() {
    req := ChatRequest{
        Model: "qwen2.5:7b",
        Messages: []Message{
            {Role: "user", Content: "详细解释 Go 的 GC 机制"},
        },
        Stream: true, // 开启流式
    }

    body, _ := json.Marshal(req)
    resp, _ := http.Post(
        "http://localhost:11434/api/chat",
        "application/json",
        bytes.NewReader(body),
    )
    defer resp.Body.Close()

    // 逐行读取流式响应
    scanner := bufio.NewScanner(resp.Body)
    for scanner.Scan() {
        var chunk StreamResponse
        json.Unmarshal(scanner.Bytes(), &chunk)
        if chunk.Done {
            fmt.Println("\n[完成]")
            break
        }
        fmt.Print(chunk.Message.Content) // 逐字打印
    }
}
```

### LangChainGo 流式

```go
package main

import (
    "context"
    "fmt"
    "github.com/tmc/langchaingo/llms"
    "github.com/tmc/langchaingo/llms/ollama"
)

func main() {
    llm, _ := ollama.New(ollama.WithModel("qwen2.5:7b"))
    ctx := context.Background()

    // 流式调用，通过回调逐块接收
    _, err := llms.GenerateFromSinglePrompt(ctx, llm,
        "用 Go 写一个 HTTP 中间件框架",
        llms.WithStreamingFunc(func(ctx context.Context, chunk []byte) error {
            fmt.Print(string(chunk)) // 实时输出每个 chunk
            return nil
        }),
    )
    if err != nil {
        panic(err)
    }
    fmt.Println()
}
```

## 关键参数说明

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| `temperature` | 输出随机性，越高越有创造力 | 任务型 0.1-0.3，创作型 0.7-0.9 |
| `top_p` | 核采样阈值，与 temperature 二选一调节 | 0.9 |
| `max_tokens` | 最大输出 token 数 | 按需设置，代码任务建议 1000+ |
| `frequency_penalty` | 降低重复内容的概率 | 0-0.5 |
| `presence_penalty` | 鼓励讨论新话题 | 0-0.5 |

## 环境验证清单

完成以上步骤后，确认以下内容：

- [ ] Go 1.21+ 已安装 → `go version`
- [ ] Ollama 已安装并运行 → `ollama --version`
- [ ] 至少下载了一个对话模型 → `ollama list`
- [ ] 至少下载了一个 Embedding 模型 → `ollama list`
- [ ] 能成功运行原生 HTTP 调用示例
- [ ] 能成功运行 LangChainGo 示例
- [ ] 流式输出工作正常

::: tip 环境搭建完成后，下一章将深入 Prompt 工程，学习如何精确控制 LLM 的输出。
:::
