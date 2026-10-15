import { NextResponse } from "next/server";

import { checkApiKey, isValidHttpUrl, publicBaseUrl } from "@/lib/api";
import type { SourceRequest } from "@/lib/generate";
import { createJob } from "@/lib/jobs";
import { DEFAULT_PAGES, getPresentationStyle, MAX_PAGES, MIN_PAGES, parsePageCount } from "@/lib/styles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateJobBody {
  sourceType?: string;
  url?: string;
  topic?: string;
  pages?: number | string;
  style?: string;
}

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

/** 提交一个生成任务，立即返回任务号；生成在后台进行。 */
export async function POST(request: Request) {
  const denied = checkApiKey(request);
  if (denied) {
    return denied;
  }

  let body: CreateJobBody;
  try {
    body = (await request.json()) as CreateJobBody;
  } catch {
    return badRequest("请求体必须是 JSON。");
  }

  const url = body.url?.trim() ?? "";
  const sourceType = body.sourceType?.trim() || (url ? "url" : "insight");
  let source: SourceRequest;
  if (sourceType === "url") {
    if (!isValidHttpUrl(url)) {
      return badRequest("sourceType 为 url 时，url 必须是有效的 http/https 地址。");
    }
    source = { kind: "url", url };
  } else if (sourceType === "insight") {
    source = { kind: "insight", topic: body.topic?.trim() || undefined };
  } else {
    return badRequest("sourceType 只能是 url 或 insight。");
  }

  const pages = parsePageCount(body.pages ?? DEFAULT_PAGES);
  if (pages === null) {
    return badRequest(`pages 必须是 ${MIN_PAGES} 到 ${MAX_PAGES} 之间的整数。`);
  }
  const style = getPresentationStyle(body.style?.trim() || "consulting");
  if (!style) {
    return badRequest("style 只能是 consulting、geek 或 magazine。");
  }

  const job = await createJob({ source, style: style.label, pages });
  const base = publicBaseUrl(request);
  return NextResponse.json(
    {
      jobId: job.id,
      status: job.status,
      message: "任务已提交，PPT 通常需要 2~5 分钟生成。可把 progressPageUrl 发给用户，在网页里查看进度并下载。",
      statusUrl: `${base}/api/jobs/${job.id}`,
      progressPageUrl: `${base}/jobs/${job.id}`,
    },
    { status: 202 },
  );
}
