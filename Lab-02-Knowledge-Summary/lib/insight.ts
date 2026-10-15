import * as fs from "node:fs/promises";
import * as path from "node:path";

// 读取 Lab-01 生成的行业洞察周报（report.json）。
// 优先用学员自己在 Codespace 里刚跑出来的 output/，没有就用仓库里每周定时发布的 frontend/ 版本。
const LAB01_DIR = path.resolve(process.cwd(), "..", "Lab-01-Industry-Insight");
const CANDIDATES = [
  { path: path.join(LAB01_DIR, "output", "report.json"), origin: "本地运行（Lab-01 output/）" },
  { path: path.join(LAB01_DIR, "frontend", "report.json"), origin: "每周定时发布（Lab-01 frontend/）" },
];

export interface InsightReference {
  id: string;
  title: string;
  url: string;
  source: string;
  published_at: string | null;
}

export interface InsightHotspot {
  title: string;
  what_happened: string;
  impact: string;
  impact_area: string;
  level: string;
  references: InsightReference[];
}

export interface InsightReport {
  title: string;
  period: { week: string; start: string; end: string; days: number };
  generated_at: string;
  mode: "llm" | "fallback";
  summary: string[];
  topics: Array<{ name: string; hotspots: InsightHotspot[] }>;
  actions: Array<{ owner: string; action: string; basis: string }>;
  coverage: Array<{ topic: string; items: number; requests_ok: number; requests_failed: string[] }>;
}

export async function loadLatestReport(): Promise<{ report: InsightReport; origin: string } | null> {
  for (const candidate of CANDIDATES) {
    try {
      const text = await fs.readFile(candidate.path, "utf-8");
      return { report: JSON.parse(text) as InsightReport, origin: candidate.origin };
    } catch {
      // 文件不存在或不完整就试下一个
    }
  }
  return null;
}

/** 按行业筛选：「新能源汽车装配」能匹配到「新能源汽车」，留空返回全部。 */
export function filterByTopic(report: InsightReport, topic?: string | null): InsightReport {
  const query = topic?.trim();
  if (!query) {
    return report;
  }
  const topics = report.topics.filter((t) => query.includes(t.name) || t.name.includes(query));
  return { ...report, topics };
}

/** 把周报转成 Markdown，作为知识总结智能体的素材文件。 */
export function reportToMarkdown(report: InsightReport): string {
  const lines = [
    `# ${report.title}`,
    "",
    `时间窗：${report.period.start} ~ ${report.period.end}`,
    "",
    "## 本周摘要",
    ...report.summary.map((s) => `- ${s}`),
    "",
  ];
  for (const topic of report.topics) {
    lines.push(`## ${topic.name}`, "");
    for (const h of topic.hotspots) {
      lines.push(`### ${h.title}（${h.impact_area}·${h.level}）`);
      if (h.what_happened) lines.push(`- 发生了什么：${h.what_happened}`);
      if (h.impact) lines.push(`- 对我们的影响：${h.impact}`);
      lines.push(`- 来源：${h.references.map((r) => `${r.source} ${r.url}`).join("；")}`, "");
    }
  }
  if (report.actions.length) {
    lines.push("## 行动建议", ...report.actions.map((a) => `- ${a.owner}：${a.action}（依据：${a.basis || "—"}）`), "");
  }
  return lines.join("\n");
}
