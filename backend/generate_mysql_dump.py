import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pymysql
from backend.config import MYSQL_USER, MYSQL_PASSWORD, MYSQL_HOST, MYSQL_PORT, MYSQL_DB

def generate_mysql_dump():
    database_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database"))
    os.makedirs(database_dir, exist_ok=True)

    conn = pymysql.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        port=int(MYSQL_PORT),
        database=MYSQL_DB
    )

    schema_file = os.path.join(database_dir, "schema.sql")
    dump_file = os.path.join(database_dir, "hrms_dump.sql")

    with conn.cursor() as cur:
        cur.execute("SHOW TABLES;")
        tables = [row[0] for row in cur.fetchall()]

        schema_lines = [
            "-- =====================================================================",
            "-- Human Resource Management System (HRMS) Database Schema",
            f"-- Database: MySQL (Engine: InnoDB)",
            f"-- Database Name: {MYSQL_DB}",
            "-- =====================================================================\n"
        ]

        dump_lines = list(schema_lines)
        dump_lines.append(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DB}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\nUSE `{MYSQL_DB}`;\n")

        for table in tables:
            cur.execute(f"SHOW CREATE TABLE `{table}`;")
            create_stmt = cur.fetchone()[1]
            schema_lines.append(f"{create_stmt};\n")
            dump_lines.append(f"DROP TABLE IF EXISTS `{table}`;")
            dump_lines.append(f"{create_stmt};\n")

            # Dump data
            cur.execute(f"SELECT * FROM `{table}`;")
            rows = cur.fetchall()
            if rows:
                cur.execute(f"DESCRIBE `{table}`;")
                col_names = [col[0] for col in cur.fetchall()]
                cols_str = ", ".join([f"`{c}`" for c in col_names])

                for row in rows:
                    vals = []
                    for val in row:
                        if val is None:
                            vals.append("NULL")
                        elif isinstance(val, (int, float)):
                            vals.append(str(val))
                        elif isinstance(val, bool):
                            vals.append("1" if val else "0")
                        else:
                            clean_str = str(val).replace("\\", "\\\\").replace("'", "\\'")
                            vals.append(f"'{clean_str}'")
                    vals_str = ", ".join(vals)
                    dump_lines.append(f"INSERT INTO `{table}` ({cols_str}) VALUES ({vals_str});")
                dump_lines.append("")

    conn.close()

    with open(schema_file, "w", encoding="utf-8") as f:
        f.write("\n".join(schema_lines))
    print(f"Generated {schema_file}")

    with open(dump_file, "w", encoding="utf-8") as f:
        f.write("\n".join(dump_lines))
    print(f"Generated {dump_file}")

if __name__ == "__main__":
    generate_mysql_dump()
