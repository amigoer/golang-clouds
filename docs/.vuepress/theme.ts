import { hopeTheme } from "vuepress-theme-hope";

import navbar from "./navbar/index.js";
import sidebar from "./sidebar/index.js";

export default hopeTheme({
  // 网站部署域名
  hostname: "https://www.golangnotes.com",

  // 作者信息
  author: {
    name: "友人",
    url: "https://www.codermast.com",
  },

  iconAssets: "fontawesome-with-brands",

  // 导航栏图标
  logo: "/logo.svg",

  // 仓库
  repo: "codermast/GolangNotes",


  // 文档所在仓库
  docsRepo: "codermast/GolangNotes",

  // 文档所在目录
  docsDir: "docs",

  // 导航栏
  navbar,

  // 侧边栏
  sidebar,

  // 页脚
  footer: "<a href='https://www.golangnotes.com/'>Golang开发指南</a>",
  displayFooter: true,

  // 多语言配置
  metaLocales: {
    editLink: "在 GitHub 上编辑此页",
  },

  // 如果想要实时查看任何改变，启用它。注: 这对更新性能有很大负面影响
  // hotReload: true,

  // 在这里配置主题提供的插件
  plugins: {
    // 注意: 仅用于测试! 你必须自行生成并在生产环境中使用自己的评论服务
    comment: {
      provider: "Giscus",
      repo: "vuepress-theme-hope/giscus-discussions",
      repoId: "R_kgDOG_Pt2A",
      category: "Announcements",
      categoryId: "DIC_kwDOG_Pt2M4COD69",
    },

    components: {
      components: ["Badge", "VPCard"],
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
