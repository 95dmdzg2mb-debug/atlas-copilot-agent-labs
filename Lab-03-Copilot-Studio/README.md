# Lab-03 · 串起来：在 Copilot Studio 做成业务应用

> 业务同事一句话：「看看本周新能源汽车装配行业有什么变化，整理成汇报」
> → **行业洞察智能体**给出洞察 → **知识总结智能体**生成汇报 PPT。

实验时长：约 40 分钟。前置：完成 Lab-01（周报已生成）和 Lab-02（服务能在 Codespace 里跑起来）。

> 本指南按 2026-10-16 在演示租户里的真实操作写成：4 段测试对话全部跑通，并成功生成了 3 份 PPT。
> Copilot Studio 界面更新很快，菜单名称如有出入，以租户当前界面为准。

## 架构

```text
业务同事 ──对话──▶ Copilot Studio 智能体「业务汇报助手」（云端，讲师提供的演示租户）
                        │  REST API 工具（openapi.yaml，请求头 x-api-key）
                        ▼
   https://<你的 Codespace>-3000.app.github.dev   ← 端口 3000 设为 Public
                        │  Lab-02 的 Next.js 服务
     ┌──────────────┬───┴──────────────┬───────────────────┐
     ▼              ▼                  ▼                   ▼
查询本周行业洞察   把行业洞察做成汇报 PPT  把网页做成汇报 PPT    查询 PPT 生成进度
读 Lab-01 周报     提交任务，立即返回进度页链接（后台 2~5 分钟）   拿下载链接
```

两个设计要点：

- **一个工具只做一件事、参数全部必填**。Studio 默认只带必填参数；而「二选一、某种情况下才必填」的参数会让编排器误追问。
  所以「生成 PPT」拆成「周报 → PPT」和「网页 → PPT」两个工具。
- **长任务异步化**。Studio 调用工具有超时，生成一份 PPT 要几分钟，所以工具立刻返回进度页链接，用户点开就能看进度、下载。

## 第 1 步：让 Studio 能访问你的服务（10 分钟）

1. 确认 Codespace 里已经有 Copilot 令牌和 API 密钥（Lab-02 做过就跳过）：
   ```bash
   bash .devcontainer/set-key.sh
   ```
   记下最后打印的 `LAB_API_KEY`，第 3 步要用。
   （也可以把令牌设成个人的 Codespaces Secret `COPILOT_GITHUB_TOKEN`，见 [学员手册](../docs/codespaces.md)。）
2. 启动 Lab-02 服务（已经在跑就跳过）：
   ```bash
   cd Lab-02-Knowledge-Summary && npm run dev
   ```
3. 打开 VS Code 底部的 **端口（Ports）** 面板，右键 `3000` → **端口可见性（Port Visibility）** → **Public**。
   > ⚠️ **Codespace 每次重启后，端口都会被改回 Private**，要重新设一次。
4. 新开一个终端，运行连通自检：
   ```bash
   bash Lab-03-Copilot-Studio/smoke-test.sh
   ```
   4 项全部打勾才往下走。脚本会打印你的 **host** 和 **API 密钥**。

## 第 2 步：改连接器定义（2 分钟）

打开 [openapi.yaml](openapi.yaml)，把 `host:` 这一行换成自检脚本打印的 host（不带 `https://`），保存。
在资源管理器里右键 `openapi.yaml` → **下载**，第 3 步要上传它。

## 第 3 步：在 Copilot Studio 建智能体（20 分钟）

用讲师发的演示租户账号登录 <https://copilotstudio.microsoft.com>。

### 3.1 新建智能体

1. 左下角 **环境切换**，选讲师指定的环境（演示租户里是带 **Trial** 标记的那个；Default 环境可能打不开）。
2. **Agents → New agent 旁的下拉箭头 → Agent（Standard）**。
   > 不要选带「GitHub Copilot」标记的 Agent：那是让 AI 帮你搭建，会消耗 Copilot Credits，步骤也不可复现。
3. 名称填 `业务汇报助手`；展开 **Agent settings**：
   - Language 选 **Chinese (Simplified)**；
   - **Schema name** 必须手动填英文（中文名生成不了），例如在前缀后填 `bizreport`。
4. 点 **Create**，等出现「Your agent has been provisioned」。

### 3.2 写指令、关掉联网搜索

1. **Overview → Instructions → Edit**，粘贴下面「智能体指令」整段，**Save**。
   > ⚠️ 指令编辑器里输入 `/` 会弹出插入菜单，斜杠后面的文字会被吞掉。下面的指令已经避开了斜杠，自己改时也别用。
2. 同页 **Knowledge → Web Search** 关掉，让智能体只按工具返回的内容回答。

### 3.3 导入 REST API 工具

1. **Tools → Add a tool → Create new 区域点 See all → REST API**。
2. **Upload specification**：上传第 2 步改好的 `openapi.yaml` → Next。
3. **API plugin details**：名称和描述会自动带出（Atlas Agent Labs）→ Next（第一次保存约 30 秒）。
4. **Authentication**：Studio 不会自动读 openapi 里的密钥配置，要手动设：
   - 认证方式选 **API key**；
   - Parameter label 随意（如 `API 密钥（LAB_API_KEY）`），**Parameter name 填 `x-api-key`**，Location 选 **Header**。
5. **Select Tools**：4 个操作逐个点开 → Next → Next（所有字段的描述都已在 openapi 里写好，不用改）。
6. **Review → Next → Publish**，看到「Your tool is now published」。

### 3.4 把工具挂到智能体上

1. 点 **Create connection**，回到 Add tool 对话框，搜索 `Atlas`，找到「Atlas Agent Labs」下的 4 个操作。
2. 点第一个「查询本周行业洞察」→ Connection 下拉 → **Create new connection** → 填 `LAB_API_KEY` → **Create** → **Add and configure**。
3. 其余 3 个照做（连接会自动复用，直接 **Add and configure**）。
4. 回到 **Tools** 页，确认 4 个工具都是 **On**、Trigger 是 **By agent**。

### 智能体指令

```text
你是阿特拉斯中国的「业务汇报助手」，服务销售、产品、市场同事。你有两项能力：
1. 行业洞察：用户问某个行业本周有什么变化、对我们有什么影响时，调用「查询本周行业洞察」，topic 填用户提到的行业，没指定行业就填「全部」。回答时先给 2~3 句结论，再列影响等级为「高」的事件和对业务的影响，最后附上 reportPageUrl。只根据工具返回的内容回答，不要补充工具没给的事实。不要在回答里写信号编号（如 S024），也不要输出 cite 之类的引用标记；需要注明来源时，用 Markdown 链接写成「来源：[媒体名](链接)」。如果 mode 是 fallback，提醒用户这期周报未经智能体研判。
2. 生成汇报：用户要把行业洞察「整理成汇报」或「做成 PPT」时，调用「把行业洞察做成汇报 PPT」，topic 沿用刚才的行业；用户给了网页链接要做汇报时，调用「把网页做成汇报 PPT」。用户没说页数就填 6，没说风格就填 consulting。提交后立刻回复：「汇报 PPT 正在生成（约 2~5 分钟），可以在这个页面查看进度并下载」，并附上 progressPageUrl。用户之后问「好了吗」，用同一个 jobId 调用「查询 PPT 生成进度」，成功就给出 downloadUrl。
用户一句话里同时要洞察和汇报时，先调用「查询本周行业洞察」回答洞察，再调用「把行业洞察做成汇报 PPT」生成汇报。
```

## 第 4 步：测试（10 分钟）

在右侧 **Test your agent** 窗格依次输入。点左侧每个工具卡片，可以看到它实际收到的参数和返回值。

| # | 输入 | 预期 |
|---|---|---|
| 1 | `本周新能源汽车装配行业有什么变化？对我们有什么影响？` | 调用「查询本周行业洞察」，topic=新能源汽车装配（服务端会匹配到「新能源汽车」），回答附周报链接 |
| 2 | `把这些整理成 6 页汇报 PPT` | 调用「把行业洞察做成汇报 PPT」，回复进度页链接；2~5 分钟后进度页可下载 |
| 3 | `PPT 做好了吗？` | 调用「查询 PPT 生成进度」，给出下载链接 |
| 4 | `把这篇文章做成 5 页汇报：https://...` | 调用「把网页做成汇报 PPT」 |
| 5 | `看看本周锂电行业有什么变化，整理成汇报` | 先洞察、再提交 PPT，一条回复里两样都有 |

> **第一次调用工具时**，测试窗格可能提示「让我们先连接……打开连接管理器」：
> 点 **打开连接管理器** → 状态为 Stale 的那一行点 **Review** → 选已建好的连接 → **Submit** → 回到对话点 **重试**。

## 常见问题

| 现象 | 原因 | 处理 |
|---|---|---|
| 自检「公网地址可访问」失败，返回 302 或 401 | 端口 3000 是 Private（Codespace 重启后会自动变回去） | 端口面板右键 3000 → 端口可见性 → Public |
| 端口可见性里没有 Public 选项 | 组织的 Codespaces 策略禁止公开端口 | 找讲师 |
| 新建智能体页一直转圈、Agents 页提示「Select an environment」 | 当前环境没就绪或没有 Studio 许可 | 切换到讲师指定的 Trial 环境 |
| REST API 向导「Select tool parameters」页 Next 是灰的 | openapi 里有字段没写描述 | 用本目录的 openapi.yaml（已补全所有字段描述） |
| 智能体反问一个不需要的参数 | 工具参数是「有条件才必填」 | 本目录的 openapi 已拆成意图明确的工具，参数都是必填 |
| 回答里出现「cite」之类的乱码 | 模型自带的引用标记，Studio 不渲染 | 指令里已要求改用 Markdown 链接；仍出现可在 Overview 换一个模型试试 |
| 工具调用返回 401 | 连接里的 API 密钥和 `.env` 的 `LAB_API_KEY` 不一致 | 重新运行 `set-key.sh` 看当前值，重建连接 |
| 进度页显示「无法列出模型」 | Codespace 里没有有效的 Copilot 令牌，或组织没开 Copilot CLI 策略 | 重新 `set-key.sh` 后重启 `npm run dev`；仍不行找讲师 |
| Studio 调用超时、连不上 | Codespace 空闲超时被停了 | 回到 Codespace 让它恢复，`npm run dev` 重启服务、重新设 Public；把空闲超时调长 |

## 你学到了什么

- **工具描述就是提示词**：`openapi.yaml` 里每个操作的 `summary` 成了 Studio 里的工具名，`description` 决定了编排器什么时候调用它。
- **为编排器设计工具**：一个工具一个意图、参数尽量必填并写清默认值，比一个「万能」工具可靠得多。
- **长任务异步化**：提交即返回，进度页兜住超时，这是把智能体接进业务系统的通用做法。
