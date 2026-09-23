import os, joblib, numpy as np, shap
from fastapi import FastAPI
from pydantic import BaseModel, Field

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'landslide_rf.joblib')
if not os.path.exists(MODEL_PATH):
    raise RuntimeError('Model missing. Run: python train_model.py')

bundle = joblib.load(MODEL_PATH)
model = bundle['model']
FEATURES = bundle['features']

# Build the SHAP explainer ONCE at startup (fast, tree-optimized for Random Forest).
# We don't rebuild this per-request — that would be slow and unnecessary.
explainer = shap.TreeExplainer(model)

app = FastAPI(title='GiriRakshak ML Risk Service', version='1.1.0')


class PredictionInput(BaseModel):
    rainfall_1h: float = Field(ge=0, default=0)
    rainfall_24h: float = Field(ge=0, default=0)
    rainfall_72h: float = Field(ge=0, default=0)
    soil_moisture: float = Field(ge=0, le=100, default=30)
    slope: float = Field(ge=0, le=90, default=20)
    elevation: float = Field(ge=-500, default=500)
    historical_density: float = Field(ge=0, le=1, default=0.1)


def level(p):
    return 'critical' if p >= .8 else 'high' if p >= .6 else 'moderate' if p >= .35 else 'low'


def get_shap_row(vals):
    """
    Returns per-feature SHAP values for the positive class (landslide=1),
    for a single input row. Handles both older and newer SHAP output shapes
    so this doesn't break across shap library versions.
    """
    raw = explainer.shap_values(vals)

    # Newer SHAP (>=0.44) sometimes returns a single array shaped
    # (n_samples, n_features, n_classes) for classifiers.
    if isinstance(raw, np.ndarray) and raw.ndim == 3:
        return raw[0, :, 1]

    # Older SHAP returns a list: one array per class -> [class0_array, class1_array]
    if isinstance(raw, list):
        return raw[1][0]

    # Fallback: single array already for one class/row
    return np.asarray(raw)[0]


@app.get('/health')
def health():
    return {
        'status': 'ok',
        'model': 'RandomForestClassifier',
        'bootstrap_model': bundle.get('bootstrap', False),
        'features': FEATURES,
        'explainability': 'shap.TreeExplainer',
    }


@app.post('/predict')
def predict(x: PredictionInput):
    vals = np.array([[getattr(x, f) for f in FEATURES]])
    p = float(model.predict_proba(vals)[0, 1])

    shap_row = get_shap_row(vals)
    total_abs = np.abs(shap_row).sum()
    shares = np.abs(shap_row) / total_abs if total_abs > 0 else np.ones(len(FEATURES)) / len(FEATURES)

    explanation = [
        {
            'feature': f,
            'value': float(vals[0, i]),
            'shapValue': round(float(shap_row[i]), 4),   # signed: pushes risk up (+) or down (-)
            'importance': round(float(shares[i]) * 100, 1),  # normalized magnitude, 0-100, for the bar chart
        }
        for i, f in enumerate(FEATURES)
    ]
    explanation.sort(key=lambda a: a['importance'], reverse=True)

    return {
        'probability': round(p, 4),
        'riskScore': round(p * 100, 1),
        'riskLevel': level(p),
        'confidence': round(max(p, 1 - p) * 100, 1),
        'explanation': explanation,
        'model': 'RandomForestClassifier',
        'explainability': 'SHAP (TreeExplainer)',
    }
