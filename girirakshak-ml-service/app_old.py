import os, joblib, numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Dict
MODEL_PATH=os.path.join(os.path.dirname(__file__),'models','landslide_rf.joblib')
if not os.path.exists(MODEL_PATH):
    raise RuntimeError('Model missing. Run: python train_model.py')
bundle=joblib.load(MODEL_PATH); model=bundle['model']; FEATURES=bundle['features']
app=FastAPI(title='GiriRakshak ML Risk Service',version='1.0.0')
class PredictionInput(BaseModel):
    rainfall_1h: float=Field(ge=0,default=0)
    rainfall_24h: float=Field(ge=0,default=0)
    rainfall_72h: float=Field(ge=0,default=0)
    soil_moisture: float=Field(ge=0,le=100,default=30)
    slope: float=Field(ge=0,le=90,default=20)
    elevation: float=Field(ge=-500,default=500)
    historical_density: float=Field(ge=0,le=1,default=0.1)
def level(p): return 'critical' if p>=.8 else 'high' if p>=.6 else 'moderate' if p>=.35 else 'low'
@app.get('/health')
def health(): return {'status':'ok','model':'RandomForestClassifier','bootstrap_model':bundle.get('bootstrap',False),'features':FEATURES}
@app.post('/predict')
def predict(x:PredictionInput):
    vals=np.array([[getattr(x,f) for f in FEATURES]])
    p=float(model.predict_proba(vals)[0,1]); importance=model.feature_importances_
    raw=np.abs(vals[0]*importance); shares=raw/raw.sum() if raw.sum()>0 else importance/importance.sum()
    explanation=[{'feature':f,'value':float(vals[0,i]),'importance':round(float(shares[i])*100,1)} for i,f in enumerate(FEATURES)]
    explanation.sort(key=lambda a:a['importance'],reverse=True)
    return {'probability':round(p,4),'riskScore':round(p*100,1),'riskLevel':level(p),'confidence':round(max(p,1-p)*100,1),'explanation':explanation,'model':'RandomForestClassifier'}
