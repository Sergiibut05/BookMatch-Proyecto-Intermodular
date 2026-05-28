"""
Semilla independiente para trueques (trades): usuarios trade_seed_*, user_books y trades.
No reutiliza usuarios de seed_analytics.py (prefijo seed_).

Uso:
  venv\\Scripts\\python scripts/seed_trades.py
  venv\\Scripts\\python scripts/seed_trades.py --clean
"""
from __future__ import annotations

import argparse
import os
import re
import sys
import uuid
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text


def load_env() -> None:
    if "DATABASE_URL" not in os.environ:
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        key_value = line.split("=", 1)
                        if len(key_value) == 2:
                            val = key_value[1].strip().strip('"').strip("'")
                            os.environ[key_value[0].strip()] = val


def get_engine():
    load_env()
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL no encontrada en el entorno o .env")
        sys.exit(1)

    if "?" in db_url:
        db_url = db_url.split("?")[0]

    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+pg8000://", 1)
    elif db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+pg8000://", 1)

    return create_engine(db_url)


def slug_email_local(name: str, suffix: str) -> str:
    s = name.lower()
    s = re.sub(r"[áàäâ]", "a", s)
    s = re.sub(r"[éèëê]", "e", s)
    s = re.sub(r"[íìïî]", "i", s)
    s = re.sub(r"[óòöô]", "o", s)
    s = re.sub(r"[úùüû]", "u", s)
    s = re.sub(r"ñ", "n", s)
    s = re.sub(r"[^a-z0-9]+", ".", s).strip(".")
    return f"{s}.{suffix}@bookmatch-trade.test"


def random_phone_es(rng: np.random.Generator) -> str:
    # +34 6XX XXX XXX (ficticio)
    second = int(rng.integers(10, 100))
    part_a = int(rng.integers(100, 1000))
    part_b = int(rng.integers(100, 1000))
    return f"+34 6{second:02d} {part_a:03d} {part_b:03d}"


def clean_data(engine) -> None:
    print("Borrando datos semilla de trueques (firebase_uid trade_seed_*)...")
    with engine.begin() as conn:
        result = conn.execute(text("DELETE FROM users WHERE firebase_uid LIKE 'trade_seed_%'"))
        print(f"Usuarios borrados (cascade trades, user_books, etc.): {result.rowcount}")
        for table, seq in (
            ("users", "users_id_seq"),
            ("user_books", "user_books_id_seq"),
            ("trades", "trades_id_seq"),
            ("trade_items", "trade_items_id_seq"),
        ):
            try:
                conn.execute(
                    text(f"SELECT setval('{seq}', (SELECT COALESCE(MAX(id), 1) FROM {table}))")
                )
            except Exception as e:
                print(f"Advertencia setval {seq}: {e}")
    print("Limpieza completada.")


def seed_data(engine) -> None:
    rng = np.random.default_rng(2026)

    nombres = [
        "María", "Laura", "Carmen", "Ana", "Lucía", "Sofía", "Elena", "Patricia",
        "Isabel", "Cristina", "Paula", "Andrea", "Natalia", "Raquel", "Beatriz",
        "Javier", "Carlos", "Miguel", "David", "Daniel", "Pablo", "Alejandro",
        "Francisco", "Sergio", "Alberto", "Roberto", "Iván", "Hugo", "Manuel",
    ]
    apellidos = [
        "García", "González", "Rodríguez", "Martínez", "López", "Sánchez", "Pérez",
        "Gómez", "Martín", "Jiménez", "Ruiz", "Hernández", "Díaz", "Moreno", "Muñoz",
        "Álvarez", "Romero", "Alonso", "Gutiérrez", "Navarro", "Torres", "Domínguez",
    ]

    with engine.begin() as conn:
        existing = conn.execute(
            text("SELECT COUNT(*) FROM users WHERE firebase_uid LIKE 'trade_seed_%'")
        ).scalar()
        if existing and int(existing) > 0:
            print(
                "Ya existen usuarios con prefijo trade_seed_. "
                "Ejecuta primero: python scripts/seed_trades.py --clean"
            )
            sys.exit(1)

        books_df = pd.read_sql_query(
            text(
                """
                SELECT id, title, author, isbn, description, cover_url, "imageUrls"
                FROM catalog_books
                """
            ),
            conn,
        )
        if books_df.empty:
            print("Error: catalog_books está vacío. Carga catálogo antes.")
            sys.exit(1)

        # Normalizar nombre de columna array por si el driver devuelve minúsculas
        if "imageUrls" not in books_df.columns and "imageurls" in books_df.columns:
            books_df = books_df.rename(columns={"imageurls": "imageUrls"})

        catalog_ids = books_df["id"].astype(int).tolist()
        if len(catalog_ids) < 5:
            print("Error: hacen falta al menos 5 libros en catalog_books para asignar hasta 5 por usuario.")
            sys.exit(1)
        n_users = 20
        now = datetime.now()

        users_rows: list[dict] = []
        used_emails: set[str] = set()
        for _ in range(n_users):
            fn = str(rng.choice(nombres))
            ln1 = str(rng.choice(apellidos))
            ln2 = str(rng.choice(apellidos)) if rng.random() > 0.35 else ""
            full_name = f"{fn} {ln1}" + (f" {ln2}" if ln2 else "")
            suffix = uuid.uuid4().hex[:10]
            email = slug_email_local(full_name.replace(" ", "."), suffix)
            while email in used_emails:
                suffix = uuid.uuid4().hex[:10]
                email = slug_email_local(full_name.replace(" ", "."), suffix)
            used_emails.add(email)

            users_rows.append(
                {
                    "firebase_uid": f"trade_seed_{uuid.uuid4().hex}",
                    "email": email,
                    "full_name": full_name,
                    "phone": random_phone_es(rng),
                    # role: omitido — la BD aplica DEFAULT "USER"::"Role"
                    "created_at": now - timedelta(days=int(rng.integers(5, 200))),
                    "updated_at": now,
                }
            )

        users_df = pd.DataFrame(users_rows)
        print(f"Insertando {len(users_df)} usuarios trade_seed_* ...")
        users_df.to_sql("users", con=conn, if_exists="append", index=False)

        seed_users = pd.read_sql_query(
            text(
                "SELECT id, firebase_uid FROM users WHERE firebase_uid LIKE 'trade_seed_%' ORDER BY id"
            ),
            conn,
        )
        user_ids = seed_users["id"].astype(int).tolist()

        conditions = ["NEW", "LIKE_NEW", "GOOD", "ACCEPTABLE", "WORN"]
        ub_rows: list[dict] = []
        for uid in user_ids:
            k = int(rng.integers(2, 6))  # 2-5 libros por usuario
            k = min(k, len(catalog_ids))
            pick = rng.choice(np.array(catalog_ids, dtype=int), size=k, replace=False)
            for cid in pick:
                row = books_df[books_df["id"] == int(cid)].iloc[0]
                cond = str(rng.choice(conditions))
                isbn_v = row["isbn"] if "isbn" in row.index and pd.notna(row["isbn"]) else None
                desc_v = row["description"] if "description" in row.index and pd.notna(row["description"]) else None
                cover_v = row["cover_url"] if "cover_url" in row.index and pd.notna(row["cover_url"]) else None
                ub_rows.append(
                    {
                        "title": row["title"],
                        "author": row["author"],
                        "isbn": isbn_v,
                        "description": desc_v,
                        "cover_url": cover_v,
                        "condition": cond,
                        "catalog_book_id": int(cid),
                        "owner_id": int(uid),
                        "created_at": now - timedelta(days=int(rng.integers(1, 60))),
                        "updated_at": now,
                    }
                )

        insert_ub = text(
            """
            INSERT INTO user_books (
                title, author, isbn, description, cover_url, "condition",
                catalog_book_id, owner_id, created_at, updated_at
            )
            VALUES (
                :title, :author, :isbn, :description, :cover_url,
                CAST(:condition AS "BookCondition"),
                :catalog_book_id, :owner_id, :created_at, :updated_at
            )
            """
        )
        print(f"Insertando {len(ub_rows)} user_books enlazados al catálogo...")
        for r in ub_rows:
            conn.execute(insert_ub, r)

        ub_map = pd.read_sql_query(
            text(
                """
                SELECT ub.id AS user_book_id, ub.owner_id
                FROM user_books ub
                INNER JOIN users u ON u.id = ub.owner_id
                WHERE u.firebase_uid LIKE 'trade_seed_%'
                ORDER BY ub.owner_id, ub.id
                """
            ),
            conn,
        )
        by_owner: dict[int, list[int]] = {}
        for _, r in ub_map.iterrows():
            oid = int(r["owner_id"])
            by_owner.setdefault(oid, []).append(int(r["user_book_id"]))

        n_trades = int(rng.integers(15, 21))  # 15-20 inclusive
        statuses = np.array(["PROPOSED", "ACCEPTED", "COMPLETED", "REJECTED"])
        status_p = np.array([0.25, 0.25, 0.35, 0.15])
        status_p = status_p / status_p.sum()

        start_trade_id = int(
            conn.execute(text("SELECT COALESCE(MAX(id), 0) + 1 FROM trades")).scalar()
        )

        used_books: set[int] = set()
        trades_rows: list[dict] = []
        items_rows: list[dict] = []

        max_attempts = n_trades * 40
        attempts = 0
        while len(trades_rows) < n_trades and attempts < max_attempts:
            attempts += 1
            a, b = rng.choice(np.array(user_ids, dtype=int), size=2, replace=False)
            sender, receiver = int(a), int(b)
            if rng.random() < 0.5:
                sender, receiver = receiver, sender

            pool_s = [x for x in by_owner.get(sender, []) if x not in used_books]
            pool_r = [x for x in by_owner.get(receiver, []) if x not in used_books]
            if len(pool_s) < 1 or len(pool_r) < 1:
                continue

            ns = int(rng.integers(1, min(3, len(pool_s)) + 1))
            nr = int(rng.integers(1, min(3, len(pool_r)) + 1))
            rng.shuffle(pool_s)
            rng.shuffle(pool_r)
            chosen_s = pool_s[:ns]
            chosen_r = pool_r[:nr]

            st = str(rng.choice(statuses, p=status_p))
            created = now - timedelta(days=int(rng.integers(1, 90)))
            expires = (
                created + timedelta(days=14)
                if st == "PROPOSED" and rng.random() > 0.3
                else None
            )
            msg = (
                "¿Te intercambiamos estos ejemplares?"
                if rng.random() > 0.4
                else None
            )

            tid = start_trade_id + len(trades_rows)
            trades_rows.append(
                {
                    "id": tid,
                    "status": st,
                    "sender_id": sender,
                    "receiver_id": receiver,
                    "message": msg,
                    "expires_at": expires,
                    "created_at": created,
                    "updated_at": now,
                }
            )
            for ubid in chosen_s:
                used_books.add(int(ubid))
                items_rows.append(
                    {
                        "trade_id": tid,
                        "user_book_id": int(ubid),
                        "side": "SENDER",
                        "created_at": created,
                    }
                )
            for ubid in chosen_r:
                used_books.add(int(ubid))
                items_rows.append(
                    {
                        "trade_id": tid,
                        "user_book_id": int(ubid),
                        "side": "RECEIVER",
                        "created_at": created,
                    }
                )

        if len(trades_rows) < n_trades:
            print(
                f"Advertencia: solo se generaron {len(trades_rows)} de {n_trades} trades "
                "(pocos intentos válidos con libros no usados)."
            )

        if not trades_rows:
            print("Error: no se pudieron generar trades.")
            sys.exit(1)

        insert_trade = text(
            """
            INSERT INTO trades (
                id, "status", sender_id, receiver_id, message, expires_at, created_at, updated_at
            )
            VALUES (
                :id, CAST(:status AS "TradeStatus"), :sender_id, :receiver_id,
                :message, :expires_at, :created_at, :updated_at
            )
            """
        )
        insert_item = text(
            """
            INSERT INTO trade_items (trade_id, user_book_id, side, created_at)
            VALUES (:trade_id, :user_book_id, CAST(:side AS "TradeSide"), :created_at)
            """
        )
        print(f"Insertando {len(trades_rows)} trades y {len(items_rows)} trade_items...")
        for r in trades_rows:
            conn.execute(insert_trade, r)
        for r in items_rows:
            conn.execute(insert_item, r)

        print("Actualizando secuencias...")
        for table, seq in (
            ("users", "users_id_seq"),
            ("user_books", "user_books_id_seq"),
            ("trades", "trades_id_seq"),
            ("trade_items", "trade_items_id_seq"),
        ):
            try:
                conn.execute(
                    text(f"SELECT setval('{seq}', (SELECT COALESCE(MAX(id), 1) FROM {table}))")
                )
            except Exception as e:
                print(f"Advertencia setval {seq}: {e}")

    print("Semilla de trueques completada.")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Semilla de usuarios, user_books y trades (prefijo firebase trade_seed_)."
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Borra usuarios trade_seed_* y datos en cascada.",
    )
    args = parser.parse_args()
    engine = get_engine()
    if args.clean:
        clean_data(engine)
    else:
        seed_data(engine)


if __name__ == "__main__":
    main()
