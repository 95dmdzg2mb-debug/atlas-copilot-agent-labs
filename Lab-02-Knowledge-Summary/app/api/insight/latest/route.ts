import { NextResponse } from "next/server";

import { checkApiKey, publicBaseUrl } from "@/lib/api";
import { filterByTopic, loadLatestReport } from "@/lib/insight";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 读取最新一期行业洞察周报（Lab-01 产出），可用 ?topic= 按行业筛选。 */
export async function GET(request: Request) {
  const denied = checkApiKey(request);
  if (denied) {
    return denied;
  }

  const loaded = await loadLatestReport();
  if (!loaded) {
    return NextResponse.json({ error: "还没有行业洞察周报，请先完成 Lab-01。" }, { status: 404 });
  }

  const topic = new URL(request.url).searchParams.get("topic")?.trim() || "";
  const report = filterByTopic(loaded.report, topic);
  const query = topic ? `?topic=${encodeURIComponent(topic)}` : "";
  return NextResponse.json({
    title: report.title,
    period: report.period,
    mode: report.mode,
    origin: loaded.origin,
    availableTopics: loaded.report.topics.map((t) => t.name),
    matchedTopic: topic ? report.topics.map((t) => t.name) : null,
    summary: report.summary,
    topics: report.topics.map((t) => ({
      name: t.name,
      hotspots: t.hotspots.map((h) => ({
        title: h.title,
        whatHappened: h.what_happened,
        impact: h.impact,
        impactArea: h.impact_area,
        level: h.level,
        sources: h.references.map((r) => ({ title: r.title, url: r.url, source: r.source })),
      })),
    })),
    actions: report.actions,
    reportPageUrl: `${publicBaseUrl(request)}/insight${query}`,
  });
}
