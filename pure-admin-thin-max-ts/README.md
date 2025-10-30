# 使用前须知

[pure-admin-thin-max-ts](https://github.com/xiaoxian521/pure-admin-thin-max-ts) 仅供购买者（个人、公司）使用且使用者不可售卖或公开源代码，违者追究法律责任、踢出此私有仓库且不退购买费！  
注：若购买者在公司使用了 [pure-admin-thin-max-ts](https://github.com/xiaoxian521/pure-admin-thin-max-ts)，离职后，公司也不可售卖或公开源代码，违者追究其公司法律责任，最高面临`5万元`罚款！

## 介绍

[点击查看介绍](https://pure-admin.cn/pages/service/#max-ts-版本)

## 视频教程

- [点击查看Max-Ts版本如何精简代码](https://www.alipan.com/s/Knab1ih5vUV)
- 视频提取码: `20zk`

## 版本选择

当前是非国际化`max-ts`版本，如果您需要国际化`max-ts`版本 [请点击](https://github.com/xiaoxian521/pure-admin-thin-max-ts/tree/i18n)

## 温馨提示

当您看到类似 `This repository has been archived` 的提示时，请不要疑惑，这是我将该仓库进行了存档处理，防止大家误提交代码到该仓库。当有新功能或者需要维护时，我会取消存档将功能加上后重新进行存档 🙏

## 开发模式与常用脚本

本项目采用 Vite 开发服务器（development mode）+ 热模块替换（HMR）+ Node ESM 架构，配合 ESLint/Prettier/Stylelint、Husky（pre-commit/commit-msg）、TypeScript 全量类型检查，以及 Playwright 冒烟与 E2E 测试。

- 开发服务器：
  - `pnpm dev` 启动本地开发服务器，默认地址示例 `http://localhost:8849/`（以实际 Vite 输出为准）。
  - `pnpm preview` 预览已构建产物；`pnpm preview:build` 先构建再预览。

- 构建：
  - `pnpm build` 生产构建；`pnpm build:staging` 以 `staging` 模式构建；`pnpm report` 生成构建分析报告。

- 代码规范（Lint）：
  - `pnpm lint` 一次性执行 ESLint + Prettier + Stylelint。
  - `pnpm lint:eslint`、`pnpm lint:prettier`、`pnpm lint:stylelint` 可分别执行。
  - 已忽略测试报告目录 `playwright-report/**` 与构建产物目录，避免 Stylelint 扫描生成文件导致异常。

- 类型检查（TypeScript）：
  - `pnpm typecheck` 执行 `tsc` 与 `vue-tsc` 的全量类型检查（不产出构建）。
  - `pnpm typecheck:watch` 在开发时实时进行类型检查，及时反馈问题（持续监听）。

- 测试（Playwright）：
  - `pnpm test:install` 安装 Playwright 的浏览器依赖（Chromium）。
  - `pnpm test:icon:smoke` 运行关键交互的冒烟测试（Chromium 项目）。
  - `pnpm test:e2e` 运行完整的 E2E 测试套件（依据 `playwright.config.ts`）。
  - `pnpm test:report` 打开最近一次测试报告。

### E2E 运行与稳定性说明

- 本项目在 CI 下统一使用 dev server（端口 `8848`），并通过 `ENABLE_PROXY=false` 禁用代理，以启用 `vite-plugin-fake-server` 的 mock 接口，避免 preview 构建阶段的 Rollup 本机二进制解析问题。
- 本地复现建议：
  - 启动开发服务器：`pnpm dev`（默认 `http://localhost:8848/`）或让 Playwright 自动启动。
  - 运行全量测试：`CI=true pnpm test:e2e`（三端均为 headless）。
  - 如需更换端口或复用已有服务，可通过 `BASE_URL` 覆盖（例如 `BASE_URL=http://localhost:8848`）。
- 详见文档：[`docs/e2e-playwright.md`](./docs/e2e-playwright.md)。

- 图标策略审计：
  - `pnpm audit:views:no-online` 视图层禁用在线图标的静态审计（`dev` 目录除外），违规将被阻断提交。
  - `pnpm audit:icon` 全局图标使用审计，避免“斜杠风格误用”等问题。

- 提交钩子（Husky）：
  - `pre-commit` 通过 `lint-staged` 自动规范化变更文件，并在涉及前端源码/脚本时执行图标审计，确保提交质量。
  - `commit-msg` 校验提交信息规范（基于 `commitlint`）。

> 建议在 VS Code 中启用保存即格式化（Format on Save），并安装 ESLint、Stylelint、Prettier 等扩展，以在编码阶段就获得即时反馈，提升开发效率。
