# 讲师手册 · 阿特拉斯中国 Copilot 智能体工作坊

## 课程结构（半天约 3.5 小时）

| 环节 | 内容 | 时长 |
|---|---|---|
| 01 | 环境与智能体基础：开 Codespace、填令牌；智能体 = 模型 + 指令 + Skills + MCP 工具 | 30 分钟 |
| 02 | Lab-01 行业洞察智能体 · MCP（讲师演示 gh-aw 每周定时版） | 50 分钟 |
| 03 | Lab-02 知识总结智能体 · Skills（Chat 里用 Skill，改 SKILL.md） | 30 分钟 |
| 04 | Lab-02 第 3 步：用 Copilot SDK 做成网页服务 | 20 分钟 |
| 05 | Lab-03 Copilot Studio 串起来 | 40 分钟 |
| — | 休息与答疑 | 40 分钟 |

## T-7 天 · 只有你能推动的事

1. **学员权限**：把学员加入 `atlascopco-Lab` 组织（或课程团队），给本仓库 **Read** 权限即可。学员的 Copilot 席位同样来自企业 `atlascopco-Lab`，策略统一在这里管。
   学员在本仓库上开 Codespace，不需要写权限。
2. **Codespaces 计费与策略**（组织 Settings → Codespaces）：
   - 允许组织成员在本仓库创建 Codespace，费用由组织承担；
   - **端口可见性策略必须允许 Public**，否则 Lab-03 做不了（Studio 在云端，只能访问公网地址）；
   - 机型允许 4 核（`devcontainer.json` 里 `hostRequirements.cpus = 4`）。每人约 3.5 小时 × 4 核 = 14 核时；预算紧可改成 2 核，Lab-02 会慢一些。
3. **开预构建**：仓库 Settings → Codespaces → **Set up prebuild**，分支 `main`，区域选离学员最近的。
   没有预构建，每个学员开 Codespace 都要现装 Python/Node 依赖和 Chromium（5~8 分钟）。
4. **Copilot 策略**（学员 Copilot 席位所在的组织或企业。学员用阿特拉斯的席位时，席位由企业 `atlascopco-Lab` 管理，
   只能由阿特拉斯的企业管理员改；每人可在 <https://github.com/settings/copilot/features> 自查以下各项是否为 Enabled）：
   - **Copilot Agent Mode in IDE Chat** 和 **MCP servers in Copilot**（Lab-01；2026-10-16 已在企业 AI Controls → MCP 设为 Enabled everywhere）；
   - **Copilot CLI**（Lab-02 的 Copilot SDK 依赖它；2026-10-16 已在企业 AI Controls → Copilot → Features & clients 设为 Enabled everywhere，SDK 实测生成 PPT 成功）。没开时 SDK 调 `models.list` 返回 403
     「not authorized to use this Copilot feature」，页面显示「无法列出模型」；
   - 确认允许学员创建 Fine-grained PAT 且不需审批（学员把 Resource owner 选为个人账号）。
5. **Copilot Studio 演示租户**：
   - 为每位学员开好 M365 账号 + Copilot Studio 授权（试用许可即可）；
   - Power Platform 管理中心的 **DLP 策略允许自定义连接器**访问 `*.app.github.dev`；
   - 自己用一个学员账号把 Lab-03 完整走一遍（连接器导入、API 密钥认证、生成式编排三处最容易卡住）。
6. **网络**：场地网络要能访问 `github.com`、`*.github.dev`、`*.githubcopilot.com`、`news.google.com`、
   `copilotstudio.microsoft.com`、`*.powerplatform.com`。企业网络做 SSL 解密的，提前备热点。

## T-2 天 · 预检

- 用一个学员账号从零开一次 Codespace，跑通三个 Lab，记下每步耗时。
- 手动触发一次 gh-aw 周报：`gh workflow run industry-insight.lock.yml`，合并 PR，确认 Pages 上的周报是本周的。
  这份周报是学员 Lab-02 / Lab-03 的兜底素材（学员自己没跑出来 Lab-01 时也能继续）。
- 学员回执：令牌已生成、Studio 账号能登录、Codespace 能打开。

## gh-aw 每周定时（讲师演示用）

- 工作流源文件：`.github/workflows/industry-insight.md`；改完必须 `gh aw compile industry-insight` 再提交 `.lock.yml`。
- 需要仓库 Secret `COPILOT_GITHUB_TOKEN`（讲师的 Fine-grained PAT，Copilot Requests 权限）。
- 仓库 Settings → Actions → General：勾选 **Allow GitHub Actions to create and approve pull requests**。
  atlascopco-Lab 企业在 Policies → Actions 里锁住了这一项（2026-10-16），没放开时 gh-aw 会把周报推到分支并建一个 Issue，
  由人点 Issue 里的「Create the pull request」链接建 PR，合并即可。
- 模型固定为 `claude-sonnet-5.5`（frontmatter `engine.model`）。gh-aw 默认的 `claude-sonnet-4.6` 不在企业开放的模型里；
  gh-aw 太旧时会报「model is retired or unsupported」，先 `gh extension upgrade gh-aw` 再编译（2026-10-16 用 v0.92.0 跑通）。
- 仓库 Settings → Pages → Source 选 **GitHub Actions**。注意：私有仓库的 Pages 默认是**公开**可访问的
  （只有 Enterprise Cloud 能设为私有），周报内容里有面向阿特拉斯的业务分析，请确认可以公开，否则不要开 Pages，
  Lab-03 直接用学员 Codespace 里的周报即可。
- 网络白名单：`focus.md` 加了新的行业媒体 RSS 时，要把域名同步加到 `network.allowed` 再编译。

## 当天 · 每个环节下课前的硬指标

| 环节 | 全员达到才往下讲 |
|---|---|
| 01 | `set-key.sh` 打印出 `LAB_API_KEY` |
| 02 | 周报网页页头显示「模式：智能体研判」 |
| 03 | 下载到一份 PPT，标题是结论句 |
| 04 | 网页上用「本周行业洞察周报」生成出 PPT |
| 05 | `smoke-test.sh` 全部通过，Studio 测试窗格能返回进度页链接 |

## 现场排障速查

| 现象 | 原因 | 处理 |
|---|---|---|
| Codespace 开了很久还在装依赖 | 学员 fork 了再开，或预构建没好 | 关掉，回到课程仓库直接开；检查 Prebuilds 状态 |
| Chat 没有 Agent 模式 / 工具图标 | Copilot 策略没开 Agent 或 MCP | 管理员开策略；临时让学员看讲师屏幕 |
| 「无法列出模型」且令牌正确 | Copilot CLI 策略没开 | 管理员开策略；临时用讲师 Codespace 演示 |
| 端口可见性没有 Public | 组织 Codespaces 策略限制 | 组织 Settings → Codespaces → 端口可见性放开 Public |
| Studio 调用超时 | 学员 Codespace 空闲被停 | 回 Codespace 恢复并重启 `npm run dev`；让学员把空闲超时调到 120 分钟 |
| 生成 PPT 很慢 | 多个学员同时生成、或机器 2 核 | 每个 Codespace 一次只跑一个任务（其余排队）；改 4 核 |

## 课后

- 把 Pages、Secret、学员权限按需收回；提醒学员删除 Codespace 和 PAT。
- 学员想带走自己的智能体：课后 fork 本仓库（fork 后在自己的仓库开 Codespace，会现装依赖）。
