import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { parseJson } from "./utils";

// 定义支持的 Provider 类型
export type ProviderType = "openai" | "gemini" | "ark";

// 通用配置接口 (屏蔽细节)
export interface LLMConfig {
  provider: ProviderType;
  apiKey: string; // 统一叫 apiKey
  model: string; // 统一叫 model
  baseURL?: string; // Ark 需要，OpenAI/Gemini 可选
  logContent?: boolean; // 是否记录内容
}

export class LLMService {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  // 内部获取底层 Model 实例
  private getModelInstance() {
    const { provider, apiKey, model, baseURL } = this.config;

    switch (provider) {
      case "openai":
        const openai = createOpenAI({ apiKey, baseURL });
        return openai.chat(model);

      case "ark":
        // 火山引擎兼容 OpenAI 协议，复用 createOpenAI
        const ark = createOpenAI({
          apiKey,
          baseURL: baseURL || "https://ark.cn-beijing.volces.com/api/v3", // 默认地址
        });
        return ark.chat(model);

      case "gemini":
        // Google now supports OpenAI-compatible API
        const google = createOpenAI({
          apiKey,
          baseURL:
            baseURL ||
            "https://generativelanguage.googleapis.com/v1beta/openai/",
        });
        return google.chat(model);

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  // 统一对外方法：支持泛型
  async generate<T = any>(
    systemPrompt: string,
    userPrompt: string
  ): Promise<T | null> {
    try {
      const { text } = await generateText({
        model: this.getModelInstance(),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.1, // 保持低温度以输出稳定 JSON
      });

      return parseJson<T>(text);
    } catch (error) {
      console.error(`LLM Error [${this.config.provider}]:`, error);
      return null;
    }
  }

  // 新增：仅返回文本，不强制解析 JSON
  async generateSimple(
    systemPrompt: string,
    userPrompt: string
  ): Promise<string | null> {
    if (this.config.logContent) {
      console.log(`[LLM Req] [${this.config.provider}]`, {
        systemPrompt,
        userPrompt,
        model: this.config.model,
        baseURL: this.config.baseURL || "(default)",
      });
    }
    try {
      const { text } = await generateText({
        model: this.getModelInstance(),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.7, // 聊天场景稍微高一点温度
      });
      if (this.config.logContent) {
        console.log(`[LLM Res] [${this.config.provider}]`, text);
      }
      return text;
    } catch (error) {
      console.error(`LLM Error [${this.config.provider}]:`, error);
      if (error instanceof Error) {
        console.error("Error Message:", error.message);
        console.error("Error Stack:", error.stack);
        // 如果是 API 调用错误，通常会有 cause 或者 response 信息
        if ("cause" in error) {
          console.error("Error Cause:", (error as any).cause);
        }
      }
      return null;
    }
  }
}
