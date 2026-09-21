import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
const dbPath = process.env.DATABASE_PATH || './data/email_automation.db';
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
export const db = new Database(dbPath);
db.pragma('journal_mode=WAL'); db.pragma('foreign_keys=ON');
db.exec(`CREATE TABLE IF NOT EXISTS contacts(id INTEGER PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT DEFAULT '',company TEXT DEFAULT '',job_title TEXT DEFAULT '',consent INTEGER NOT NULL DEFAULT 0,unsubscribed INTEGER NOT NULL DEFAULT 0,source TEXT DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS campaigns(id INTEGER PRIMARY KEY,name TEXT NOT NULL,subject TEXT NOT NULL,body_html TEXT NOT NULL,body_text TEXT NOT NULL,followup_days INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'draft',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,started_at TEXT,completed_at TEXT);
CREATE TABLE IF NOT EXISTS deliveries(id INTEGER PRIMARY KEY,campaign_id INTEGER NOT NULL,contact_id INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'queued',attempts INTEGER NOT NULL DEFAULT 0,provider_message_id TEXT,last_error TEXT,sent_at TEXT,followup_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(campaign_id,contact_id),FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,FOREIGN KEY(contact_id) REFERENCES contacts(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY,delivery_id INTEGER,type TEXT NOT NULL,payload TEXT DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status); CREATE INDEX IF NOT EXISTS idx_deliveries_followup ON deliveries(followup_at);`);
export function logEvent(deliveryId,type,payload={}) { db.prepare('INSERT INTO events(delivery_id,type,payload) VALUES(?,?,?)').run(deliveryId ?? null,type,JSON.stringify(payload)); }