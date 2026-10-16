import { isValidHttpUrl } from "@/lib/api";
import { badRequest, handleCreateJob } from "@/lib/job-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 把一篇网页做成汇报 PPT（Copilot Studio 工具 CreateWebPagePresentation）。 */
export async function POST(request: Request) {
  return handleCreateJob(request, (body) => {
    const url = body.url?.trim() ?? "";
    return isValidHttpUrl(url) ? { kind: "url", url } : badRequest("url 必须是有效的 http/https 地址。");
  });
}
