---
order : 10
icon : material-symbols:deployed-code
---

# 10. 生产部署与优化

将 Agent 从实验环境推向生产环境，需要关注可观测性、性能、安全、成本和部署等关键维度。

## 可观测性

### 结构化日志

```go
package observability

import (
    "context"
    "encoding/json"
    "log/slog"
    "time"
)

// AgentLogger Agent 专用日志器
type AgentLogger struct {
    logger *slog.Logger
}

func NewAgentLogger() *AgentLogger {
    return &AgentLogger{
        logger: slog.Default(),
    }
}

// LogLLMCall 记录 LLM 调用
func (l *AgentLogger) LogLLMCall(ctx context.Context, model string, 
    messages []Message, response string, duration time.Duration, tokens int) {
    l.logger.InfoContext(ctx, "LLM 调用",
        slog.String("model", model),
        slog.Int("input_messages", len(messages)),
        slog.Int("output_length", len(response)),
        slog.Duration("duration", duration),
        slog.Int("tokens", tokens),
        slog.String("trace_id", getTraceID(ctx)),
    )
}

// LogToolCall 记录工具调用
func (l *AgentLogger) LogToolCall(ctx context.Context, toolName string, 
    args map[string]interface{}, result string, err error, duration time.Duration) {
    level := slog.LevelInfo
    if err != nil {
        level = slog.LevelError
    }
    l.logger.Log(ctx, level, "工具调用",
        slog.String("tool", toolName),
        slog.Any("args", args),
        slog.Int("result_length", len(result)),
        slog.Duration("duration", duration),
        slog.Any("error", err),
    )
}

// LogAgentStep 记录 Agent 推理步骤
func (l *AgentLogger) LogAgentStep(ctx context.Context, step int, 
    thought, action, observation string) {
    l.logger.InfoContext(ctx, "Agent 推理步骤",
        slog.Int("step", step),
        slog.String("thought", truncate(thought, 200)),
        slog.String("action", action),
        slog.String("observation", truncate(observation, 200)),
    )
}
```

### 链路追踪（Tracing）

```go
package observability

import (
    "context"
    "time"
)

// Span 追踪跨度
type Span struct {
    TraceID   string        `json:"trace_id"`
    SpanID    string        `json:"span_id"`
    ParentID  string        `json:"parent_id,omitempty"`
    Name      string        `json:"name"`
    StartTime time.Time     `json:"start_time"`
    EndTime   time.Time     `json:"end_time"`
    Duration  time.Duration `json:"duration"`
    Attrs     map[string]interface{} `json:"attrs"`
    Status    string        `json:"status"` // ok/error
}

// Tracer 追踪器
type Tracer struct {
    spans []Span
}

func (t *Tracer) StartSpan(ctx context.Context, name string) (context.Context, *Span) {
    span := &Span{
        TraceID:   getTraceID(ctx),
        SpanID:    generateID(),
        ParentID:  getSpanID(ctx),
        Name:      name,
        StartTime: time.Now(),
        Attrs:     make(map[string]interface{}),
    }
    ctx = context.WithValue(ctx, spanIDKey, span.SpanID)
    return ctx, span
}

func (t *Tracer) EndSpan(span *Span, err error) {
    span.EndTime = time.Now()
    span.Duration = span.EndTime.Sub(span.StartTime)
    if err != nil {
        span.Status = "error"
        span.Attrs["error"] = err.Error()
    } else {
        span.Status = "ok"
    }
    t.spans = append(t.spans, *span)
}

// 在 Agent 中使用追踪
func (a *Agent) Run(ctx context.Context, input string) (string, error) {
    ctx, span := a.tracer.StartSpan(ctx, "agent.run")
    defer func() { a.tracer.EndSpan(span, nil) }()
    span.Attrs["input"] = truncate(input, 100)

    for i := 0; i < a.maxIterations; i++ {
        // 追踪 LLM 调用
        ctx, llmSpan := a.tracer.StartSpan(ctx, "llm.chat")
        response, err := a.llm.Chat(ctx, messages)
        a.tracer.EndSpan(llmSpan, err)

        if response.HasToolCalls() {
            // 追踪工具调用
            for _, call := range response.ToolCalls {
                ctx, toolSpan := a.tracer.StartSpan(ctx, "tool."+call.Name)
                result, err := a.executeTool(ctx, call)
                a.tracer.EndSpan(toolSpan, err)
            }
        }
    }
    return result, nil
}
```

### 指标监控

```go
package observability

import "sync/atomic"

// Metrics Agent 性能指标
type Metrics struct {
    TotalRequests    atomic.Int64
    TotalTokens      atomic.Int64
    TotalToolCalls   atomic.Int64
    TotalErrors      atomic.Int64
    TotalLatencyMs   atomic.Int64  // 累计延迟
}

func (m *Metrics) RecordRequest(tokens int, latencyMs int64, hasError bool) {
    m.TotalRequests.Add(1)
    m.TotalTokens.Add(int64(tokens))
    m.TotalLatencyMs.Add(latencyMs)
    if hasError {
        m.TotalErrors.Add(1)
    }
}

func (m *Metrics) RecordToolCall() {
    m.TotalToolCalls.Add(1)
}

// 暴露为 HTTP 端点供 Prometheus 抓取
func (m *Metrics) Handler() http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "agent_total_requests %d\n", m.TotalRequests.Load())
        fmt.Fprintf(w, "agent_total_tokens %d\n", m.TotalTokens.Load())
        fmt.Fprintf(w, "agent_total_tool_calls %d\n", m.TotalToolCalls.Load())
        fmt.Fprintf(w, "agent_total_errors %d\n", m.TotalErrors.Load())
        avgLatency := float64(0)
        if reqs := m.TotalRequests.Load(); reqs > 0 {
            avgLatency = float64(m.TotalLatencyMs.Load()) / float64(reqs)
        }
        fmt.Fprintf(w, "agent_avg_latency_ms %.2f\n", avgLatency)
    }
}
```

## 性能优化

### Embedding 缓存

避免重复调用 Embedding API：

```go
package cache

import (
    "crypto/sha256"
    "encoding/hex"
    "sync"
)

// EmbeddingCache Embedding 结果缓存
type EmbeddingCache struct {
    mu    sync.RWMutex
    cache map[string][]float64
    embedder Embedder
}

func NewEmbeddingCache(embedder Embedder) *EmbeddingCache {
    return &EmbeddingCache{
        cache:    make(map[string][]float64),
        embedder: embedder,
    }
}

func (c *EmbeddingCache) Embed(ctx context.Context, text string) ([]float64, error) {
    key := hash(text)
    
    // 查缓存
    c.mu.RLock()
    if vec, ok := c.cache[key]; ok {
        c.mu.RUnlock()
        return vec, nil
    }
    c.mu.RUnlock()

    // 未命中，调用 API
    vec, err := c.embedder.Embed(ctx, text)
    if err != nil {
        return nil, err
    }

    // 写入缓存
    c.mu.Lock()
    c.cache[key] = vec
    c.mu.Unlock()

    return vec, nil
}

func hash(s string) string {
    h := sha256.Sum256([]byte(s))
    return hex.EncodeToString(h[:])
}
```

### 并发请求控制

```go
package ratelimit

import "context"

// Limiter 并发限制器
type Limiter struct {
    sem chan struct{}
}

func NewLimiter(maxConcurrent int) *Limiter {
    return &Limiter{
        sem: make(chan struct{}, maxConcurrent),
    }
}

func (l *Limiter) Acquire(ctx context.Context) error {
    select {
    case l.sem <- struct{}{}:
        return nil
    case <-ctx.Done():
        return ctx.Err()
    }
}

func (l *Limiter) Release() {
    <-l.sem
}

// 在 Agent 中使用
func (a *Agent) Run(ctx context.Context, input string) (string, error) {
    if err := a.limiter.Acquire(ctx); err != nil {
        return "", fmt.Errorf("获取并发许可失败: %w", err)
    }
    defer a.limiter.Release()

    // 实际执行逻辑...
    return a.doRun(ctx, input)
}
```

### 响应缓存

对于相同或高度相似的查询，返回缓存结果：

```go
package cache

import (
    "sync"
    "time"
)

type CacheEntry struct {
    Response  string
    CreatedAt time.Time
}

// ResponseCache 响应缓存
type ResponseCache struct {
    mu      sync.RWMutex
    entries map[string]CacheEntry
    ttl     time.Duration
}

func NewResponseCache(ttl time.Duration) *ResponseCache {
    return &ResponseCache{
        entries: make(map[string]CacheEntry),
        ttl:     ttl,
    }
}

func (c *ResponseCache) Get(key string) (string, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    
    entry, ok := c.entries[key]
    if !ok || time.Since(entry.CreatedAt) > c.ttl {
        return "", false
    }
    return entry.Response, true
}

func (c *ResponseCache) Set(key, response string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.entries[key] = CacheEntry{
        Response:  response,
        CreatedAt: time.Now(),
    }
}
```

## 安全防护

### Prompt 注入防护

```go
package security

import (
    "regexp"
    "strings"
)

// SanitizeInput 清理用户输入，防止 Prompt 注入
func SanitizeInput(input string) string {
    // 1. 移除试图修改系统指令的内容
    dangerous := []string{
        "忽略之前的指令",
        "ignore previous instructions",
        "你现在是",
        "you are now",
        "system:",
        "SYSTEM:",
    }
    
    cleaned := input
    for _, d := range dangerous {
        cleaned = strings.ReplaceAll(cleaned, d, "[已过滤]")
    }

    return cleaned
}

// ValidateOutput 验证输出，防止敏感信息泄露
func ValidateOutput(output string) string {
    // 过滤可能泄露的敏感信息
    patterns := []string{
        `(?i)api[_-]?key\s*[:=]\s*\S+`,
        `(?i)password\s*[:=]\s*\S+`,
        `(?i)secret\s*[:=]\s*\S+`,
        `\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b`, // 邮箱
    }
    
    result := output
    for _, p := range patterns {
        re := regexp.MustCompile(p)
        result = re.ReplaceAllString(result, "[已脱敏]")
    }
    return result
}
```

### API Key 管理

```go
package config

import (
    "fmt"
    "os"
)

// Config 安全配置管理
type Config struct {
    OpenAIKey   string
    GeminiKey   string
    OllamaURL   string
}

// LoadConfig 从环境变量加载配置（不硬编码在代码中）
func LoadConfig() (*Config, error) {
    cfg := &Config{
        OpenAIKey: os.Getenv("OPENAI_API_KEY"),
        GeminiKey: os.Getenv("GOOGLE_API_KEY"),
        OllamaURL: os.Getenv("OLLAMA_URL"),
    }

    if cfg.OllamaURL == "" {
        cfg.OllamaURL = "http://localhost:11434"
    }

    return cfg, nil
}
```

## 成本控制

### Token 用量追踪

```go
package cost

import (
    "fmt"
    "sync"
)

// 模型定价（USD / 1M tokens）
var pricing = map[string]struct{ Input, Output float64 }{
    "gpt-4o":              {2.50, 10.00},
    "gpt-4o-mini":         {0.15, 0.60},
    "gpt-3.5-turbo":      {0.50, 1.50},
    "claude-3-5-sonnet":  {3.00, 15.00},
    "gemini-2.0-flash":   {0.10, 0.40},
}

// CostTracker 成本追踪器
type CostTracker struct {
    mu       sync.Mutex
    records  []UsageRecord
}

type UsageRecord struct {
    Model       string
    InputTokens int
    OutputTokens int
    Cost        float64
}

func (t *CostTracker) Record(model string, inputTokens, outputTokens int) {
    t.mu.Lock()
    defer t.mu.Unlock()

    price, ok := pricing[model]
    if !ok {
        return
    }

    cost := float64(inputTokens)/1_000_000*price.Input + 
            float64(outputTokens)/1_000_000*price.Output

    t.records = append(t.records, UsageRecord{
        Model:        model,
        InputTokens:  inputTokens,
        OutputTokens: outputTokens,
        Cost:         cost,
    })
}

func (t *CostTracker) TotalCost() float64 {
    t.mu.Lock()
    defer t.mu.Unlock()
    
    total := 0.0
    for _, r := range t.records {
        total += r.Cost
    }
    return total
}

func (t *CostTracker) Report() string {
    t.mu.Lock()
    defer t.mu.Unlock()

    totalInput, totalOutput := 0, 0
    totalCost := 0.0
    for _, r := range t.records {
        totalInput += r.InputTokens
        totalOutput += r.OutputTokens
        totalCost += r.Cost
    }

    return fmt.Sprintf(
        "调用次数: %d | 输入 tokens: %d | 输出 tokens: %d | 总成本: $%.4f",
        len(t.records), totalInput, totalOutput, totalCost)
}
```

### 成本优化策略

| 策略 | 效果 | 实现难度 |
|------|------|----------|
| 使用小模型处理简单任务 | 节省 80%+ | ⭐ |
| Embedding 缓存 | 减少重复调用 | ⭐ |
| 响应缓存 | 相似问题直接返回 | ⭐⭐ |
| Prompt 精简 | 减少输入 token | ⭐ |
| 分级路由 | 简单→小模型，复杂→大模型 | ⭐⭐⭐ |

## Docker 部署

### Dockerfile

```dockerfile
# 构建阶段
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o agent ./cmd/main.go

# 运行阶段
FROM alpine:3.19
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/agent .

EXPOSE 8080
CMD ["./agent"]
```

### Docker Compose（含 Ollama + 向量数据库）

```yaml
version: '3.8'

services:
  agent:
    build: .
    ports:
      - "8080:8080"
    environment:
      - OLLAMA_URL=http://ollama:11434
      - QDRANT_URL=http://qdrant:6333
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - ollama
      - qdrant

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

volumes:
  ollama_data:
  qdrant_data:
```

## 评估体系

### 核心指标

| 指标 | 目标值 | 测量方式 |
|------|--------|----------|
| **准确率** | > 90% | 人工标注 + 自动评估 |
| **响应延迟** | < 3s (P95) | 端到端计时 |
| **幻觉率** | < 5% | 人工抽检 |
| **工具调用成功率** | > 95% | 日志统计 |
| **用户满意度** | > 4/5 | 反馈收集 |
| **月均成本** | 在预算内 | 成本追踪器 |

### 自动化测试

```go
package eval

import (
    "context"
    "testing"
)

type TestCase struct {
    Input          string
    ExpectedOutput string   // 期望包含的关键内容
    MustCallTools  []string // 必须调用的工具
}

func TestAgent(t *testing.T) {
    agent := setupTestAgent()

    cases := []TestCase{
        {
            Input:          "北京天气怎么样？",
            ExpectedOutput: "北京",
            MustCallTools:  []string{"get_weather"},
        },
        {
            Input:          "1+1等于几？",
            ExpectedOutput: "2",
            MustCallTools:  nil, // 不需要工具
        },
    }

    for _, tc := range cases {
        t.Run(tc.Input, func(t *testing.T) {
            result, err := agent.Run(context.Background(), tc.Input)
            if err != nil {
                t.Fatalf("Agent 执行失败: %v", err)
            }
            
            if !strings.Contains(result, tc.ExpectedOutput) {
                t.Errorf("输出不包含期望内容\n期望包含: %s\n实际输出: %s",
                    tc.ExpectedOutput, result)
            }
        })
    }
}
```

## 生产部署清单

```
上线前检查清单：

□ API Key 通过环境变量注入，不在代码中硬编码
□ 所有工具调用有超时控制（30s 以内）
□ Agent 循环有最大迭代次数限制
□ 用户输入经过安全清理
□ 输出经过敏感信息过滤
□ 结构化日志记录所有 LLM 和工具调用
□ 并发请求有限流保护
□ Embedding 和响应有缓存层
□ 成本追踪已启用
□ 自动化测试覆盖核心场景
□ 监控告警已配置（错误率 > 5% 报警）
□ 优雅退出已实现（处理完当前请求再关闭）
```

::: tip 恭喜！你已完成 Go AI Agent 从入门到精通的全部教程。现在你可以构建自己的生产级 Agent 系统了。
:::
