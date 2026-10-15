import * as fs from "node:fs/promises";
import * as path from "node:path";

import { runKnowledgeToPpt, type CopilotStreamEvent, type PresentationSource } from "@/lib/copilot";
import { filterByTopic, loadLatestReport, reportToMarkdown } from "@/lib/insight";
import { createSessionDir, extractReportedPptxName, snapshotPptxNames, waitForGeneratedPptx } from "@/lib/ppt-files";

/** 调用方给出的素材：网页链接，或者 Lab-01 的行业洞察周报（可按行业筛选）。 */
export type SourceRequest = { kind: "url"; url: string } | { kind: "insight"; topic?: string };

export interface GenerateInput {
  source: SourceRequest;
  style: string;
  pages: number;
}

export interface GenerateResult {
  sessionId: string;
  fileName: string;
  replyText: string;
  eventLog: string[];
}

export class GenerationError extends Error {
  constructor(
    message: string,
    readonly replyText = "",
    readonly eventLog: string[] = [],
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

export function downloadPath(sessionId: string, fileName: string): string {
  return `/api/download?session=${encodeURIComponent(sessionId)}&file=${encodeURIComponent(fileName)}`;
}

/** 把周报写进会话目录当素材：Copilot 直接读本地文件，不用回头抓自己的公网地址。 */
async function prepareSource(source: SourceRequest, sessionDir: string): Promise<PresentationSource> {
  if (source.kind === "url") {
    return source;
  }
  const loaded = await loadLatestReport();
  if (!loaded) {
    throw new GenerationError("还没有行业洞察周报，请先完成 Lab-01 生成 report.json。");
  }
  const report = filterByTopic(loaded.report, source.topic);
  if (!report.topics.length) {
    const names = loaded.report.topics.map((t) => t.name).join("、");
    throw new GenerationError(`周报里没有「${source.topic}」相关的行业，可选：${names}。`);
  }
  const fileName = "source.md";
  await fs.writeFile(path.join(sessionDir, fileName), reportToMarkdown(report), "utf-8");
  const scope = source.topic ? `「${source.topic}」部分` : "全文";
  return { kind: "file", fileName, label: `${report.title}${scope}` };
}

export async function generatePresentation(
  input: GenerateInput,
  onEvent?: (event: CopilotStreamEvent) => void,
): Promise<GenerateResult> {
  const startedAtMs = Date.now();
  const { sessionId, sessionDir } = await createSessionDir();
  const source = await prepareSource(input.source, sessionDir);
  const previousNames = await snapshotPptxNames(sessionDir);

  const result = await runKnowledgeToPpt({ source, style: input.style, pages: input.pages, sessionDir }, { onEvent });

  const file = await waitForGeneratedPptx({
    sessionDir,
    previousNames,
    startedAtMs,
    reportedFileName: extractReportedPptxName(result.replyText),
  });
  if (!file) {
    throw new GenerationError(
      "Copilot 会话已结束，但会话目录里没有找到生成的 PPTX，请查看服务端日志。",
      result.replyText,
      result.eventLog,
    );
  }
  return { sessionId, fileName: file.name, replyText: result.replyText, eventLog: result.eventLog };
}
