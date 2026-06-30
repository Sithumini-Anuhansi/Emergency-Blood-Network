"""
Emergency Blood Network - AI Microservice

Exposes:
  GET  /health
  POST /predict-eligibility
  POST /predict-match-score
"""

import os
import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

eligibility_bundle = joblib.load(os.path.join(MODELS_DIR, "eligibility_model.pkl"))
match_bundle = joblib.load(os.path.join(MODELS_DIR, "match_model.pkl"))


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "OK", "service": "EBN AI Microservice"})


@app.route("/predict-eligibility", methods=["POST"])
def predict_eligibility():
    """
    Expects JSON:
    {
      "age": 30,
      "gender": "Male" | "Female",
      "weight": 65,
      "hemoglobin": 13.5,
      "days_since_last_donation": 120
    }
    """
    try:
        data = request.get_json(force=True)
        required = ["age", "gender", "weight", "hemoglobin", "days_since_last_donation"]
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

        model = eligibility_bundle["model"]
        gender_encoder = eligibility_bundle["gender_encoder"]
        feature_cols = eligibility_bundle["feature_cols"]

        gender_encoded = gender_encoder.transform([data["gender"]])[0]

        row = pd.DataFrame([{
            "age": data["age"],
            "gender_encoded": gender_encoded,
            "weight": data["weight"],
            "hemoglobin": data["hemoglobin"],
            "days_since_last_donation": data["days_since_last_donation"],
        }])[feature_cols]

        prediction = model.predict(row)[0]
        probability = model.predict_proba(row)[0][1]

        return jsonify({
            "eligible": bool(prediction),
            "confidence": round(float(probability), 4),
        })

    except ValueError as e:
        # Typically raised by gender_encoder.transform on an unseen label
        return jsonify({"error": f"Invalid input value: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict-match-score", methods=["POST"])
def predict_match_score():
    """
    Expects JSON:
    {
      "blood_group_match": 1,
      "district_match": 0,
      "donor_available": 1,
      "donor_eligible": 1,
      "donor_age": 30,
      "days_since_last_donation": 150,
      "urgency_score": 2
    }
    urgency_score mapping: low=0, medium=1, high=2, critical=3
    """
    try:
        data = request.get_json(force=True)
        model = match_bundle["model"]
        feature_cols = match_bundle["feature_cols"]

        missing = [f for f in feature_cols if f not in data]
        if missing:
            return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

        row = pd.DataFrame([data])[feature_cols]

        prediction = model.predict(row)[0]
        probability = model.predict_proba(row)[0][1]

        return jsonify({
            "likely_successful": bool(prediction),
            "match_score": round(float(probability), 4),
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/rank-donors", methods=["POST"])
def rank_donors():
    """
    Convenience endpoint: given a request's blood group/district/urgency and
    a list of candidate donors, scores and ranks them by predicted match success.

    Expects JSON:
    {
      "request_blood_group": "O+",
      "request_district": "Gampaha",
      "urgency_score": 2,
      "donors": [
        {
          "donor_id": "...", "blood_group": "O+", "district": "Gampaha",
          "availability": true, "eligibility": true, "age": 30,
          "days_since_last_donation": 150
        },
        ...
      ]
    }
    """
    try:
        data = request.get_json(force=True)
        req_bg = data["request_blood_group"]
        req_district = data["request_district"]
        urgency_score = data["urgency_score"]
        donors = data["donors"]

        if not donors:
            return jsonify({"ranked_donors": []})

        model = match_bundle["model"]
        feature_cols = match_bundle["feature_cols"]

        rows = []
        for d in donors:
            rows.append({
                "donor_id": d["donor_id"],
                "blood_group_match": int(d["blood_group"] == req_bg),
                "district_match": int(d["district"] == req_district),
                "donor_available": int(d["availability"]),
                "donor_eligible": int(d["eligibility"]),
                "donor_age": d["age"],
                "days_since_last_donation": d["days_since_last_donation"],
                "urgency_score": urgency_score,
            })

        df = pd.DataFrame(rows)
        X = df[feature_cols]
        scores = model.predict_proba(X)[:, 1]
        df["match_score"] = scores

        ranked = df.sort_values("match_score", ascending=False)
        result = ranked[["donor_id", "match_score"]].to_dict(orient="records")

        return jsonify({"ranked_donors": result})

    except KeyError as e:
        return jsonify({"error": f"Missing field: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)