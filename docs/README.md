---
home: true
icon: home
title: 首页
breadcrumbExclude: true
heroImage: /logo.png
heroText: Golang Clouds
tagline: Golang 全栈开发指南 — 涵盖 Go 语言核心、AI Agent 开发、云原生与开源生态
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

  - header : 
    description: 知识图谱，快速定位你想学习的技术栈
    image: /assets/image/index-filled.svg
    bgImage: /assets/bg/2-light.svg
    bgImageDark: /assets/bg/2-dark.svg
    bgImageStyle:
      background-repeat: repeat
      background-size: initial
    features:
      - title: Golang
        icon: grommet-icons:golang
        details: Go 语言核心语法、并发编程、网络编程
        link: /golang/

      - title: AI Agent
        icon: hugeicons:artificial-intelligence-04
        details: Agent 开发教程，从入门到生产部署
        link: /ai/

      - title: Docker
        icon: uil:docker
        details: 容器化平台，打包、发布和运行应用
        link: /backend-tech/cloud-native/docker/

      - title: Kubernetes
        icon: mdi:kubernetes
        details: 容器编排引擎，自动化部署和管理
        link: /backend-tech/cloud-native/kubernetes/

      - title: Gin
        icon: simple-icons:lightning
        details: Go 最流行的高性能 Web 框架
        link: /golang/web/gin/

      - title: Git
        icon: bi:git
        details: 分布式版本控制系统
        link: /backend-tech/general/git/

  - header: Golang 学习路线
    description: 系统化的 Go 语言学习路线
    image: /assets/image/go.svg
    bgImage: /assets/bg/3-light.svg
    bgImageDark: /assets/bg/3-dark.svg
    highlights:
      - title: 核心基础
        icon: ri:coreos-fill
        details: 变量、类型、函数、结构体、接口等基础语法
        link: /golang/core/basic/

      - title: 并发编程
        icon: ic:outline-sync-lock
        details: Goroutine、Channel、sync 包等并发原语
        link: /golang/core/concurrent/

      - title: 网络编程
        icon: zondicons:network
        details: HTTP、TCP/UDP、WebSocket 等协议实战
        link: /golang/core/network/

  - header: AI Agent 开发
    description: 从零开始系统学习 Go 语言 AI Agent 开发
    image: /assets/image/features.svg
    bgImage: /assets/bg/1-light.svg
    bgImageDark: /assets/bg/1-dark.svg
    highlights:
      - title: 🟢 入门篇
        icon: mdi:lightbulb-outline
        details: 核心概念 · 环境搭建 · 第一个 LLM 调用
        link: /ai/agent-concepts

      - title: 🔵 基础篇
        icon: mdi:tools
        details: Prompt 工程 · Tool Calling · Memory 管理
        link: /ai/prompt-engineering

      - title: 🟣 进阶篇
        icon: material-symbols:flowsheet
        details: RAG · 工作流编排 · 多 Agent 协作
        link: /ai/rag

      - title: 🔴 实战篇
        icon: material-symbols:deployed-code
        details: 框架对比 · 生产部署 · 性能优化
        link: /ai/go-agent-frameworks

  - header: 参与贡献
    image: /assets/image/github-dark.svg
    bgImage: /assets/bg/4-light.svg
    bgImageDark: /assets/bg/4-dark.svg
    highlights:
      - title: 本项目开源至：<img src="/assets/image/github-repo.svg" />
        link : https://github.com/amigoer/golang-clouds
      - title: 如果你有兴趣参与本站的开发维护，欢迎在本项目仓库提交 PR。

copyright: false
footer: <a href="https://github.com/amigoer/golang-clouds" target="_blank">Golang Clouds</a> &#124 Copyright © 2026 Amigoer
---
