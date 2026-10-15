"use client";

import { useEffect, useRef, useState } from "react";

import {
  DEFAULT_PAGES,
  MAX_PAGES,
  MIN_PAGES,
  PRESENTATION_STYLES,
  type PresentationStyleId,
} from "@/lib/styles";

interface GenerateResponse {
  fileName: string;
  downloadPath: string;
  replyText: string;
  eventLog: string[];
}

interface StreamEventPayload {
  type: string;
  level: "info" | "error" | "delta";
  summary: string;
  timestamp: string;
  data: Record<string, unknown>;
}

interface StatusPayload {
  step: string;
  message: string;
  timestamp: string;
}

const MODEL_LIST_ERROR_MESSAGE = "无法列出模型，请确认环境变量已配置";

export default function HomePage() {
  const [sourceType, setSourceType] = useState<"url" | "insight">("url");
  const [url, setUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState<PresentationStyleId>("consulting");
  const [pages, setPages] = useState(String(DEFAULT_PAGES));
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setStatus("正在建立 SSE 连接并启动 Copilot 会话。");
    setIsStreaming(true);

    eventSourceRef.current?.close();

    try {
      const params = new URLSearchParams(
        sourceType === "url" ? { source: "url", url, style, pages } : { source: "insight", topic, style, pages },
      );
      const eventSource = new EventSource(`/api/generate/stream?${params.toString()}`);
      eventSourceRef.current = eventSource;

      eventSource.addEventListener("open", () => {
        setStatus("SSE 已连接，正在接收 Copilot SDK 事件。");
      });

      eventSource.addEventListener("status", (incoming) => {
        const data = JSON.parse((incoming as MessageEvent<string>).data) as StatusPayload;
        setStatus(data.message);
      });

      eventSource.addEventListener("sdk-event", (incoming) => {
        const data = JSON.parse((incoming as MessageEvent<string>).data) as StreamEventPayload;
        const summary = data.summary?.trim() || data.type;
        setStatus(summary);
      });

      eventSource.addEventListener("result", (incoming) => {
        const data = JSON.parse((incoming as MessageEvent<string>).data) as GenerateResponse;
        setResult(data);
        setStatus("PPT 已生成，可以下载结果文件。");
      });

      eventSource.addEventListener("generation-error", (incoming) => {
        const data = JSON.parse((incoming as MessageEvent<string>).data) as { error?: string };
        const message = data.error ?? "Generation failed.";
        setError(message === MODEL_LIST_ERROR_MESSAGE ? null : message);
        setIsStreaming(false);
        eventSource.close();
        eventSourceRef.current = null;
      });

      eventSource.addEventListener("complete", () => {
        setIsStreaming(false);
        eventSource.close();
        eventSourceRef.current = null;
      });

      eventSource.onerror = () => {
        if (eventSourceRef.current !== eventSource) {
          return;
        }

        setError("SSE connection closed unexpectedly.");
        setIsStreaming(false);
        eventSource.close();
        eventSourceRef.current = null;
      };
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Generation failed.");
      setIsStreaming(false);
    }
  }

  return (
    <main className="shell">
      <div className="page">
        <section className="content">
          <section className="form-card">
            <div className="form-head">
              <div>
                <span className="eyebrow">Knowledge Summary Agent</span>
                <h2 style={{ fontFamily: "var(--font-display)" }}>知识总结智能体 · 一键出汇报 PPT</h2>
                <p>给一个链接或选本周行业周报，按「结论 → 要点 → 建议」生成可编辑的 PPT。</p>
              </div>
            </div>

            <form className="grid-form" onSubmit={handleSubmit}>
              <div className="field">
                <div className="style-legend">素材来源</div>
                <div className="actions" style={{ justifyContent: "flex-start" }}>
                  <label>
                    <input
                      type="radio"
                      name="sourceType"
                      checked={sourceType === "url"}
                      onChange={() => setSourceType("url")}
                    />{" "}
                    网页链接（技术文章、竞品产品页、展会报道）
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="sourceType"
                      checked={sourceType === "insight"}
                      onChange={() => setSourceType("insight")}
                    />{" "}
                    本周行业洞察周报（Lab-01，<a href="/insight" target="_blank" rel="noreferrer">先看看</a>）
                  </label>
                </div>
              </div>

              {sourceType === "url" ? (
                <div className="field">
                  <label htmlFor="url">网页 URL</label>
                  <input
                    id="url"
                    name="url"
                    type="url"
                    placeholder="https://example.com/article"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="field">
                  <label htmlFor="topic">只看某个行业（可选）</label>
                  <input
                    id="topic"
                    name="topic"
                    type="text"
                    placeholder="例如：新能源汽车；留空用整份周报"
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                  />
                </div>
              )}

              <div className="field field-inline">
                <div>
                  <label htmlFor="pages">页数</label>
                  <div className="field-help">支持 {MIN_PAGES} 到 {MAX_PAGES} 页。</div>
                </div>
                <input
                  id="pages"
                  name="pages"
                  type="number"
                  inputMode="numeric"
                  min={MIN_PAGES}
                  max={MAX_PAGES}
                  step={1}
                  value={pages}
                  onChange={(event) => setPages(event.target.value)}
                  required
                />
              </div>

              <div className="field">
                <div className="style-legend">PPT 风格</div>
                <div className="style-grid">
                  {PRESENTATION_STYLES.map((option) => {
                    const selected = option.id === style;
                    return (
                      <label
                        key={option.id}
                        className={`style-card ${selected ? "selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="style"
                          value={option.id}
                          checked={selected}
                          onChange={() => setStyle(option.id as PresentationStyleId)}
                        />
                        <div className={`style-preview ${option.previewClassName}`} />
                        <div className="style-tag">{option.shortLabel}</div>
                        <h3 style={{ fontFamily: "var(--font-display)" }}>{option.label}</h3>
                        <p>{option.description}</p>
                        <p>{option.emphasis}</p>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="actions">
                <button className="button" type="submit" disabled={isStreaming}>
                  {isStreaming ? "生成中…" : "开始生成 PPT"}
                </button>
              </div>
            </form>
          </section>

          {isStreaming || status ? <div className="status-banner">{status ?? "正在调用 Copilot SDK，会话可能持续几十秒到数分钟。"}</div> : null}
          {error ? <div className="status-banner error">{error}</div> : null}

          {result ? (
            <section className="result-card">
              <div className="result-head">
                <div>
                  <span className="eyebrow">Result</span>
                  <h3 style={{ fontFamily: "var(--font-display)" }}>PPT 已生成</h3>
                </div>
                <a className="download-link" href={result.downloadPath}>
                  下载 {result.fileName}
                </a>
              </div>
              {result.replyText ? <p>{result.replyText}</p> : null}
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}