export interface Article {
  id: number;
  volume: string;
  lesson: string;
  content: string;
}

export interface Volume {
  id: string;
  name: string;
}

export type D1Database = {
  prepare(sql: string): D1Statement;
  exec(sql: string): Promise<D1ExecResult>;
  batch(stmts: D1Statement[]): Promise<D1Result<unknown>[]>;
};

export type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
};

export type D1Result<T = unknown> = {
  results?: T[];
  success: boolean;
  error?: string;
  meta?: {
    change_count?: number;
    duration?: number;
    last_row_id?: number;
  };
};

export type D1ExecResult = {
  count: number;
  duration: number;
};

let isInitialized = false;

export async function initDB(db: D1Database): Promise<void> {
  if (isInitialized) return;

  try {
    await db.exec(`
    CREATE TABLE IF NOT EXISTS volumes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );
  `);

    await db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      volume_id TEXT NOT NULL,
      lesson TEXT NOT NULL,
      content TEXT NOT NULL,
      FOREIGN KEY (volume_id) REFERENCES volumes(id)
    );
  `);
  } catch (error: any) {
    // 忽略 Cloudflare 本地开发环境的特定错误
    // TypeError: Cannot read properties of undefined (reading 'duration')
    const isKnownError =
      error instanceof TypeError &&
      error.message &&
      error.message.includes("duration");

    if (!isKnownError) {
      console.error("DB Init Error:", error);
      // 如果是其他错误，我们可能不想标记为已初始化，以便重试？
      // 或者为了避免无限报错，还是标记为 true？
      // 这里选择抛出，让外层决定，但外层目前只是 log。
      throw error;
    } else {
      // console.warn("Ignored known D1 local dev error");
    }
  }

  isInitialized = true;
}

export async function getAvailableVolumes(db: D1Database): Promise<Volume[]> {
  const stmt = db.prepare("SELECT id, name FROM volumes ORDER BY id");
  const result = await stmt.all<Volume>();
  return (result.results || []) as Volume[];
}

export async function getVolumeData(
  db: D1Database,
  volumeId: string
): Promise<Article[]> {
  const stmt = db.prepare(
    "SELECT id, volume_id as volume, lesson, content FROM articles WHERE volume_id = ?"
  );
  const result = await stmt.bind(volumeId).all<Article & { volume: string }>();
  const results = result.results || [];

  if (results.length === 0) {
    return [];
  }

  return results.map((row: Article & { volume: string }) => ({
    id: row.id,
    volume: row.volume,
    lesson: row.lesson,
    content: row.content,
  }));
}

export async function getRandomArticle(
  db: D1Database,
  volumeId?: string
): Promise<Article | null> {
  if (volumeId) {
    const stmt = db.prepare(
      "SELECT id, volume_id as volume, lesson, content FROM articles WHERE volume_id = ? ORDER BY RANDOM() LIMIT 1"
    );
    const result = await stmt
      .bind(volumeId)
      .first<Article & { volume: string }>();
    if (!result) return null;
    return {
      id: result.id,
      volume: result.volume,
      lesson: result.lesson,
      content: result.content,
    };
  }

  const stmt = db.prepare(
    "SELECT id, volume_id as volume, lesson, content FROM articles ORDER BY RANDOM() LIMIT 1"
  );
  const result = await stmt.first<Article & { volume: string }>();
  if (!result) return null;
  return {
    id: result.id,
    volume: result.volume,
    lesson: result.lesson,
    content: result.content,
  };
}

export async function getArticleById(
  db: D1Database,
  id: number
): Promise<Article | null> {
  const stmt = db.prepare(
    "SELECT id, volume_id as volume, lesson, content FROM articles WHERE id = ?"
  );
  const result = await stmt.bind(id).first<Article & { volume: string }>();
  if (!result) return null;
  return {
    id: result.id,
    volume: result.volume,
    lesson: result.lesson,
    content: result.content,
  };
}

export async function seedVolumes(
  db: D1Database,
  volumes: { id: string; name: string }[]
): Promise<void> {
  const batch = volumes.map((v) =>
    db
      .prepare("INSERT OR REPLACE INTO volumes (id, name) VALUES (?, ?)")
      .bind(v.id, v.name)
  );
  await db.batch(batch);
}

export async function seedArticles(
  db: D1Database,
  articles: { volume_id: string; lesson: string; content: string }[]
): Promise<void> {
  const batch = articles.map((a) =>
    db
      .prepare(
        "INSERT INTO articles (volume_id, lesson, content) VALUES (?, ?, ?)"
      )
      .bind(a.volume_id, a.lesson, a.content)
  );
  await db.batch(batch);
}

export async function getArticleCount(db: D1Database): Promise<number> {
  const stmt = db.prepare("SELECT COUNT(*) as count FROM articles");
  const result = await stmt.first<{ count: number }>();
  return result?.count || 0;
}
