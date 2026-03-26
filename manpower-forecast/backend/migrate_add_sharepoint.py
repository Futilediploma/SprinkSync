"""Migration to add SharePoint import fields."""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "manpower_forecast.db")
conn = sqlite3.connect(db_path)
cur = conn.cursor()

project_cols = [r[1] for r in cur.execute("PRAGMA table_info(projects)").fetchall()]

new_project_cols = {
    "external_id": "TEXT",
    "source": "TEXT DEFAULT 'manual'",
    "square_footage": "REAL",
    "estimated_value": "REAL",
    "probability": "INTEGER",
    "bid_stage": "TEXT",
    "us_citizen_required": "INTEGER DEFAULT 0",
    "last_synced_at": "DATETIME",
}

for col, typ in new_project_cols.items():
    if col not in project_cols:
        cur.execute(f"ALTER TABLE projects ADD COLUMN {col} {typ}")
        print(f"Added projects.{col}")
    else:
        print(f"projects.{col} already exists")

# Create sync_logs table
cur.execute("""
CREATE TABLE IF NOT EXISTS sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    status TEXT,
    trigger TEXT,
    triggered_by TEXT,
    projects_created INTEGER DEFAULT 0,
    projects_updated INTEGER DEFAULT 0,
    projects_skipped INTEGER DEFAULT 0,
    rows_processed INTEGER DEFAULT 0,
    error_message TEXT,
    details TEXT
)
""")
print("sync_logs table ready")

conn.commit()
conn.close()
print("Migration complete")
