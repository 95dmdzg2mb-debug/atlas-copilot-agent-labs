import { isValidHttpUrl } from "@/lib/api";
import { normalizeTopic } from "@/lib/insight";
import { badRequest, handleCreateJob } from "@/lib/job-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 通用提交接口：用 sourceType 区分素材（curl 调试用）。Copilot Studio 用下面两个意图更明确的接口。 */
export async function POST(request: Request) {
  return handleCreateJob(request, (body) => {
    const url = body.url?.trim() ?? "";
    const sourceType = body.sourceType?.trim() || (url ? "url" : "insight");
    if (sourceType === "url") {
      return isValidHttpUrl(url)
        ? { kind: "url", url }
        : badRequest("sourceType 为 url 时，url 必须是有效的 http/https 地址。");
    }
    if (sourceType === "insight") {
      return { kind: "insight", topic: normalizeTopic(body.topic) };
    }
    return badRequest("sourceType 只能是 url 或 insight。");
  });
}
