#!/usr/bin/env bash
# =============================================================================
# 填写 Copilot 访问令牌，并生成对外 API 密钥
#
#   bash .devcontainer/set-key.sh
#
# 写入 Lab-02-Knowledge-Summary/.env（已被 .gitignore 忽略，不会进版本库）：
#   COPILOT_GITHUB_TOKEN  Fine-grained PAT，权限 Account → Copilot Requests（Read）
#   LAB_API_KEY           Lab-03 给 Copilot Studio 连接器用的 x-api-key，没有就随机生成
#
# 令牌用隐藏输入读取，不作为命令行参数传入，不会留在 shell 历史里。
# =============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$REPO_ROOT/Lab-02-Knowledge-Summary/.env"
EXAMPLE="$REPO_ROOT/Lab-02-Knowledge-Summary/.env.example"

[[ -f "$ENV_FILE" ]] || cp "$EXAMPLE" "$ENV_FILE"
chmod 600 "$ENV_FILE"

value_of() { sed -nE "s/^[[:space:]]*$1=[[:space:]]*//p" "$ENV_FILE" | tail -1; }

# 删除旧值再追加。用 grep 过滤而不是 sed 替换：令牌里的字符可能破坏 sed 表达式。
set_var() {
  local tmp
  tmp="$(mktemp)"
  grep -vE "^[[:space:]]*#*[[:space:]]*$1=" "$ENV_FILE" > "$tmp" || true
  printf '%s=%s\n' "$1" "$2" >> "$tmp"
  cat "$tmp" > "$ENV_FILE"
  rm -f "$tmp"
  chmod 600 "$ENV_FILE"
}

echo
echo "粘贴你的 Fine-grained PAT（权限 Account → Copilot Requests），输入不会显示，回车确认："
token=""
IFS= read -rs token || true
echo
token="$(printf '%s' "$token" | tr -d '[:space:]')"
if [[ -z "$token" ]]; then
  echo "没有输入令牌，保持原值不变。"
else
  if [[ "$token" != github_pat_* ]]; then
    echo "! 这不像 Fine-grained PAT（通常以 github_pat_ 开头）。classic 令牌（ghp_）不支持 Copilot SDK，"
    echo "  如果后面报「无法列出模型」，请按 docs/codespaces.md 重新生成 Fine-grained PAT。"
  fi
  set_var COPILOT_GITHUB_TOKEN "$token"
  echo "✔ 已写入 COPILOT_GITHUB_TOKEN"
fi

api_key="$(value_of LAB_API_KEY)"
if [[ -z "$api_key" ]]; then
  api_key="$(openssl rand -hex 16)"
  set_var LAB_API_KEY "$api_key"
fi

cat <<EOT

✔ LAB_API_KEY = $api_key
  Lab-03 在 Copilot Studio 里建连接器时要填这个值（请求头 x-api-key）。

如果 Lab-02 的服务已经在跑，按 Ctrl+C 停掉再 npm run dev 重启，新配置才会生效。
EOT
