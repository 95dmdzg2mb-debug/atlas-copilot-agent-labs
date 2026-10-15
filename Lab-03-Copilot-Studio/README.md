# Lab-03 · 串起来：在 Copilot Studio 做成业务应用

> 业务同事一句话：「看看本周新能源汽车装配行业有什么变化，整理成汇报」
> → **行业洞察智能体**给出洞察 → **知识总结智能体**生成汇报 PPT。

实验时长：约 40 分钟。前置：完成 Lab-01（周报已生成）和 Lab-02（服务能在 Codespace 里跑起来）。

## 架构

```text
业务同事 ──对话──▶ Copilot Studio 智能体「业务汇报助手」（云端，讲师提供的演示租户）
                        │  自定义连接器（openapi.yaml，请求头 x-api-key）
                        ▼
   https://<你的 Codespace>-3000.app.github.dev   ← 端口 3000 设为 Public
                        │  Lab-02 的 Next.js 服务（同一个服务提供三个操作）
     ┌──────────────────┼──────────────────────────┐
     ▼                  ▼                          ▼
GetIndustryInsight  CreatePresentationJob    GetPresentationJob
读 Lab-01 周报       提交 PPT 任务，立即返回    查进度 / 拿下载链接
                     进度页链接（后台 2~5 分钟）
```

为什么是「提交任务 + 进度页」，而不是等 PPT 生成完再返回：Copilot Studio 调用连接器有超时，生成一份 PPT
要几分钟，同步等待一定会超时。所以接口立刻返回进度页链接，用户点开就能看到进度并下载。

## 第 1 步：让 Studio 能访问你的服务（10 分钟）

1. 确认已经填过令牌和 API 密钥（Lab-02 做过就跳过）：
   ```bash
   bash .devcontainer/set-key.sh
   ```
   记下最后打印的 `LAB_API_KEY`，第 3 步要用。
2. 启动 Lab-02 服务（已经在跑就跳过）：
   ```bash
   cd Lab-02-Knowledge-Summary && npm run dev
   ```
3. 打开 VS Code 底部的 **端口（Ports）** 面板，右键 `3000` → **端口可见性（Port Visibility）** → **Public**。
4. 新开一个终端，运行连通自检：
   ```bash
   bash Lab-03-Copilot-Studio/smoke-test.sh
   ```
   全部打勾才往下走。它会打印你的 **host** 和 **API 密钥**。

> ⚠️ 端口设为 Public 后，任何知道地址的人都能访问。所以生成 PPT 和读周报的接口都要求 `x-api-key`；
> 下课后请把端口改回 Private，或直接停止 Codespace。

## 第 2 步：改连接器定义（2 分钟）

打开 [openapi.yaml](openapi.yaml)，把 `host:` 这一行换成自检脚本打印的 host（不带 `https://`），保存。

## 第 3 步：在 Copilot Studio 建智能体（15 分钟）

用讲师发的演示租户账号登录 <https://copilotstudio.microsoft.com>。

1. **新建智能体**：名称 `业务汇报助手`，描述「帮销售、产品、市场同事查看行业洞察并生成汇报 PPT」。
2. **指令**：把下面「智能体指令」整段粘贴进去。
3. **添加工具**：工具 → 添加工具 → 新建工具 → **REST API**（不同租户的界面可能显示为「自定义连接器」，按界面提示导入即可）：
   - 上传改好的 `openapi.yaml`；
   - 身份验证选 **API 密钥**，参数名 `x-api-key`，位置 **Header**；
   - 新建连接时填入你的 `LAB_API_KEY`；
   - 三个操作（`GetIndustryInsight` / `CreatePresentationJob` / `GetPresentationJob`）全部添加为工具。
4. 确认智能体开启了**生成式编排**（Generative orchestration），这样它会根据工具描述自己决定何时调用哪个工具。

### 智能体指令

```text
你是阿特拉斯中国的「业务汇报助手」，服务销售、产品、市场同事。你有两项能力：

1. 行业洞察：用户问某个行业本周有什么变化、对我们有什么影响时，调用 GetIndustryInsight，
   topic 填用户提到的行业。回答时先给 2~3 句结论，再列影响等级为「高」的事件和对业务的影响，
   最后附上 reportPageUrl。只根据工具返回的内容回答，不要补充工具没给的事实。
   如果 mode 是 fallback，提醒用户这期周报未经智能体研判。

2. 生成汇报：用户要「整理成汇报 / 做成 PPT」时，调用 CreatePresentationJob：
   - 基于行业洞察做汇报：sourceType = insight，topic 填行业；
   - 基于某个网页做汇报：sourceType = url，url 填网页地址；
   - 用户没说页数就用 6 页，没说风格就用 consulting。
   提交后立刻回复：「汇报 PPT 正在生成（约 2~5 分钟），可以在这个页面查看进度并下载：<progressPageUrl>」。
   用户之后问「好了吗」，用同一个 jobId 调用 GetPresentationJob，成功就给出 downloadUrl。

用户一句话里同时要洞察和汇报时，先调用 GetIndustryInsight 回答洞察，再调用 CreatePresentationJob 生成汇报。
```

## 第 4 步：测试（10 分钟）

在 Studio 右侧测试窗格依次输入：

1. `本周新能源汽车装配行业有什么变化？对我们有什么影响？`
   - 预期：调用 `GetIndustryInsight`（topic=新能源汽车装配，服务端会匹配到「新能源汽车」），回答附周报链接。
2. `把这些整理成 6 页汇报 PPT`
   - 预期：调用 `CreatePresentationJob`（sourceType=insight），回复进度页链接；点开等 2~5 分钟后下载 PPT。
3. 一句话串起来：`看看本周锂电行业有什么变化，整理成汇报`
   - 预期：先回答洞察，再提交 PPT 任务。
4. `把这篇文章做成 5 页汇报：https://...`（换成任意一篇技术文章或竞品产品页）
   - 预期：sourceType=url。

## 常见问题

| 现象 | 原因 | 处理 |
|---|---|---|
| 自检「公网地址可访问」失败，返回 302 或 401 | 端口 3000 还是 Private | 端口面板右键 3000 → 端口可见性 → Public |
| 端口可见性里没有 Public 选项 | 组织的 Codespaces 策略禁止公开端口 | 找讲师（讲师手册里有处理办法） |
| Studio 调用返回 401 | 连接里的 API 密钥和 `.env` 的 `LAB_API_KEY` 不一致 | 重新运行 `set-key.sh` 看当前值，更新连接 |
| Studio 调用超时、连不上 | Codespace 空闲超时被停了 | 回到 Codespace 让它恢复，`npm run dev` 重启服务；把空闲超时调长（见讲师手册） |
| 进度页显示「无法列出模型」 | Copilot 令牌无效，或组织没开 Copilot CLI/SDK 策略 | 重新生成 Fine-grained PAT 并 `set-key.sh`；仍不行找讲师 |
| 连接器导入报错 | 用了 OpenAPI 3.x，或 host 带了 `https://` | 用本目录的 `openapi.yaml`（2.0），host 只写域名 |

## 你学到了什么

- **一个服务、一个连接器**：两个智能体通过同一个 Web 服务对外，Studio 只需要一个连接器。
- **长任务异步化**：提交即返回，进度页兜住超时，这是把智能体接进业务系统的通用做法。
- **工具描述就是提示词**：`openapi.yaml` 里每个操作的 `description` 决定了 Studio 什么时候调用它，改描述就能改行为。
