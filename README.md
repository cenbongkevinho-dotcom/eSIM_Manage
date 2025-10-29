# eSIM_Manage 文档与项目概览

[![Icon Smoke](https://github.com/cenbongkevinho-dotcom/eSIM_Manage/actions/workflows/icon-smoke.yml/badge.svg?branch=main)](https://github.com/cenbongkevinho-dotcom/eSIM_Manage/actions/workflows/icon-smoke.yml)
[![Icon Audit](https://github.com/cenbongkevinho-dotcom/eSIM_Manage/actions/workflows/icon-audit.yml/badge.svg?branch=main)](https://github.com/cenbongkevinho-dotcom/eSIM_Manage/actions/workflows/icon-audit.yml)

说明：以上徽章会显示最新一次在 main 分支上的工作流状态（通过/失败/运行中）。点击徽章可进入对应工作流的运行列表。

本仓库包含 eSIM_Manage 平台的初版产品需求与技术架构文档，遵循 GSMA eSIM RSP 架构（Consumer/M2M）。

## 文档目录

- docs/产品需求文档.md — 产品需求文档（功能/流程/合规/非功能）
- docs/技术架构.md — 系统技术架构与语言开发文档（选型/微服务/安全/运维）
  - docs/技术架构\_权限矩阵与契约测试.md — 技术架构补充（权限矩阵、错误处理与 API 契约测试）
- docs/api/openapi.yaml — 初版开放接口规范（主要资源端点与鉴权）
  - 已补充通用参数（page/pageSize/sort）、Idempotency-Key 幂等头与统一错误响应（ErrorResponse）。
  - 新增通用头参数：X-Request-ID（请求链路追踪），Webhook 安全头（X-SMDP-Signature/X-SMDP-Timestamp）；响应包含 X-Correlation-ID 与 X-RateLimit-\* 速率限制信息。
  - 新增财务模块端点：/billing/invoices/{id}、/billing/invoices/{id}/reconcile、/billing/invoices/{id}/approve、/billing/invoices/{id}/sign、/billing/invoices/{id}/pdf；以及支付端点 /payments。
  - 新增市场与定价模块端点：/market/crawl-jobs 发起与查询作业；/pricing/strategies 的创建/更新/审批/发布。
  - 新增 OAuth2 Scopes：approvals:write、billing:sign、market:crawl、pricing:write、pricing:approve、pricing:publish。
- docs/数据模型.md — 核心数据模型（实体/字段/关系/索引）
- docs/路线图.md — 实施路线图与里程碑（阶段目标/验收/风险）
  - 已包含轻量 CRM 与外部 CRM 集成端点（/suppliers、/crm/contacts、/integrations/crm、/integrations/crm/sync 等）

## 技术栈（语言一致性）

- 后端开发语言统一：采用 Go 和 Python，不使用 Java。
- 建议分工：
  - Go：高吞吐核心服务与实时接口（Webhook、账单与签章、API 网关、定价模拟等）。
  - Python：数据处理与集成（CRM 同步、契约测试工具集成、分析报表管道等）。
- 构建与依赖管理：Go Modules（Go）、Poetry（Python）；统一 Lint/测试（golangci-lint、pytest）与覆盖率度量。
- 应用框架与基础设施（建议）：Go 使用 Gin/Fiber，Python 使用 FastAPI；消息队列（Kafka/RabbitMQ）、数据库（PostgreSQL）、缓存（Redis）；可观测性（OpenTelemetry + Prometheus + Grafana）。
- CI/CD：GitHub Actions 统一流水线；OpenAPI 规范校验（Spectral/OpenAPI CLI）、契约测试（Dredd/Schemathesis），在 PR 与夜间构建中执行。

## 后续工作建议

1. 与首家运营商沙盒对齐字段与回调事件，完善 OpenAPI 与映射表。
2. 选定部署环境（K8s/云厂商），搭建基础设施与密钥管理（Vault/HSM）。
3. 落地最小可用功能（MVP）：激活码 →LPA→Webhook→ 订阅生命周期可视化。
4. 引入 CI/CD 与质量保障（SAST/SCA/契约测试），开展性能与安全演练。
5. 规划 CRM 集成与主数据治理：选定目标 CRM（Salesforce/HubSpot 等）沙盒，配置 OAuth、字段映射与冲突策略，完善同步与观测指标。

## 市场抓取合规与风控说明

为保护目标站点与平台自身的稳定与合规性，市场数据抓取（Market Crawl）必须遵循以下原则：

- 机器人协议与平台条款：严格遵守目标站点 robots.txt 以及平台服务条款（TOS）。仅抓取公开可访问数据，不绕过登录、付费墙或防爬机制。
- 频率限制与退避重试：平台对抓取相关端点实施速率限制（X-RateLimit-\*）。超限返回 429 Too Many Requests，并附带 Retry-After 响应头。客户端应依据 Retry-After 进行退避并重试。
- 数据来源与内容合规：仅采集商品/价格等公开业务数据，禁止采集个人敏感信息（PII）或受保护内容；不进行内容规避、UA 伪装或来源欺骗。抓取来源将被记录用于审计。
- 告警与封禁流程：出现异常抓取（高频/异常来源/规则违背）会触发自动告警并暂停作业；必要时加入封禁名单。请降低频率或联系管理员以恢复。
- 审计与留存：抓取作业会记录参数与关联 ID（X-Correlation-ID），并保存风控触发原因，以支持复盘与合规审计。

相关接口与契约详见 docs/api/openapi.yaml 中 /market/crawl-jobs 及其子路径的描述与错误响应（包含 429 与 Retry-After）。

## 契约测试与 CI

本仓库已提供契约测试与 OpenAPI 规范校验指南，参见：

- docs/ci/契约测试.md（Spectral、Dredd、Schemathesis 的使用说明与示例命令）
- docs/ci/hooks.js（Dredd hooks，自动注入 Idempotency-Key 与 X-Request-ID）
- .github/workflows/contract-tests.yml（GitHub Actions 工作流：在 PR 上自动执行 Lint 与契约测试）
- .spectral.yaml（Spectral 基础规则：GET 端点需含 x-codeSamples；429 响应需含 Retry-After 头）

本地运行与 CI 集成的详细命令请参考 docs/ci/契约测试.md。

前端图标相关烟雾测试（Playwright）：

```bash
cd pure-admin-thin-max-ts

# 安装依赖
pnpm install

# 安装 Playwright 浏览器
pnpm test:install

# 运行烟雾测试（Chromium）
pnpm test:icon:smoke
```
