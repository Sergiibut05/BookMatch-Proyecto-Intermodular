import os
import sys
import argparse
import uuid
import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text
from datetime import datetime, timedelta

def load_env():
    # Attempt to read from .env if the variable is not already in os.environ
    if "DATABASE_URL" not in os.environ:
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        key_value = line.split("=", 1)
                        if len(key_value) == 2:
                            val = key_value[1].strip().strip('"').strip("'")
                            os.environ[key_value[0]] = val

def get_engine():
    load_env()
    db_url = os.environ.get("DATABASE_URL")
    
    if not db_url:
        print("Error: DATABASE_URL no encontrada en el entorno o .env")
        sys.exit(1)

    if db_url and "?" in db_url:
        db_url = db_url.split("?")[0]
        
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+pg8000://", 1)
    elif db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+pg8000://", 1)
        
    return create_engine(db_url)

def clean_data(engine):
    print("Iniciando borrado de datos sintéticos...")
    with engine.begin() as conn:
        # Borramos los usuarios semilla. Por cascada se borrarán órdenes, items y reviews.
        result = conn.execute(text("DELETE FROM users WHERE firebase_uid LIKE 'seed_%'"))
        print(f"Usuarios semilla borrados: {result.rowcount}")
    print("Limpieza completada.")

def generate_dates(n, end_date=None):
    if end_date is None:
        end_date = datetime.now()
    start_date = end_date - timedelta(days=365)
    
    # Rango de fechas (últimos 12 meses)
    all_dates = pd.date_range(start=start_date, end=end_date, freq='D')
    
    # Probabilidades por mes para simular estacionalidad
    # Picos en Dic (12), Abr (4), Nov (11). Bajón en Ago (8).
    weights = []
    for d in all_dates:
        if d.month in [12, 4, 11]:
            weights.append(3.0) # Alta temporada
        elif d.month == 8:
            weights.append(0.5) # Baja temporada
        else:
            weights.append(1.0) # Normal
            
    weights = np.array(weights) / sum(weights)
    
    # Seleccionamos fechas aleatorias con las probabilidades dadas
    chosen_dates = np.random.choice(all_dates, size=n, p=weights)
    
    # Añadimos horas y minutos aleatorios a cada fecha
    random_times = pd.to_timedelta(np.random.randint(0, 24*3600, size=n), unit='s')
    
    return chosen_dates + random_times

def seed_data(engine):
    print("Iniciando generación de datos sintéticos...")
    np.random.seed(42) # Reproducibilidad
    
    with engine.begin() as conn:
        # Obtener catálogo de libros para generar compras y reseñas
        books_df = pd.read_sql_query("SELECT id, price FROM catalog_books", conn)
        if books_df.empty:
            print("Error: No hay libros en catalog_books. Se necesita un catálogo inicial.")
            return

        book_ids = books_df['id'].values
        
        # 1. GENERAR USUARIOS
        n_users = 40
        users_data = []
        for i in range(n_users):
            seed_id = f"seed_{uuid.uuid4().hex[:8]}"
            users_data.append({
                "firebase_uid": seed_id,
                "email": f"seed_user_{i+1}@bookmatch.test",
                "full_name": f"Usuario Simulado {i+1}",
                "role": "USER",
                "created_at": datetime.now() - timedelta(days=np.random.randint(30, 365)),
                "updated_at": datetime.now()
            })
        users_df = pd.DataFrame(users_data)
        
        print(f"Insertando {len(users_df)} usuarios sintéticos...")
        users_df.to_sql("users", con=conn, if_exists="append", index=False)
        
        # Recuperar los usuarios recién creados para usar sus IDs
        seed_users = pd.read_sql_query("SELECT id FROM users WHERE firebase_uid LIKE 'seed_%'", conn)
        user_ids = seed_users['id'].values
        
        # 2. GENERAR ÓRDENES Y ORDER ITEMS
        n_orders = 500
        orders_data = []
        order_items_data = []
        
        order_dates = generate_dates(n_orders)
        statuses = ["PAID", "DELIVERED", "SHIPPED", "PENDING", "CANCELLED"]
        status_weights = [0.70, 0.15, 0.10, 0.04, 0.01] # 70% paid, 15% del, 10% ship, 4% pend, 1% canc
        
        # Simulamos 5 best sellers (tendrán 3x de probabilidad de ser comprados)
        n_books = len(book_ids)
        book_weights = np.ones(n_books)
        best_sellers_indices = np.random.choice(n_books, size=min(5, n_books), replace=False)
        for idx in best_sellers_indices:
            book_weights[idx] = 3.0
        book_weights = book_weights / book_weights.sum()
        
        # Obtenemos el ID de inicio para las órdenes para poder enlazarlas con order_items
        start_order_id = conn.execute(text("SELECT COALESCE(MAX(id), 0) + 1 FROM orders")).scalar()
        
        for i in range(n_orders):
            order_id = start_order_id + i
            o_date = order_dates[i]
            
            # Generar items (1 a 3 items por orden)
            n_items = np.random.choice([1, 2, 3], p=[0.6, 0.3, 0.1])
            chosen_books = np.random.choice(book_ids, size=n_items, p=book_weights, replace=False)
            
            total_amount = 0.0
            for book_id in chosen_books:
                price = float(books_df[books_df['id'] == book_id]['price'].values[0])
                quantity = 1 # simplificamos a 1
                total_amount += price * quantity
                
                order_items_data.append({
                    "order_id": order_id,
                    "catalog_book_id": book_id,
                    "quantity": quantity,
                    "price": price
                })
                
            orders_data.append({
                "id": order_id,
                "user_id": np.random.choice(user_ids),
                "total_amount": total_amount,
                "status": np.random.choice(statuses, p=status_weights),
                "created_at": o_date,
                "updated_at": o_date
            })
            
        orders_df = pd.DataFrame(orders_data)
        order_items_df = pd.DataFrame(order_items_data)
        
        print(f"Insertando {len(orders_df)} órdenes con {len(order_items_df)} items...")
        orders_df.to_sql("orders", con=conn, if_exists="append", index=False)
        order_items_df.to_sql("order_items", con=conn, if_exists="append", index=False)
        
        # 3. GENERAR REVIEWS
        n_reviews = 800
        reviews_data = []
        
        # Para garantizar combinaciones únicas (user_id, catalog_book_id)
        # generaremos más combinaciones aleatorias y luego filtraremos.
        review_user_choices = np.random.choice(user_ids, size=n_reviews + 500)
        review_book_choices = np.random.choice(book_ids, size=n_reviews + 500, p=book_weights)
        
        combinations_df = pd.DataFrame({
            'user_id': review_user_choices,
            'catalog_book_id': review_book_choices
        })
        # Eliminar duplicados para no violar @@unique([catalogBookId, userId])
        combinations_df = combinations_df.drop_duplicates(subset=['user_id', 'catalog_book_id'])
        
        # Limitar a los n_reviews que queríamos, si hay suficientes
        combinations_df = combinations_df.head(n_reviews)
        
        for _, row in combinations_df.iterrows():
            rating_raw = np.random.normal(loc=3.8, scale=0.9)
            rating = int(np.clip(np.round(rating_raw), 1, 5))
            
            reviews_data.append({
                "catalog_book_id": int(row['catalog_book_id']),
                "user_id": int(row['user_id']),
                "rating": rating,
                "comment": "Reseña generada automáticamente." if np.random.random() > 0.5 else None,
                "created_at": datetime.now() - timedelta(days=np.random.randint(0, 300))
            })
            
        reviews_df = pd.DataFrame(reviews_data)
        print(f"Insertando {len(reviews_df)} reseñas...")
        reviews_df.to_sql("reviews", con=conn, if_exists="append", index=False)

        # 4. ACTUALIZAR SECUENCIAS
        print("Actualizando secuencias autoincrementales...")
        try:
            conn.execute(text("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))"))
            conn.execute(text("SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders))"))
            conn.execute(text("SELECT setval('order_items_id_seq', (SELECT MAX(id) FROM order_items))"))
            conn.execute(text("SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews))"))
        except Exception as e:
            print(f"Advertencia al actualizar secuencias: {e}")
            
    print("¡Generación de datos finalizada con éxito!")

def main():
    parser = argparse.ArgumentParser(description="Script para poblar la BD con datos analíticos.")
    parser.add_argument("--clean", action="store_true", help="Borrar datos sintéticos previamente generados.")
    args = parser.parse_args()

    engine = get_engine()

    if args.clean:
        clean_data(engine)
    else:
        seed_data(engine)

if __name__ == "__main__":
    main()
