import { LLMService } from "./factory";
import type { ProviderType, LLMConfig } from "./factory";

declare const process: any;

// 定义 Cloudflare Worker 的 Env 接口 (对应 .env 文件)
export interface Env {
  LLM_PROVIDER: string; // 'openai', 'gemini', 'ark'
  LLM_MAX_WORKERS?: string; // stored as string in env
  LOG_LLM_CONTENT?: string; // stored as string "true"/"false"

  // 我们可以约定，为了简单，环境变量也可以通用化，或者按需读取
  // 方案 A：通用变量名 (如 LLM_API_KEY) - 最简单，但切换 Provider 时需要改 Key
  // 方案 B：保留特定变量名 - 切换 Provider 时只需改 LLM_PROVIDER (推荐)
  OPENAI_API_KEY?: string;
  OPENAI_MODEL_NAME?: string;
  OPENAI_BASE_URL?: string;

  GEMINI_API_KEY?: string;
  GEMINI_MODEL_NAME?: string;
  GEMINI_BASE_URL?: string;

  ARK_API_KEY?: string;
  ARK_MODEL_NAME?: string;
  ARK_BASE_URL?: string;
}

export function createLLM(env?: Env, providerOverride?: string) {
  // 如果没有传 env，尝试使用 process.env (Node.js 环境)
  const configEnv =
    env ||
    ((typeof process !== "undefined" ? process.env : {}) as unknown as Env);

  const provider = (providerOverride || configEnv.LLM_PROVIDER) as ProviderType;
  const logContent = configEnv.LOG_LLM_CONTENT === "true";
  let config: LLMConfig;

  // 根据 provider 组装通用 Config
  switch (provider) {
    case "openai":
      config = {
        provider: "openai",
        apiKey: configEnv.OPENAI_API_KEY!,
        model: configEnv.OPENAI_MODEL_NAME || "gpt-4",
        baseURL: configEnv.OPENAI_BASE_URL,
        logContent,
      };
      break;
    case "gemini":
      config = {
        provider: "gemini",
        apiKey: configEnv.GEMINI_API_KEY!,
        model: configEnv.GEMINI_MODEL_NAME || "gemini-1.5-flash",
        baseURL: configEnv.GEMINI_BASE_URL,
        logContent,
      };
      break;
    case "ark":
      config = {
        provider: "ark",
        apiKey: configEnv.ARK_API_KEY!,
        model: configEnv.ARK_MODEL_NAME!,
        baseURL:
          configEnv.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3",
        logContent,
      };
      break;
    default:
      throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
  }

  return new LLMService(config);
}
