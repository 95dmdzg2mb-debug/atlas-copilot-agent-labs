import { normalizeTopic } from "@/lib/insight";
import { handleCreateJob } from "@/lib/job-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 把本周行业洞察周报做成汇报 PPT（Copilot Studio 工具 CreateInsightPresentation）。 */
export async function POST(request: Request) {
  return handleCreateJob(request, (body) => ({ kind: "insight", topic: normalizeTopic(body.topic) }));
}
