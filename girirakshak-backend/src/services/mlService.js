const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
export async function predictWithML(features) {
  const r = await fetch(`${ML_URL}/predict`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(features),signal:AbortSignal.timeout(7000)});
  if (!r.ok) throw new Error(`ML service ${r.status}`);
  return r.json();
}
