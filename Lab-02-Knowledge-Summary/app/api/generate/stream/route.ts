import { isValidHttpUrl } from "@/lib/api";
import { CopilotInitializationError, type CopilotStreamEvent } from "@/lib/copilot";
import { downloadPath, generatePresentation, GenerationError, type SourceRequest } from "@/lib/generate";
import { getPresentationStyle, MAX_PAGES, MIN_PAGES, parsePageCount } from "@/lib/styles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function statusPayload(step: string, message: string) {
  return { step, message, timestamp: new Date().toISOString() };
}

function createSseResponse(body: BodyInit): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/** 网页端用：生成过程中的 Copilot SDK 事件通过 SSE 实时推给浏览器。 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sourceType = searchParams.get("source")?.trim() || "url";
  const url = searchParams.get("url")?.trim() ?? "";
  const topic = searchParams.get("topic")?.trim() || undefined;
  const pages = parsePageCount(searchParams.get("pages") ?? undefined);
  const style = getPresentationStyle(searchParams.get("style")?.trim() ?? "");

  let source: SourceRequest;
  if (sourceType === "insight") {
    source = { kind: "insight", topic };
  } else if (url && isValidHttpUrl(url)) {
    source = { kind: "url", url };
  } else {
    return createSseResponse(sseEvent("generation-error", { error: "请输入有效的 http 或 https 网页地址。" }));
  }

  if (!style) {
    return createSseResponse(sseEvent("generation-error", { error: "请选择一种支持的 PPT 风格。" }));
  }

  if (pages === null) {
    return createSseResponse(
      sseEvent("generation-error", { error: `页数需在 ${MIN_PAGES} 到 ${MAX_PAGES} 之间。` }),
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const write = (event: string, data: unknown) => {
        if (closed) {
          return;
        }

        controller.enqueue(encoder.encode(sseEvent(event, data)));
      };

      const close = () => {
        if (closed) {
          return;
        }

        closed = true;
        controller.close();
      };

      const abortHandler = () => {
        write("abort", statusPayload("aborted", "Client disconnected."));
        close();
      };

      request.signal.addEventListener("abort", abortHandler, { once: true });

      void (async () => {
        write("status", statusPayload("starting", "Copilot session is starting."));

        try {
          const result = await generatePresentation({ source, style: style.label, pages }, (event: CopilotStreamEvent) => {
            write("sdk-event", { ...event, timestamp: new Date().toISOString() });
          });

          write("result", {
            fileName: result.fileName,
            downloadPath: downloadPath(result.sessionId, result.fileName),
            replyText: result.replyText,
            eventLog: result.eventLog,
          });
          write("complete", statusPayload("complete", "Presentation generation finished."));
        } catch (error) {
          if (error instanceof CopilotInitializationError) {
            write("status", statusPayload("authentication-error", error.userMessage));
          }

          write("generation-error", {
            error:
              error instanceof CopilotInitializationError
                ? error.userMessage
                : error instanceof Error
                  ? error.message
                  : "Unexpected generation failure.",
            ...(error instanceof GenerationError ? { replyText: error.replyText, eventLog: error.eventLog } : {}),
          });
        } finally {
          request.signal.removeEventListener("abort", abortHandler);
          close();
        }
      })();
    },
  });

  return createSseResponse(stream);
}
