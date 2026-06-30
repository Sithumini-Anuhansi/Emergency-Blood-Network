"""
Trains a classifier to predict match_successful (whether a donor-request
pairing would result in a completed donation) based on compatibility and
donor-state features.

Run from the ai/ directory: python training/train_match.py
"""

import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import classification_report, accuracy_score, roc_auc_score, confusion_matrix

DATA_PATH = "datasets/match_outcomes.csv"
MODEL_OUT = "models/match_model.pkl"

def main():
    df = pd.read_csv(DATA_PATH)

    feature_cols = [
        "blood_group_match",
        "district_match",
        "donor_available",
        "donor_eligible",
        "donor_age",
        "days_since_last_donation",
        "urgency_score",
    ]
    X = df[feature_cols]
    y = df["match_successful"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = GradientBoostingClassifier(
        n_estimators=150,
        max_depth=3,
        learning_rate=0.1,
        random_state=42,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    print("Accuracy:", accuracy_score(y_test, y_pred))
    print("ROC-AUC:", roc_auc_score(y_test, y_proba))
    print("\nConfusion Matrix:\n", confusion_matrix(y_test, y_pred))
    print("\nClassification Report:\n", classification_report(y_test, y_pred, target_names=["Unsuccessful", "Successful"]))

    print("\nFeature Importances:")
    for feat, imp in sorted(zip(feature_cols, model.feature_importances_), key=lambda x: -x[1]):
        print(f"  {feat}: {imp:.3f}")

    bundle = {
        "model": model,
        "feature_cols": feature_cols,
    }
    joblib.dump(bundle, MODEL_OUT)
    print(f"\nModel saved to {MODEL_OUT}")

if __name__ == "__main__":
    main()