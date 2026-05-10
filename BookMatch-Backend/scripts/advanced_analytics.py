import os
import sys
import json
import pandas as pd
import numpy as np
from sqlalchemy import create_engine

def load_env():
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
        print(json.dumps({"error": "DATABASE_URL no encontrada en el entorno o .env"}))
        sys.exit(1)
        
    if db_url and "?" in db_url:
        db_url = db_url.split("?")[0]
        
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+pg8000://", 1)
    elif db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+pg8000://", 1)
        
    return create_engine(db_url)

def get_rfm_segment(score):
    if score >= 13: return "VIP"
    if score >= 10: return "Leal"
    if score >= 7: return "Regular"
    if score >= 4: return "En Riesgo"
    return "Dormido"

def main():
    try:
        engine = get_engine()
        
        # 1. Cargar DataFrames básicos
        orders_df = pd.read_sql_query("SELECT id, user_id, total_amount, created_at FROM orders WHERE status != 'CANCELLED'", engine)
        users_df = pd.read_sql_query("SELECT id FROM users", engine)
        reviews_df = pd.read_sql_query("SELECT id, rating FROM reviews", engine)
        order_items_df = pd.read_sql_query("SELECT order_id, catalog_book_id, quantity FROM order_items", engine)
        books_df = pd.read_sql_query("SELECT id, title FROM catalog_books", engine)
        
        # DataFrames para categorías
        cat_query = """
        SELECT cbc.catalog_book_id, c.name AS category_name
        FROM catalog_book_categories cbc
        JOIN categories c ON cbc.category_id = c.id
        """
        book_categories_df = pd.read_sql_query(cat_query, engine)
        
        # Estructura del JSON resultante
        result = {}

        # 2. KPIs Globales
        total_revenue = float(orders_df['total_amount'].sum()) if not orders_df.empty else 0.0
        total_orders = len(orders_df)
        total_users = len(users_df)
        average_ticket = total_revenue / total_orders if total_orders > 0 else 0.0
        average_rating = float(reviews_df['rating'].mean()) if not reviews_df.empty else 0.0
        
        result["global_kpis"] = {
            "total_revenue": round(total_revenue, 2),
            "total_orders": total_orders,
            "total_users": total_users,
            "average_ticket": round(average_ticket, 2),
            "average_rating": round(average_rating, 2)
        }

        # 3. RFM Analysis
        if not orders_df.empty:
            max_date = orders_df['created_at'].max()
            rfm = orders_df.groupby('user_id').agg({
                'created_at': lambda x: (max_date - x.max()).days,
                'id': 'count',
                'total_amount': 'sum'
            }).reset_index()
            
            rfm.columns = ['user_id', 'Recency', 'Frequency', 'Monetary']
            
            # Asignar scores del 1 al 5 usando quintiles, manejando posibles duplicados con duplicates='drop'
            rfm['R_Score'] = pd.qcut(rfm['Recency'].rank(method='first'), 5, labels=[5, 4, 3, 2, 1]).astype(int)
            rfm['F_Score'] = pd.qcut(rfm['Frequency'].rank(method='first'), 5, labels=[1, 2, 3, 4, 5]).astype(int)
            rfm['M_Score'] = pd.qcut(rfm['Monetary'].rank(method='first'), 5, labels=[1, 2, 3, 4, 5]).astype(int)
            
            rfm['RFM_Score'] = rfm['R_Score'] + rfm['F_Score'] + rfm['M_Score']
            rfm['Segment'] = rfm['RFM_Score'].apply(get_rfm_segment)
            
            segment_counts = rfm['Segment'].value_counts().to_dict()
            result["rfm_segments"] = [{"segment": k, "count": v} for k, v in segment_counts.items()]
        else:
            result["rfm_segments"] = []

        # 4. Serie Temporal (Semanas)
        if not orders_df.empty:
            orders_df['created_at'] = pd.to_datetime(orders_df['created_at'])
            # Asegurar que está ordenado
            ts_df = orders_df.set_index('created_at').sort_index()
            # Resample por semana (W-MON)
            weekly_revenue = ts_df['total_amount'].resample('W-MON').sum().reset_index()
            weekly_revenue.columns = ['week', 'revenue']
            
            weekly_revenue['moving_avg_4w'] = weekly_revenue['revenue'].rolling(window=4, min_periods=1).mean()
            weekly_revenue['growth_pct'] = weekly_revenue['revenue'].pct_change().fillna(0) * 100
            
            # Formatear fechas como string para JSON
            weekly_revenue['week'] = weekly_revenue['week'].dt.strftime('%Y-%m-%d')
            weekly_revenue['revenue'] = weekly_revenue['revenue'].round(2)
            weekly_revenue['moving_avg_4w'] = weekly_revenue['moving_avg_4w'].round(2)
            weekly_revenue['growth_pct'] = weekly_revenue['growth_pct'].round(2).replace([np.inf, -np.inf], 0)
            
            result["time_series"] = weekly_revenue.to_dict(orient="records")
        else:
            result["time_series"] = []

        # 5. Ventas por Mes
        if not orders_df.empty:
            monthly_revenue = ts_df['total_amount'].resample('ME').sum().reset_index()
            monthly_revenue.columns = ['month', 'revenue']
            monthly_revenue['month'] = monthly_revenue['month'].dt.strftime('%Y-%m')
            monthly_revenue['revenue'] = monthly_revenue['revenue'].round(2)
            result["monthly_sales"] = monthly_revenue.to_dict(orient="records")
        else:
            result["monthly_sales"] = []

        # 6. Top 10 Libros
        if not order_items_df.empty:
            book_sales = order_items_df.groupby('catalog_book_id')['quantity'].sum().reset_index()
            top_books = book_sales.merge(books_df, left_on='catalog_book_id', right_on='id')
            top_books = top_books.sort_values(by='quantity', ascending=False).head(10)
            result["top_books"] = [
                {"title": row['title'], "quantity": int(row['quantity'])} 
                for _, row in top_books.iterrows()
            ]
        else:
            result["top_books"] = []

        # 7. Precios y valoraciones por categoría
        query_prices = """
        SELECT c.name AS category, AVG(cb.price) AS average_price
        FROM catalog_books cb
        JOIN catalog_book_categories cbc ON cb.id = cbc.catalog_book_id
        JOIN categories c ON cbc.category_id = c.id
        GROUP BY c.name
        """
        
        query_reviews = """
        SELECT c.name AS category, AVG(r.rating) AS average_rating
        FROM reviews r
        JOIN catalog_books cb ON r.catalog_book_id = cb.id
        JOIN catalog_book_categories cbc ON cb.id = cbc.catalog_book_id
        JOIN categories c ON cbc.category_id = c.id
        GROUP BY c.name
        """
        
        df_prices = pd.read_sql_query(query_prices, engine)
        df_prices['average_price'] = df_prices['average_price'].astype(float).round(2)
        result["pricesByCategory"] = df_prices.to_dict(orient="records")
        
        df_revs = pd.read_sql_query(query_reviews, engine)
        df_revs['average_rating'] = df_revs['average_rating'].astype(float).round(2)
        result["reviewsByCategory"] = df_revs.to_dict(orient="records")

        # 8. Matriz de Correlación (Cross-Selling Basket Analysis)
        if not order_items_df.empty and not book_categories_df.empty:
            # Unir order_items con categories y orders (para tener user_id)
            items_orders = order_items_df.merge(orders_df[['id', 'user_id']], left_on='order_id', right_on='id')
            items_cats = items_orders.merge(book_categories_df, on='catalog_book_id')
            
            # Tabla pivote: user_id vs category_name -> conteo de compras
            user_cat_matrix = items_cats.pivot_table(index='user_id', columns='category_name', values='quantity', aggfunc='sum').fillna(0)
            
            # Correlación de Pearson
            if len(user_cat_matrix.columns) > 1:
                corr_matrix = user_cat_matrix.corr(method='pearson')
                
                # Extraer las correlaciones más fuertes (triángulo superior para no repetir)
                correlations = []
                cols = corr_matrix.columns
                for i in range(len(cols)):
                    for j in range(i+1, len(cols)):
                        val = corr_matrix.iloc[i, j]
                        if not np.isnan(val) and val > 0.1: # Filtro de correlación positiva leve
                            correlations.append({
                                "cat_a": cols[i],
                                "cat_b": cols[j],
                                "correlation": round(val, 3)
                            })
                
                # Ordenar por correlación descendente y devolver solo top 15
                correlations = sorted(correlations, key=lambda x: x['correlation'], reverse=True)[:15]
                result["category_correlation"] = correlations
            else:
                result["category_correlation"] = []
        else:
            result["category_correlation"] = []

        # Imprimir resultado en JSON puro por stdout
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
