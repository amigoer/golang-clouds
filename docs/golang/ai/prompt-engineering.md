---
order : 3
icon : fluent:prompt-24-filled
---

# 3. Prompt 工程

Prompt 工程是 Agent 开发的核心技能。一个好的 Prompt 可以让 LLM 的输出质量提升数倍，而一个差的 Prompt 则会导致不可控的幻觉和错误。

## 消息角色

LLM 对话由三种角色的消息组成：

| 角色 | 作用 | 特点 |
|------|------|------|
| **System** | 设定 AI 的身份、规则和行为边界 | 全局生效，优先级最高 |
| **User** | 用户输入的问题或指令 | 每轮对话的触发器 |
| **Assistant** | AI 的回复内容 | 也可用于提供示例（Few-shot） |

```go
messages := []Message{
    {Role: "system",    Content: "你是一个 Go 语言专家，回答简洁精确"},
    {Role: "user",      Content: "什么是 channel？"},
    {Role: "assistant", Content: "channel 是 Go 中 goroutine 间通信的管道"},
    {Role: "user",      Content: "给个代码示例"},
}
```

## System Prompt 设计

System Prompt 是控制 Agent 行为最关键的部分。一个优秀的 System Prompt 通常包含以下要素：

### 结构化模板

```
你是 [角色定义]。

## 能力
- [能力 1]
- [能力 2]

## 规则
1. [必须遵守的规则]
2. [输出格式要求]
3. [限制和边界]

## 输出格式
[期望的输出结构]
```

### 实际示例

```go
const systemPrompt = `你是一名资深 Go 语言代码审查专家。

## 能力
- 分析 Go 代码的正确性、性能和安全性
- 识别常见的并发问题（data race、deadlock）
- 提供符合 Go 惯用法的改进建议

## 审查规则
1. 每个问题按严重程度分为：🔴 严重 | 🟡 警告 | 🔵 建议
2. 每个问题必须提供修复后的代码
3. 始终参考 Go 官方文档和 Effective Go
4. 不确定的问题标注"需要确认"

## 输出格式
### 审查结果
- [严重程度] 问题描述
  - 位置：文件名:行号
  - 原因：为什么这是问题
  - 修复：修复后的代码片段

### 总评
综合评分（1-10）和一句话总结`
```

## Prompt 技术

### Zero-shot（零样本）

直接提问，不给示例。适合简单、明确的任务：

```go
prompt := "将以下 JSON 数据转换为 Go 结构体定义：{\"name\":\"张三\",\"age\":18}"
```

### Few-shot（少样本）

通过提供 2-3 个示例，教会模型输出格式和风格：

```go
messages := []Message{
    {Role: "system", Content: "你是一个 Go 函数文档生成器"},
    
    // 示例 1
    {Role: "user", Content: "func Add(a, b int) int"},
    {Role: "assistant", Content: `// Add 计算两个整数的和。
//
// 参数:
//   - a: 第一个整数
//   - b: 第二个整数
//
// 返回值:
//   两个整数的和`},
    
    // 示例 2
    {Role: "user", Content: "func Contains(s, substr string) bool"},
    {Role: "assistant", Content: `// Contains 检查字符串 s 是否包含子串 substr。
//
// 参数:
//   - s: 被搜索的字符串
//   - substr: 要查找的子串
//
// 返回值:
//   如果 s 包含 substr 返回 true，否则返回 false`},
    
    // 实际请求
    {Role: "user", Content: "func ReadFile(path string) ([]byte, error)"},
}
```

### Chain-of-Thought（思维链）

引导模型逐步推理，提升复杂问题的准确性：

```go
prompt := `分析以下 Go 代码是否存在并发安全问题。

请按以下步骤分析：
1. 识别所有共享变量
2. 找出所有可能并发访问共享变量的 goroutine
3. 检查是否有适当的同步机制
4. 给出结论和修复方案

代码：
` + code
```

### Structured Output（结构化输出）

要求 LLM 以固定的 JSON 格式输出，方便程序解析：

```go
prompt := `分析以下 Go 项目的依赖关系，以 JSON 格式输出。

输出格式：
{
    "project": "项目名",
    "go_version": "Go 版本",
    "dependencies": [
        {
            "name": "依赖名",
            "version": "版本号",
            "purpose": "用途说明",
            "risk_level": "low|medium|high"
        }
    ],
    "summary": "一句话总结"
}

只输出 JSON，不要有其他内容。`
```

## Go 模板引擎实践

在实际项目中，Prompt 往往需要动态注入变量。使用 Go 的 `text/template` 管理 Prompt 模板：

```go
package prompt

import (
    "bytes"
    "text/template"
)

// Prompt 模板管理
type PromptTemplate struct {
    tmpl *template.Template
}

// 创建模板
func NewPromptTemplate(name, text string) (*PromptTemplate, error) {
    tmpl, err := template.New(name).Parse(text)
    if err != nil {
        return nil, err
    }
    return &PromptTemplate{tmpl: tmpl}, nil
}

// 渲染模板
func (p *PromptTemplate) Render(data interface{}) (string, error) {
    var buf bytes.Buffer
    if err := p.tmpl.Execute(&buf, data); err != nil {
        return "", err
    }
    return buf.String(), nil
}

// 使用示例
func main() {
    tmpl, _ := NewPromptTemplate("code_review", `你是 {{.Role}}。
请审查以下 {{.Language}} 代码，关注 {{.Focus}}。

代码：
{{.Code}}

请用 {{.OutputLang}} 回答。`)

    result, _ := tmpl.Render(map[string]string{
        "Role":       "资深代码审查专家",
        "Language":   "Go",
        "Focus":      "并发安全和性能",
        "Code":       "func handler(w http.ResponseWriter, r *http.Request) {...}",
        "OutputLang": "中文",
    })
    
    fmt.Println(result)
}
```

### 模板复用库

构建一个可复用的 Prompt 模板库：

```go
// 内置常用模板
var Templates = map[string]string{
    "code_review": `...`,
    "code_gen":    `你是一个 Go 代码生成器。根据以下需求生成代码：
需求：{{.Requirement}}
约束：
- 使用标准库，避免第三方依赖
- 包含完整的错误处理
- 添加中文注释`,
    
    "summarize": `请对以下文本进行摘要。
要求：
- 保留关键信息
- 摘要长度不超过 {{.MaxLength}} 字
- 使用 {{.Style}} 风格

文本：
{{.Text}}`,

    "translate": `将以下 {{.SourceLang}} 文本翻译为 {{.TargetLang}}。
保持技术术语准确，不要过度意译。

{{.Text}}`,
}
```

## Prompt 调优方法论

### 常见问题与解决方案

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 输出太啰嗦 | System Prompt 没限制长度 | 添加「简洁回答，不超过 X 字」 |
| 格式不稳定 | 没给明确的格式示例 | 使用 Few-shot + JSON Schema |
| 幻觉严重 | 问了模型不知道的内容 | 添加「不确定时说不知道」 |
| 忽略规则 | 规则太长或太模糊 | 精简规则，用编号列表 |
| 输出语言不对 | 没指定语言 | 在 System Prompt 开头指定 |

### 迭代流程

```
初始 Prompt
    ↓
测试 10 个代表性输入
    ↓
收集失败案例
    ↓
分析失败原因
    ↓
针对性修改 Prompt
    ↓
再次测试验证
    ↓
固化为模板
```

### 温度选择参考

```
temperature 参数对照表

任务类型              推荐温度    原因
──────────────────────────────────────
代码生成              0.1-0.2    需要确定性和正确性
数据提取/分类         0.0-0.1    需要严格按格式输出
技术文档摘要          0.2-0.3    在准确的基础上保持流畅
问答对话              0.5-0.7    适度创造力
创意写作              0.8-1.0    鼓励多样性
头脑风暴              0.9-1.2    最大创造力
```

## 实用 Prompt 模式

### 角色扮演

```
你现在是一个有 10 年经验的 Go 架构师，在一家日均 1000 万请求的互联网公司工作。
你倾向于简洁的代码和清晰的抽象，反对过度设计。
```

### 约束边界

```
回答规则：
1. 只使用 Go 标准库
2. 代码必须兼容 Go 1.21+
3. 不要使用 unsafe 包
4. 所有错误必须处理，不得使用 panic
```

### 输出控制

```
请严格按以下格式回答，不要有任何额外内容：

```json
{
    "answer": "你的回答",
    "confidence": 0.95,
    "sources": ["来源1", "来源2"]
}
```（输出格式结束）
```

### 自我检查

```
回答后，请自我检查：
1. 代码是否可以编译通过？
2. 是否处理了所有 error？
3. 是否存在并发安全问题？
如果发现问题，直接修正后再输出。
```

## 小结

| 技术 | 适用场景 | 效果 |
|------|----------|------|
| System Prompt | 所有场景 | 定义 Agent 核心行为 |
| Few-shot | 格式控制 | 通过示例固定输出格式 |
| Chain-of-Thought | 复杂推理 | 提升逻辑准确性 |
| 结构化输出 | 程序集成 | 方便解析和处理 |
| 模板引擎 | 生产项目 | 动态生成、可维护 |

::: tip 下一章将学习 Tool Calling，让 Agent 不再只是「说」，而是能够「做」。
:::
