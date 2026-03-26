---
order : 8
icon : fluent:people-team-24-filled
---

# 8. 多 Agent 系统

当单个 Agent 无法胜任复杂任务时，可以将多个专业 Agent 组织起来协作完成。本章介绍多 Agent 的架构模式和 Go 实现。

## 为什么需要多 Agent

| 单 Agent | 多 Agent |
|----------|----------|
| 一个 Prompt 要包含所有能力 | 每个 Agent 专注一个领域 |
| 工具过多导致调用混乱 | 工具按专业分配 |
| 上下文窗口容易爆满 | 各 Agent 独立管理上下文 |
| 难以处理多步骤复杂任务 | 任务分解，协同完成 |

## 架构模式

### 模式一：Supervisor（管理者）

一个管理者 Agent 负责分配任务，多个工人 Agent 负责执行：

```
                ┌─────────────┐
   用户 ───────→│ Supervisor  │
                │ (管理者)     │
                └──────┬──────┘
                       │ 分配任务
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ 搜索 Agent│ │ 分析 Agent│ │ 编码 Agent│
    └──────────┘ └──────────┘ └──────────┘
          │            │            │
          └────────────┼────────────┘
                       │ 汇报结果
                ┌──────▼──────┐
                │ Supervisor  │ → 汇总回答
                └─────────────┘
```

### 模式二：Pipeline（流水线）

Agent 按顺序接力处理：

```
用户 → [提取 Agent] → [翻译 Agent] → [审核 Agent] → 输出
```

### 模式三：Debate（辩论）

多个 Agent 对同一问题给出不同观点，最终由仲裁者综合：

```
              ┌─────────────┐
              │   问题       │
              └──────┬──────┘
         ┌───────────┼───────────┐
         ▼           ▼           ▼
   ┌──────────┐┌──────────┐┌──────────┐
   │ 正方 Agent││ 反方 Agent││ 中立 Agent│
   └────┬─────┘└────┬─────┘└────┬─────┘
        └───────────┼───────────┘
                    ▼
            ┌──────────────┐
            │  仲裁者 Agent  │ → 综合结论
            └──────────────┘
```

## 核心实现

### Agent 基础定义

```go
package multiagent

import "context"

// Agent 接口
type Agent interface {
    Name() string
    Description() string
    Run(ctx context.Context, input string) (string, error)
}

// BaseAgent 基础 Agent 实现
type BaseAgent struct {
    name        string
    description string
    llm         LLM
    tools       []Tool
    systemPrompt string
}

func NewAgent(name, description, systemPrompt string, llm LLM, tools ...Tool) *BaseAgent {
    return &BaseAgent{
        name:         name,
        description:  description,
        llm:          llm,
        tools:        tools,
        systemPrompt: systemPrompt,
    }
}

func (a *BaseAgent) Name() string        { return a.name }
func (a *BaseAgent) Description() string { return a.description }

func (a *BaseAgent) Run(ctx context.Context, input string) (string, error) {
    messages := []Message{
        {Role: "system", Content: a.systemPrompt},
        {Role: "user", Content: input},
    }
    
    // 使用 ReAct 循环执行（复用前一章的逻辑）
    return reactLoop(ctx, a.llm, a.tools, messages, 5)
}
```

### Supervisor 实现

```go
package multiagent

import (
    "context"
    "encoding/json"
    "fmt"
    "strings"
)

// Supervisor 管理者 Agent
type Supervisor struct {
    llm    LLM
    agents map[string]Agent
}

func NewSupervisor(llm LLM) *Supervisor {
    return &Supervisor{
        llm:    llm,
        agents: make(map[string]Agent),
    }
}

func (s *Supervisor) Register(agent Agent) {
    s.agents[agent.Name()] = agent
}

// 任务分配结构
type TaskAssignment struct {
    AgentName string `json:"agent_name"`
    Task      string `json:"task"`
    Reason    string `json:"reason"`
}

type Plan struct {
    Tasks []TaskAssignment `json:"tasks"`
}

func (s *Supervisor) Run(ctx context.Context, query string) (string, error) {
    // 1. 制定执行计划
    plan, err := s.makePlan(ctx, query)
    if err != nil {
        return "", fmt.Errorf("制定计划失败: %w", err)
    }

    // 2. 分配并执行任务
    results := make(map[string]string)
    for _, task := range plan.Tasks {
        agent, ok := s.agents[task.AgentName]
        if !ok {
            results[task.AgentName] = fmt.Sprintf("错误：未找到 Agent %s", task.AgentName)
            continue
        }

        result, err := agent.Run(ctx, task.Task)
        if err != nil {
            results[task.AgentName] = fmt.Sprintf("执行失败: %s", err.Error())
        } else {
            results[task.AgentName] = result
        }
    }

    // 3. 汇总结果
    return s.summarize(ctx, query, results)
}

func (s *Supervisor) makePlan(ctx context.Context, query string) (*Plan, error) {
    // 构建 Agent 描述列表
    var agentList strings.Builder
    for name, agent := range s.agents {
        agentList.WriteString(fmt.Sprintf("- %s: %s\n", name, agent.Description()))
    }

    prompt := fmt.Sprintf(`你是一个任务协调器。根据用户的问题，决定应该分配给哪些 Agent 执行。

可用 Agent 列表：
%s

用户问题：%s

请以 JSON 格式输出任务分配计划：
{"tasks": [{"agent_name": "Agent名称", "task": "具体任务描述", "reason": "选择原因"}]}

只输出 JSON。`, agentList.String(), query)

    resp, err := s.llm.Generate(ctx, prompt)
    if err != nil {
        return nil, err
    }

    var plan Plan
    if err := json.Unmarshal([]byte(resp), &plan); err != nil {
        return nil, fmt.Errorf("解析计划失败: %w", err)
    }
    return &plan, nil
}

func (s *Supervisor) summarize(ctx context.Context, query string, results map[string]string) (string, error) {
    var resultText strings.Builder
    for agent, result := range results {
        resultText.WriteString(fmt.Sprintf("### %s 的结果：\n%s\n\n", agent, result))
    }

    prompt := fmt.Sprintf(`根据各个 Agent 的执行结果，为用户的原始问题生成一个完整、连贯的最终回答。

用户问题：%s

各 Agent 执行结果：
%s

请整合以上结果，生成最终回答。`, query, resultText.String())

    return s.llm.Generate(ctx, prompt)
}
```

### 使用 Supervisor

```go
func main() {
    llm := openai.New("gpt-4o")
    supervisor := multiagent.NewSupervisor(llm)

    // 注册专业 Agent
    supervisor.Register(multiagent.NewAgent(
        "researcher", "擅长搜索和整理技术资料",
        "你是一个技术调研专家，擅长搜索和整理信息。回答要有引用来源。",
        llm, NewSearchTool(),
    ))

    supervisor.Register(multiagent.NewAgent(
        "coder", "擅长编写 Go 代码",
        "你是一个 Go 代码专家，只输出可运行的代码，附带注释。",
        llm,
    ))

    supervisor.Register(multiagent.NewAgent(
        "reviewer", "擅长代码审查和最佳实践",
        "你是一个代码审查专家，关注安全性、性能和可维护性。",
        llm,
    ))

    // 运行
    result, _ := supervisor.Run(context.Background(),
        "帮我调研 Go 中最好的 HTTP 路由库，然后用它写一个 REST API 示例，最后审查代码质量")
    fmt.Println(result)
    // Supervisor 自动：researcher 调研 → coder 编码 → reviewer 审查 → 汇总
}
```

## Pipeline 模式

```go
package multiagent

import "context"

// Pipeline 流水线模式
type Pipeline struct {
    stages []Agent
}

func NewPipeline(stages ...Agent) *Pipeline {
    return &Pipeline{stages: stages}
}

func (p *Pipeline) Run(ctx context.Context, input string) (string, error) {
    current := input
    for _, agent := range p.stages {
        result, err := agent.Run(ctx, current)
        if err != nil {
            return "", fmt.Errorf("Agent [%s] 失败: %w", agent.Name(), err)
        }
        current = result
    }
    return current, nil
}

// 使用示例：文档翻译流水线
func main() {
    pipeline := multiagent.NewPipeline(
        // Stage 1: 提取核心内容
        multiagent.NewAgent("extractor", "提取核心内容",
            "提取文档中的核心技术内容，去除无关信息", llm),
        // Stage 2: 翻译
        multiagent.NewAgent("translator", "中英翻译",
            "将中文技术文档翻译为地道的英文，保持术语准确", llm),
        // Stage 3: 校审
        multiagent.NewAgent("proofreader", "英文校审",
            "校对英文翻译的准确性和流畅性，修正语法错误", llm),
    )

    result, _ := pipeline.Run(ctx, chineseDoc)
    fmt.Println(result)
}
```

## Debate 模式

```go
package multiagent

import (
    "context"
    "fmt"
    "strings"
    "sync"
)

// DebateSystem 辩论系统
type DebateSystem struct {
    debaters  []Agent     // 辩手
    judge     Agent       // 仲裁者
    rounds    int         // 辩论轮数
}

func NewDebateSystem(judge Agent, rounds int, debaters ...Agent) *DebateSystem {
    return &DebateSystem{
        debaters: debaters,
        judge:    judge,
        rounds:   rounds,
    }
}

func (d *DebateSystem) Run(ctx context.Context, topic string) (string, error) {
    var allArguments []string

    for round := 0; round < d.rounds; round++ {
        // 每轮各辩手并行发言
        var wg sync.WaitGroup
        roundResults := make([]string, len(d.debaters))

        for i, debater := range d.debaters {
            wg.Add(1)
            go func(idx int, agent Agent) {
                defer wg.Done()
                prompt := fmt.Sprintf("话题：%s\n\n之前的讨论：\n%s\n\n请发表你的观点（第 %d 轮）：",
                    topic, strings.Join(allArguments, "\n---\n"), round+1)
                result, _ := agent.Run(ctx, prompt)
                roundResults[idx] = fmt.Sprintf("[%s] %s", agent.Name(), result)
            }(i, debater)
        }
        wg.Wait()

        allArguments = append(allArguments, roundResults...)
    }

    // 仲裁者做最终判断
    judgePrompt := fmt.Sprintf(`话题：%s

以下是各方观点：
%s

请公正地综合所有观点，给出最终结论。`, topic, strings.Join(allArguments, "\n\n---\n\n"))

    return d.judge.Run(ctx, judgePrompt)
}

// 使用示例：技术选型辩论
func main() {
    debate := multiagent.NewDebateSystem(
        // 仲裁者
        multiagent.NewAgent("judge", "技术仲裁",
            "你是一个公正的技术决策专家", llm),
        2, // 2 轮辩论
        // 辩手们
        multiagent.NewAgent("pro_micro", "微服务支持者",
            "你坚定支持微服务架构，强调其灵活性和可扩展性", llm),
        multiagent.NewAgent("pro_mono", "单体架构支持者",
            "你坚定支持单体架构，强调其简单性和低运维成本", llm),
        multiagent.NewAgent("moderate", "中立分析师",
            "你持中立立场，客观分析两种架构的适用场景", llm),
    )

    result, _ := debate.Run(ctx, "一个日活 10 万的 SaaS 产品，应该用微服务还是单体架构？")
    fmt.Println(result)
}
```

## Agent 间通信

### 消息总线

```go
package multiagent

import "sync"

// MessageBus Agent 间的消息总线
type MessageBus struct {
    mu          sync.RWMutex
    subscribers map[string][]chan AgentMessage
}

type AgentMessage struct {
    From    string      `json:"from"`
    To      string      `json:"to"`
    Type    string      `json:"type"`   // request/response/broadcast
    Content string      `json:"content"`
}

func NewMessageBus() *MessageBus {
    return &MessageBus{
        subscribers: make(map[string][]chan AgentMessage),
    }
}

// Subscribe 订阅消息
func (b *MessageBus) Subscribe(agentName string) <-chan AgentMessage {
    b.mu.Lock()
    defer b.mu.Unlock()
    ch := make(chan AgentMessage, 10)
    b.subscribers[agentName] = append(b.subscribers[agentName], ch)
    return ch
}

// Publish 发送消息
func (b *MessageBus) Publish(msg AgentMessage) {
    b.mu.RLock()
    defer b.mu.RUnlock()

    if msg.To == "*" {
        // 广播
        for _, channels := range b.subscribers {
            for _, ch := range channels {
                ch <- msg
            }
        }
    } else {
        // 定向发送
        for _, ch := range b.subscribers[msg.To] {
            ch <- msg
        }
    }
}
```

## 模式选择指南

| 模式 | 适用场景 | 优点 | 缺点 |
|------|----------|------|------|
| **Supervisor** | 任务可分解为独立子任务 | 灵活，可动态分配 | Supervisor 是瓶颈 |
| **Pipeline** | 固定顺序的处理流程 | 简单直观 | 不够灵活 |
| **Debate** | 需要多角度分析 | 结论更全面 | token 消耗大 |
| **消息总线** | 动态协作场景 | 松耦合 | 实现复杂 |

## 实战建议

```
构建多 Agent 系统的最佳实践：

1. 先用单 Agent 验证可行性
2. 明确每个 Agent 的职责边界
3. 控制 Agent 数量（3-5 个为宜）
4. 为每个 Agent 配备专用工具
5. Supervisor 的 Prompt 要简洁明确
6. 添加超时和重试机制
7. 记录每个 Agent 的执行日志
```

::: tip 下一章回顾 Go Agent 框架，看看成熟框架如何实现本章介绍的这些模式。
:::
