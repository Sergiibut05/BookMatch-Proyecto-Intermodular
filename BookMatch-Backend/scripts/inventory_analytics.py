import os
import sys
import json
import pandas as pd
from sqlalchemy import create_engine

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

def main():
    try:
        load_env()
        db_url = os.environ.get("DATABASE_URL")
        
        if not db_url:
            print(json.dumps({"error": "DATABASE_URL no encontrada en el entorno o .env"}))
            sys.exit(1)

        # Si Prisma usa 'postgresql://', SQLAlchemy también lo soporta.
        # En caso de errores con parámetros (ej. ?pgbouncer=true), SQLAlchemy podría quejarse, 
        # pero normalmente funciona.
        if db_url and "?" in db_url:
            db_url = db_url.split("?")[0]
            
        # Reemplazar el esquema genérico por el del driver pg8000
        if db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+pg8000://", 1)
        elif db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql+pg8000://", 1)
            
        engine = create_engine(db_url)
        
        # Consulta 1: Precio promedio por categoría
        query_prices = """
        SELECT 
            c.name AS category,
            AVG(cb.price) AS average_price
        FROM catalog_books cb
        JOIN catalog_book_categories cbc ON cb.id = cbc.catalog_book_id
        JOIN categories c ON cbc.category_id = c.id
        GROUP BY c.name
        """
        
        # Consulta 2: Media de valoraciones por categoría
        query_reviews = """
        SELECT 
            c.name AS category,
            AVG(r.rating) AS average_rating
        FROM reviews r
        JOIN catalog_books cb ON r.catalog_book_id = cb.id
        JOIN catalog_book_categories cbc ON cb.id = cbc.catalog_book_id
        JOIN categories c ON cbc.category_id = c.id
        GROUP BY c.name
        """
        
        # Ejecutar usando pandas
        df_prices = pd.read_sql_query(query_prices, engine)
        df_reviews = pd.read_sql_query(query_reviews, engine)
        
        # Convertir a tipos compatibles con JSON (float en lugar de Decimal si fuera necesario)
        df_prices['average_price'] = df_prices['average_price'].astype(float).round(2)
        df_reviews['average_rating'] = df_reviews['average_rating'].astype(float).round(2)
        
        # Formatear el resultado
        result = {
            "pricesByCategory": df_prices.to_dict(orient="records"),
            "reviewsByCategory": df_reviews.to_dict(orient="records")
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
