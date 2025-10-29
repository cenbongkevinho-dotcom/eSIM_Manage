// @ts-check

/** @type {import('postcss-load-config').Config} */
export default {
  plugins: {
    // 说明：显式指定 `preset: 'default'`，避免 cssnano 在构建阶段调用 lilconfig 搜索配置导致
    // EISDIR（读取目录）异常，兼容 Vite 对 index.html 内联 CSS 的处理
    ...(process.env.NODE_ENV === "production"
      ? { cssnano: { preset: "default" } }
      : {})
  }
};
