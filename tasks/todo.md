# atlas-copilot-agent-labs · 改造计划

来源：阿特拉斯中国 · 「两个智能体解决什么」实验详解页（2026-10-16 确认）。
基线代码：`ITD-NextDimension/github-sdk` 的 Lab-01（gh-aw + MCP 脚本）与 Lab-03（Skills + Copilot SDK）。

## 已定决策

- 仓库：`ITD-NextDimension/atlas-copilot-agent-labs`，私有；学员**直接在本仓库开 Codespace，不 fork**（吃 prebuild）。
- Lab-01 学员路线：Codespace 内 VS Code Agent 模式 + 标准 MCP 服务器 + `prompt.md`；gh-aw 每周定时出周报由讲师仓库演示，两边共用同一个 MCP 服务器。
- Lab-03（Copilot Studio）：指南 + OpenAPI 2.0 连接器 + 异步 API；Codespace 3000 端口设 Public 供 Studio 调用；讲师提供演示租户账号。
- 数据源：行业媒体 RSS + Google News RSS 关键词兜底，先实测再定，缺口如实标注。

## 任务

### 0. 骨架
- [x] 新建本地仓库，拷入 Lab-01 / Lab-03 基线
- [x] `.devcontainer/`（onCreate 装依赖 + Playwright，postCreate 轻量初始化，set-key.sh）
- [x] 根 `.gitignore` 放行 `.vscode/mcp.json`

### 1. Lab-01 行业洞察智能体 · MCP
- [x] 数据源连通性实测（新能源汽车 / 锂电 / 半导体 / 压缩空气与真空竞品 / 节能降碳政策）→ `focus.md` + `input/sources.json`
- [x] 重写工具为 `industry_tools.py`（时间窗 7 天、按行业打标、引用校验）
- [x] 标准 MCP 服务器（stdio）+ `.vscode/mcp.json`
- [x] `.github/prompts/industry-insight.prompt.md`，含学员可改的「关注行业」区块
- [x] 周报结构：摘要 → 分行业 → 竞品新品 → 政策 → 对阿特拉斯业务的影响 → 行动建议；输出 report.md + report.json
- [x] gh-aw `industry-insight.md`：每周定时 + 白名单与数据源对齐 + 传路径不传内联 JSON；`gh aw compile`
- [x] 本地兜底流水线跑通

### 2. Lab-02 知识总结智能体 · Skills + SDK
- [x] `knowledge2ppt` Skill：结论 → 要点 → 建议，含学员可改的「团队汇报规范」区块
- [x] 修 `lib/copilot.ts` 里的 skill 名
- [x] 异步 API：`POST /api/jobs`、`GET /api/jobs/{id}`、进度页、下载；`x-api-key`
- [x] `/api/insight/latest` + `/insight` 页面（读 Lab-01 周报）
- [~] typecheck + build ✔；curl 走通鉴权/周报/任务失败路径 ✔；真实生成 .pptx ✘ 被 Copilot 策略挡住（见 Review）

### 3. Lab-03 串起来 · Copilot Studio
- [x] `openapi.yaml`（Swagger 2.0）
- [x] Studio 分步指南（建智能体、导入连接器、工具描述、对话示例）
- [x] 端口 Public、空闲超时、DLP、超时处理注意事项

### 4. 文档
- [x] README、`docs/codespaces.md`（学员）、`INSTRUCTOR.md`（讲师）、prerequirement

### 5. 发布
- [ ] 建私有仓库并推送，开 Codespaces prebuild，真实触发一次 gh-aw

## Review

- 实测数据源（2026-10-16）：近 7 天 154 条信号，5 个行业均有覆盖、0 个失败源；竞品类噪音较多，靠 focus.md 排除词 + 智能体研判过滤。
- 设计取舍：行业关注清单写在 `focus.md`（一份 Markdown 同时驱动抓取和研判）；周报引用只能用信号 ID，由工具回填链接，模型编不出来源；
  Lab-02 接周报时由服务端把周报写进会话目录当素材，不让 Copilot 回抓自己的公网地址。
- 已验证：Lab-01 单测 3/3、MCP stdio 调用、`gh aw compile` 0 错误；Lab-02 typecheck/build、401 鉴权、行业模糊匹配、任务失败回报；
  `openapi.yaml` 通过 Swagger 2.0 校验；`set-key.sh` 沙盒测试。
- 未验证：真实生成 .pptx —— 讲师账号 Copilot Business 席位调用 `models.list` 返回 403「not authorized to use this Copilot feature」，
  需在席位所属组织/企业开启 Copilot CLI 策略后复测；devcontainer 需在真实 Codespace 里构建一次；Copilot Studio 导入连接器需在演示租户里走一遍。
- 过程中的失误：`git mv -k` 在未跟踪文件上静默跳过却返回 0，串联的 `rm -rf` 删掉了刚拷入的 pptx skill；已从源仓库恢复并逐文件比对一致。
