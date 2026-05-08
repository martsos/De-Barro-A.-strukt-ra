import mysql.connector
from datetime import date, timedelta

def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="" \
        "Kacsa1001",
        database="debarro_uzemanyag"
    )

# Magyar ünnepnapok - bővíthető
unnepnapok = {
    # 2026
    date(2026, 1, 1): "Újév",
    date(2026, 3, 15): "Március 15.",
    date(2026, 4, 3): "Nagypéntek",
    date(2026, 4, 6): "Húsvéthétfő",
    date(2026, 5, 1): "Munka ünnepe",
    date(2026, 8, 20): "Államalapítás ünnepe",
    date(2026, 10, 23): "Október 23.",
    date(2026, 11, 1): "Mindenszentek",
    date(2026, 12, 25): "Karácsony első napja",
    date(2026, 12, 26): "Karácsony második napja",
    # 2027
    date(2027, 1, 1): "Újév",
    date(2027, 3, 15): "Március 15.",
    date(2027, 3, 26): "Nagypéntek",
    date(2027, 3, 29): "Húsvéthétfő",
    date(2027, 5, 1): "Munka ünnepe",
    date(2027, 8, 20): "Államalapítás ünnepe",
    date(2027, 10, 23): "Október 23.",
    date(2027, 11, 1): "Mindenszentek",
    date(2027, 12, 25): "Karácsony első napja",
    date(2027, 12, 26): "Karácsony második napja",
    # 2028
    date(2028, 1, 1): "Újév",
    date(2028, 3, 15): "Március 15.",
    date(2028, 4, 14): "Nagypéntek",
    date(2028, 4, 17): "Húsvéthétfő",
    date(2028, 5, 1): "Munka ünnepe",
    date(2028, 8, 20): "Államalapítás ünnepe",
    date(2028, 10, 23): "Október 23.",
    date(2028, 11, 1): "Mindenszentek",
    date(2028, 12, 25): "Karácsony első napja",
    date(2028, 12, 26): "Karácsony második napja",
    # 2029
    date(2029, 1, 1): "Újév",
    date(2029, 3, 15): "Március 15.",
    date(2029, 3, 30): "Nagypéntek",
    date(2029, 4, 2): "Húsvéthétfő",
    date(2029, 5, 1): "Munka ünnepe",
    date(2029, 8, 20): "Államalapítás ünnepe",
    date(2029, 10, 23): "Október 23.",
    date(2029, 11, 1): "Mindenszentek",
    date(2029, 12, 25): "Karácsony első napja",
    date(2029, 12, 26): "Karácsony második napja",
    # 2030
    date(2030, 1, 1): "Újév",
    date(2030, 3, 15): "Március 15.",
    date(2030, 4, 19): "Nagypéntek",
    date(2030, 4, 22): "Húsvéthétfő",
    date(2030, 5, 1): "Munka ünnepe",
    date(2030, 8, 20): "Államalapítás ünnepe",
    date(2030, 10, 23): "Október 23.",
    date(2030, 11, 1): "Mindenszentek",
    date(2030, 12, 25): "Karácsony első napja",
    date(2030, 12, 26): "Karácsony második napja",
}

magyar_honapok = {
    1: "Január", 2: "Február", 3: "Március", 4: "Április",
    5: "Május", 6: "Június", 7: "Július", 8: "Augusztus",
    9: "Szeptember", 10: "Október", 11: "November", 12: "December"
}

magyar_napok = {
    0: "Hétfő", 1: "Kedd", 2: "Szerda", 3: "Csütörtök",
    4: "Péntek", 5: "Szombat", 6: "Vasárnap"
}

def nap_tipusa(d):
    if d in unnepnapok:
        return "Ünnepnap"
    elif d.weekday() == 5:
        return "Szombat"
    elif d.weekday() == 6:
        return "Vasárnap"
    else:
        return "Munkanap"

def negyed(honap):
    if honap <= 3: return "Q1"
    elif honap <= 6: return "Q2"
    elif honap <= 9: return "Q3"
    else: return "Q4"

def generate_dates():
    conn = get_connection()
    cursor = conn.cursor()

    start = date(2026, 1, 1)
    end = date(2030, 12, 31)
    current = start

    while current <= end:
        datum_id = int(current.strftime("%Y%m%d"))
        ev = current.year
        honap_szam = current.month
        honap_nev = magyar_honapok[honap_szam]
        het_szam = current.isocalendar()[1]
        nap_szam = current.day
        nap_nev = magyar_napok[current.weekday()]
        nap_tip = nap_tipusa(current)
        unnep = unnepnapok.get(current, None)
        neg = negyed(honap_szam)

        cursor.execute("""
            INSERT IGNORE INTO dim_ido 
            (datum_id, datum, ev, negyed, honap_szam, honap_nev, 
             het_szam, nap_szam, nap_nev, nap_tipusa, unnep_neve)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (datum_id, current, ev, neg, honap_szam, honap_nev,
              het_szam, nap_szam, nap_nev, nap_tip, unnep))

        current += timedelta(days=1)

    conn.commit()
    conn.close()
    print("Dátumok feltöltve!")

generate_dates()