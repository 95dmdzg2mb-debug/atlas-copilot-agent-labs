#!/usr/bin/env bash
# =============================================================================
# devcontainer · postCreate —— 每个学员各自的轻量初始化（重活在 on-create.sh）
# =============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$REPO_ROOT/Lab-02-Knowledge-Summary/.env"

if [[ ! -x "$REPO_ROOT/.venv/bin/python" || ! -d "$REPO_ROOT/Lab-02-Knowledge-Summary/node_modules" ]]; then
  echo
  echo "✘ 依赖没装完整（.venv 或 Lab-02 的 node_modules 缺失）。在终端里重跑："
  echo "    bash .devcontainer/on-create.sh"
  echo "  还是不行请找讲师。"
  exit 0   # 不阻断容器启动，让学员还能进终端排查
fi

# .env 只在不存在时创建，不覆盖学员已经填好的值
if [[ ! -f "$ENV_FILE" ]]; then
  cp "$REPO_ROOT/Lab-02-Knowledge-Summary/.env.example" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
fi

# gh-aw 扩展只在讲师演示「每周定时」时用到，装不上不影响学员实验
gh extension install github/gh-aw >/dev/null 2>&1 || true

cat <<'BANNER'

环境就绪。下一步：

  1. 填写你的 Copilot 访问令牌（Lab-02 / Lab-03 要用）：
       bash .devcontainer/set-key.sh
  2. 打开 Copilot Chat，切到 Agent 模式，输入 /industry-insight 开始 Lab-01

学员手册：docs/codespaces.md

BANNER
