import mysql.connector

def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Kacsa1001",
        database="debarro_uzemanyag"
    )