# 阿特拉斯中国 · Copilot 智能体工作坊

半天动手实验：用 GitHub Copilot 亲手做两个能干活的智能体，最后在 Copilot Studio 里把它们串成一个业务应用。
每个实验都从一个真实工作痛点出发：先看业务场景，再看智能体怎么干活，最后亲手改一处，让它变成你自己的。

| 实验 | 业务痛点 | 技术 | 你会亲手做 |
|---|---|---|---|
| [Lab-01 · 行业洞察智能体](Lab-01-Industry-Insight/) | 下游行业、竞品新品、节能政策散在几十个网站，靠人看又慢又容易漏 | **MCP 工具** + Copilot Agent 模式（每周定时版用 gh-aw） | 改一份 Markdown 指令（`focus.md`），换成自己关注的行业 |
| [Lab-02 · 知识总结智能体](Lab-02-Knowledge-Summary/) | 读完一篇文章要做汇报，读、提炼、排版要半天，格式人人不同 | **Skills** + **Copilot SDK** | 改 `SKILL.md` 把团队汇报规范写成技能；用 SDK 做成网页服务 |
| [Lab-03 · 串起来](Lab-03-Copilot-Studio/) | 业务同事不会用 VS Code，只想说一句话拿结果 | **Copilot Studio** + 自定义连接器 | 一句话「看看本周新能源汽车装配行业有什么变化，整理成汇报」→ 洞察 + 汇报 PPT |

```text
                     ┌───────────── Copilot Studio「业务汇报助手」（Lab-03）────────────┐
                     │        一个自定义连接器（openapi.yaml · x-api-key）               │
                     └───────────────────────────────┬──────────────────────────────────┘
                                                     ▼  https://<codespace>-3000.app.github.dev
Lab-01 行业洞察智能体                          Lab-02 知识总结智能体（Next.js + Copilot SDK）
focus.md → MCP 工具抓取/校验 → 周报 report.json ──▶ 读周报 / 网页 → knowledge2ppt skill → pptx skill → .pptx
```

## 开始

**在本仓库直接创建 Codespace**：点 **Code → Codespaces → Create codespace on main**。不要先 fork，fork 出来的仓库吃不到预构建，要现装几分钟依赖。

环境就绪后按 [学员手册 docs/codespaces.md](docs/codespaces.md) 一步步走，每一步都写了期望结果。

- 培训前准备（账号、授权、网络）：[prerequirement.md](prerequirement.md)
- 讲师手册（课前检查、当天流程、排障）：[INSTRUCTOR.md](INSTRUCTOR.md)

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
```
