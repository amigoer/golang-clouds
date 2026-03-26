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
        text: "AI 智能体",
        link: "ai/",
        icon: "hugeicons:artificial-intelligence-04",
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
