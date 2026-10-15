import Link from "next/link";

import { downloadPath } from "@/lib/generate";
import { getJob } from "@/lib/jobs";

export const dynamic = "force-dynamic";

const STATUS_TEXT = { queued: "排队中", running: "生成中", succeeded: "已完成", failed: "失败" } as const;

/** 任务进度页：Copilot Studio 把这个链接发给用户，生成中每 5 秒自动刷新，完成后可直接下载。 */
export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    return (
      <main className="shell">
        <div className="page">
          <div className="status-banner error">找不到这个任务。</div>
        </div>
      </main>
    );
  }

  const done = job.status === "succeeded" || job.status === "failed";
  const source = job.source.kind === "url" ? job.source.url : `行业洞察周报${job.source.topic ? ` · ${job.source.topic}` : ""}`;
  return (
    <main className="shell">
      {done ? null : <meta httpEquiv="refresh" content="5" />}
      <div className="page">
        <section className="content">
          <section className="result-card">
            <span className="eyebrow">Job · {STATUS_TEXT[job.status]}</span>
            <h2 style={{ fontFamily: "var(--font-display)" }}>汇报 PPT 生成任务</h2>
            <p className="result-meta">
              素材：{source} · {job.pages} 页 · {job.style}
            </p>
            <div className={`status-banner ${job.status === "failed" ? "error" : job.status === "succeeded" ? "success" : ""}`}>
              {job.message}
              {done ? "" : "（页面每 5 秒自动刷新）"}
            </div>
            {job.status === "succeeded" && job.sessionId && job.fileName ? (
              <div className="actions">
                <a className="download-link" href={downloadPath(job.sessionId, job.fileName)}>
                  下载 {job.fileName}
                </a>
              </div>
            ) : null}
          </section>
          <p className="result-meta">
            <Link href="/">← 返回首页</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
