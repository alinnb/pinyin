import { pinyin } from "pinyin-pro";
import {
  initDB,
  getAvailableVolumes,
  getVolumeData,
  getRandomArticle,
  getArticleById,
} from "./lib/db";

interface Env {
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
    // Handle literal \r\n, \n, \r with optional spaces
    .replace(/\\\s*r\s*\\?\s*n/g, "\n")
    .replace(/\\\s*n/g, "\n")
    .replace(/\\\s*r/g, "\n")
    // Handle actual control characters
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

    // 错题练习：直接返回包含错题字符的练习内容
    if (initialType === "mistake") {
      const charsToUse = mistakes && mistakes.length > 0
        ? mistakes.slice(0, 10)
        : ["那", "哪", "拔", "拨", "拆", "折", "即", "既", "染", "梁"];

      // 将错题字符组成简单的练习句
      const practiceWordList = [
        "天空大地花草树木江河湖海山川",
        "日月星辰风雨雷电云雾雪霜",
        "春夏秋冬春夏秋冬春秋冬夏",
        "爸爸妈妈哥哥姐姐弟弟妹妹",
        "老师同学朋友邻居客人",
      ];
      const baseText = practiceWordList[Math.floor(Math.random() * practiceWordList.length)];

      // 随机替换一些字符为错题字符
      const chars = Array.from(baseText);
      for (let i = 0; i < Math.min(charsToUse.length, 4); i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        chars[randomIndex] = charsToUse[i];
      }

      return Response.json({
        content: chars.join(""),
      });
    }

    // 如果指定了 articleId 和 lineIndex，尝试获取下一句
    if (typeof articleId === "number" && typeof lineIndex === "number") {
      const dbArticle = await getArticleById(env.DB, articleId);
      if (dbArticle) {
        const lines = splitContentLines(dbArticle.content);
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
      }
    }

    // 尝试从 DB 获取（如果 initialType 是 volumeId）
    const dbArticle = await getRandomArticle(env.DB, initialType);
    if (dbArticle) {
      const lines = splitContentLines(dbArticle.content);

      return Response.json({
        article: {
          id: dbArticle.id,
          title: dbArticle.lesson,
          content: lines,
          lineIndex: 0,
          totalLines: lines.length,
        },
      });
    }

    // 数据库中没有找到内容
    return Response.json({ error: "未找到练习内容" }, { status: 404 });
  } catch (error) {
    console.error("[Worker] Error:", error);
    return Response.json({ error: "生成失败，请稍后再试" }, { status: 500 });
  }
}
