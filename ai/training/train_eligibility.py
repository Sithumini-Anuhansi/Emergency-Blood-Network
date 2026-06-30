"""
Trains a binary classifier to predict donor eligibility (eligible_to_donate)
based on age, gender, weight, hemoglobin, and days_since_last_donation.

Run from the ai/ directory: python training/train_eligibility.py
"""

import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

DATA_PATH = "datasets/donor_dataset.csv"
MODEL_OUT = "models/eligibility_model.pkl"

def main():
    df = pd.read_csv(DATA_PATH)

    # Encode gender as a numeric feature
    gender_encoder = LabelEncoder()
    df["gender_encoded"] = gender_encoder.fit_transform(df["gender"])

    feature_cols = ["age", "gender_encoded", "weight", "hemoglobin", "days_since_last_donation"]
    X = df[feature_cols]
    y = (df["eligible_to_donate"] == "Yes").astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=6,
        min_samples_leaf=3,
        random_state=42,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print("Accuracy:", accuracy_score(y_test, y_pred))
    print("\nConfusion Matrix:\n", confusion_matrix(y_test, y_pred))
    print("\nClassification Report:\n", classification_report(y_test, y_pred, target_names=["Not Eligible", "Eligible"]))

    print("\nFeature Importances:")
    for feat, imp in sorted(zip(feature_cols, model.feature_importances_), key=lambda x: -x[1]):
        print(f"  {feat}: {imp:.3f}")

    # Bundle model + encoder + feature order together so the API doesn't need
    # to guess preprocessing steps at inference time
    bundle = {
        "model": model,
        "gender_encoder": gender_encoder,
        "feature_cols": feature_cols,
    }
    joblib.dump(bundle, MODEL_OUT)
    print(f"\nModel saved to {MODEL_OUT}")

if __name__ == "__main__":
    main()