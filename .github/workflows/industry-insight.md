---
name: Industry Insight Weekly
on:
  workflow_dispatch:
  schedule:
    # 每周一 UTC 00:00 = 北京时间周一 08:00。GitHub Actions 定时为尽力而为，可能延迟数分钟到数十分钟。
    - cron: "0 0 * * 1"
strict: false
permissions:
  contents: read
tools:
  bash: [":*"]
  edit:
engine: copilot
timeout-minutes: 30
steps:
  - name: Set up Python
    uses: actions/setup-python@v5
    with:
      python-version: '3.11'
  - name: Install Python deps for industry tools
    run: |
      python3 -m pip install --upgrade pip
      python3 -m pip install -r Lab-01-Industry-Insight/mcp_server/requirements.txt
network:
  allowed:
    - defaults
    - python
    # Google News RSS（focus.md 里每条「搜索」都会变成一次 Google News 查询）
    - "news.google.com"
    # 行业媒体 RSS：必须与 Lab-01-Industry-Insight/input/sources.json 保持一致
    - "cnevpost.com"
    - "carnewschina.com"
    - "www.electrive.com"
    - "electrek.co"
    - "www.energy-storage.news"
    - "semiengineering.com"
    - "www.eetimes.com"
    - "www.semiconductor-today.com"
    - "www.airbestpractices.com"
safe-outputs:
  create-pull-request:
    title-prefix: "[industry-insight] "
    labels: [automation, industry-insight]
mcp-scripts:
  industry-read-focus:
    description: "读取 focus.md（行业关注清单），返回每个行业的搜索词、排除词、关注点和媒体源数量"
    run: |
      cd "$GITHUB_WORKSPACE"
      python3 Lab-01-Industry-Insight/mcp_server/cli.py read_focus
  industry-fetch-signals:
    description: "按 focus.md 抓取行业媒体 RSS 与 Google News，过滤去重后写入 Lab-01-Industry-Insight/output/raw_signals.json，返回各行业条数与失败的源"
    inputs:
      days:
        type: number
        default: 7
    timeout: 300
    run: |
      cd "$GITHUB_WORKSPACE"
      python3 -c "import os, json, subprocess, sys; sys.exit(subprocess.call([sys.executable, 'Lab-01-Industry-Insight/mcp_server/cli.py', 'fetch_industry_signals', json.dumps({'days': int(os.environ.get('INPUT_DAYS') or 7)})]))"
  industry-get-signals:
    description: "读取已抓取的精简信号（id/行业/来源/日期/标题/摘要）。topic 填 focus.md 里的行业标题，留空返回全部"
    inputs:
      topic:
        type: string
        required: false
      limit:
        type: number
        default: 40
    run: |
      cd "$GITHUB_WORKSPACE"
      python3 -c "import os, json, subprocess, sys; sys.exit(subprocess.call([sys.executable, 'Lab-01-Industry-Insight/mcp_server/cli.py', 'get_signals', json.dumps({'topic': os.environ.get('INPUT_TOPIC', ''), 'limit': int(os.environ.get('INPUT_LIMIT') or 40)}, ensure_ascii=False)]))"
  industry-build-report:
    description: "校验 Lab-01-Industry-Insight/output/insights.json 并生成周报（report.md + report.json，同步到 frontend/）。返回 mode（llm/fallback）与 warnings"
    run: |
      cd "$GITHUB_WORKSPACE"
      python3 Lab-01-Industry-Insight/mcp_server/cli.py build_weekly_report
---

# 行业洞察周报

你是**行业洞察智能体**。先用 `cat Lab-01-Industry-Insight/focus.md` 完整读一遍行业关注清单，尤其是「汇报对象与业务背景」和「分析要求」，后面所有判断都以它为准。

执行约束：

- 全程使用仓库根目录相对路径。
- 不要自己联网抓取网页，数据只来自下面的工具；抓取失败的源如实记为缺口，不要用自己的知识补。
- 各步骤只传短参数；大块数据由工具自己落盘。
- **候选 JSON 必须用 Python `json.dump(..., ensure_ascii=False)` 写文件，不要手写 heredoc**（中文引号会弄坏 JSON）。

## 第 1 步：确认关注清单

调用 `industry-read-focus`，确认这次覆盖的行业。

## 第 2 步：抓取信号

调用 `industry-fetch-signals`（days=7），记下每个行业的条数和失败的源。

## 第 3 步：逐个行业研判

对每个行业分别调用 `industry-get-signals(topic=行业名)`，然后：

- 剔除和业务无关的噪音（股价、市场规模预测报告、消费评测等）；
- 同一事件的多篇报道合并成一个热点，每个行业挑出 2~4 个真正值得汇报的；
- 按 focus.md 的「关注什么」判断对业务的影响，落到具体设备、具体客户；判断不了就写「影响待评估」；
- 每个热点必须用 `refs` 引用信号 ID（如 `S012`），没有出处的结论不写。

把研判结果用 Python 写入 `Lab-01-Industry-Insight/output/insights.json`，结构：

```json
{
  "summary": ["本周最重要的 3~5 条结论，每条一句话"],
  "topics": [
    {
      "topic": "与 focus.md 里的行业标题一字不差",
      "hotspots": [
        {
          "title": "一句话写清事件",
          "what_happened": "发生了什么（时间、主体、规模）",
          "impact": "对我们的影响：哪类设备、哪类客户、机会还是风险",
          "impact_area": "销售机会 | 产品 | 市场 | 风险",
          "level": "高 | 中 | 低",
          "refs": ["S012", "S034"]
        }
      ]
    }
  ],
  "actions": [
    { "owner": "销售 | 产品 | 市场", "action": "谁去做什么", "basis": "依据的事件或信号 ID" }
  ]
}
```

## 第 4 步：生成周报并提交

1. 调用 `industry-build-report`。如果 `mode` 是 `fallback` 或 `warnings` 不为空，按提示修正 `insights.json` 后再调用一次（最多重试 2 次）。
2. 通过 safe-outputs 的 `create-pull-request` 提交 `Lab-01-Industry-Insight/frontend/report.md` 和 `Lab-01-Industry-Insight/frontend/report.json`。PR 标题写周次和本周最重要的一条结论；PR 描述列出各行业热点数、影响等级为「高」的事件和数据缺口。不要引入额外的手工 git 流程。
