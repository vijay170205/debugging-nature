# GiriRakshak ML Integration

## Services
1. `girirakshak-frontend` - React GIS dashboard
2. `girirakshak-backend` - Node/Express API and hybrid orchestration
3.  `girirakshak-ml-service` - Python/FastAPI Random Forest prediction service
   - Explainability: SHAP (TreeExplainer) — provides per-prediction feature 
     attribution, not just global feature importance.

## Run
Terminal 1:
`cd girirakshak-ml-service && python -m venv .venv && .venv/Scripts/activate` (Windows) then `pip install -r requirements.txt`, `python train_model.py`, `uvicorn app:app --reload --port 8000`

Terminal 2:
`cd girirakshak-backend && npm install && npm run dev`
Set `ML_SERVICE_URL=http://localhost:8000` if needed.

Terminal 3:
`cd girirakshak-frontend && npm install && npm run dev`

## Important validation note
The included trainer creates a **bootstrap synthetic baseline** so the full pipeline runs end-to-end. It is NOT scientifically validated for operational warning. Replace it with a real labeled regional landslide/non-landslide dataset and report actual precision, recall, F1, calibration, and false-alarm performance before claiming industry deployment.
Explainability (SHAP) reflects the model's actual learned behavior accurately 
regardless of training data quality — but since the underlying model is trained 
on synthetic bootstrap data, SHAP explanations should also be re-validated 
once the model is retrained on real labeled landslide data.
