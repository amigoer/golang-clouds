import { navbar } from "vuepress-theme-hope";

export default navbar([
  {
    text: "Golang指南",
    prefix: "golang/",
    icon: "grommet-icons:golang",
    children: [
      {
        text: "语法核心",
        prefix: "core/",
        icon: "ri:coreos-fill",
        children: [
          {
            text: "基础知识",
            link: "basic/",
            icon: "solar:crown-star-bold",
          },
          {
            text: "并发编程",
            link: "concurrent/",
            icon: "ic:outline-sync-lock",
          },
          {
            text: "网络编程",
            link: "network/",
            icon: "zondicons:network",
          },
        ]
      },
      {
        text: "Web框架",
        prefix: "web/",
        children: [
          {
            text: "Gin",
            link: "gin/",
            icon: "simple-icons:lightning",
          },
        ]
      },
      {
        text: "社区生态",
        prefix: "community/",
        children: [
          {
            text: "标准库",
            link: "standard-library/",
            icon: "majesticons:library",
          },
          {
            text: "开源库",
            link: "open-library/",
            icon: "fontisto:ampproject",
          },
          {
            text: "开源项目",
            link: "open-project/",
            icon: "raphael:opensource",
          },
        ]
      }
    ]
  },
  {
    text: "AI 智能体",
    prefix: "ai/",
    icon: "hugeicons:artificial-intelligence-04",
    children: [
      {
        text: "核心概念",
        link: "agent-concepts",
        icon: "mdi:lightbulb-outline",
      },
      {
        text: "环境搭建",
        link: "setup-environment",
        icon: "vscode-icons:file-type-config",
      },
      {
        text: "Prompt 工程",
        link: "prompt-engineering",
        icon: "fluent:prompt-24-filled",
      },
      {
        text: "Tool Calling",
        link: "tool-calling",
        icon: "mdi:tools",
      },
      {
        text: "Memory 管理",
        link: "memory-management",
        icon: "mdi:memory",
      },
      {
        text: "RAG",
        link: "rag",
        icon: "mdi:database-search",
      },
      {
        text: "工作流编排",
        link: "agent-workflow",
        icon: "material-symbols:flowsheet",
      },
      {
        text: "多 Agent",
        link: "multi-agent",
        icon: "fluent:people-team-24-filled",
      },
      {
        text: "框架对比",
        link: "go-agent-frameworks",
        icon: "mdi:compare",
      },
      {
        text: "生产部署",
        link: "production-deployment",
        icon: "material-symbols:deployed-code",
      },
    ]
  },
  {
    text: "后端技术",
    prefix: "backend-tech/",
    icon: "mingcute:code-fill",
    children: [
      {
        text: "云原生",
        prefix: "cloud-native/",
        children: [
          {
            text: "Docker",
            link: "docker/",
            icon: "mdi:docker",
          },
          {
            text: "Kubernetes",
            link: "kubernetes/",
            icon: "mdi:kubernetes",
          },
        ]
      },
      {
        text: "常用工具",
        prefix: "general/",
        children: [
          {
            text: "Git",
            link: "git/",
            icon: "teenyicons:git-solid",
          },
        ]
      },
    ]
  },
]);
