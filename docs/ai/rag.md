---
order : 2
icon : fluent:document-search-24-filled
---

# 2. RAG 检索增强生成

## 什么是 RAG

RAG（Retrieval-Augmented Generation，检索增强生成）通过在生成回答前**先检索相关知识**，让 LLM 能够基于外部数据源给出准确、有据可查的回答，有效解决大模型的**幻觉问题**和**知识过时问题**。

```
传统 LLM:     用户提问 → LLM 直接回答（可能编造信息）

RAG 增强:     用户提问 → 检索相关文档 → 将文档+问题一起发给 LLM → 有据回答
```

## RAG 系统架构

```
                        RAG 完整流程
                        
┌─────────────────── 离线索引阶段 ───────────────────┐
│                                                     │
│  文档 → 分块(Chunking) → 向量化(Embedding) → 存储   │
│                                                     │
│  PDF ─┐                    ┌──────────┐             │
│  MD  ─┤→ 文本分块 → Embed →│ 向量数据库 │            │
│  HTML─┘                    └──────────┘             │
└─────────────────────────────────────────────────────┘

┌─────────────────── 在线查询阶段 ───────────────────┐
│                                                     │
│  用户问题 → Embed → 向量检索 → Top-K 文档           │
│                   ↓                                 │
│            构造 Prompt（问题 + 检索文档）             │
│                   ↓                                 │
│              LLM 生成回答                            │
└─────────────────────────────────────────────────────┘
```

## 文档分块策略

分块（Chunking）是 RAG 中最关键的预处理步骤，直接影响检索质量。

### 常用分块方法

| 方法 | 适用场景 | 特点 |
|------|----------|------|
| **固定大小分块** | 通用文档 | 简单直接，按字符/token 数量切分 |
| **语义分块** | 长文章 | 在主题切换处分割，保持语义完整 |
| **层次化分块** | 技术文档 | 按标题层级分割，保留文档结构 |
| **重叠分块** | 所有场景 | 相邻块有 10-20% 重叠，防止上下文丢失 |

### 分块参数参考

```
文档类型          推荐块大小       重叠率
─────────────────────────────────────
技术文档          300-500 tokens   15%
对话记录          200-300 tokens   10%
长篇文章          500-800 tokens   20%
代码文件          按函数/类分割     —
```

### Go 实现示例

```go
// 基于固定大小 + 重叠的分块器
type TextSplitter struct {
    ChunkSize    int     // 每块大小
    ChunkOverlap int     // 重叠大小
    Separator    string  // 分隔符
}

func (s *TextSplitter) Split(text string) []string {
    var chunks []string
    // 按分隔符分割
    paragraphs := strings.Split(text, s.Separator)
    
    current := ""
    for _, p := range paragraphs {
        if len(current)+len(p) > s.ChunkSize {
            chunks = append(chunks, strings.TrimSpace(current))
            // 保留重叠部分
            overlap := current[max(0, len(current)-s.ChunkOverlap):]
            current = overlap + p
        } else {
            current += s.Separator + p
        }
    }
    if current != "" {
        chunks = append(chunks, strings.TrimSpace(current))
    }
    return chunks
}

// 使用
splitter := &TextSplitter{
    ChunkSize:    500,
    ChunkOverlap: 50,
    Separator:    "\n\n",
}
chunks := splitter.Split(document)
```

## 检索策略

### 基础检索：向量相似度搜索

```go
// 将用户查询向量化后，在向量数据库中搜索最相似的文档块
queryEmbedding := embeddingModel.Embed("如何在 Go 中实现并发？")

results := vectorDB.Search(ctx, SearchParams{
    Vector: queryEmbedding,
    TopK:   5,   // 返回最相似的 5 个文档块
})
```

### 进阶检索：混合搜索

结合 **关键词搜索** 和 **语义搜索** 的优势：

```
混合搜索 = α × 向量相似度 + (1-α) × 关键词匹配度

α = 0.7 时，以语义为主，关键词为辅
```

```go
// 混合搜索伪代码
func HybridSearch(query string, alpha float64) []Document {
    // 语义搜索
    semanticResults := vectorDB.SemanticSearch(query, topK)
    // 关键词搜索（BM25）
    keywordResults := fullTextIndex.Search(query, topK)
    
    // 融合排序（RRF - Reciprocal Rank Fusion）
    merged := reciprocalRankFusion(semanticResults, keywordResults, alpha)
    return merged
}
```

### 重排序（Re-ranking）

两阶段检索：先粗搜返回较多候选，再用精排模型重新排序：

```
第一阶段：向量检索 Top-20（快速，低成本）
    ↓
第二阶段：重排序模型 → Top-5（精确，高质量）
```

```go
// 重排序示例
candidates := vectorDB.Search(query, topK: 20)  // 粗搜

// 使用 Cross-Encoder 重排序
reranked := reranker.Rerank(query, candidates)
finalResults := reranked[:5]  // 取 Top-5
```

## Prompt 构造

将检索到的文档与用户问题组装成 Prompt 送给 LLM：

```go
func BuildRAGPrompt(question string, docs []Document) string {
    var context strings.Builder
    for i, doc := range docs {
        context.WriteString(fmt.Sprintf("【文档%d】%s\n", i+1, doc.Content))
    }
    
    return fmt.Sprintf(`你是一个专业的技术助手。请基于以下参考文档回答用户问题。
如果文档中没有相关信息，请明确说明。不要编造信息。

## 参考文档
%s

## 用户问题
%s

## 回答要求
1. 优先引用参考文档中的信息
2. 如果信息不足，明确告知用户
3. 回答需要简洁准确`, context.String(), question)
}
```

## RAG 评估指标

| 指标 | 衡量内容 | 目标 |
|------|----------|------|
| **检索准确率** | 检索到的文档是否与问题相关 | > 90% |
| **生成忠实度** | 回答是否忠实于检索到的文档 | > 95% |
| **响应延迟** | 端到端响应时间 | < 2s |
| **幻觉率** | 回答中编造信息的比例 | < 5% |

## 进阶 RAG 方案

### GraphRAG（知识图谱增强）

将文档构建成知识图谱，在检索时利用实体间的关系进行推理：

```
传统 RAG：基于文本块的扁平检索
GraphRAG：基于实体-关系的结构化检索，支持多跳推理
```

### Agentic RAG（智能体增强）

将 RAG 嵌入 Agent 工作流中，Agent 可以：

- 动态决定是否需要检索
- 根据检索结果质量决定是否需要重新检索
- 从多个知识库中分别检索并汇总

```
用户提问
  ↓
Agent 分析: 需要检索吗？
  ↓ 是
选择知识库 → 检索 → 评估质量
  ↓ 质量不足
调整查询 → 重新检索 → 评估
  ↓ 质量满足
组装上下文 → 生成回答
```

### Self-RAG（自反思）

LLM 在生成回答过程中**自我评估**是否需要检索、检索结果是否有用、回答是否忠实于来源。

## 小结

| 环节 | 关键点 |
|------|--------|
| 分块 | 合理的块大小 + 适当重叠 + 保持语义完整 |
| 向量化 | 选择适合场景的 Embedding 模型 |
| 检索 | 混合搜索 + 重排序提升精度 |
| 生成 | 明确的 Prompt 模板 + 引用来源 |
| 评估 | 持续监控检索准确率和生成忠实度 |

::: tip 下一章将介绍 Go 语言中实现 RAG 和 Agent 的主流框架。
:::
