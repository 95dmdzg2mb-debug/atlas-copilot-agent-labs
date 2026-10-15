# GitHub Copilot 仓库自定义指令

## 这个仓库是什么

阿特拉斯中国 Copilot 智能体工作坊的动手实验仓库，学员在 Codespaces 里完成：

- **Lab-01-Industry-Insight/**：行业洞察智能体。`focus.md` 是行业关注清单（Markdown 指令），
  `mcp_server/` 是 MCP 服务器（`industry_tools.py` 是逻辑，`server.py` 给 VS Code，`cli.py` 给 gh-aw）。
- **Lab-02-Knowledge-Summary/**：知识总结智能体。Next.js + Copilot SDK，Skill 在仓库根目录 `.github/skills/`。
- **Lab-03-Copilot-Studio/**：Copilot Studio 接入指南与 `openapi.yaml`（Swagger 2.0）。

## 必须遵守

- 用户要「把网页 / 文章 / 周报做成汇报或 PPT」时，直接使用 `knowledge2ppt` skill（它会再调用 `pptx` skill），
  不要去调用 Lab-02 的网页或 API。
- 用户要「出行业洞察周报」时，使用 `industry-insight` MCP 服务器的工具，或提示用户运行 `/industry-insight`。
- 周报里的结论必须引用真实的信号 ID，不编造数据、来源和客户名称。

## 约定

- 面向模型的提示词、报告和 PPT 正文用中文；代码标识符用英文。
- Python：标准库优先，`from __future__ import annotations`、`pathlib.Path`、类型注解；大块数据落盘传路径。
- gh-aw：改 `.github/workflows/industry-insight.md` 后必须 `gh aw compile industry-insight`；
  `focus.md` / `input/sources.json` 加了新域名，要同步加到 `network.allowed`。
- 命令使用仓库根目录相对路径。
