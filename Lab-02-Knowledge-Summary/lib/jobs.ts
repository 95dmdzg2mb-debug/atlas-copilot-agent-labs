import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { CopilotInitializationError } from "@/lib/copilot";
import { generatePresentation, GenerationError, type GenerateInput } from "@/lib/generate";
import { OUTPUT_DIR } from "@/lib/ppt-files";

/**
 * 异步任务：Copilot Studio 的连接器调用有超时，生成一份 PPT 要几分钟，
 * 所以提交后立刻返回任务号，生成在后台排队进行，调用方再按任务号查进度。
 */
export type JobStatus = "queued" | "running" | "succeeded" | "failed";

export interface Job extends GenerateInput {
  id: string;
  status: JobStatus;
  message: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  sessionId?: string;
  fileName?: string;
}

const JOBS_DIR = path.join(OUTPUT_DIR, "jobs");
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 一台 Codespace 一次只跑一个生成任务，其余排队，避免同时拉起多个浏览器把 2 核机器压满。
// 存在 globalThis 上，开发模式热更新时任务表和队列不会丢。
const state = (globalThis as typeof globalThis & {
  __knowledgeJobs?: { jobs: Map<string, Job>; tail: Promise<void> };
}).__knowledgeJobs ??= { jobs: new Map(), tail: Promise.resolve() };

async function save(job: Job): Promise<void> {
  state.jobs.set(job.id, job);
  await fs.mkdir(JOBS_DIR, { recursive: true });
  await fs.writeFile(path.join(JOBS_DIR, `${job.id}.json`), JSON.stringify(job, null, 2), "utf-8");
}

async function run(job: Job): Promise<void> {
  await save({ ...job, status: "running", message: "正在调用 Copilot 生成 PPT，通常需要 2~5 分钟。", startedAt: new Date().toISOString() });
  try {
    const result = await generatePresentation(job, (event) => {
      const current = state.jobs.get(job.id);
      if (current && event.level !== "delta" && event.summary) {
        current.message = event.summary.slice(0, 200);
      }
    });
    await save({
      ...state.jobs.get(job.id)!,
      status: "succeeded",
      message: "PPT 已生成。",
      sessionId: result.sessionId,
      fileName: result.fileName,
      finishedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof CopilotInitializationError
        ? error.userMessage
        : error instanceof GenerationError || error instanceof Error
          ? error.message
          : "生成失败。";
    await save({ ...state.jobs.get(job.id)!, status: "failed", message, finishedAt: new Date().toISOString() });
  }
}

export async function createJob(input: GenerateInput): Promise<Job> {
  const job: Job = {
    ...input,
    id: crypto.randomUUID(),
    status: "queued",
    message: "已排队，等待前面的任务完成。",
    createdAt: new Date().toISOString(),
  };
  await save(job);
  state.tail = state.tail.then(() => run(job)).catch(() => undefined);
  return job;
}

export async function getJob(id: string): Promise<Job | null> {
  if (!UUID_RE.test(id)) {
    return null;
  }
  const inMemory = state.jobs.get(id);
  if (inMemory) {
    return inMemory;
  }
  try {
    const job = JSON.parse(await fs.readFile(path.join(JOBS_DIR, `${id}.json`), "utf-8")) as Job;
    // 文件里还是「进行中」但内存里没有：服务重启过，任务已经中断
    if (job.status === "queued" || job.status === "running") {
      return { ...job, status: "failed", message: "服务重启，任务已中断，请重新提交。" };
    }
    return job;
  } catch {
    return null;
  }
}
