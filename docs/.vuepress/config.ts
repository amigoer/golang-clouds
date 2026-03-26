import { defineUserConfig } from "vuepress";

import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  // 语言
  lang: "zh-CN",
  // 标题
  title: "Golang Clouds",
  // 描述
  description: "Golang 全栈开发指南 — 涵盖 Go 语言核心、AI Agent 开发、云原生与开源生态",

  theme,

  // 和 PWA 一起启用
  // shouldPrefetch: false,
});
