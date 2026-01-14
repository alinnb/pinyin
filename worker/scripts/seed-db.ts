import fs from "fs";
import path from "path";

interface ArticleData {
  volume: string;
  lesson: string;
  content: string[];
}

interface VolumeInfo {
  id: string;
  name: string;
}

const volumes: VolumeInfo[] = [
  { id: "grade-1-vol-1", name: "语文一年级上册" },
  { id: "grade-1-vol-2", name: "语文一年级下册" },
  { id: "grade-2-vol-1", name: "语文二年级上册" },
  { id: "grade-2-vol-2", name: "语文二年级下册" },
  { id: "grade-3-vol-1", name: "语文三年级上册" },
  { id: "grade-3-vol-2", name: "语文三年级下册" },
  { id: "grade-4-vol-1", name: "语文四年级上册" },
  { id: "grade-4-vol-2", name: "语文四年级下册" },
  { id: "grade-5-vol-1", name: "语文五年级上册" },
  { id: "grade-5-vol-2", name: "语文五年级下册" },
];

const volumeFileMapping: Record<string, string[]> = {
  "grade-1-vol-1": ["1-1.json"],
  "grade-1-vol-2": ["1-2.json"],
  "grade-2-vol-1": ["2-1.json"],
  "grade-2-vol-2": ["2-2.json"],
  "grade-3-vol-1": ["3-1.json"],
  "grade-3-vol-2": ["3-2.json"],
  "grade-4-vol-1": ["4-1.json", "4-1b.json"],
  "grade-4-vol-2": ["4-2.json", "4-2b.json"],
  "grade-5-vol-1": ["5-1.json", "5-1b.json"],
  "grade-5-vol-2": ["5-2.json", "5-2b.json"],
};

function loadArticles(files: string[]): ArticleData[] {
  const articles: ArticleData[] = [];

  for (const file of files) {
    const filePath = path.join(process.cwd(), "worker/data", file);
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content) as ArticleData[];
    articles.push(...parsed);
  }

  return articles;
}

function formatContent(content: string[]): string {
  return content.join("\n");
}

function generateInserts(): string {
  const statements: string[] = [];

  for (const volume of volumes) {
    const volumeFiles = volumeFileMapping[volume.id];
    if (!volumeFiles) continue;

    const articles = loadArticles(volumeFiles);

    statements.push(
      `INSERT OR REPLACE INTO volumes (id, name) VALUES ('${volume.id}', '${volume.name}');`
    );

    for (const article of articles) {
      const content = formatContent(article.content)
        .replace(/'/g, "''")
        .replace(/\n/g, "\\n");
      const lesson = article.lesson.replace(/'/g, "''");
      statements.push(
        `INSERT INTO articles (volume_id, lesson, content) VALUES ('${volume.id}', '${lesson}', '${content}');`
      );
    }
  }

  return statements.join("\n");
}

function generateSql(): string {
  const schema = `--
-- Database initialization script for pinyin learning app
-- Generated automatically
--

-- Create tables
CREATE TABLE IF NOT EXISTS volumes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  volume_id TEXT NOT NULL,
  lesson TEXT NOT NULL,
  content TEXT NOT NULL,
  FOREIGN KEY (volume_id) REFERENCES volumes(id)
);

CREATE INDEX IF NOT EXISTS idx_articles_volume_id ON articles(volume_id);

-- Seed data
`;

  return schema + generateInserts();
}

const sql = generateSql();
const outputPath = path.join(process.cwd(), "worker/migrations/0002_seed.sql");
fs.writeFileSync(outputPath, sql);
console.log(`Generated seed SQL at: ${outputPath}`);
console.log(`Total statements: ${sql.split(";").filter(Boolean).length}`);
