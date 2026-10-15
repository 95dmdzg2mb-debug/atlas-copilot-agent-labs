import { NextResponse } from "next/server";

import { checkApiKey, publicBaseUrl } from "@/lib/api";
import { downloadPath } from "@/lib/generate";
import { getJob } from "@/lib/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 查询任务进度；成功后返回下载链接。 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = checkApiKey(request);
  if (denied) {
    return denied;
  }

  const { id } = await params;
  const job = await getJob(id);
  if (!job) {
    return NextResponse.json({ error: "找不到这个任务。" }, { status: 404 });
  }

  const base = publicBaseUrl(request);
  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    message: job.message,
    fileName: job.fileName ?? null,
    downloadUrl: job.sessionId && job.fileName ? `${base}${downloadPath(job.sessionId, job.fileName)}` : null,
    progressPageUrl: `${base}/jobs/${job.id}`,
    createdAt: job.createdAt,
    finishedAt: job.finishedAt ?? null,
  });
}
