import os
import sys
import json
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Metric,
    RunReportRequest,
)

PROPERTY_ID = "510169070"

def load_env():
    if "FIREBASE_PROJECT_ID" not in os.environ:
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

def get_client():
    load_env()
    
    required_vars = ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"]
    for var in required_vars:
        if var not in os.environ:
            print(json.dumps({"error": f"Falta {var} en el entorno o .env"}))
            sys.exit(1)

    credentials = service_account.Credentials.from_service_account_info({
        "type": "service_account",
        "project_id": os.environ["FIREBASE_PROJECT_ID"],
        "client_email": os.environ["FIREBASE_CLIENT_EMAIL"],
        "private_key": os.environ["FIREBASE_PRIVATE_KEY"].replace("\\n", "\n"),
        "token_uri": "https://oauth2.googleapis.com/token",
    })
    
    return BetaAnalyticsDataClient(credentials=credentials)

def run_report(client, dimensions, metrics, date_ranges=[DateRange(start_date="30daysAgo", end_date="today")], limit=None):
    request = RunReportRequest(
        property=f"properties/{PROPERTY_ID}",
        dimensions=[Dimension(name=d) for d in dimensions],
        metrics=[Metric(name=m) for m in metrics],
        date_ranges=date_ranges,
        limit=limit
    )
    return client.run_report(request)

def main():
    try:
        client = get_client()
        result = {}

        # 1. Pageviews por día (30 días)
        response_daily = run_report(client, dimensions=["date"], metrics=["screenPageViews", "activeUsers"])
        daily_data = []
        for row in response_daily.rows:
            daily_data.append({
                "date": row.dimension_values[0].value,
                "pageviews": int(row.metric_values[0].value),
                "activeUsers": int(row.metric_values[1].value)
            })
        # Ordenar por fecha (el formato date es YYYYMMDD)
        daily_data = sorted(daily_data, key=lambda x: x["date"])
        result["pageviewsByDay"] = daily_data

        # 2. Top 10 páginas más visitadas
        response_pages = run_report(client, dimensions=["pageTitle", "pagePath"], metrics=["screenPageViews"], limit=10)
        top_pages = []
        for row in response_pages.rows:
            top_pages.append({
                "title": row.dimension_values[0].value,
                "path": row.dimension_values[1].value,
                "views": int(row.metric_values[0].value)
            })
        result["topPages"] = top_pages

        # 3. Visitantes por país
        response_countries = run_report(client, dimensions=["country"], metrics=["activeUsers"], limit=10)
        countries = []
        for row in response_countries.rows:
            countries.append({
                "country": row.dimension_values[0].value,
                "users": int(row.metric_values[0].value)
            })
        result["visitorsByCountry"] = countries

        # 4. Navegadores y dispositivos
        response_browsers = run_report(client, dimensions=["browser"], metrics=["activeUsers"], limit=10)
        browsers = []
        for row in response_browsers.rows:
            browsers.append({
                "browser": row.dimension_values[0].value,
                "users": int(row.metric_values[0].value)
            })
        result["browsers"] = browsers

        response_devices = run_report(client, dimensions=["deviceCategory"], metrics=["activeUsers"])
        devices = []
        for row in response_devices.rows:
            devices.append({
                "device": row.dimension_values[0].value,
                "users": int(row.metric_values[0].value)
            })
        result["devices"] = devices

        # 5. Summary: Sesiones, tasa de rebote, duración media
        response_summary = run_report(client, dimensions=[], metrics=["sessions", "bounceRate", "averageSessionDuration"])
        if response_summary.rows:
            row = response_summary.rows[0]
            result["summary"] = {
                "sessions": int(row.metric_values[0].value),
                "bounceRate": float(row.metric_values[1].value),
                "averageSessionDuration": float(row.metric_values[2].value)
            }
        else:
            result["summary"] = {
                "sessions": 0, "bounceRate": 0.0, "averageSessionDuration": 0.0
            }

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
