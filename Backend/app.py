
import csv
import io
import os
import requests
import threading

from datetime import datetime, timezone, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# Load private credentials from .env
load_dotenv()

app = Flask(__name__)
CORS(app)

NASA_API = "https://appeears.earthdatacloud.nasa.gov/api/"

# NASA AppEEARS token cache
_nasa_token = None
_nasa_token_expiry = 0
_nasa_token_lock = threading.Lock()


def get_nasa_token():
    global _nasa_token, _nasa_token_expiry

    with _nasa_token_lock:
        now = datetime.now(timezone.utc).timestamp()

        # Reuse token if it is still valid
        if _nasa_token and now < _nasa_token_expiry - 300:
            return _nasa_token

        username = os.getenv("EARTHDATA_USERNAME")
        password = os.getenv("EARTHDATA_PASSWORD")

        if not username or not password:
            raise ValueError("NASA Earthdata credentials are missing.")

        login_response = requests.post(
            NASA_API + "login",
            auth=(username, password),
            data={"grant_type": "client_credentials"},
            timeout=30
        )
        login_response.raise_for_status()

        login_data = login_response.json()
        _nasa_token = login_data["token"]

        expiration = login_data.get("expiration")

        if expiration:
            expiry_date = datetime.fromisoformat(
                expiration.replace("Z", "+00:00")
            )
            _nasa_token_expiry = expiry_date.timestamp()
        else:
            _nasa_token_expiry = (
                now + timedelta(hours=47).total_seconds()
            )

        app.logger.info("NASA AppEEARS token obtained and cached.")

        return _nasa_token


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "Backend is running!",
        "service": "Earth Jukebox"
    })


@app.route("/api/earthdata-check", methods=["GET"])
def earthdata_check():
    try:
        token = get_nasa_token()

        if token:
            return jsonify({
                "status": "NASA Earthdata connection successful!"
            })

    except (requests.RequestException, ValueError, KeyError):
        app.logger.exception("NASA Earthdata connection failed")

        return jsonify({
            "error": "NASA connection failed. Check credentials or try again."
        }), 502


@app.route("/api/vegetation/request", methods=["POST"])
def request_vegetation():
    data = request.get_json(silent=True) or {}

    latitude = data.get("latitude")
    longitude = data.get("longitude")

    if latitude is None or longitude is None:
        return jsonify({
            "error": "Latitude and longitude are required"
        }), 400

    try:
        latitude = float(latitude)
        longitude = float(longitude)

        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            return jsonify({"error": "Invalid coordinates"}), 400

        # Reuse cached NASA token
        token = get_nasa_token()

        # Prepare the point-sampling request
        task = {
            "task_name": "Earth Jukebox Vegetation",
            "task_type": "point",
            "params": {
                "dates": [{
                    "startDate": "11-10-2025",
                    "endDate": "11-10-2026"
                }],
                "layers": [
                    {
                        "product": "MOD13Q1.061",
                        "layer": "_250m_16_days_NDVI"
                    },
                    {
                        "product": "MOD13Q1.061",
                        "layer": "_250m_16_days_VI_Quality"
                    }
                ],
                "coordinates": [{
                    "id": "selected-location",
                    "latitude": latitude,
                    "longitude": longitude
                }]
            }
        }

        # Submit task to NASA
        response = requests.post(
            NASA_API + "task",
            json=task,
            headers={"Authorization": f"Bearer {token}"},
            timeout=30
        )
        response.raise_for_status()

        return jsonify({
            "message": "NASA vegetation request submitted!",
            "task_id": response.json()["task_id"],
            "latitude": latitude,
            "longitude": longitude
        }), 202

    except requests.RequestException as error:
        app.logger.exception("NASA API request failed")

        if error.response is not None:
            app.logger.error("NASA response: %s", error.response.text)

        return jsonify({
            "error": "NASA request failed. Check the backend terminal."
        }), 502

    except (KeyError, ValueError):
        app.logger.exception("NASA response parsing failed")

        return jsonify({
            "error": "Unexpected response from NASA."
        }), 502


@app.route("/api/vegetation/tasks", methods=["GET"])
def vegetation_tasks():
    try:
        # Reuse cached NASA token
        token = get_nasa_token()

        response = requests.get(
            NASA_API + "task",
            params={"limit": 5},
            headers={"Authorization": f"Bearer {token}"},
            timeout=30
        )
        response.raise_for_status()

        return jsonify(response.json())

    except requests.RequestException:
        app.logger.exception("Could not retrieve NASA tasks")

        return jsonify({
            "error": "Could not retrieve NASA tasks."
        }), 502

    except (ValueError, KeyError):
        app.logger.exception("NASA authentication failed")

        return jsonify({
            "error": "Could not authenticate with NASA."
        }), 502


@app.route("/api/vegetation/results/<task_id>", methods=["GET"])
def vegetation_results(task_id):
    try:
        # Reuse cached NASA token instead of logging in every 5 seconds
        token = get_nasa_token()
        headers = {"Authorization": f"Bearer {token}"}

        # Check task status
        status_response = requests.get(
            NASA_API + f"task/{task_id}",
            headers=headers,
            timeout=30
        )
        status_response.raise_for_status()

        status = status_response.json().get("status")

        if status != "done":
            return jsonify({
                "status": status,
                "message": "NASA is still processing the data."
            }), 202

        # Get completed task bundle
        bundle_response = requests.get(
            NASA_API + f"bundle/{task_id}",
            headers=headers,
            timeout=30
        )
        bundle_response.raise_for_status()

        files = bundle_response.json().get("files", [])

        # Find the actual results CSV
        csv_file = next(
            (
                file for file in files
                if file.get("file_name", "").lower().endswith("results.csv")
            ),
            None
        )

        if not csv_file:
            return jsonify({
                "error": "NASA results CSV not found."
            }), 404

        # Download CSV
        csv_response = requests.get(
            NASA_API + f"bundle/{task_id}/{csv_file['file_id']}",
            headers=headers,
            timeout=60
        )
        csv_response.raise_for_status()

        # Read CSV and prepare chart data
        reader = csv.DictReader(io.StringIO(csv_response.text))

        records = []

        for row in reader:
            try:
                ndvi = float(
                    row["MOD13Q1_061__250m_16_days_NDVI"]
                )

                records.append({
                    "date": row["Date"],
                    "ndvi": ndvi,
                    "quality": row[
                        "MOD13Q1_061__250m_16_days_VI_Quality_MODLAND_Description"
                    ]
                })

            except (ValueError, KeyError):
                continue

        records.sort(key=lambda item: item["date"])

        return jsonify({
            "status": "done",
            "task_id": task_id,
            "records": records
        })

    except requests.RequestException:
        app.logger.exception("NASA results retrieval failed")

        return jsonify({
            "error": "Could not retrieve NASA results."
        }), 502

    except (KeyError, ValueError):
        app.logger.exception("NASA results parsing failed")

        return jsonify({
            "error": "Could not parse NASA results."
        }), 502



# --------------------------------------------------
# Direct NASA MODIS vegetation data (ORNL DAAC)
# --------------------------------------------------

ORNL_API = "https://modis.ornl.gov/rst/api/v1/"
MODIS_PRODUCT = "MOD13Q1"

def fetch_modis_band(latitude, longitude, band, date_batches):
    """Fetch one MODIS band in batches of no more than 10 dates."""

    observations = {}

    for batch in date_batches:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "band": band,
            "startDate": batch[0]["modis_date"],
            "endDate": batch[-1]["modis_date"],
            "kmAboveBelow": 0,
            "kmLeftRight": 0
        }

        response = requests.get(
            f"{ORNL_API}{MODIS_PRODUCT}/subset",
            params=params,
            timeout=60
        )
        response.raise_for_status()

        for item in response.json().get("subset", []):
            values = item.get("data", [])

            if values:
                observations[item["modis_date"]] = values[0]

    return observations


@app.route("/api/vegetation/direct", methods=["POST"])
def direct_vegetation():
    data = request.get_json(silent=True) or {}

    try:
        latitude = float(data.get("latitude"))
        longitude = float(data.get("longitude"))

        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            return jsonify({"error": "Invalid coordinates"}), 400

        # Retrieve available MODIS observation dates
        dates_response = requests.get(
            f"{ORNL_API}{MODIS_PRODUCT}/dates",
            params={
                "latitude": latitude,
                "longitude": longitude
            },
            timeout=30
        )
        dates_response.raise_for_status()

        all_dates = dates_response.json().get("dates", [])

        start_date = datetime.strptime("2025-11-10", "%Y-%m-%d").date()
        end_date = datetime.strptime("2026-11-10", "%Y-%m-%d").date()

        selected_dates = []

        for item in all_dates:
            observation_date = datetime.strptime(
                item["calendar_date"], "%Y-%m-%d"
            ).date()

            if start_date <= observation_date <= end_date:
                selected_dates.append(item)

        selected_dates.sort(key=lambda item: item["calendar_date"])

        if not selected_dates:
            return jsonify({
                "status": "done",
                "records": [],
                "message": "No MODIS observations are available for this location and period."
            })

        # Split observations into batches of 10
        date_batches = [
            selected_dates[i:i + 10]
            for i in range(0, len(selected_dates), 10)
        ]

        # Fetch actual NASA NDVI values
        ndvi_values = fetch_modis_band(
            latitude,
            longitude,
            "250m_16_days_NDVI",
            date_batches
        )

        # Fetch NASA pixel reliability values
        quality_values = fetch_modis_band(
            latitude,
            longitude,
            "250m_16_days_pixel_reliability",
            date_batches
        )

        quality_labels = {
            0: "Good",
            1: "Marginal",
            2: "Snow/Ice",
            3: "Cloudy"
        }

        records = []

        for item in selected_dates:
            modis_date = item["modis_date"]

            raw_ndvi = ndvi_values.get(modis_date)
            raw_quality = quality_values.get(modis_date)

            # Ignore missing or invalid NDVI values
            if raw_ndvi is None:
                continue

            raw_ndvi = float(raw_ndvi)

            if raw_ndvi == -3000 or not (-2000 <= raw_ndvi <= 10000):
                continue

            # NASA MOD13Q1 NDVI scale factor
            ndvi = raw_ndvi * 0.0001

            quality = (
                int(raw_quality)
                if raw_quality is not None
                else None
            )

            records.append({
                "date": item["calendar_date"],
                "ndvi": round(ndvi, 4),
                "quality": quality,
                "quality_label": quality_labels.get(
                    quality, "Unknown"
                )
            })

        return jsonify({
            "status": "done",
            "source": "NASA MODIS MOD13Q1.061 via ORNL DAAC",
            "latitude": latitude,
            "longitude": longitude,
            "total_observations": len(records),
            "records": records
        })

    except requests.RequestException:
        app.logger.exception("Direct NASA MODIS request failed")

        return jsonify({
            "error": "Could not retrieve direct NASA MODIS data."
        }), 502

    except (ValueError, KeyError, TypeError):
        app.logger.exception("Could not process MODIS observations")

        return jsonify({
            "error": "Could not process NASA MODIS data."
        }), 500
        
# --------------------------------------------------
# NASA FIRMS - Real-time wildfire observations
# --------------------------------------------------

@app.route("/api/hazards/firms", methods=["GET"])
def firms_wildfires():
    map_key = os.getenv("FIRMS_MAP_KEY")

    if not map_key:
        return jsonify({
            "error": "NASA FIRMS MAP_KEY is missing from Backend/.env"
        }), 500

    try:
        days = int(request.args.get("days", 3))

        if not 1 <= days <= 5:
            return jsonify({
                "error": "Days must be between 1 and 5."
            }), 400

        # India bounding box: west, south, east, north
        india_bbox = "world"
        firms_url = (
            "https://firms.modaps.eosdis.nasa.gov/api/area/csv/"
            f"{map_key}/VIIRS_NOAA20_NRT/{india_bbox}/{days}"
        )

        response = requests.get(
            firms_url,
            timeout=60
        )
        response.raise_for_status()

        # NASA returns CSV data
        reader = csv.DictReader(io.StringIO(response.text))
        records = []

        numeric_fields = [
            "latitude",
            "longitude",
            "bright_ti4",
            "bright_ti5",
            "scan",
            "track",
            "frp"
        ]

        for row in reader:
            record = dict(row)

            for field in numeric_fields:
                value = record.get(field)

                if value not in (None, ""):
                    try:
                        record[field] = float(value)
                    except ValueError:
                        record[field] = None

            records.append(record)

        return jsonify({
            "status": "success",
            "source": "NASA FIRMS VIIRS NOAA-20 NRT",
            "region": "Global",
            "bounding_box": india_bbox,
            "period_days": days,
            "total_detections": len(records),
            "observations": records
        })

    except requests.RequestException:
        app.logger.exception("NASA FIRMS request failed")

        return jsonify({
            "error": "Could not retrieve NASA FIRMS observations."
        }), 502

    except ValueError:
        app.logger.exception("Could not process NASA FIRMS data")

        return jsonify({
            "error": "Invalid NASA FIRMS response or day range."
        }), 500

@app.route("/api/hazards/storms")
def get_storm_data():
    import pandas as pd
    import requests
    from io import StringIO

    url = "https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/csv/ibtracs.ACTIVE.list.v04r01.csv"

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        df = pd.read_csv(StringIO(response.text), skiprows=[1])

        columns = [
            "SID", "NAME", "ISO_TIME", "BASIN",
            "LAT", "LON", "WMO_WIND", "WMO_PRES",
            "USA_WIND", "USA_PRES", "NATURE"
        ]

        available = [col for col in columns if col in df.columns]
        df = df[available]

        df = df.dropna(subset=["LAT", "LON"])

        return jsonify(
            df.replace({float("nan"): None}).to_dict(orient="records")
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --------------------------------------------------
# NSIDC - REAL DAILY SEA ICE EXTENT DATA
# Arctic and Antarctic - Sea Ice Index v4.0
# --------------------------------------------------

SEA_ICE_URLS = {
    "arctic": (
        "https://noaadata.apps.nsidc.org/NOAA/G02135/"
        "north/daily/data/N_seaice_extent_daily_v4.0.csv"
    ),
    "antarctic": (
        "https://noaadata.apps.nsidc.org/NOAA/G02135/"
        "south/daily/data/S_seaice_extent_daily_v4.0.csv"
    )
}


def fetch_sea_ice_records(url):
    response = requests.get(url, timeout=60)
    response.raise_for_status()

    reader = csv.reader(io.StringIO(response.text))

    records = []

    for row in reader:
        if len(row) < 5:
            continue

        try:
            year = int(row[0].strip())
            month = int(row[1].strip())
            day = int(row[2].strip())
            extent = float(row[3].strip())
            missing = float(row[4].strip())

            observation_date = datetime(
                year, month, day
            ).date()

            if extent < 0:
                continue

            records.append({
                "date": observation_date.isoformat(),
                "extent": extent,
                "missing": missing,
                "source_data": (
                    row[5].strip() if len(row) > 5 else None
                )
            })

        except (ValueError, IndexError):
            # Ignore CSV header and units rows
            continue

    records.sort(key=lambda item: item["date"])

    return records


@app.route("/api/hazards/sea-ice", methods=["GET"])
def get_sea_ice_data():
    try:
        arctic_records = fetch_sea_ice_records(
            SEA_ICE_URLS["arctic"]
        )

        antarctic_records = fetch_sea_ice_records(
            SEA_ICE_URLS["antarctic"]
        )

        if not arctic_records or not antarctic_records:
            return jsonify({
                "error": "No sea ice measurements were returned."
            }), 502

        def prepare_latest(records):
            latest = records[-1]
            previous = records[-2] if len(records) > 1 else None

            change = None

            if previous:
                change = round(
                    latest["extent"] - previous["extent"], 3
                )

            return {
                "latest": latest,
                "previous": previous,
                "change_since_previous_observation": change,
                "recent_records": records[-30:]
            }

        return jsonify({
            "status": "success",
            "dataset": "NSIDC Sea Ice Index v4.0 (G02135)",
            "description": (
                "Satellite-derived daily sea ice extent "
                "for the Northern and Southern Hemispheres."
            ),
            "unit": "million square kilometres",
            "source": (
                "National Snow and Ice Data Center (NSIDC)"
            ),
            "source_urls": SEA_ICE_URLS,
            "arctic": prepare_latest(arctic_records),
            "antarctic": prepare_latest(antarctic_records)
        })

    except requests.RequestException:
        app.logger.exception(
            "Could not retrieve NSIDC sea ice data"
        )

        return jsonify({
            "error": "Could not retrieve NSIDC sea ice measurements."
        }), 502

    except Exception:
        app.logger.exception(
            "Could not process NSIDC sea ice data"
        )

        return jsonify({
            "error": "Could not process sea ice measurements."
        }), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)
