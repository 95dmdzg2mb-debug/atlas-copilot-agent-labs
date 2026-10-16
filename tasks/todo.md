# atlas-copilot-agent-labs · 改造计划

来源：阿特拉斯中国 · 「两个智能体解决什么」实验详解页（2026-10-16 确认）。
基线代码：`ITD-NextDimension/github-sdk` 的 Lab-01（gh-aw + MCP 脚本）与 Lab-03（Skills + Copilot SDK）。

## 已定决策

- 仓库：`atlascopco-Lab/atlas-copilot-agent-labs`，私有（2026-10-16 由 ITD-NextDimension 转移过来）；学员**直接在本仓库开 Codespace，不 fork**（吃 prebuild）。
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
- [x] typecheck + build；真实生成 .pptx（企业开启 Copilot CLI 策略后，SDK 与 Studio 两条路都生成成功）

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

## Lab-03 实测计划（2026-10-16）

目标：按学员视角把 Lab-03 真实走通一遍 —— Studio 里一句话「看看本周新能源汽车装配行业有什么变化，整理成汇报」→ 返回洞察 + PPT 进度页 → 下载到 PPT；
走完后把 README 改成与真实界面一致。

分工：🤖 = Claude 做；👤 = 必须由用户做（登录/凭据/同意条款）

### A. 服务端（Codespace）
- [x] 👤 设 Codespaces 用户 Secret `COPILOT_GITHUB_TOKEN`（`gh secret set ... --user --app codespaces`），学员也可用这条路代替 set-key.sh
- [x] 🤖 建测试 Codespace（空闲超时 120 分钟），生成 `LAB_API_KEY`，`npm run dev` 后台常驻
- [x] 🤖 端口 3000 设 Public（`gh codespace ports visibility 3000:public`），跑 `smoke-test.sh` 全绿
- [x] 🤖 公网 curl 走一遍 `CreatePresentationJob` → 进度页 → 下载，确认从 Studio 视角可用

### B. Copilot Studio（演示租户，Chrome）
- [x] 👤 在 Chrome 登录 copilotstudio.microsoft.com，确认环境与授权
- [x] 🤖 新建智能体「业务汇报助手」，粘贴 README 里的智能体指令，确认生成式编排开启
- [x] 🤖 工具 → 新建 → REST API，上传填好 host 的 openapi.yaml；三个操作加为工具
- [x] 👤 建连接时粘贴 `LAB_API_KEY`（凭据由用户输入）
- [x] 🤖 测试窗格跑 4 段对话：洞察 / 洞察→PPT / 一句话串起来 / 网页→PPT；核对每次调用的参数与回复

### C. 收尾
- [x] 🤖 按真实界面改 Lab-03 README（菜单名、截图位置、坑），必要时调 openapi 描述或智能体指令
- [ ] 🤖 删除测试 Codespace；Studio 智能体保留给讲师演示（或按用户要求删除）

风险：租户 DLP 拦自定义连接器；组织策略不允许 Public 端口；Studio 连接器超时；REST API 工具界面与文档不一致。

### Lab-03 实测结论（2026-10-16，演示租户 Ontology-trial 环境）

- 5 段测试对话全部通过：洞察 / 洞察→PPT / 查进度 / 网页→PPT / 一句话串起来；Studio 发起的 3 个任务都生成了 PPT。
- 实测改动：openapi 每个字段补描述（否则向导卡住）；生成 PPT 拆成「周报→PPT」「网页→PPT」两个工具、参数全部必填
  （Studio 默认不带可选参数，条件必填会被误追问）；指令避开 `/`（会触发插入菜单吞字）；工具名直接用 openapi 的 summary。
- 待确认：pages/style 改为必填后未在 Studio 重新导入验证（Swagger 校验通过）；回答里的 cite 标记已在指令中禁止，未复测。

## 实操手册（2026-10-17 启动）

目标：按教学设计 v2 出一份埃知风格 HTML 单页实操手册，每一步都有真实截图和「复盘三问」。

### A. v2 落地（参考答案放在 answer/* 分支，main 保持题目状态）
- [ ] 热身：周报网页「只看高影响」开关 → `answer/warmup`
- [ ] Lab-01：MCP 工具「客户雷达」`search_signals` + 单测 → `answer/lab01`
- [ ] Lab-02：网页新增「公司品牌风」 → `answer/lab02`
- [ ] gh-aw 学员分支：确认在 `student/<名字>` 分支上手动触发能跑自己的 focus.md；规则保护 main
- [ ] 各 Lab README 与 v2 对齐（题目、提示词、复盘三问）

### B. 真实走一遍并截图（Codespace + Chrome；敏感信息打码）
- [ ] 开场：仓库页 → 创建 Codespace → 环境就绪 → set-key
- [ ] 热身：@workspace / /explain / Agent 模式改网页 / 自定义指令
- [ ] Lab-01：/industry-insight → 改 focus.md → 客户雷达 → 推分支 + Actions 触发 → Issue 结果
- [ ] Lab-02：Chat 用 Skill → 改 SKILL.md → 品牌风 → 网页生成 PPT
- [ ] Lab-03：端口 Public → smoke-test → Studio 建智能体 / 挂工具 / 测试 / 改一处

### C. 写手册
- [ ] docs/manual/index.html + docs/manual/img/，每步：做什么 → 截图 → 应该看到 → 复盘三问；附排障表
