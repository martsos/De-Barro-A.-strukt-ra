import mysql.connector
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / "validate.env")

def get_connection():
    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        charset="utf8mb4",
        collation="utf8mb4_unicode_ci"
    )
    cursor = conn.cursor()
    cursor.execute("SET NAMES utf8mb4")
    cursor.execute("SET character_set_results = utf8mb4")
    cursor.close()
    return conn