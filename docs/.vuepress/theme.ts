import { hopeTheme } from "vuepress-theme-hope";

import navbar from "./navbar/index.js";
import sidebar from "./sidebar/index.js";

export default hopeTheme({
  // 网站部署域名
  hostname: "https://golang-clouds.vercel.app",

  // 作者信息
  author: {
    name: "Amigoer",
    url: "https://github.com/amigoer",
  },

  iconAssets: "iconify",

  // 导航栏图标
  logo: "/logo.svg",

  // 仓库
  repo: "amigoer/golang-clouds",

  // 文档所在仓库
  docsRepo: "amigoer/golang-clouds",

  // 文档所在目录
  docsDir: "docs",

  // 导航栏
  navbar,

  fullscreen: true,

  // 侧边栏
  sidebar,

  // 页脚
  footer: "<a href='https://github.com/amigoer/golang-clouds'>Golang Clouds</a>",
  displayFooter: true,

  // 多语言配置
  metaLocales: {
    editLink: "在 GitHub 上编辑此页",
  },

  // 在这里配置主题提供的插件
  plugins: {

    // 开启代码复制
    copyCode: true,

    searchPro: {
      hotKeys: [
        { key: "k", ctrl: true },
        { key: "k", meta: true },
      ],
    },

    components: {
      components: ["Badge", "VPCard", "SiteInfo"],
    },

    // 此处开启了很多功能用于演示，你应仅保留用到的功能。
    mdEnhance: {
      align: true,
      attrs: true,
      codetabs: true,
      component: true,
      demo: true,
      figure: true,
      imgLazyload: true,
      imgSize: true,
      include: true,
      mark: true,
      plantuml: true,
      spoiler: true,
      linkify: true,
      stylize: [
        {
          matcher: "Recommended",
          replacer: ({ tag }) => {
            if (tag === "em")
              return {
                tag: "Badge",
                attrs: { type: "tip" },
                content: "Recommended",
              };
          },
        },
      ],
      sub: true,
      sup: true,
      tabs: true,
      tasklist: true,
      vPre: true,
    },


  },
});
