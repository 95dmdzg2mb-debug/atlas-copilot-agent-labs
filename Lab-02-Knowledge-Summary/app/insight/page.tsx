import Link from "next/link";

import { filterByTopic, loadLatestReport } from "@/lib/insight";

export const dynamic = "force-dynamic";

/** 行业洞察周报网页版（读 Lab-01 的 report.json）。Copilot Studio 回复里给业务同事的就是这个链接。 */
export default async function InsightPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  const loaded = await loadLatestReport();

  if (!loaded) {
    return (
      <main className="shell">
        <div className="page">
          <div className="status-banner error">还没有行业洞察周报，请先完成 Lab-01 生成 report.json。</div>
        </div>
      </main>
    );
  }

  const report = filterByTopic(loaded.report, topic);
  return (
    <main className="shell">
      <div className="page">
        <section className="content">
          <section className="form-card">
            <span className="eyebrow">Industry Insight · {report.period.week}</span>
            <h2 style={{ fontFamily: "var(--font-display)" }}>
              {report.title}
              {topic ? ` · ${topic}` : ""}
            </h2>
            <p className="result-meta">
              {report.period.start} ~ {report.period.end} · {report.mode === "llm" ? "智能体研判" : "兜底（未经智能体研判）"} · {loaded.origin}
            </p>
            <h3>本周摘要</h3>
            <ul>
              {report.summary.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>

          {report.topics.length === 0 ? (
            <div className="status-banner error">
              周报里没有「{topic}」相关的行业，可选：{loaded.report.topics.map((t) => t.name).join("、")}。
            </div>
          ) : null}

          {report.topics.map((t) => (
            <section className="result-card" key={t.name}>
              <h3 style={{ fontFamily: "var(--font-display)" }}>{t.name}</h3>
              {t.hotspots.map((h) => (
                <div key={h.title} style={{ marginTop: 16 }}>
                  <strong>{h.title}</strong>
                  <span className="style-tag" style={{ marginLeft: 8 }}>
                    {h.impact_area}·{h.level}
                  </span>
                  {h.what_happened ? <p>发生了什么：{h.what_happened}</p> : null}
                  {h.impact ? <p>对我们的影响：{h.impact}</p> : null}
                  <p className="result-meta">
                    来源：
                    {h.references.map((r, i) => (
                      <span key={r.id}>
                        {i > 0 ? "；" : ""}
                        <a href={r.url} target="_blank" rel="noreferrer">
                          {r.source}
                        </a>
                      </span>
                    ))}
                  </p>
                </div>
              ))}
            </section>
          ))}

          {!topic && report.actions.length ? (
            <section className="result-card">
              <h3 style={{ fontFamily: "var(--font-display)" }}>行动建议</h3>
              <ul>
                {report.actions.map((a) => (
                  <li key={a.action}>
                    <strong>{a.owner}</strong>：{a.action}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="result-meta">
            <Link href="/">← 把这份周报做成汇报 PPT</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
