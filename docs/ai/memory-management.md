---
order : 5
icon : mdi:memory
---

# 5. Memory 与对话管理

Agent 的记忆系统决定了它能否在多轮对话中保持上下文连贯。没有记忆的 Agent 每次对话都像是第一次见面，无法胜任复杂的交互场景。

## 记忆类型

```
Agent 记忆体系

┌─────────────────────────────────────────────┐
│  短期记忆（Buffer Memory）                    │
│  存储当前会话的完整对话历史                     │
│  生命周期：单次会话                            │
├─────────────────────────────────────────────┤
│  窗口记忆（Window Memory）                    │
│  只保留最近 N 轮对话                           │
│  解决上下文窗口限制                            │
├─────────────────────────────────────────────┤
│  摘要记忆（Summary Memory）                   │
│  将历史对话压缩为摘要                          │
│  兼顾历史信息和 token 开销                     │
├─────────────────────────────────────────────┤
│  向量记忆（Vector Memory）                    │
│  将对话向量化存入向量数据库                     │
│  支持语义检索历史信息                          │
│  生命周期：永久                               │
└─────────────────────────────────────────────┘
```

## 记忆接口设计

```go
package memory

import "context"

// Message 消息结构
type Message struct {
    Role      string `json:"role"`       // system/user/assistant/tool
    Content   string `json:"content"`
    Timestamp int64  `json:"timestamp"`
}

// Memory 记忆接口
type Memory interface {
    // Add 添加一条消息
    Add(ctx context.Context, msg Message) error
    // Get 获取历史消息
    Get(ctx context.Context) ([]Message, error)
    // Clear 清空记忆
    Clear(ctx context.Context) error
}
```

## 短期记忆（Buffer Memory）

最简单的实现，存储当前会话的所有消息：

```go
package memory

import (
    "context"
    "sync"
)

// BufferMemory 完整对话历史
type BufferMemory struct {
    mu       sync.RWMutex
    messages []Message
}

func NewBufferMemory() *BufferMemory {
    return &BufferMemory{
        messages: make([]Message, 0),
    }
}

func (m *BufferMemory) Add(ctx context.Context, msg Message) error {
    m.mu.Lock()
    defer m.mu.Unlock()
    m.messages = append(m.messages, msg)
    return nil
}

func (m *BufferMemory) Get(ctx context.Context) ([]Message, error) {
    m.mu.RLock()
    defer m.mu.RUnlock()
    result := make([]Message, len(m.messages))
    copy(result, m.messages)
    return result, nil
}

func (m *BufferMemory) Clear(ctx context.Context) error {
    m.mu.Lock()
    defer m.mu.Unlock()
    m.messages = m.messages[:0]
    return nil
}
```

::: warning 缺点
对话越长，消耗的 token 越多。当对话超过模型上下文窗口（如 8K tokens）时会报错。
:::

## 窗口记忆（Window Memory）

只保留最近 N 轮对话，自动丢弃更早的历史：

```go
package memory

import (
    "context"
    "sync"
)

// WindowMemory 滑动窗口记忆
type WindowMemory struct {
    mu       sync.RWMutex
    messages []Message
    maxPairs int  // 保留的最大对话轮数（一问一答算一轮）
}

func NewWindowMemory(maxPairs int) *WindowMemory {
    return &WindowMemory{
        messages: make([]Message, 0),
        maxPairs: maxPairs,
    }
}

func (m *WindowMemory) Add(ctx context.Context, msg Message) error {
    m.mu.Lock()
    defer m.mu.Unlock()
    
    m.messages = append(m.messages, msg)
    m.trim()
    return nil
}

func (m *WindowMemory) Get(ctx context.Context) ([]Message, error) {
    m.mu.RLock()
    defer m.mu.RUnlock()
    result := make([]Message, len(m.messages))
    copy(result, m.messages)
    return result, nil
}

// trim 保留 system 消息 + 最近 N 轮对话
func (m *WindowMemory) trim() {
    // 分离 system 消息
    var systemMsgs, chatMsgs []Message
    for _, msg := range m.messages {
        if msg.Role == "system" {
            systemMsgs = append(systemMsgs, msg)
        } else {
            chatMsgs = append(chatMsgs, msg)
        }
    }

    // 只保留最近 maxPairs * 2 条聊天消息
    maxChat := m.maxPairs * 2
    if len(chatMsgs) > maxChat {
        chatMsgs = chatMsgs[len(chatMsgs)-maxChat:]
    }

    m.messages = append(systemMsgs, chatMsgs...)
}

func (m *WindowMemory) Clear(ctx context.Context) error {
    m.mu.Lock()
    defer m.mu.Unlock()
    m.messages = m.messages[:0]
    return nil
}
```

## 摘要记忆（Summary Memory）

用 LLM 将历史对话压缩为摘要，兼顾信息保留和 token 节省：

```go
package memory

import (
    "context"
    "fmt"
    "sync"
)

// Summarizer 摘要生成接口
type Summarizer interface {
    Summarize(ctx context.Context, messages []Message) (string, error)
}

// SummaryMemory 摘要记忆
type SummaryMemory struct {
    mu          sync.RWMutex
    summary     string       // 历史摘要
    recent      []Message    // 最近的消息
    maxRecent   int          // 最近消息的最大数量
    summarizer  Summarizer   // 摘要生成器
}

func NewSummaryMemory(summarizer Summarizer, maxRecent int) *SummaryMemory {
    return &SummaryMemory{
        recent:     make([]Message, 0),
        maxRecent:  maxRecent,
        summarizer: summarizer,
    }
}

func (m *SummaryMemory) Add(ctx context.Context, msg Message) error {
    m.mu.Lock()
    defer m.mu.Unlock()

    m.recent = append(m.recent, msg)

    // 当最近消息过多时，触发摘要压缩
    if len(m.recent) > m.maxRecent {
        // 取出需要被压缩的消息
        toSummarize := m.recent[:len(m.recent)-m.maxRecent/2]
        
        // 生成摘要
        newSummary, err := m.summarizer.Summarize(ctx, toSummarize)
        if err != nil {
            return err
        }

        // 更新摘要和最近消息
        if m.summary != "" {
            m.summary = m.summary + "\n" + newSummary
        } else {
            m.summary = newSummary
        }
        m.recent = m.recent[len(m.recent)-m.maxRecent/2:]
    }

    return nil
}

func (m *SummaryMemory) Get(ctx context.Context) ([]Message, error) {
    m.mu.RLock()
    defer m.mu.RUnlock()

    var result []Message
    
    // 将摘要作为 system 消息注入
    if m.summary != "" {
        result = append(result, Message{
            Role:    "system",
            Content: fmt.Sprintf("以下是之前对话的摘要：\n%s", m.summary),
        })
    }

    result = append(result, m.recent...)
    return result, nil
}
```

### LLM 摘要生成器实现

```go
package memory

import (
    "context"
    "strings"
)

// LLMSummarizer 使用 LLM 生成对话摘要
type LLMSummarizer struct {
    llm LLM // LLM 接口
}

func (s *LLMSummarizer) Summarize(ctx context.Context, messages []Message) (string, error) {
    // 将消息格式化为文本
    var conv strings.Builder
    for _, msg := range messages {
        conv.WriteString(fmt.Sprintf("%s: %s\n", msg.Role, msg.Content))
    }

    prompt := fmt.Sprintf(`请将以下对话内容压缩为简洁的摘要。
保留关键信息、用户偏好和重要结论。删除寒暄和冗余内容。

对话内容：
%s

摘要：`, conv.String())

    return s.llm.Generate(ctx, prompt)
}
```

## 向量记忆（Vector Memory）

将对话内容向量化存储，支持按语义检索历史信息，实现真正的长期记忆：

```go
package memory

import (
    "context"
    "fmt"
    "time"
)

// VectorMemory 向量记忆 - 语义检索历史
type VectorMemory struct {
    vectorStore VectorStore   // 向量数据库
    embedder    Embedder      // Embedding 模型
    buffer      *WindowMemory // 短期记忆（当前会话）
    sessionID   string        // 会话 ID
}

func NewVectorMemory(store VectorStore, embedder Embedder, sessionID string) *VectorMemory {
    return &VectorMemory{
        vectorStore: store,
        embedder:    embedder,
        buffer:      NewWindowMemory(5),
        sessionID:   sessionID,
    }
}

func (m *VectorMemory) Add(ctx context.Context, msg Message) error {
    // 1. 存入短期记忆
    m.buffer.Add(ctx, msg)

    // 2. 异步存入向量数据库（长期记忆）
    go func() {
        embedding, err := m.embedder.Embed(ctx, msg.Content)
        if err != nil {
            return
        }

        m.vectorStore.Insert(ctx, VectorDocument{
            ID:        fmt.Sprintf("%s-%d", m.sessionID, time.Now().UnixNano()),
            Content:   msg.Content,
            Vector:    embedding,
            Metadata: map[string]string{
                "role":       msg.Role,
                "session_id": m.sessionID,
                "timestamp":  fmt.Sprintf("%d", msg.Timestamp),
            },
        })
    }()

    return nil
}

func (m *VectorMemory) Get(ctx context.Context) ([]Message, error) {
    return m.buffer.Get(ctx)
}

// Search 语义检索历史对话
func (m *VectorMemory) Search(ctx context.Context, query string, topK int) ([]Message, error) {
    queryEmbed, err := m.embedder.Embed(ctx, query)
    if err != nil {
        return nil, err
    }

    results, err := m.vectorStore.Search(ctx, queryEmbed, topK)
    if err != nil {
        return nil, err
    }

    messages := make([]Message, len(results))
    for i, r := range results {
        messages[i] = Message{
            Role:    r.Metadata["role"],
            Content: r.Content,
        }
    }
    return messages, nil
}
```

### 在 Agent 中使用向量记忆

```go
func (a *Agent) Chat(ctx context.Context, userInput string) (string, error) {
    // 1. 从向量记忆中检索相关历史
    relatedHistory, _ := a.memory.Search(ctx, userInput, 3)

    // 2. 获取最近对话
    recentHistory, _ := a.memory.Get(ctx)

    // 3. 构建消息列表
    messages := []Message{
        {Role: "system", Content: a.systemPrompt},
    }

    // 注入相关历史（如果有）
    if len(relatedHistory) > 0 {
        var historyText strings.Builder
        historyText.WriteString("以下是与当前话题相关的历史对话：\n")
        for _, h := range relatedHistory {
            historyText.WriteString(fmt.Sprintf("- %s\n", h.Content))
        }
        messages = append(messages, Message{
            Role: "system", Content: historyText.String(),
        })
    }

    // 加入最近对话
    messages = append(messages, recentHistory...)
    messages = append(messages, Message{Role: "user", Content: userInput})

    // 4. 调用 LLM
    response, err := a.llm.Chat(ctx, messages)
    if err != nil {
        return "", err
    }

    // 5. 存入记忆
    a.memory.Add(ctx, Message{Role: "user", Content: userInput})
    a.memory.Add(ctx, Message{Role: "assistant", Content: response})

    return response, nil
}
```

## Session 持久化

将会话持久化到文件或数据库，支持断线续聊：

```go
package memory

import (
    "encoding/json"
    "os"
    "path/filepath"
)

// FileSessionStore 基于文件的会话存储
type FileSessionStore struct {
    dir string
}

func NewFileSessionStore(dir string) *FileSessionStore {
    os.MkdirAll(dir, 0755)
    return &FileSessionStore{dir: dir}
}

// Save 保存会话
func (s *FileSessionStore) Save(sessionID string, messages []Message) error {
    path := filepath.Join(s.dir, sessionID+".json")
    data, err := json.MarshalIndent(messages, "", "  ")
    if err != nil {
        return err
    }
    return os.WriteFile(path, data, 0644)
}

// Load 加载会话
func (s *FileSessionStore) Load(sessionID string) ([]Message, error) {
    path := filepath.Join(s.dir, sessionID+".json")
    data, err := os.ReadFile(path)
    if err != nil {
        if os.IsNotExist(err) {
            return []Message{}, nil // 新会话
        }
        return nil, err
    }

    var messages []Message
    if err := json.Unmarshal(data, &messages); err != nil {
        return nil, err
    }
    return messages, nil
}

// List 列出所有会话
func (s *FileSessionStore) List() ([]string, error) {
    entries, err := os.ReadDir(s.dir)
    if err != nil {
        return nil, err
    }

    var sessions []string
    for _, e := range entries {
        if filepath.Ext(e.Name()) == ".json" {
            sessions = append(sessions, 
                strings.TrimSuffix(e.Name(), ".json"))
        }
    }
    return sessions, nil
}
```

## 记忆策略选择

| 策略 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **Buffer** | 信息完整 | token 消耗大 | 短对话、简单问答 |
| **Window** | 控制成本 | 丢失早期信息 | 多数通用场景 |
| **Summary** | 保留关键信息 | 摘要可能丢失细节 | 长对话、客服 |
| **Vector** | 精准召回 | 实现复杂 | 知识型 Agent |
| **混合** | 效果最佳 | 实现最复杂 | 生产级 Agent |

### 推荐组合

```
生产级 Agent 记忆方案：

Window Memory（最近 10 轮）
    ↕ 实时读写
Agent Core
    ↕ 语义检索
Vector Memory（全量历史）
    ↕ 定期压缩
Summary Memory（历史摘要）
```

## 小结

| 要点 | 说明 |
|------|------|
| 接口抽象 | 统一 Memory 接口，方便切换策略 |
| 并发安全 | 使用 sync.RWMutex 保护共享状态 |
| 窗口策略 | 保留 system 消息 + 最近 N 轮 |
| 向量记忆 | 语义检索实现长期记忆 |
| 持久化 | 支持断线续聊的会话管理 |

::: tip 基础篇到此结束。下一章进入进阶篇，学习 RAG 检索增强生成，让 Agent 拥有专属知识库。
:::
