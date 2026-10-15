# 学员手册 · 用 Codespaces 跑完这门课

全程在浏览器里完成，本机不用装任何软件。每一步都写了**期望结果**，对不上就看本页最后的「遇到问题」或举手找讲师。

## 0. 课前（讲师会提前发通知）

- [ ] 有 GitHub 账号，已被讲师加入课程组织，并有 **Copilot Business / Enterprise** 席位
- [ ] 已按下面「准备 Copilot 令牌」生成好 Fine-grained PAT（Lab-02 要用）
- [ ] 讲师发给你的 Copilot Studio 演示账号能登录 <https://copilotstudio.microsoft.com>（Lab-03 要用）

### 准备 Copilot 令牌（Fine-grained PAT）

1. 打开 <https://github.com/settings/personal-access-tokens> → **Generate new token**。
2. Token name 写 `copilot-agent-labs`，Expiration 选 7 天。
3. **Resource owner 选你自己的账号**（不要选组织，组织往往需要管理员审批）。
4. Permissions → **Account permissions** → **Copilot Requests** 选 **Read**。其他都不用勾。
5. 生成后复制 `github_pat_...` 开头的令牌，先存在安全的地方。

## 1. 创建 Codespace（5 分钟）

1. 打开课程仓库页面，点 **Code → Codespaces → Create codespace on main**。
   **不要先 fork**，fork 后再开会重装全部依赖。
2. 等待浏览器里出现 VS Code，终端里打印出「环境就绪」。

**期望结果**：终端最后几行是「环境就绪。下一步：……」，左下角显示 `Codespaces`。

3. 在终端运行，粘贴令牌后回车（输入不会显示）：
   ```bash
   bash .devcontainer/set-key.sh
   ```
   **期望结果**：`✔ 已写入 COPILOT_GITHUB_TOKEN`，并打印一串 `LAB_API_KEY`（Lab-03 要用，先不用记）。

4. 把空闲超时调长，免得 Lab-03 时 Codespace 自己停掉：打开 <https://github.com/settings/codespaces> →
   **Default idle timeout** 改成 **120** 分钟。

## 2. Lab-01 · 行业洞察智能体（50 分钟）

按 [Lab-01 README](../Lab-01-Industry-Insight/README.md) 操作。核心三件事：

1. Copilot Chat → **Agent** 模式 → 输入 `/industry-insight`。
   **期望结果**：智能体依次调用 `read_focus`、`fetch_industry_signals`、`get_signals`、`build_weekly_report`，最后汇报「几个行业、几个热点」。
2. 预览周报：
   ```bash
   python -m http.server 8080 --directory Lab-01-Industry-Insight/frontend
   ```
   **期望结果**：网页标题「行业洞察周报 · 20xx-Wxx」，页头写「模式：智能体研判」。
3. 改 `Lab-01-Industry-Insight/focus.md`，加一个你关注的行业，再跑一次。

## 3. Lab-02 · 知识总结智能体（50 分钟）

按 [Lab-02 README](../Lab-02-Knowledge-Summary/README.md) 操作。核心三件事：

1. 在 Chat 里让 Copilot 把一篇文章总结成 6 页汇报 PPT，下载用 PowerPoint 打开。
2. 改 `.github/skills/knowledge2ppt/SKILL.md` 的「团队汇报规范」，再生成一次对比。
3. 启动网页服务：
   ```bash
   cd Lab-02-Knowledge-Summary && npm run dev
   ```
   **期望结果**：浏览器打开端口 3000，页面标题「知识总结智能体 · 一键出汇报 PPT」；选「本周行业洞察周报」能生成 PPT。

> 下载 Codespace 里的文件：资源管理器里右键文件 → **下载**。

## 4. Lab-03 · Copilot Studio 串起来（40 分钟）

按 [Lab-03 README](../Lab-03-Copilot-Studio/README.md) 操作。关键一步是把端口 3000 设为 **Public**，然后跑自检：

```bash
bash Lab-03-Copilot-Studio/smoke-test.sh
```

**期望结果**：最后一行「全部通过（4 项），可以去 Copilot Studio 建连接器了」。

## 5. 课后清理

1. 端口面板把 3000 改回 **Private**。
2. 想保留你的改动：资源管理器里右键 `focus.md`、`SKILL.md` 下载；或者课后 fork 一份再提交。
3. 停止并删除 Codespace：<https://github.com/codespaces> → 你的 Codespace → **Delete**。
4. 删除课上用的 Fine-grained PAT：<https://github.com/settings/personal-access-tokens>。

## 遇到问题

| 现象 | 处理 |
|---|---|
| Codespace 一直在装依赖，很久不好 | 你可能是在 fork 上开的。关掉，回到课程仓库直接开 |
| Codespace 打不开 / 白屏 | 公司网络访问不了 `*.github.dev`，换讲师提供的热点 |
| Chat 里没有 Agent 模式或工具图标 | 组织的 Copilot 策略没开 Agent / MCP，找讲师 |
| 「无法列出模型」 | 重新 `bash .devcontainer/set-key.sh`；令牌正确仍报错就是组织没开 Copilot CLI 策略，找讲师 |
| 各 Lab 的专项问题 | 见各 Lab README 最后的「遇到问题」 |
