import { assertToolAuth } from "@/modules/ai/tools/tool-auth";
import { getToolByName } from "@/modules/ai/tools/tool-registry";
import type { AiToolContext } from "@/modules/ai/types/tool-context";
import { getAiLimits } from "@/modules/ai/config/ai-limits";
import { logger } from "@/lib/logger/logger";
import { ValidationError } from "@/lib/errors/app-error";

export async function executeTool(name: string, rawInput: unknown, ctx: AiToolContext) {
  const tool = getToolByName(name);
  if (!tool) throw new ValidationError(`Unknown tool: ${name}`);

  assertToolAuth(tool.auth, ctx);
  const input = tool.inputSchema.parse(rawInput ?? {});
  const started = Date.now();

  try {
    const output = await tool.handler(input, ctx);
    const serialized = JSON.stringify(output);
    const max = getAiLimits().maxToolOutputChars;
    if (serialized.length > max) {
      throw new ValidationError("Tool output too large.");
    }
    logger.info("ai_tool_success", {
      tenantId: ctx.tenantId,
      operation: name,
      durationMs: Date.now() - started,
    });
    return output;
  } catch (err) {
    logger.warn("ai_tool_failed", {
      tenantId: ctx.tenantId,
      operation: name,
      durationMs: Date.now() - started,
      errorCode: err instanceof Error ? err.message : "unknown",
    });
    throw err;
  }
}
