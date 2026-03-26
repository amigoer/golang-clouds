---
order : 7
icon : material-symbols:flowsheet
---

# 7. Agent 工作流编排

从单步 LLM 调用到复杂的多步骤 Agent 系统，工作流编排是关键。本章介绍三种主要编排模式：Chain（链式）、Graph（图式）和 ReAct Loop（循环推理）。

## ReAct Loop 实现

ReAct（Reasoning + Acting）是最基础的 Agent 运行循环。核心思路：不断「思考→行动→观察」直到完成任务。

### 完整 Go 实现

```go
package agent

import (
    "context"
    "encoding/json"
    "fmt"
    "strings"
)

// ReActAgent 实现 ReAct 推理循环
type ReActAgent struct {
    llm           LLM
    tools         *ToolRegistry
    memory        Memory
    systemPrompt  string
    maxIterations int
}

type AgentConfig struct {
    SystemPrompt  string
    MaxIterations int
}

func NewReActAgent(llm LLM, tools *ToolRegistry, memory Memory, cfg AgentConfig) *ReActAgent {
    if cfg.MaxIterations == 0 {
        cfg.MaxIterations = 5
    }
    return &ReActAgent{
        llm:           llm,
        tools:         tools,
        memory:        memory,
        systemPrompt:  cfg.SystemPrompt,
        maxIterations: cfg.MaxIterations,
    }
}

// Run 执行 Agent 推理循环
func (a *ReActAgent) Run(ctx context.Context, input string) (string, error) {
    // 加载历史记忆
    history, _ := a.memory.Get(ctx)

    messages := make([]Message, 0, len(history)+2)
    messages = append(messages, Message{Role: "system", Content: a.systemPrompt})
    messages = append(messages, history...)
    messages = append(messages, Message{Role: "user", Content: input})

    // ReAct 循环
    for i := 0; i < a.maxIterations; i++ {
        // 调用 LLM
        response, err := a.llm.ChatWithTools(ctx, messages, a.tools.Definitions())
        if err != nil {
            return "", fmt.Errorf("LLM 调用失败 (迭代 %d): %w", i, err)
        }

        // 如果没有工具调用，说明 Agent 认为可以直接回答
        if !response.HasToolCalls() {
            // 保存记忆
            a.memory.Add(ctx, Message{Role: "user", Content: input})
            a.memory.Add(ctx, Message{Role: "assistant", Content: response.Content})
            return response.Content, nil
        }

        // 执行所有工具调用
        messages = append(messages, Message{
            Role:      "assistant",
            ToolCalls: response.ToolCalls,
        })

        for _, call := range response.ToolCalls {
            result := a.executeTool(ctx, call)
            messages = append(messages, Message{
                Role:       "tool",
                Content:    result,
                ToolCallID: call.ID,
            })
        }
    }

    return "", fmt.Errorf("达到最大迭代次数 (%d)，未能完成任务", a.maxIterations)
}

func (a *ReActAgent) executeTool(ctx context.Context, call ToolCall) string {
    tool, ok := a.tools.Get(call.Name)
    if !ok {
        return fmt.Sprintf("错误：未知工具 %s", call.Name)
    }

    var args map[string]interface{}
    json.Unmarshal(call.Args, &args)

    // 超时保护
    ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
    defer cancel()

    result, err := tool.Execute(ctx, args)
    if err != nil {
        return fmt.Sprintf("工具执行失败: %s", err.Error())
    }
    return result
}
```

### 使用 ReAct Agent

```go
func main() {
    llm := openai.New("gpt-4o")
    tools := NewToolRegistry()
    tools.Register(&WeatherTool{})
    tools.Register(&CalculatorTool{})
    tools.Register(&SearchTool{})

    agent := NewReActAgent(llm, tools, NewWindowMemory(10), AgentConfig{
        SystemPrompt: "你是一个有用的助手，善于使用工具解决问题。",
        MaxIterations: 5,
    })

    result, err := agent.Run(context.Background(),
        "北京今天气温多少度？换算成华氏度是多少？")
    // Agent 自动：查天气 → 拿到温度 → 计算华氏度 → 生成回答
    fmt.Println(result)
}
```

## Chain 模式（顺序链）

将多个步骤串联，每步的输出作为下一步的输入：

```
Input → [Step1] → [Step2] → [Step3] → Output
```

```go
package chain

import "context"

// Step 链中的一个步骤
type Step func(ctx context.Context, input string) (string, error)

// Chain 顺序执行链
type Chain struct {
    steps []Step
}

func New(steps ...Step) *Chain {
    return &Chain{steps: steps}
}

// Run 按顺序执行所有步骤
func (c *Chain) Run(ctx context.Context, input string) (string, error) {
    current := input
    for i, step := range c.steps {
        result, err := step(ctx, current)
        if err != nil {
            return "", fmt.Errorf("步骤 %d 失败: %w", i+1, err)
        }
        current = result
    }
    return current, nil
}

// 使用示例：文档处理链
func main() {
    pipeline := chain.New(
        // Step 1: 提取关键信息
        func(ctx context.Context, doc string) (string, error) {
            return llm.Generate(ctx, "提取以下文档的关键信息：\n"+doc)
        },
        // Step 2: 翻译为英文
        func(ctx context.Context, info string) (string, error) {
            return llm.Generate(ctx, "翻译为英文：\n"+info)
        },
        // Step 3: 生成摘要
        func(ctx context.Context, english string) (string, error) {
            return llm.Generate(ctx, "生成 100 词以内的摘要：\n"+english)
        },
    )

    result, _ := pipeline.Run(ctx, longDocument)
    fmt.Println(result)
}
```

## Graph 模式（有向图）

比 Chain 更灵活，支持条件分支、并行执行和循环：

```
          ┌──→ [搜索] ──→ [回答] ──→ END
START → [分类]                        
          └──→ [计算] ──→ [回答] ──→ END
```

```go
package graph

import (
    "context"
    "fmt"
    "sync"
)

// Node 图中的节点
type Node struct {
    Name    string
    Execute func(ctx context.Context, state *State) error
}

// Edge 图中的边
type Edge struct {
    From      string
    To        string
    Condition func(state *State) bool // nil 表示无条件
}

// State 在节点间传递的状态
type State struct {
    mu   sync.RWMutex
    data map[string]interface{}
}

func NewState() *State {
    return &State{data: make(map[string]interface{})}
}

func (s *State) Set(key string, value interface{}) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.data[key] = value
}

func (s *State) Get(key string) interface{} {
    s.mu.RLock()
    defer s.mu.RUnlock()
    return s.data[key]
}

// Graph 有向图工作流
type Graph struct {
    nodes map[string]*Node
    edges []*Edge
    entry string
}

func New() *Graph {
    return &Graph{
        nodes: make(map[string]*Node),
    }
}

func (g *Graph) AddNode(node *Node) {
    g.nodes[node.Name] = node
}

func (g *Graph) AddEdge(from, to string, condition func(*State) bool) {
    g.edges = append(g.edges, &Edge{From: from, To: to, Condition: condition})
}

func (g *Graph) SetEntry(name string) {
    g.entry = name
}

// Run 执行图工作流
func (g *Graph) Run(ctx context.Context, state *State) error {
    current := g.entry
    visited := make(map[string]int) // 防止无限循环

    for current != "" {
        visited[current]++
        if visited[current] > 10 {
            return fmt.Errorf("节点 %s 执行超过 10 次，可能存在循环", current)
        }

        node, ok := g.nodes[current]
        if !ok {
            return fmt.Errorf("未知节点: %s", current)
        }

        // 执行节点
        if err := node.Execute(ctx, state); err != nil {
            return fmt.Errorf("节点 %s 执行失败: %w", current, err)
        }

        // 查找下一个节点
        current = g.findNext(current, state)
    }

    return nil
}

func (g *Graph) findNext(current string, state *State) string {
    for _, edge := range g.edges {
        if edge.From == current {
            if edge.Condition == nil || edge.Condition(state) {
                return edge.To
            }
        }
    }
    return "" // 无后续节点，结束
}
```

### 使用 Graph 构建智能客服

```go
func main() {
    g := graph.New()

    // 意图分类节点
    g.AddNode(&graph.Node{
        Name: "classify",
        Execute: func(ctx context.Context, s *graph.State) error {
            query := s.Get("query").(string)
            intent, _ := llm.Generate(ctx, fmt.Sprintf(
                "判断用户意图，只输出一个词(faq/order/complaint)：%s", query))
            s.Set("intent", strings.TrimSpace(intent))
            return nil
        },
    })

    // FAQ 回答节点
    g.AddNode(&graph.Node{
        Name: "faq",
        Execute: func(ctx context.Context, s *graph.State) error {
            query := s.Get("query").(string)
            // 从知识库检索并回答
            answer, _ := ragEngine.Query(ctx, query)
            s.Set("answer", answer)
            return nil
        },
    })

    // 订单查询节点
    g.AddNode(&graph.Node{
        Name: "order",
        Execute: func(ctx context.Context, s *graph.State) error {
            query := s.Get("query").(string)
            // 查询订单系统
            orderInfo, _ := orderService.Query(ctx, query)
            s.Set("answer", orderInfo)
            return nil
        },
    })

    // 投诉处理节点
    g.AddNode(&graph.Node{
        Name: "complaint",
        Execute: func(ctx context.Context, s *graph.State) error {
            s.Set("answer", "您的投诉已记录，工单号: T20260327001，将在24小时内处理。")
            return nil
        },
    })

    // 定义边
    g.SetEntry("classify")
    g.AddEdge("classify", "faq", func(s *graph.State) bool {
        return s.Get("intent") == "faq"
    })
    g.AddEdge("classify", "order", func(s *graph.State) bool {
        return s.Get("intent") == "order"
    })
    g.AddEdge("classify", "complaint", func(s *graph.State) bool {
        return s.Get("intent") == "complaint"
    })

    // 运行
    state := graph.NewState()
    state.Set("query", "我的订单到哪了？")
    g.Run(context.Background(), state)
    fmt.Println(state.Get("answer"))
}
```

## 并行执行

当多个步骤之间没有依赖关系时，可以利用 Go 的 goroutine 并行执行：

```go
package chain

import (
    "context"
    "sync"
)

// Parallel 并行执行多个步骤
type Parallel struct {
    steps []Step
}

func NewParallel(steps ...Step) *Parallel {
    return &Parallel{steps: steps}
}

func (p *Parallel) Run(ctx context.Context, input string) ([]string, error) {
    results := make([]string, len(p.steps))
    errs := make([]error, len(p.steps))

    var wg sync.WaitGroup
    for i, step := range p.steps {
        wg.Add(1)
        go func(idx int, s Step) {
            defer wg.Done()
            results[idx], errs[idx] = s(ctx, input)
        }(i, step)
    }
    wg.Wait()

    // 检查错误
    for _, err := range errs {
        if err != nil {
            return nil, err
        }
    }
    return results, nil
}

// 使用示例：同时从多个角度分析代码
func main() {
    parallel := NewParallel(
        func(ctx context.Context, code string) (string, error) {
            return llm.Generate(ctx, "分析代码的安全性：\n"+code)
        },
        func(ctx context.Context, code string) (string, error) {
            return llm.Generate(ctx, "分析代码的性能：\n"+code)
        },
        func(ctx context.Context, code string) (string, error) {
            return llm.Generate(ctx, "分析代码的可读性：\n"+code)
        },
    )

    reviews, _ := parallel.Run(ctx, sourceCode)
    // reviews[0] = 安全分析, reviews[1] = 性能分析, reviews[2] = 可读性分析
}
```

## 中断与恢复

对于耗时长或需要人工审核的工作流，支持中断和恢复：

```go
package workflow

import (
    "context"
    "encoding/json"
    "os"
)

// Checkpoint 检查点，支持工作流中断恢复
type Checkpoint struct {
    StepIndex int                    `json:"step_index"` // 当前步骤
    State     map[string]interface{} `json:"state"`      // 当前状态
    Status    string                 `json:"status"`     // running/paused/completed
}

// ResumableWorkflow 可恢复的工作流
type ResumableWorkflow struct {
    steps      []NamedStep
    checkpoint *Checkpoint
    savePath   string
}

type NamedStep struct {
    Name    string
    Execute func(ctx context.Context, state map[string]interface{}) error
    // NeedApproval 是否需要人工审核
    NeedApproval bool
}

func (w *ResumableWorkflow) Run(ctx context.Context) error {
    startIdx := 0
    if w.checkpoint != nil {
        startIdx = w.checkpoint.StepIndex
    }

    state := make(map[string]interface{})
    if w.checkpoint != nil {
        state = w.checkpoint.State
    }

    for i := startIdx; i < len(w.steps); i++ {
        step := w.steps[i]

        // 需要人工审核时暂停
        if step.NeedApproval {
            w.saveCheckpoint(i, state, "paused")
            fmt.Printf("⏸️ 工作流在步骤 [%s] 暂停，等待人工审核\n", step.Name)
            return nil // 暂停，等待恢复
        }

        // 执行步骤
        fmt.Printf("▶️ 执行步骤 [%s]...\n", step.Name)
        if err := step.Execute(ctx, state); err != nil {
            w.saveCheckpoint(i, state, "error")
            return fmt.Errorf("步骤 [%s] 失败: %w", step.Name, err)
        }

        // 保存检查点
        w.saveCheckpoint(i+1, state, "running")
    }

    w.saveCheckpoint(len(w.steps), state, "completed")
    return nil
}

func (w *ResumableWorkflow) saveCheckpoint(idx int, state map[string]interface{}, status string) {
    cp := &Checkpoint{StepIndex: idx, State: state, Status: status}
    data, _ := json.Marshal(cp)
    os.WriteFile(w.savePath, data, 0644)
}
```

## 编排模式选择

| 模式 | 适用场景 | 复杂度 |
|------|----------|--------|
| **ReAct Loop** | 自主推理型 Agent | ⭐⭐ |
| **Chain** | 固定流程的数据处理 | ⭐ |
| **Graph** | 有分支的业务流程 | ⭐⭐⭐ |
| **Parallel** | 无依赖的批量处理 | ⭐⭐ |
| **Resumable** | 需要人工介入的长流程 | ⭐⭐⭐⭐ |

::: tip 下一章将学习多 Agent 系统，让多个 Agent 分工协作解决更复杂的问题。
:::
