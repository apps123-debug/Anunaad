import csv
import io
import os
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# Load private credentials from .env
load_dotenv()

app = Flask(__name__)
CORS(app)

NASA_API = "https://appeears.earthdatacloud.nasa.gov/api/"


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "Backend is running!",
        "service": "Earth Jukebox"
    })


@app.route("/api/earthdata-check", methods=["GET"])
def earthdata_check():
    username = os.getenv("EARTHDATA_USERNAME")
    password = os.getenv("EARTHDATA_PASSWORD")

    if not username or not password:
        return jsonify({"error": "Earthdata credentials are missing"}), 500

    try:
        response = requests.post(
            NASA_API + "login",
            auth=(username, password),
            data={"grant_type": "client_credentials"},
            timeout=30
        )

        response.raise_for_status()

        return jsonify({
            "status": "NASA Earthdata connection successful!"
        })

    except requests.RequestException:
        return jsonify({
            "error": "NASA connection failed. Check credentials or try again."
        }), 502

@app.route("/api/vegetation/request", methods=["POST"])
def request_vegetation():
    data = request.get_json(silent=True) or {}

    latitude = data.get("latitude")
    longitude = data.get("longitude")

    if latitude is None or longitude is None:
        return jsonify({"error": "Latitude and longitude are required"}), 400

    try:
        latitude = float(latitude)
        longitude = float(longitude)

        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            return jsonify({"error": "Invalid coordinates"}), 400

        username = os.getenv("EARTHDATA_USERNAME")
        password = os.getenv("EARTHDATA_PASSWORD")

        # Authenticate with NASA AppEEARS
        login_response = requests.post(
            NASA_API + "login",
            auth=(username, password),
            data={"grant_type": "client_credentials"},
            timeout=30
        )
        login_response.raise_for_status()

        token = login_response.json()["token"]

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

        # Submit the task to NASA
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

    except (KeyError, ValueError) as error:
        app.logger.exception("NASA response parsing failed")

        return jsonify({
            "error": "Unexpected response from NASA."
        }), 502


@app.route("/api/vegetation/tasks", methods=["GET"])
def vegetation_tasks():
    try:
        username = os.getenv("EARTHDATA_USERNAME")
        password = os.getenv("EARTHDATA_PASSWORD")

        login_response = requests.post(
            NASA_API + "login",
            auth=(username, password),
            data={"grant_type": "client_credentials"},
            timeout=30
        )
        login_response.raise_for_status()

        token = login_response.json()["token"]

        response = requests.get(
            NASA_API + "task",
            params={"limit": 5},
            headers={"Authorization": f"Bearer {token}"},
            timeout=30
        )
        response.raise_for_status()

        return jsonify(response.json())

    except requests.RequestException as error:
        app.logger.exception("Could not retrieve NASA tasks")
        return jsonify({
            "error": "Could not retrieve NASA tasks."
        }), 502
  
@app.route("/api/vegetation/results/<task_id>", methods=["GET"])
def vegetation_results(task_id):
    try:
        username = os.getenv("EARTHDATA_USERNAME")
        password = os.getenv("EARTHDATA_PASSWORD")

        # Authenticate with NASA
        login_response = requests.post(
            NASA_API + "login",
            auth=(username, password),
            data={"grant_type": "client_credentials"},
            timeout=30
        )
        login_response.raise_for_status()

        token = login_response.json()["token"]
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
  
if __name__ == "__main__":
    app.run(port=5000, debug=True)
