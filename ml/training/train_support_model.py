"""
Machine Learning Training Pipeline for Academic Support Indicator in EduTrack AI.
- Reproducible synthetic academic cohort generator
- Scikit-learn Logistic Regression Pipeline with StandardScaler & Imputer
- Baseline comparison (Majority class & Heuristic rule)
- Comprehensive evaluation metrics (Precision, Recall, F1, ROC-AUC)
- Model artifact serialization with metadata to ml/artifacts/
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report,
    confusion_matrix
)

# Feature schema
FEATURE_NAMES = [
    "cumulative_gpa",
    "recent_term_gpa",
    "gpa_delta",
    "credit_completion_ratio",
    "course_failure_count",
    "course_withdrawal_count",
    "current_semester"
]

def generate_synthetic_cohort(n_samples: int = 1200, random_state: int = 42) -> pd.DataFrame:
    """
    Generates realistic academic progression data strictly based on academic records.
    Zero demographic features are collected or simulated.
    """
    np.random.seed(random_state)

    current_semester = np.random.randint(1, 9, size=n_samples)
    
    # Latent academic standing factor
    latent_standing = np.random.normal(loc=3.1, scale=0.6, size=n_samples)
    
    cumulative_gpa = np.clip(latent_standing + np.random.normal(0, 0.2, size=n_samples), 1.0, 4.0)
    gpa_delta = np.random.normal(loc=-0.05, scale=0.35, size=n_samples)
    recent_term_gpa = np.clip(cumulative_gpa + gpa_delta, 0.0, 4.0)
    
    # Credit completion ratio (completed / attempted)
    base_completion = np.clip(0.85 + (cumulative_gpa - 2.5) * 0.15, 0.3, 1.0)
    credit_completion_ratio = np.clip(base_completion + np.random.normal(0, 0.08, size=n_samples), 0.2, 1.0)
    
    # Failure & withdrawal counts
    fail_prob = np.clip(0.4 - (cumulative_gpa * 0.08), 0.01, 0.7)
    course_failure_count = np.random.binomial(n=3, p=fail_prob)
    course_withdrawal_count = np.random.binomial(n=2, p=np.clip(fail_prob * 0.6, 0.01, 0.5))

    # Support Needed target (1 = Student would benefit from academic advisor outreach, 0 = On track)
    # Target definition based on composite academic hurdles:
    # low recent GPA (<2.3), substantial GPA drop (delta < -0.6), low completion ratio (<0.7), or multiple failures
    risk_score = (
        (cumulative_gpa < 2.2).astype(int) * 3 +
        (recent_term_gpa < 2.0).astype(int) * 3 +
        (gpa_delta < -0.5).astype(int) * 2 +
        (credit_completion_ratio < 0.75).astype(int) * 2 +
        (course_failure_count >= 1).astype(int) * 2 +
        (course_withdrawal_count >= 1).astype(int) * 1
    )
    
    # Add mild stochasticity to simulate real-world noise
    noise = np.random.normal(0, 0.5, size=n_samples)
    target = (risk_score + noise >= 3.0).astype(int)

    df = pd.DataFrame({
        "cumulative_gpa": cumulative_gpa,
        "recent_term_gpa": recent_term_gpa,
        "gpa_delta": gpa_delta,
        "credit_completion_ratio": credit_completion_ratio,
        "course_failure_count": course_failure_count,
        "course_withdrawal_count": course_withdrawal_count,
        "current_semester": current_semester,
        "needs_support": target
    })

    return df

def train_and_persist_model(output_dir: str = "ml/artifacts"):
    os.makedirs(output_dir, exist_ok=True)
    
    print("[1/5] Generating reproducible synthetic academic dataset...")
    df = generate_synthetic_cohort(n_samples=1500, random_state=42)
    
    X = df[FEATURE_NAMES]
    y = df["needs_support"]
    
    # Train / test split (80/20) with stratification
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    print(f"[2/5] Cohort Split: {len(X_train)} train samples, {len(X_test)} test samples. Class balance: {y.mean():.2%} positive.")
    
    # 1. Baseline Heuristic Rule: flags risk if GPA < 2.3 or failures >= 1
    baseline_preds = ((X_test["cumulative_gpa"] < 2.3) | (X_test["course_failure_count"] >= 1)).astype(int)
    baseline_f1 = f1_score(y_test, baseline_preds)
    baseline_acc = accuracy_score(y_test, baseline_preds)
    
    # 2. Scikit-learn Pipeline
    print("[3/5] Fitting Scikit-Learn Pipeline (Imputer + Scaler + LogisticRegression)...")
    pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(penalty="l2", C=1.0, class_weight="balanced", random_state=42))
    ])
    
    pipeline.fit(X_train, y_train)
    
    # Evaluation
    print("[4/5] Evaluating model performance...")
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_proba)
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    # Feature coefficients for transparency
    coefs = pipeline.named_steps["classifier"].coef_[0].tolist()
    feature_importance = dict(zip(FEATURE_NAMES, [round(c, 4) for c in coefs]))

    metrics = {
        "model_version": "v1.2.0-lr",
        "algorithm": "LogisticRegression (scikit-learn with StandardScaler)",
        "training_timestamp": datetime.now(timezone.utc).isoformat(),
        "n_samples": len(df),
        "test_metrics": {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(roc_auc), 4),
            "confusion_matrix": cm
        },
        "baseline_comparison": {
            "baseline_heuristic_name": "Simple Rule (GPA < 2.3 or failures >= 1)",
            "baseline_accuracy": round(float(baseline_acc), 4),
            "baseline_f1_score": round(float(baseline_f1), 4),
            "improvement_over_baseline_f1": round(float(f1 - baseline_f1), 4)
        },
        "feature_weights": feature_importance,
        "safeguards": {
            "disclaimer": "Academic support indicator for advisor review only. Not an automated punitive or definitive judgment.",
            "sensitive_attributes_used": False,
            "human_in_the_loop_required": True
        }
    }
    
    # Persist model artifact
    model_path = os.path.join(output_dir, "academic_support_model.joblib")
    metrics_path = os.path.join(output_dir, "model_metadata.json")
    
    joblib.dump(pipeline, model_path)
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
        
    print(f"[5/5] Model saved to {model_path}")
    print(f"Metrics saved to {metrics_path}")
    print(f"Test F1-score: {f1:.4f} | ROC-AUC: {roc_auc:.4f}")
    return metrics

if __name__ == "__main__":
    train_and_persist_model()
