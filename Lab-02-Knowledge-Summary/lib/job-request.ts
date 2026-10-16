import { NextResponse } from "next/server";

import { checkApiKey, publicBaseUrl } from "@/lib/api";
import type { SourceRequest } from "@/lib/generate";
import { createJob } from "@/lib/jobs";
import { DEFAULT_PAGES, getPresentationStyle, MAX_PAGES, MIN_PAGES, parsePageCount } from "@/lib/styles";

export interface CreateJobBody {
  sourceType?: string;
  url?: string;
  topic?: string;
  pages?: number | string;
  style?: string;
}

export function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

/**
 * 三个提交接口（/api/jobs、/api/jobs/insight、/api/jobs/webpage）共用的流程：
 * 鉴权 → 解析 JSON → 由各接口决定素材来源 → 校验页数和风格 → 建任务并立即返回。
 */
export async function handleCreateJob(
  request: Request,
  resolveSource: (body: CreateJobBody) => SourceRequest | NextResponse,
): Promise<NextResponse> {
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

  const source = resolveSource(body);
  if (source instanceof NextResponse) {
    return source;
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
