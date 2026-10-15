import * as crypto from "node:crypto";

import { NextResponse } from "next/server";

/**
 * 对外 API（给 Copilot Studio 调用）的简单鉴权。
 * 端口设成 Public 后任何人都能访问，而每次生成都会消耗你的 Copilot 额度，
 * 所以 .env 里配了 LAB_API_KEY 时，请求必须带上同值的 x-api-key 请求头。
 */
export function checkApiKey(request: Request): NextResponse | null {
  const expected = process.env.LAB_API_KEY?.trim();
  if (!expected) {
    return null;
  }
  const given = request.headers.get("x-api-key")?.trim() ?? "";
  const ok =
    given.length === expected.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  return ok ? null : NextResponse.json({ error: "缺少或错误的 x-api-key 请求头。" }, { status: 401 });
}

/**
 * 返回给 Copilot Studio 的链接必须是公网能打开的地址。
 * 在 Codespace 里由环境变量拼出 https://<codespace>-3000.app.github.dev；
 * 其他环境可用 PUBLIC_BASE_URL 显式指定。
 */
export function publicBaseUrl(request: Request): string {
  const configured = process.env.PUBLIC_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  const codespace = process.env.CODESPACE_NAME;
  const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
  if (codespace && domain) {
    return `https://${codespace}-${process.env.PORT || "3000"}.${domain}`;
  }
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") ?? "http";
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
