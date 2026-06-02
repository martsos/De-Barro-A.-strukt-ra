from database import get_connection
from auth import get_password_hash

users = [
    {
        "username": "admin",
        "password": "admin123",
        "nev": "Adminisztrátor",
        "szerepkor": "ADMIN_1"
    },
    {
        "username": "teszt_ua",
        "password": "teszt123",
        "nev": "Teszt Üzemanyagos",
        "szerepkor": "UA_3"
    }
]

conn = get_connection()
cursor = conn.cursor()

for user in users:
    print(f"Hashelés előtt: '{user['password']}'")
    hash = get_password_hash(user["password"])
    # szerepkor_id lekérés
    cursor.execute("SELECT szerepkor_id FROM szerepkorok WHERE szerepkor = %s", (user["szerepkor"],))
    szerepkor = cursor.fetchone()
    
    if not szerepkor:
        print(f"Szerepkör nem található: {user['szerepkor']}")
        continue
    
    hash = get_password_hash(user["password"])
    
    cursor.execute("""
        INSERT INTO users (username, password_hash, nev, szerepkor_id)
        VALUES (%s, %s, %s, %s)
    """, (user["username"], hash, user["nev"], szerepkor[0]))
    
    print(f"User létrehozva: {user['username']}")

conn.commit()
cursor.close()
conn.close()
print("Kész!")

