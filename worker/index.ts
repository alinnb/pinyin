import { pinyin } from "pinyin-pro";

interface Env {
  GOOGLE_AI_STUDIO_TOKEN: string;
  GEMINI_MODEL_CHAT: string;
  NODE_ENV?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

async function handlePinyin(request: Request) {
  try {
    const body: any = await request.json();
    const { text, options } = body;

    if (!text || typeof text !== "string" || text.trim() === "") {
      return Response.json({ error: "请输入有效的中文文本" }, { status: 400 });
    }

    const userOptions = options || {};
    const pinyinOptions: any = {
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
  } catch (error: any) {
    return Response.json(
      { code: -1, error: "服务器内部错误", message: error.message },
      { status: 500 }
    );
  }
}

async function handleGenerate(request: Request, env: Env) {
  try {
    const body: any = await request.json();
    let { type, mistakes } = body;

    if (type === "random") {
      const options = ["poem", "tongue", "sentence", "idiom", "classical"];
      type = options[Math.floor(Math.random() * options.length)];
    }

    const samples: Record<string, string[]> = {
      poem: ["床前明月光，疑是地上霜"],
      tongue: ["吃葡萄不吐葡萄皮，不吃葡萄倒吐葡萄皮"],
      sentence: ["小朋友喜欢读书，书中自有黄金屋"],
      idiom: ["亡羊补牢，为时未晚"],
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
      let mistakesToUse = mistakes;
      if (!mistakes || mistakes.length === 0) {
        mistakesToUse = [
          "那",
          "哪",
          "拔",
          "拨",
          "拆",
          "折",
          "即",
          "既",
          "染",
          "梁",
        ];
      }
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
          : "随机生成一句小学阶段童话短句，去除生僻字，长度10-20中文字。只输出文本，保留标点符号，不要包含其他解释。";
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
