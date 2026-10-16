import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.database import engine
from sqlalchemy import inspect, text

columns_to_add = {
    "attendance": [
        ("shiftId", "varchar(36) NULL"),
        ("isLate", "tinyint(1) NOT NULL DEFAULT 0"),
        ("lateMinutes", "int NOT NULL DEFAULT 0"),
        ("isEarlyExit", "tinyint(1) NOT NULL DEFAULT 0"),
        ("earlyExitMinutes", "int NOT NULL DEFAULT 0"),
        ("overtimeHours", "float NOT NULL DEFAULT 0"),
    ],
    "payrolls": [
        ("standardWorkingDays", "int NOT NULL DEFAULT 22"),
        ("weekendDaysCount", "int NOT NULL DEFAULT 8"),
        ("holidaysCount", "int NOT NULL DEFAULT 0"),
        ("conveyanceAllowance", "float NOT NULL DEFAULT 0"),
        ("medicalAllowance", "float NOT NULL DEFAULT 0"),
        ("specialAllowance", "float NOT NULL DEFAULT 0"),
        ("overtimeHours", "float NOT NULL DEFAULT 0"),
        ("overtimePay", "float NOT NULL DEFAULT 0"),
        ("variablePay", "float NOT NULL DEFAULT 0"),
    ],
    "notifications": [
        ("targetRole", "varchar(50) DEFAULT 'ALL'"),
        ("targetDepartment", "varchar(100) DEFAULT 'ALL'"),
        ("isBroadcast", "tinyint(1) NOT NULL DEFAULT 0"),
        ("actionUrl", "varchar(255) NULL"),
    ]
}

def run_migrations():
    insp = inspect(engine)
    with engine.connect() as conn:
        for table, cols in columns_to_add.items():
            existing = {c["name"] for c in insp.get_columns(table)}
            for col_name, col_def in cols:
                if col_name not in existing:
                    stmt = f"ALTER TABLE `{table}` ADD COLUMN `{col_name}` {col_def};"
                    print(f"Adding column {col_name} to {table}...")
                    conn.execute(text(stmt))
                else:
                    print(f"Column {col_name} already in {table}.")
        conn.commit()
    print("All Phase 2 columns verified and present in MySQL tables!")

if __name__ == "__main__":
    run_migrations()
