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
            icon: "ic:baseline-bolt",
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
          {
            text: "性能优化",
            link: "performance-optimization/",
            icon: "icon-park:smart-optimization",
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

          {
            text: "Echo",
            link: "echo/",
            icon: "mingcute:snow-line",
          },

          {
            text: "Beego",
            link: "beego/",
            icon: "heroicons:fire-solid",
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
    text: "后端技术",
    prefix: "backend-tech/",
    icon: "mingcute:code-fill",
    children: [
      {
        text: "数据库",
        prefix: "database/",
        children: [
          {
            text: "MySQL",
            link: "mysql/",
            icon: "tabler:brand-mysql",
          },

          {
            text: "Redis",
            link: "redis/",
            icon: "cib:redis",
          },
          {
            text: "MongoDB",
            link: "mongodb/",
            icon: "simple-icons:mongodb",
          },
          {
            text: "Elasticsearch",
            link: "elasticsearch/",
            icon: "simple-icons:elasticsearch",
          },
        ]
      },
      {
        text: "消息队列",
        prefix: "message-queue/",
        children: [
          {
            text: "Kafka",
            link: "kafka/",
            icon: "logos:kafka-icon",
          },
          {
            text: "RabbitMQ",
            link: "robbitmq/",
            icon: "simple-icons:rabbitmq",
          },
        ]
      },
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
            text: "Linux",
            link: "linux/",
            icon: "mingcute:linux-fill",
          },

          {
            text: "Git",
            link: "git/",
            icon: "teenyicons:git-solid",
          },
        ]
      },
    ]
  },
  {
    text: "计算机基础",
    prefix: "computer-basic/",
    icon: "mingcute:computer-fill",
    children: [
      {
        text: "数据结构",
        link: "datastruct/",
        icon: "carbon:data-structured",
      }, {
        text: "计算机网络",
        link: "computer-network/",
        icon: "ph:network-bold",
      }, {
        text: "操作系统",
        link: "operating-system/",
        icon: "icon-park-solid:coordinate-system",
      },
      {
        text: "计算机组成原理",
        link: "computer-composition/",
        icon: "el:cog",
      }]
  },
  {
    text: "项目实战",
    prefix: "projects/",
    icon: "ant-design:project-filled",
    children: [
      {
        text: "Pont SSH",
        link: "pont-ssh/",
        icon: "ion:terminal"
      },
      {
        text: "Conch DB",
        link: "conch-db/",
        icon: "fluent-emoji-high-contrast:spiral-shell"
      },
      {
        text: "Easy Chat",
        link: "easy-chat/",
        icon: "fluent:chat-24-filled"
      },

    ]
  },

  {
    text: "关于网站",
    link: "/computer-basic",
    icon: "mdi:about"
  },
]);
