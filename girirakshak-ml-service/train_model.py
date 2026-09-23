"""Bootstrap trainer. Replace synthetic bootstrap data with validated regional labeled data before production deployment."""
import os, numpy as np, joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
FEATURES=['rainfall_1h','rainfall_24h','rainfall_72h','soil_moisture','slope','elevation','historical_density']
rng=np.random.default_rng(42); n=6000
X=np.column_stack([rng.gamma(1.8,4,n),rng.gamma(2.5,18,n),rng.gamma(3,35,n),rng.uniform(10,75,n),rng.uniform(0,65,n),rng.uniform(0,3000,n),rng.uniform(0,1,n)])
score=(0.035*X[:,0]+0.012*X[:,1]+0.004*X[:,2]+0.025*X[:,3]+0.028*X[:,4]+0.8*X[:,6]-2.2+rng.normal(0,.55,n))
y=(score>0.5).astype(int)
Xtr,Xte,ytr,yte=train_test_split(X,y,test_size=.2,random_state=42,stratify=y)
model=RandomForestClassifier(n_estimators=300,max_depth=14,min_samples_leaf=4,class_weight='balanced',random_state=42,n_jobs=-1)
model.fit(Xtr,ytr)
os.makedirs('models',exist_ok=True)
joblib.dump({'model':model,'features':FEATURES,'bootstrap':True,'report':classification_report(yte,model.predict(Xte),output_dict=True)},'models/landslide_rf.joblib')
print('Saved models/landslide_rf.joblib')
