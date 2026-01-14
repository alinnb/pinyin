import { pinyin } from "pinyin-pro";
import {
  initDB,
  getAvailableVolumes,
  getVolumeData,
  getRandomArticle,
  getArticleById,
} from "./lib/db";

interface Env {
  GOOGLE_AI_STUDIO_TOKEN: string;
  GEMINI_MODEL_CHAT: string;
  NODE_ENV?: string;
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      await initDB(env.DB);
    } catch (error) {
      console.error("Failed to initialize database:", error);
    }

    const url = new URL(request.url);

    if (url.pathname === "/api/pinyin") {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }
      return handlePinyin(request);
    }

    if (url.pathname === "/api/generate") {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }
      return handleGenerate(request, env);
    }

    if (url.pathname === "/api/volumes") {
      const volumes = await getAvailableVolumes(env.DB);
      return Response.json(volumes);
    }

    if (url.pathname === "/api/articles") {
      const volumeId = url.searchParams.get("volume");
      if (!volumeId) {
        return Response.json(
          { error: "volume parameter required" },
          { status: 400 }
        );
      }
      const articles = await getVolumeData(env.DB, volumeId);
      return Response.json(articles);
    }

    if (url.pathname === "/api/random") {
      const volumeId = url.searchParams.get("volume") || undefined;
      const article = await getRandomArticle(env.DB, volumeId);
      if (!article) {
        return Response.json({ error: "No article found" }, { status: 404 });
      }
      const sentence = pickRandomSentence(article.content);
      return Response.json({
        article: {
          title: article.lesson,
          content: [sentence],
        },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

function splitContentLines(content: string): string[] {
  const normalized = content
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  return normalized
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function pickRandomSentence(content: string): string {
  const lines = splitContentLines(content);
  if (lines.length === 0) return content.trim();
  return lines[Math.floor(Math.random() * lines.length)];
}

async function handlePinyin(request: Request) {
  try {
    const body: Record<string, unknown> = await request.json();
    const { text, options } = body;

    if (!text || typeof text !== "string" || text.trim() === "") {
      return Response.json({ error: "请输入有效的中文文本" }, { status: 400 });
    }

    const userOptions = (options as Record<string, unknown>) || {};
    const pinyinOptions: Record<string, unknown> = {
      toneType: userOptions.toneType || "none",
      type: userOptions.type || "string",
      multiple: userOptions.multiple || false,
      separator: userOptions.separator || " ",
      removeNonZh: userOptions.removeNonZh || false,
    };

    const pinyinResult = pinyin(text, pinyinOptions);

    return Response.json({
      code: 0,
      data: {
        originalText: text,
        pinyin: pinyinResult,
        options: pinyinOptions,
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { code: -1, error: "服务器内部错误", message: errorMessage },
      { status: 500 }
    );
  }
}

async function handleGenerate(request: Request, env: Env) {
  try {
    const body: Record<string, unknown> = await request.json();
    const {
      type: initialType,
      mistakes,
      articleId,
      lineIndex,
    } = body as {
      type: string;
      mistakes?: string[];
      articleId?: number;
      lineIndex?: number;
    };

    // 如果指定了 articleId 和 lineIndex，尝试获取下一句
    if (typeof articleId === "number" && typeof lineIndex === "number") {
      const dbArticle = await getArticleById(env.DB, articleId);
      if (dbArticle) {
        const lines = dbArticle.content
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        const nextIndex = lineIndex + 1;

        if (nextIndex < lines.length) {
          return Response.json({
            article: {
              id: dbArticle.id,
              title: dbArticle.lesson,
              content: [lines[nextIndex]],
              lineIndex: nextIndex,
              totalLines: lines.length,
            },
          });
        }
        // 如果已经到末尾，继续下面的逻辑（随机取新的）
      }
    }

    // 尝试从 DB 获取（如果 initialType 是 volumeId）
    // 注意：getRandomArticle 内部会判断是否是 volumeId，如果不是（比如是 random/poem 等），可能也会返回 null 或者抛错？
    // 这里我们先判断 initialType 是否看起来像 volumeId（或者我们信任 getVolumeData 能处理）
    // 之前逻辑是直接调用 getVolumeData 来检查是否有数据，现在可以用 getRandomArticle

    // 简单判断：如果不是预定义的类型，假设它是 volumeId
    const isPredefined = [
      "random",
      "poem",
      "tongue",
      "sentence",
      "idiom",
      "classical",
      "mistake",
    ].includes(initialType);

    if (!isPredefined) {
      const dbArticle = await getRandomArticle(env.DB, initialType);
      if (dbArticle) {
        const lines = dbArticle.content
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        // 随机取一行
        const idx = Math.floor(Math.random() * lines.length);
        const sentence = lines[idx];

        return Response.json({
          article: {
            id: dbArticle.id,
            title: dbArticle.lesson,
            content: [sentence],
            lineIndex: idx,
            totalLines: lines.length,
          },
        });
      }
    }

    let type = initialType;
    if (type === "random") {
      const options = ["poem", "tongue", "sentence", "idiom", "classical"];
      type = options[Math.floor(Math.random() * options.length)];
    }

    const samples: Record<string, string[]> = {
      poem: ["床前明月光，疑是地上霜"],
      tongue: ["吃葡萄不吐葡萄皮，不吃葡萄倒吐葡萄皮"],
      sentence: ["小朋友喜欢读书，书中自有黄金屋"],
      idiom: ["有朋自远方来，不亦乐乎"],
      mistake: ["干燥的沙漠少雨，急躁的脾气不好"],
      classical: ["学而时习之，不亦说乎"],
    };

    const pickLocal = () => {
      const arr = samples[type] || samples["sentence"];
      const s = arr[Math.floor(Math.random() * arr.length)];
      return s.slice(0, 20);
    };

    let prompt = "";
    if (type === "mistake") {
      const mistakesToUse =
        mistakes && mistakes.length > 0
          ? mistakes
          : ["那", "哪", "拔", "拨", "拆", "折", "即", "既", "染", "梁"];
      const mistakesStr = mistakesToUse.slice(0, 20).join("，");
      prompt = `我的易错字是：${mistakesStr}。请根据这些易错字，生成一个包含这些字或类似易错字的短句，用于练习拼音。长度10-20字。只输出文本，保留标点符号，不要包含其他解释。`;
    } else {
      prompt =
        type === "poem"
          ? "随机生成一行小学阶段唐诗或宋词，需要真实存在而不是AI生成，长度10-20中文字。只输出文本，保留标点符号，不要包含其他解释。"
          : type === "tongue"
          ? "随机生成一条小学阶段绕口令，去除生僻字，长度10-20中文字。只输出文本，保留标点符号，不要包含其他解释。"
          : type === "idiom"
          ? "随机生成小学阶段的【2个常用短语/谚语】或【3个四字成语】，长度10-25中文字，不要含生僻字。只输出文本，不含序号，用逗号隔开，不要包含其他解释。"
          : type === "classical"
          ? "随机生成一句小学阶段的简短古文（如论语、孟子等名句），去除生僻字，长度10-20字。只输出文本，保留标点符号，不要包含其他解释。"
          : "随机生成一句小学阶段语文课文短句，长度10-20中文字。只输出文本，保留标点符号，不要包含其他解释。";
    }

    if (!env.GOOGLE_AI_STUDIO_TOKEN) {
      return Response.json({ content: pickLocal() });
    }

    console.log("[Worker] GOOGLE_AI_STUDIO_TOKEN is present");

    const ACCOUNT_ID = "6557015f49716345b2e62bcd3c3a9cd3";
    const GATEWAY_NAME = "pinyin-app";
    const MODEL = env.GEMINI_MODEL_CHAT || "gemini-2.5-flash";
    const url = `https://gateway.ai.cloudflare.com/v1/${ACCOUNT_ID}/${GATEWAY_NAME}/google-ai-studio/v1/models/${MODEL}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cf-aig-authorization": `Bearer ${env.GOOGLE_AI_STUDIO_TOKEN}`,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 1.0,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[Worker] Gemini API error! status: ${response.status}, body: ${errorText}`
      );
      return Response.json({ content: pickLocal() });
    }

    const data: any = await response.json();
    let text = "";
    if (
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts
    ) {
      text = data.candidates[0].content.parts.map((p: any) => p.text).join("");
    }

    if (text) {
      const out = text.trim().replace(/\s+/g, "");
      if (!out || out.length < 5) {
        console.warn("[Worker] Generated content too short or empty:", out);
        return Response.json({ content: pickLocal() });
      }
      const cleanOut = out.replace(/^["'“”‘’]+|["'“”‘’]+$/g, "");
      console.log("[Worker] Final cleaned content:", cleanOut);
      return Response.json({ content: cleanOut.slice(0, 25) });
    }

    return Response.json({ content: pickLocal() });
  } catch (error) {
    console.error("[Worker] Error:", error);
    return Response.json({ content: "生成失败，请稍后再试" });
  }
}
