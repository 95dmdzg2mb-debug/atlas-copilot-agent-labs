# 阿特拉斯中国 · Copilot 智能体工作坊

半天动手实验：用 GitHub Copilot 亲手做两个能干活的智能体，最后在 Copilot Studio 里把它们串成一个业务应用。
每个实验都从一个真实工作痛点出发：先看业务场景，再看智能体怎么干活，最后亲手改一处，让它变成你自己的。

| 实验 | 业务痛点 | 技术 | 你会亲手做 |
|---|---|---|---|
| [Lab-01 · 行业洞察智能体](Lab-01-Industry-Insight/) | 下游行业、竞品新品、节能政策散在几十个网站，靠人看又慢又容易漏 | **MCP 工具** + Copilot Agent 模式（每周定时版用 gh-aw） | 改一份 Markdown 指令（`focus.md`），换成自己关注的行业；让 Copilot 加一个 MCP 工具「客户雷达」；在自己的 fork 上用 gh-aw 跑云端版 |
| [Lab-02 · 知识总结智能体](Lab-02-Knowledge-Summary/) | 读完一篇文章要做汇报，读、提炼、排版要半天，格式人人不同 | **Skills** + **Copilot SDK** | 改 `SKILL.md` 把团队汇报规范写成技能；让 Copilot 给网页加「公司品牌风」；用 SDK 做成网页服务 |
| [Lab-03 · 串起来](Lab-03-Copilot-Studio/) | 业务同事不会用 VS Code，只想说一句话拿结果 | **Copilot Studio** + 自定义连接器（每人导入自己的） | 一句话「看看本周新能源汽车装配行业有什么变化，整理成汇报」→ 洞察 + 汇报 PPT |

```text
                     ┌───────────── Copilot Studio「业务汇报助手」（Lab-03）────────────┐
                     │        一个自定义连接器（openapi.yaml · x-api-key）               │
                     └───────────────────────────────┬──────────────────────────────────┘
                                                     ▼  https://<codespace>-3000.app.github.dev
Lab-01 行业洞察智能体                          Lab-02 知识总结智能体（Next.js + Copilot SDK）
focus.md → MCP 工具抓取/校验 → 周报 report.json ──▶ 读周报 / 网页 → knowledge2ppt skill → pptx skill → .pptx
```

## 开始

每人用**自己的 fork、自己的 Codespace、自己的 Copilot 令牌**（Codespaces、Actions 和 Copilot 额度都记在自己账号上）：

1. 右上角 **Fork** → Owner 选自己 → **取消勾选**「Copy the `main` branch only」（卡住时要用 `answer/*` 参考答案分支）。
2. 生成 Fine-grained PAT（Account → Copilot Requests: Read），存成个人 Codespaces secret 和 fork 的 Actions secret，名字都叫 `COPILOT_GITHUB_TOKEN`。
3. 在 fork 的 **Actions** 页签启用工作流，Settings → Actions → General 勾选「Allow GitHub Actions to create and approve pull requests」。
4. 在**你的 fork** 上 **Code → Codespaces → Create codespace on main**（第一次要现装依赖，3~8 分钟，建议课前做）。

📘 **学员实操手册**（每一步都有截图、期望结果、复盘卡、卡住了怎么办）：[docs/manual/index.html](docs/manual/index.html)
（仓库开启 GitHub Pages 后也可以在浏览器直接打开：`https://atlascopco-lab.github.io/atlas-copilot-agent-labs/manual/`）

- 文字版学员手册：[docs/codespaces.md](docs/codespaces.md)
- 培训前准备（账号、授权、网络）：[prerequirement.md](prerequirement.md)
- 讲师手册（课前检查、当天流程、排障）：[INSTRUCTOR.md](INSTRUCTOR.md)

### 参考答案

| 分支 | 对应练习 |
|---|---|
| `answer/warmup` | 热身：周报网页「只看高影响」开关 |
| `answer/lab01` | Lab-01：MCP 工具「客户雷达」`search_signals` + 单元测试 |
| `answer/lab02` | Lab-02：网页新增「公司品牌风」 |

卡住时只拿需要的文件，不要整个切过去，例如：`git restore --source origin/answer/lab01 -- Lab-01-Industry-Insight/mcp_server Lab-01-Industry-Insight/tests`。

## 仓库结构

```text
.devcontainer/                  Codespaces 环境（onCreate 装依赖，set-key.sh 填令牌）
.vscode/mcp.json                在 VS Code 里注册 Lab-01 的 MCP 服务器
.github/prompts/                /industry-insight 提示词文件（Lab-01）
.github/skills/                 knowledge2ppt（Lab-02 要改的）+ pptx skill
.github/workflows/              industry-insight.md（gh-aw 每周定时）+ deploy-pages.yml
Lab-01-Industry-Insight/        focus.md · input/sources.json · mcp_server/ · frontend/ · tests/
Lab-02-Knowledge-Summary/       Next.js 应用：网页 + 对外 API（/api/insight、/api/jobs）
Lab-03-Copilot-Studio/          Studio 分步指南 · openapi.yaml · smoke-test.sh
docs/manual/                    学员实操手册（HTML + 截图）
```
