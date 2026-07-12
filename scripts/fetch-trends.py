"""Cachea interés de búsqueda mediante pytrends (sin key; integración no oficial).
Uso: python scripts/fetch-trends.py --term "turismo El Salvador" --geo SV --timeframe "today 12-m"
Instalación previa: pip install -r requirements.txt
"""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from pytrends.request import TrendReq

parser = argparse.ArgumentParser()
parser.add_argument("--term", required=True, help="Término turístico que se quiere medir")
parser.add_argument("--geo", default="", help="Código de país, p. ej. SV, MX, ES; vacío = global")
parser.add_argument("--timeframe", default="today 12-m")
args = parser.parse_args()
client = TrendReq(hl="es-419", tz=0)
client.build_payload([args.term], cat=67, timeframe=args.timeframe, geo=args.geo, gprop="")
timeline = client.interest_over_time()
regions = client.interest_by_region(resolution="COUNTRY", inc_low_vol=True, inc_geo_code=True)
output = {
    "source": "Google Trends via pytrends (no oficial)", "fetched_at": datetime.now(timezone.utc).isoformat(),
    "query": {"term": args.term, "geo": args.geo, "timeframe": args.timeframe},
    "interest_over_time": [{"date": index.date().isoformat(), "value": int(row[args.term])} for index, row in timeline.iterrows()],
    "interest_by_region": [{"region": str(index), "geo_code": str(row.get("geoCode", "")), "value": int(row[args.term])} for index, row in regions.iterrows()],
}
Path("data").mkdir(exist_ok=True)
Path("data/trends.json").write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
print("✓ Tendencias guardadas en data/trends.json")
