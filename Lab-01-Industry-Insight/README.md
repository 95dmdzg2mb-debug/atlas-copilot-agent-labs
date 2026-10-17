# Lab-01 · 行业洞察智能体 · MCP 工具

> **业务场景**：销售、产品、市场同事每周都要追新能源汽车、锂电、半导体等下游客户行业的变化，
> 压缩空气与真空领域的竞品新品，以及节能降碳政策。信息散在几十个网站，靠人看又慢又容易漏。

实验时长：约 50 分钟。全程在 Codespace 里完成，不需要本地装任何东西。

## 智能体怎么干活

```text
focus.md（你写的 Markdown 指令：关注哪些行业、搜什么、怎么判断影响）
   │
   ▼
Copilot Agent 模式 ──调用──▶ industry-insight MCP 服务器（Python，给智能体装上的「手」）
   │                          ├ read_focus              读关注清单
   │                          ├ fetch_industry_signals  抓行业媒体 RSS + Google News，过滤去重
   │                          ├ get_signals             按行业取精简信号给智能体读
   │                          └ build_weekly_report     校验研判结果 → 渲染周报
   ▼
frontend/report.md + report.json ──▶ 周报网页（Codespace 预览 / GitHub Pages）
                                  └─▶ Lab-03 里 Copilot Studio 读 report.json
```

分工很清楚：**抓取、去重、校验、出链接这些确定性的活交给工具**，**挑重点、判断对业务的影响交给模型**。
周报里每条结论都要引用信号 ID，由工具回填原文链接，所以模型编不出来源。

## 第 1 步：看懂两个关键文件（10 分钟）

1. [focus.md](focus.md)：行业关注清单。每个 `## 行业` 下面：
   - `- 搜索（中文/英文）：` 会变成一次 Google News 查询（近 7 天）；
   - `- 排除词：` 过滤噪音标题；
   - `- 关注什么：` 告诉智能体从什么角度判断影响。
2. [input/sources.json](input/sources.json)：固定抓取的行业媒体 RSS，`topic` 要和 `focus.md` 里的行业标题一字不差。

> 💡 **试一试 · 让 Copilot 讲解 MCP 服务器**：在 Copilot Chat 里问
> `#file:Lab-01-Industry-Insight/mcp_server/server.py 这个 MCP 服务器暴露了哪些工具？智能体怎么知道什么时候调用哪个？`

## 第 2 步：让智能体出一份周报（15 分钟）

1. 打开 Copilot Chat（`Ctrl+Alt+I`，macOS 为 `Ctrl+Cmd+I`），模式切到 **Agent**。
2. 点输入框旁的 🔧 工具图标，确认列表里有 **industry-insight** 的 4 个工具（第一次会提示启动 MCP 服务器，点允许）。
3. 输入：
   ```text
   /industry-insight
   ```
   这会运行 [.github/prompts/industry-insight.prompt.md](../.github/prompts/industry-insight.prompt.md)。
   智能体调用工具时会请你确认，点 **继续**。
4. 等它汇报完，在终端预览周报：
   ```bash
   python -m http.server 8080 --directory Lab-01-Industry-Insight/frontend
   ```
   Codespace 弹出端口提示时点 **在浏览器中打开**。

**预期结果**：周报包含本周摘要、5 个行业的热点（每条都有「对我们的影响」和来源链接）、对业务的影响汇总表、行动建议、数据覆盖与缺口。页头显示「模式：智能体研判」。

## 第 3 步：改一份 Markdown 指令，换成你关注的行业（15 分钟）

这是本 Lab 的重点：**不改任何代码**，只改 `focus.md`。

1. 在 `focus.md` 里复制一段 `## 行业`，改成你关心的行业，例如：
   ```markdown
   ## 光伏

   - 搜索（中文）：光伏 电池片 扩产 OR 新工厂 OR 投产
   - 搜索（英文）：solar cell factory OR solar module plant
   - 关注什么：电池片和组件工厂扩产，对洁净压缩空气和真空镀膜设备的需求
   - 排除词：概念股, 涨停
   ```
2. 也可以改「汇报对象与业务背景」或「分析要求」，比如要求每个行业只挑 2 个热点。
3. 新开一个 Chat 会话，再运行一次 `/industry-insight`，对比新旧周报。

> 💡 **试一试 · 让 Copilot 帮你写搜索词**：
> `我负责食品饮料行业的空压机销售，参照 #file:Lab-01-Industry-Insight/focus.md 的格式帮我写一段「## 食品饮料」`

## 第 4 步：让 Copilot 加一个 MCP 工具「客户雷达」（10 分钟）

新开 Chat 会话，输入：

```text
给 industry-insight MCP 服务器加一个工具「客户雷达」search_signals(keyword, limit=10)：在已抓取的信号 output/raw_signals.json 里按关键词（客户名或竞品名）搜标题和摘要，返回匹配的信号（id、行业、标题、来源、链接、日期）。逻辑写在 industry_tools.py，在 server.py 和 cli.py 里注册；参照 tests/test_industry_tools.py 的风格补一个单元测试并运行。
```

1. 看到单元测试全部通过后点 **Keep**。
2. 打开 `.vscode/mcp.json`，点 `"industry-insight"` 上方的 **Restart**，确认变成「5 tools」。
3. 新开会话问：`宁德时代（CATL）本周有什么动静？用客户雷达查，每条带链接。`

**期望结果**：智能体调用 `search_signals`，回答里每条都有原文链接。卡住了可以拿参考答案：
`git restore --source origin/answer/lab01 -- Lab-01-Industry-Insight/mcp_server Lab-01-Industry-Insight/tests`

## 第 5 步：在自己的 fork 上用 gh-aw 跑云端版（10 分钟 + 等待 5 分钟）

同一套工具也被 gh-aw（GitHub Agentic Workflows）调用：[.github/workflows/industry-insight.md](../.github/workflows/industry-insight.md)
是用 Markdown 写的工作流，`gh aw compile` 编译成 Actions 真正运行的 `.lock.yml`。课程仓库每周一北京时间 08:00 定时运行；
fork 上的定时工作流默认是停用的（Disabled），课前准备里已经单独启用了它，课上用手动触发。

1. 前提（课前准备里做过）：fork 的 Actions 已启用，Industry Insight Weekly 也点过 **Enable workflow**；fork 有 Actions secret `COPILOT_GITHUB_TOKEN`；
   Settings → Actions → General 勾选了「Allow GitHub Actions to create and approve pull requests」。
2. 把改动推到你的 fork：
   ```bash
   git add Lab-01-Industry-Insight/focus.md Lab-01-Industry-Insight/mcp_server Lab-01-Industry-Insight/tests
   git commit -m "Lab-01: 加新行业 + 客户雷达工具"
   git push
   ```
3. 你的 fork → **Actions → Industry Insight Weekly → Run workflow**（分支 `main`）。

**期望结果**：约 5 分钟后你的 fork 里出现一个 **Draft** 周报 PR，里面有你新加的行业；审核后点 **Ready for review** 再 Merge。
失败时在 Actions 里点开这次运行看日志（gh-aw 会想开「[aw] …」Issue 说明原因，但 fork 默认关了 Issues，看不到）。

> 改了 `industry-insight.md` 本身要先 `gh aw compile industry-insight`；只改 focus.md 和工具代码不用编译。
> 给 `input/sources.json` 加新的 RSS 源时，要同时把域名加到工作流的 `network.allowed` 再编译。

## 遇到问题

| 现象 | 处理 |
|---|---|
| 工具列表里没有 industry-insight | 命令面板运行 `MCP: List Servers` → 选 industry-insight → Start；看 Output 面板的报错 |
| MCP 服务器启动报 `No module named mcp` | 终端运行 `bash .devcontainer/on-create.sh` 重装依赖 |
| 周报页头显示「兜底（未经智能体研判）」 | 智能体没把研判结果交给 `build_weekly_report`，在 Chat 里让它「按 warnings 修正后重新生成周报」 |
| 新加的工具智能体不调用 | MCP 服务器没重启：`.vscode/mcp.json` 里点 Restart，确认「5 tools」 |
| fork 的 Actions 里没有 Industry Insight Weekly | Actions 页签点「I understand my workflows, go ahead and enable them」 |
| 有 Industry Insight Weekly 但没有 Run workflow 按钮 | 它旁边标着 Disabled：点进去，按黄条上的 **Enable workflow** |
| gh-aw 报 401 | fork 的 Actions secret `COPILOT_GITHUB_TOKEN` 没设或令牌过期 |
| 某个行业 0 条 | 看周报最后的「数据覆盖与缺口」；搜索词太窄就放宽，或去掉过严的排除词 |

不联网的自检：`python -m pytest Lab-01-Industry-Insight/tests -q`
