-- Create tables for storing pinyin learning content

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
