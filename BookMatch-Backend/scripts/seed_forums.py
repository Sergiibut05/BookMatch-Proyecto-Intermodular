"""
Semilla de foros, publicaciones, comentarios, respuestas y votos de prueba.

Usa usuarios existentes con firebase_uid trade_seed_* (seed_trades.py) y/o seed_*
(seed_analytics.py) como autores. Los foros semilla llevan la marca forum_seed:bookmatch
en la descripción para poder borrarlos con --clean.

Requisitos: pandas, numpy, sqlalchemy, pg8000 (venv del backend).

Uso:
  venv\\Scripts\\python scripts/seed_forums.py
  venv\\Scripts\\python scripts/seed_forums.py --clean

Desde la raíz del backend también:
  npm run seed:forums
  npm run seed:forums:clean
"""
from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text

SEED_MARKER = "forum_seed:bookmatch"

FORUM_THEMES: list[tuple[str, str]] = [
    (
        "Clásicos imprescindibles",
        "Debate sobre obras que marcan generaciones: ¿por dónde empezar y qué releer?",
    ),
    (
        "Novela negra y thriller",
        "Giros finales, detectives imperfectos y autoras que están redefiniendo el género.",
    ),
    (
        "Fantasía y mundos épicos",
        "Sagas largas, mapas, magia con reglas y worldbuilding que engancha.",
    ),
    (
        "Ciencia ficción (sin spoilers)",
        "Ucronías, espacio operático y distopías: comparte sin destripar el final.",
    ),
    (
        "Cómic y novela gráfica",
        "Tiras, álbumes europeos y cómic americano: arte y guion a partes iguales.",
    ),
    (
        "Poesía contemporánea",
        "Antologías, voces nuevas y poemas que se quedan en la cabeza días.",
    ),
    (
        "Ensayo y no ficción",
        "Divulgación, memorias y ensayo literario para leer con calma.",
    ),
    (
        "Novedades editoriales",
        "Lo que acaba de salir en librería: primeras impresiones y comparativas.",
    ),
    (
        "Recomendaciones rápidas",
        "Hilos cortos del tipo «si te gustó X, prueba Y» con razones concretas.",
    ),
    (
        "Club de lectura mensual",
        "Votamos título, fijamos ritmo de páginas y comentamos por capítulos.",
    ),
    (
        "Literatura infantil y juvenil",
        "Desde álbum ilustrado a YA: qué funciona en casa y en el aula.",
    ),
    (
        "Traducciones y estilo",
        "Comparar traductores, versiones antiguas y pérdidas culturales.",
    ),
]

POST_TITLE_POOL = [
    "¿Por dónde empezar con {topic}?",
    "Relectura de un clásico de {topic}",
    "Mi top 5 de {topic} este año",
    "Libro infravalorado de {topic}",
    "Debate: ¿obligatorio leer en orden?",
    "Adaptación al cine vs. el libro",
    "Edición ilustrada que merece la pena",
    "Búsqueda de recomendaciones para regalar",
    "Opinión impopular sobre {topic}",
    "Hilo de preguntas sin spoilers",
]

POST_BODY_INTROS = [
    "Llevo unas semanas enganchado a este tema y me gustaría contrastar opiniones con la comunidad.",
    "He terminado hace poco una obra que me ha dejado pensando y quiero abrir debate.",
    "Estoy montando una pequeña biblioteca temática y acepto sugerencias.",
    "Para quien empiece ahora, comparto lo que me habría venido bien saber antes.",
]

POST_BODY_MIDDLES = [
    "Me interesa especialmente la prosa, el ritmo y si el final cierra bien los hilos.",
    "También valoro ediciones cuidadas: tipografía, notas y traducción cuando aplica.",
    "Si podéis, indicad edad recomendada o si es lectura exigente.",
    "He leído mezcla de autores españoles y traducciones recientes.",
]

POST_BODY_OUTROS = [
    "¿Qué habéis leído vosotros últimamente en esta línea?",
    "Dejo el hilo abierto a recomendaciones y a disentir con respeto.",
    "Gracias por leer; responderé a los comentarios que pueda.",
]

COMMENT_TOP = [
    "Totalmente de acuerdo; yo empecé por esa antología y funcionó muy bien.",
    "Yo iría por otro orden: primero los cuentos y luego la novela larga.",
    "Ojo con la edición de bolsillo, a veces recorta notas útiles.",
    "Si te gusta ese autor, prueba también su ensayo breve sobre oficios literarios.",
    "Lo leí en audiolibro y la narración añade mucho en este género.",
    "No termino de conectar con el personaje principal, aunque el mundo está logrado.",
    "Para regalar, yo evitaría la edición de tapa dura salvo que sea coleccionista.",
    "Hay una reseña muy buena en la última Newsletter de la librería de barrio.",
]

COMMENT_REPLY = [
    "Buen apunte, no lo había considerado.",
    "Gracias, lo apunto para la siguiente visita a la biblioteca.",
    "Interesante; ¿recuerdas el título exacto de la edición?",
    "Coincido, sobre todo en la segunda mitad del libro.",
    "Yo tuve la experiencia contraria, pero entiendo tu lectura.",
    "Eso explica por qué el final me sonó apresurado.",
]


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


def stamp_description(body: str) -> str:
    return f"{body.strip()}\n\n{SEED_MARKER}"


def pick_author(rng: np.random.Generator, user_ids: np.ndarray) -> int:
    return int(rng.choice(user_ids))


def build_post_title(rng: np.random.Generator, topic: str) -> str:
    template = str(rng.choice(POST_TITLE_POOL))
    return template.format(topic=topic)


def build_post_content(rng: np.random.Generator, topic: str) -> str:
    intro = str(rng.choice(POST_BODY_INTROS))
    middle = str(rng.choice(POST_BODY_MIDDLES))
    outro = str(rng.choice(POST_BODY_OUTROS))
    return f"{intro}\n\nEstoy centrado en {topic}. {middle}\n\n{outro}"


def reset_sequences(conn, table_seq_pairs: tuple[tuple[str, str], ...]) -> None:
    for table, seq in table_seq_pairs:
        try:
            conn.execute(
                text(f"SELECT setval('{seq}', (SELECT COALESCE(MAX(id), 1) FROM {table}))")
            )
        except Exception as e:
            print(f"Advertencia setval {seq}: {e}")


def clean_data(engine) -> None:
    print(f"Borrando foros semilla (marca {SEED_MARKER}) y datos en cascada...")
    with engine.begin() as conn:
        result = conn.execute(
            text("DELETE FROM forums WHERE description LIKE :pat"),
            {"pat": f"%{SEED_MARKER}%"},
        )
        print(f"Foros borrados (posts, comentarios y votos en cascada): {result.rowcount}")
        reset_sequences(
            conn,
            (
                ("forums", "forums_id_seq"),
                ("posts", "posts_id_seq"),
                ("comments", "comments_id_seq"),
                ("votes", "votes_id_seq"),
            ),
        )
    print("Limpieza completada.")


def seed_data(engine) -> None:
    rng = np.random.default_rng(20260322)
    now = datetime.now()

    with engine.begin() as conn:
        existing = conn.execute(
            text("SELECT COUNT(*) FROM forums WHERE description LIKE :pat"),
            {"pat": f"%{SEED_MARKER}%"},
        ).scalar()
        if existing and int(existing) > 0:
            print(
                f"Ya existen foros semilla ({SEED_MARKER}). "
                "Ejecuta primero: python scripts/seed_forums.py --clean"
            )
            sys.exit(1)

        users_df = pd.read_sql_query(
            text(
                """
                SELECT id, firebase_uid, full_name
                FROM users
                WHERE firebase_uid LIKE 'trade_seed_%'
                   OR firebase_uid LIKE 'seed_%'
                ORDER BY id
                """
            ),
            conn,
        )
        if users_df.empty:
            print(
                "Error: no hay usuarios seed (trade_seed_* ni seed_*). "
                "Ejecuta seed_trades.py y/o seed_analytics.py antes."
            )
            sys.exit(1)

        user_ids = users_df["id"].astype(int).to_numpy()
        print(f"Autores disponibles: {len(user_ids)} usuarios seed.")

        n_forums = int(rng.integers(8, 13))  # 8–12 inclusive
        themes = list(FORUM_THEMES)
        rng.shuffle(themes)
        picked_forums = themes[:n_forums]

        forum_rows: list[dict] = []
        for title, desc in picked_forums:
            created = now - timedelta(days=int(rng.integers(30, 400)))
            forum_rows.append(
                {
                    "title": title,
                    "description": stamp_description(desc),
                    "creator_id": pick_author(rng, user_ids),
                    "created_at": created,
                    "updated_at": now,
                }
            )

        forums_df = pd.DataFrame(forum_rows)
        print(f"Insertando {len(forums_df)} foros...")
        forums_df.to_sql("forums", con=conn, if_exists="append", index=False)

        forums_map = pd.read_sql_query(
            text(
                """
                SELECT id, title
                FROM forums
                WHERE description LIKE :pat
                ORDER BY id
                """
            ),
            conn,
            params={"pat": f"%{SEED_MARKER}%"},
        )

        post_rows: list[dict] = []
        for _, forum in forums_map.iterrows():
            forum_id = int(forum["id"])
            topic = str(forum["title"])
            n_posts = int(rng.integers(3, 9))  # 3–8
            for _ in range(n_posts):
                created = now - timedelta(days=int(rng.integers(1, 120)))
                post_rows.append(
                    {
                        "title": build_post_title(rng, topic),
                        "content": build_post_content(rng, topic),
                        "forum_id": forum_id,
                        "author_id": pick_author(rng, user_ids),
                        "score": 0,
                        "created_at": created,
                        "updated_at": now,
                    }
                )

        posts_df = pd.DataFrame(post_rows)
        print(f"Insertando {len(posts_df)} posts...")
        posts_df.to_sql("posts", con=conn, if_exists="append", index=False)

        posts_map = pd.read_sql_query(
            text(
                """
                SELECT p.id AS post_id, p.forum_id
                FROM posts p
                INNER JOIN forums f ON f.id = p.forum_id
                WHERE f.description LIKE :pat
                ORDER BY p.id
                """
            ),
            conn,
            params={"pat": f"%{SEED_MARKER}%"},
        )

        comment_rows: list[dict] = []
        for _, prow in posts_map.iterrows():
            post_id = int(prow["post_id"])
            post_base = now - timedelta(days=int(rng.integers(1, 90)))
            n_comments = int(rng.integers(2, 7))  # 2–6
            for _ in range(n_comments):
                created = post_base + timedelta(hours=int(rng.integers(1, 72)))
                comment_rows.append(
                    {
                        "content": str(rng.choice(COMMENT_TOP)),
                        "post_id": post_id,
                        "author_id": pick_author(rng, user_ids),
                        "created_at": created,
                        "updated_at": now,
                    }
                )

        top_df = pd.DataFrame(comment_rows)
        print(f"Insertando {len(top_df)} comentarios de primer nivel...")
        top_df.to_sql("comments", con=conn, if_exists="append", index=False)

        top_comments = pd.read_sql_query(
            text(
                """
                SELECT c.id, c.post_id, c.created_at
                FROM comments c
                INNER JOIN posts p ON p.id = c.post_id
                INNER JOIN forums f ON f.id = p.forum_id
                WHERE f.description LIKE :pat
                  AND c.parent_id IS NULL
                ORDER BY c.id
                """
            ),
            conn,
            params={"pat": f"%{SEED_MARKER}%"},
        )

        reply_rows: list[dict] = []
        for _, tc in top_comments.iterrows():
            if rng.random() > 0.45:
                continue
            n_replies = int(rng.integers(1, 4))  # 1–3
            parent_id = int(tc["id"])
            post_id = int(tc["post_id"])
            base_created = tc["created_at"]
            if isinstance(base_created, str):
                base_created = datetime.fromisoformat(base_created.replace("Z", "+00:00"))
            for r in range(n_replies):
                created = base_created + timedelta(hours=int(rng.integers(2, 48)))
                reply_rows.append(
                    {
                        "content": str(rng.choice(COMMENT_REPLY)),
                        "post_id": post_id,
                        "author_id": pick_author(rng, user_ids),
                        "parent_id": parent_id,
                        "created_at": created,
                        "updated_at": now,
                    }
                )

        if reply_rows:
            replies_df = pd.DataFrame(reply_rows)
            print(f"Insertando {len(replies_df)} respuestas a comentarios...")
            replies_df.to_sql("comments", con=conn, if_exists="append", index=False)
        else:
            print("Sin respuestas anidadas en esta ejecución (azar).")

        votes_rows: list[dict] = []
        post_ids = posts_map["post_id"].astype(int).tolist()
        for post_id in post_ids:
            n_votes = int(rng.integers(0, 6))
            if n_votes == 0:
                continue
            voters = rng.choice(user_ids, size=min(n_votes, len(user_ids)), replace=False)
            for uid in voters:
                vote_type = "UP" if rng.random() > 0.15 else "DOWN"
                votes_rows.append(
                    {
                        "user_id": int(uid),
                        "post_id": int(post_id),
                        "type": vote_type,
                    }
                )

        if votes_rows:
            votes_df = pd.DataFrame(votes_rows).drop_duplicates(subset=["user_id", "post_id"])
            print(f"Insertando {len(votes_df)} votos...")
            insert_vote = text(
                """
                INSERT INTO votes (user_id, post_id, type)
                VALUES (:user_id, :post_id, CAST(:type AS "VoteType"))
                ON CONFLICT (user_id, post_id) DO NOTHING
                """
            )
            for row in votes_df.to_dict(orient="records"):
                conn.execute(insert_vote, row)

            for post_id in post_ids:
                conn.execute(
                    text(
                        """
                        UPDATE posts SET score = (
                            SELECT COALESCE(SUM(CASE WHEN type = 'UP' THEN 1 WHEN type = 'DOWN' THEN -1 ELSE 0 END), 0)
                            FROM votes WHERE post_id = :pid
                        )
                        WHERE id = :pid
                        """
                    ),
                    {"pid": post_id},
                )

        print("Actualizando secuencias...")
        reset_sequences(
            conn,
            (
                ("forums", "forums_id_seq"),
                ("posts", "posts_id_seq"),
                ("comments", "comments_id_seq"),
                ("votes", "votes_id_seq"),
            ),
        )

    print(
        "Semilla de foros completada: foros, posts, comentarios, respuestas y votos insertados."
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Semilla de foros/posts/comentarios (marca forum_seed:bookmatch)."
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help=f"Borra foros con marca {SEED_MARKER} y datos en cascada.",
    )
    args = parser.parse_args()
    engine = get_engine()
    if args.clean:
        clean_data(engine)
    else:
        seed_data(engine)


if __name__ == "__main__":
    main()
