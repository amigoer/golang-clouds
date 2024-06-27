import { defineUserConfig } from "vuepress";

import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  // 语言
  lang: "zh-CN",
  // 标题
  title: "Golang全栈开发指南",
  // 描述
  description: "Golang Notes learning platform",

  theme,

  // 和 PWA 一起启用
  // shouldPrefetch: false,
});
