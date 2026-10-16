#!/usr/bin/env bash
# =============================================================================
# devcontainer · onCreate —— 安装三个 Lab 的全部依赖
#
# Codespaces 预构建会执行它并把结果打进镜像，学员开 Codespace 时依赖已经装好。
# 安装步骤与各 Lab README 里的手动步骤保持一致。
# =============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

step() { echo; echo "==> $1"; }

# ---- 1. Python 虚拟环境（Lab-01 MCP 服务器 + pptx skill 的 Python 脚本）--------
# 位置必须是仓库根目录 .venv：.vscode/mcp.json 和 devcontainer.json 的 PATH 都写死了它。
# --clear：本地 Dev Containers 路线挂进来的目录里可能有宿主机建的 .venv，不能复用。
step "创建虚拟环境 .venv"
python -m venv --clear .venv
.venv/bin/python -m pip install --quiet --upgrade pip
.venv/bin/python -m pip install --quiet -r Lab-01-Industry-Insight/requirements.txt
.venv/bin/python -m pip install --quiet "markitdown[pptx]" defusedxml
.venv/bin/python --version

# ---- 2. Lab-02 Node 依赖（Next.js、Copilot SDK、pptxgenjs、playwright、sharp）----
step "安装 Lab-02 Node 依赖"
(cd Lab-02-Knowledge-Summary && npm ci --no-audit --no-fund)

# ---- 3. 无头 Chromium（pptx skill 把 HTML 渲染成幻灯片要用，约 150MB）---------
step "安装 Playwright Chromium 及系统依赖"
(cd Lab-02-Knowledge-Summary && npx playwright install --with-deps chromium)

# ---- 4. 离线自检：Lab-01 工具的单元测试（不联网、不需要凭证）------------------
step "自检 Lab-01 工具"
.venv/bin/python -m pytest Lab-01-Industry-Insight/tests -q -p no:cacheprovider

echo
echo "onCreate 完成。"
