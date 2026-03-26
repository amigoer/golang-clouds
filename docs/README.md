---
home: true
icon: home
title: 首页
breadcrumbExclude: true
heroImage: /logo.png
heroText: Golang Clouds
tagline: Go 语言全栈开发知识库 — 从基础语法到 AI Agent 开发
lang : zh-CN

bgImage: /assets/bg/6-light.svg
bgImageDark: /assets/bg/6-dark.svg
bgImageStyle:
  background-attachment: fixed

actions:
  - text: 开始学习
    icon: mingcute:bulb-fill
    link: ./golang/core/basic/
    type: primary

  - text: AI Agent 教程
    icon: hugeicons:artificial-intelligence-04
    link: ./ai/

highlights:

  - header: Go 语言核心
    description: 扎实掌握 Go 语言的基础语法、并发编程与网络编程
    image: /assets/image/go.svg
    bgImage: /assets/bg/3-light.svg
    bgImageDark: /assets/bg/3-dark.svg
    highlights:
      - title: 基础语法
        icon: solar:crown-star-bold
        details: 变量、类型、函数、结构体、接口、错误处理
        link: /golang/core/basic/

      - title: 并发编程
        icon: ic:outline-sync-lock
        details: Goroutine、Channel、sync 包、并发模式
        link: /golang/core/concurrent/

      - title: 网络编程
        icon: zondicons:network
        details: HTTP、TCP/UDP、WebSocket 协议实战
        link: /golang/core/network/

      - title: Gin 框架
        icon: simple-icons:lightning
        details: Go 最流行的高性能 Web 框架
        link: /golang/web/gin/

  - header: AI Agent 开发
    description: 从零开始，系统学习 Go 语言 AI Agent 开发
    image: /assets/image/features.svg
    bgImage: /assets/bg/1-light.svg
    bgImageDark: /assets/bg/1-dark.svg
    highlights:
      - title: 核心概念
        icon: mdi:lightbulb-outline
        details: Agent 定义、ReAct 模式、Embedding
        link: /ai/agent-concepts

      - title: 环境搭建
        icon: vscode-icons:file-type-config
        details: Ollama 部署、API 配置、第一次调用
        link: /ai/setup-environment

      - title: Prompt 工程
        icon: fluent:prompt-24-filled
        details: System Prompt、Few-shot、CoT 技巧
        link: /ai/prompt-engineering

      - title: Tool Calling
        icon: mdi:tools
        details: 工具定义、多工具协同、MCP 协议
        link: /ai/tool-calling

      - title: Memory 管理
        icon: mdi:memory
        details: Buffer/Window/Summary/Vector 四种策略
        link: /ai/memory-management

      - title: RAG
        icon: mdi:database-search
        details: 分块策略、混合搜索、重排序
        link: /ai/rag

      - title: 工作流编排
        icon: material-symbols:flowsheet
        details: ReAct Loop、Chain、Graph、并行执行
        link: /ai/agent-workflow

      - title: 多 Agent 系统
        icon: fluent:people-team-24-filled
        details: Supervisor / Pipeline / Debate 模式
        link: /ai/multi-agent

      - title: 框架对比
        icon: mdi:compare
        details: LangChainGo / Eino / Genkit / Lingoose
        link: /ai/go-agent-frameworks

      - title: 生产部署
        icon: material-symbols:deployed-code
        details: 可观测性、安全防护、成本控制
        link: /ai/production-deployment

  - header: 云原生 & 工具链
    description: 后端开发者的必备技术栈
    image: /assets/image/box.svg
    bgImage: /assets/bg/4-light.svg
    bgImageDark: /assets/bg/4-dark.svg
    highlights:
      - title: Docker
        icon: uil:docker
        details: 容器化平台，打包、发布和运行应用
        link: /backend-tech/cloud-native/docker/

      - title: Kubernetes
        icon: mdi:kubernetes
        details: 容器编排引擎，自动化部署与管理
        link: /backend-tech/cloud-native/kubernetes/

      - title: Git
        icon: bi:git
        details: 分布式版本控制，团队协作必备
        link: /backend-tech/general/git/

  - header: 开源生态
    description: Go 社区的标准库、开源库与优秀项目
    image: /assets/image/open-source.svg
    bgImage: /assets/bg/5-light.svg
    bgImageDark: /assets/bg/5-dark.svg
    highlights:
      - title: 标准库
        icon: majesticons:library
        details: Go 标准库核心包详解与实战
        link: /golang/community/standard-library/

      - title: 开源库
        icon: fontisto:ampproject
        details: 社区热门第三方库速览与对比
        link: /golang/community/open-library/

      - title: 开源项目
        icon: raphael:opensource
        details: 优秀 Go 开源项目推荐与分析
        link: /golang/community/open-project/

  - header: 参与贡献
    image: /assets/image/github-dark.svg
    bgImage: /assets/bg/4-light.svg
    bgImageDark: /assets/bg/4-dark.svg
    highlights:
      - title: 本项目开源至：<img src="/assets/image/github-repo.svg" />
        link : https://github.com/amigoer/golang-clouds
      - title: 欢迎在本项目仓库提交 PR，一起完善这份知识库。

copyright: false
footer: <a href="https://github.com/amigoer/golang-clouds" target="_blank">Golang Clouds</a> &#124 Copyright © 2026 Amigoer
---
