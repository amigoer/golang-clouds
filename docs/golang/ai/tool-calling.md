---
order : 4
icon : mdi:tools
---

# 4. Tool Calling 实战

Tool Calling（工具调用）让 Agent 从「只会说」变成「能做事」。通过定义工具接口，LLM 可以在推理过程中自主决定调用哪些工具、传什么参数，执行完成后再继续推理。

## 核心流程

```
┌──────┐       ┌──────┐       ┌──────┐       ┌──────┐
│ 用户 │──────→│ LLM  │──────→│ 应用 │──────→│ 工具 │
│ 提问 │       │ 推理 │       │ 执行 │       │ 执行 │
└──────┘       └──┬───┘       └──┬───┘       └──┬───┘
                  │              │              │
                  │  tool_call   │   执行函数    │
                  │─────────────→│─────────────→│
                  │              │              │
                  │  tool_result │   返回结果    │
                  │←─────────────│←─────────────│
                  │              │              │
                  │  继续推理     │              │
                  │  生成回答     │              │
                  └──────────────┘              │
```

关键点：**LLM 本身不执行工具**，它只是输出「我想调用某个工具，参数是什么」，由应用层负责实际执行。

## 工具 Schema 定义

每个工具需要用 JSON Schema 描述其名称、功能和参数：

```go
// 工具定义结构
type ToolDefinition struct {
    Type     string   `json:"type"`     // 固定为 "function"
    Function Function `json:"function"`
}

type Function struct {
    Name        string     `json:"name"`        // 工具名称
    Description string     `json:"description"` // 功能描述（LLM 靠这个决定何时调用）
    Parameters  Parameters `json:"parameters"`  // 参数 Schema
}

type Parameters struct {
    Type       string                 `json:"type"` // 固定为 "object"
    Properties map[string]Property    `json:"properties"`
    Required   []string               `json:"required"`
}

type Property struct {
    Type        string   `json:"type"`
    Description string   `json:"description"`
    Enum        []string `json:"enum,omitempty"` // 可选：枚举值
}
```

## 实现常用工具

### 工具接口设计

```go
package tools

import "context"

// Tool 工具接口
type Tool interface {
    // Name 工具名称
    Name() string
    // Description 工具描述（LLM 用这个判断何时调用）
    Description() string
    // Schema 参数定义
    Schema() map[string]interface{}
    // Execute 执行工具
    Execute(ctx context.Context, args map[string]interface{}) (string, error)
}

// Registry 工具注册表
type Registry struct {
    tools map[string]Tool
}

func NewRegistry() *Registry {
    return &Registry{tools: make(map[string]Tool)}
}

func (r *Registry) Register(tool Tool) {
    r.tools[tool.Name()] = tool
}

func (r *Registry) Get(name string) (Tool, bool) {
    t, ok := r.tools[name]
    return t, ok
}

func (r *Registry) All() []Tool {
    result := make([]Tool, 0, len(r.tools))
    for _, t := range r.tools {
        result = append(result, t)
    }
    return result
}
```

### 天气查询工具

```go
package tools

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"
)

type WeatherTool struct{}

func (w *WeatherTool) Name() string { return "get_weather" }

func (w *WeatherTool) Description() string {
    return "获取指定城市的实时天气信息，包括温度、湿度和天气状况"
}

func (w *WeatherTool) Schema() map[string]interface{} {
    return map[string]interface{}{
        "type": "object",
        "properties": map[string]interface{}{
            "city": map[string]interface{}{
                "type":        "string",
                "description": "城市名称，如'北京'、'上海'",
            },
            "unit": map[string]interface{}{
                "type":        "string",
                "enum":        []string{"celsius", "fahrenheit"},
                "description": "温度单位，默认 celsius（摄氏度）",
            },
        },
        "required": []string{"city"},
    }
}

func (w *WeatherTool) Execute(ctx context.Context, args map[string]interface{}) (string, error) {
    city, _ := args["city"].(string)
    
    // 调用天气 API（此处用模拟数据）
    weather := map[string]interface{}{
        "city":        city,
        "temperature": 22,
        "humidity":    65,
        "condition":   "晴",
        "wind":        "东南风 3级",
    }
    
    data, _ := json.Marshal(weather)
    return string(data), nil
}
```

### 数据库查询工具

```go
package tools

import (
    "context"
    "database/sql"
    "encoding/json"
    "fmt"
)

type DatabaseQueryTool struct {
    db *sql.DB
}

func NewDatabaseQueryTool(db *sql.DB) *DatabaseQueryTool {
    return &DatabaseQueryTool{db: db}
}

func (d *DatabaseQueryTool) Name() string { return "query_database" }

func (d *DatabaseQueryTool) Description() string {
    return "执行只读 SQL 查询，获取数据库中的数据。仅支持 SELECT 语句。"
}

func (d *DatabaseQueryTool) Schema() map[string]interface{} {
    return map[string]interface{}{
        "type": "object",
        "properties": map[string]interface{}{
            "query": map[string]interface{}{
                "type":        "string",
                "description": "SQL SELECT 查询语句",
            },
        },
        "required": []string{"query"},
    }
}

func (d *DatabaseQueryTool) Execute(ctx context.Context, args map[string]interface{}) (string, error) {
    query, _ := args["query"].(string)

    // 安全检查：只允许 SELECT
    if !isSelectQuery(query) {
        return "", fmt.Errorf("安全限制：只允许执行 SELECT 查询")
    }

    rows, err := d.db.QueryContext(ctx, query)
    if err != nil {
        return "", fmt.Errorf("查询失败: %w", err)
    }
    defer rows.Close()

    // 将结果转为 JSON
    results, err := rowsToJSON(rows)
    if err != nil {
        return "", err
    }

    data, _ := json.Marshal(results)
    return string(data), nil
}

func isSelectQuery(query string) bool {
    // 简单检查，生产中需更严格的 SQL 解析
    normalized := strings.TrimSpace(strings.ToUpper(query))
    return strings.HasPrefix(normalized, "SELECT")
}
```

### HTTP 请求工具

```go
package tools

import (
    "context"
    "fmt"
    "io"
    "net/http"
    "time"
)

type HTTPTool struct {
    client *http.Client
}

func NewHTTPTool() *HTTPTool {
    return &HTTPTool{
        client: &http.Client{Timeout: 10 * time.Second},
    }
}

func (h *HTTPTool) Name() string { return "http_request" }

func (h *HTTPTool) Description() string {
    return "发送 HTTP GET 请求获取网页或 API 的内容"
}

func (h *HTTPTool) Schema() map[string]interface{} {
    return map[string]interface{}{
        "type": "object",
        "properties": map[string]interface{}{
            "url": map[string]interface{}{
                "type":        "string",
                "description": "目标 URL",
            },
        },
        "required": []string{"url"},
    }
}

func (h *HTTPTool) Execute(ctx context.Context, args map[string]interface{}) (string, error) {
    url, _ := args["url"].(string)

    req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
    resp, err := h.client.Do(req)
    if err != nil {
        return "", fmt.Errorf("请求失败: %w", err)
    }
    defer resp.Body.Close()

    // 限制读取大小，防止内存溢出
    body, err := io.ReadAll(io.LimitReader(resp.Body, 10*1024)) // 最大 10KB
    if err != nil {
        return "", err
    }

    return fmt.Sprintf("状态码: %d\n内容:\n%s", resp.StatusCode, string(body)), nil
}
```

## 完整 Tool Calling 流程

将工具注册、LLM 调用和工具执行串联起来：

```go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "go-agent-lab/internal/tools"
)

// ToolCall LLM 返回的工具调用指令
type ToolCall struct {
    ID       string          `json:"id"`
    Name     string          `json:"name"`
    Args     json.RawMessage `json:"arguments"`
}

func main() {
    ctx := context.Background()

    // 1. 注册工具
    registry := tools.NewRegistry()
    registry.Register(&tools.WeatherTool{})
    registry.Register(tools.NewHTTPTool())

    // 2. 构建带工具描述的消息
    messages := []Message{
        {Role: "system", Content: "你是一个有用的助手，可以使用工具回答问题"},
        {Role: "user", Content: "北京现在天气怎么样？"},
    }

    // 3. 调用 LLM（带工具定义）
    response := callLLMWithTools(ctx, messages, registry.All())

    // 4. 处理 LLM 响应
    if response.HasToolCalls() {
        for _, call := range response.ToolCalls {
            // 5. 执行工具
            tool, ok := registry.Get(call.Name)
            if !ok {
                fmt.Printf("未知工具: %s\n", call.Name)
                continue
            }

            var args map[string]interface{}
            json.Unmarshal(call.Args, &args)

            result, err := tool.Execute(ctx, args)
            if err != nil {
                fmt.Printf("工具执行失败: %v\n", err)
                continue
            }

            // 6. 将工具结果送回 LLM
            messages = append(messages,
                Message{Role: "assistant", Content: "", ToolCalls: response.ToolCalls},
                Message{Role: "tool", Content: result, ToolCallID: call.ID},
            )
        }

        // 7. 再次调用 LLM 生成最终回答
        finalResponse := callLLM(ctx, messages)
        fmt.Println(finalResponse.Content)
    }
}
```

## 使用 LangChainGo 简化工具调用

LangChainGo 封装了上述流程，开发更简洁：

```go
package main

import (
    "context"
    "fmt"
    "github.com/tmc/langchaingo/agents"
    "github.com/tmc/langchaingo/llms/ollama"
    "github.com/tmc/langchaingo/tools"
)

// 自定义工具 - 实现 tools.Tool 接口
type WeatherLookup struct{}

func (w WeatherLookup) Name() string        { return "weather_lookup" }
func (w WeatherLookup) Description() string { return "查询城市天气" }
func (w WeatherLookup) Call(ctx context.Context, input string) (string, error) {
    // input 是 LLM 传入的原始字符串
    return fmt.Sprintf("%s: 晴天，22°C，湿度65%%", input), nil
}

func main() {
    ctx := context.Background()
    llm, _ := ollama.New(ollama.WithModel("qwen2.5:7b"))

    // 注册工具并创建 Agent
    agentTools := []tools.Tool{
        WeatherLookup{},
        tools.Calculator{}, // 内置计算器
    }

    executor, _ := agents.Initialize(llm, agentTools,
        agents.WithMaxIterations(3),
    )

    // Agent 自动决定调用工具
    result, _ := agents.Run(ctx, executor, 
        "北京今天多少度？如果温度是22度，华氏度是多少？")
    fmt.Println(result)
    // Agent 会：1.调用天气工具 → 2.调用计算器(22*9/5+32) → 3.汇总回答
}
```

## 多工具协同

当 Agent 拥有多个工具时，LLM 会自主决定调用顺序和组合：

```go
// 场景：用户问 "对比北京和上海的天气，哪个更适合户外运动？"

// Agent 执行流程：
// Round 1: 
//   Thought: 需要查询两个城市的天气
//   Action: get_weather(city="北京")
//   Action: get_weather(city="上海")  ← 并行调用
// 
// Round 2:
//   Thought: 已获取两地天气，可以分析
//   Action: 直接生成回答（不需要工具）
//   Output: 北京晴天22°C...上海多云18°C...建议选择北京
```

## 错误处理与安全

### 工具执行错误处理

```go
func safeExecuteTool(ctx context.Context, tool Tool, args map[string]interface{}) string {
    // 超时控制
    ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
    defer cancel()

    result, err := tool.Execute(ctx, args)
    if err != nil {
        // 将错误信息返回给 LLM，让它决定如何处理
        return fmt.Sprintf("工具执行失败: %s。请尝试其他方法或告知用户。", err.Error())
    }

    // 结果大小限制
    if len(result) > 4096 {
        result = result[:4096] + "\n...[结果已截断]"
    }

    return result
}
```

### 安全防护

```go
// 工具调用安全检查
func validateToolCall(call ToolCall) error {
    // 1. 工具是否在白名单中
    if !isAllowedTool(call.Name) {
        return fmt.Errorf("工具 %s 不在允许列表中", call.Name)
    }

    // 2. 参数合法性检查
    if err := validateArgs(call.Name, call.Args); err != nil {
        return fmt.Errorf("参数校验失败: %w", err)
    }

    // 3. 调用频率限制
    if isRateLimited(call.Name) {
        return fmt.Errorf("工具 %s 调用频率过高", call.Name)
    }

    return nil
}
```

## MCP 协议简介

MCP（Model Context Protocol）是 Anthropic 提出的开放标准，旨在统一 Agent 与外部工具/数据源的通信协议。

```
传统方式：每个工具都需要自定义集成代码
MCP 方式：统一协议，工具即插即用

┌──────────┐     MCP     ┌──────────────┐
│  Agent   │◄───────────►│ MCP Server   │
│          │   协议      │ (工具提供方)   │
└──────────┘             └──────────────┘
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
                  文件系统   数据库    API服务
```

MCP 的核心价值：
- **标准化**：工具提供方只需实现一次 MCP Server
- **互操作**：任何支持 MCP 的 Agent 都能使用任何 MCP Server
- **安全**：内置权限控制和安全边界

## 小结

| 要点 | 说明 |
|------|------|
| Schema 定义 | 清晰的描述让 LLM 正确选择工具 |
| 接口抽象 | 统一 Tool 接口，方便扩展 |
| 错误处理 | 将错误返回给 LLM 而非程序崩溃 |
| 安全防护 | 白名单、参数校验、频率限制 |
| MCP 趋势 | 标准化工具协议，关注发展 |

::: tip 工具让 Agent 有了行动能力。下一章我们学习如何给 Agent 加上记忆，让它能记住之前的对话和经验。
:::
