import { memoryStore } from '../store/memoryStore.js';
import { predictWithML } from '../services/mlService.js';
function level(score){return score>=80?'critical':score>=60?'high':score>=35?'moderate':'low'}
function thresholdRisk(r1,r24,r72,soil){const s=Math.min(100, r1*4+r24*1.4+r72*.35+Math.max(0,soil-35)*1.2);return {riskScore:Math.round(s),riskLevel:level(s),method:'Rainfall and antecedent-wetness safety threshold'}}
function staticFeatures(zone){return {slope:zone.slope??35,elevation:zone.elevation??800,historical_density:zone.historicalDensity??0.2}}
export async function getLiveEnvironment(_req,res,next){try{
 const zones=memoryStore.getZones(); const latitude=zones.map(z=>z.lat).join(','); const longitude=zones.map(z=>z.lng).join(',');
 const current='precipitation,rain,soil_moisture_0_to_1cm,weather_code,wind_speed_10m';
 const hourly='precipitation,rain,soil_moisture_0_to_1cm';
 const url=`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=${current}&hourly=${hourly}&past_days=3&forecast_days=1&timezone=auto`;
 const response=await fetch(url,{signal:AbortSignal.timeout(10000)}); if(!response.ok) throw new Error('Weather provider unavailable');
 const payload=await response.json(); const results=Array.isArray(payload)?payload:[payload];
 const data=await Promise.all(zones.map(async(zone,i)=>{const p=results[i]||{};const c=p.current||{};const h=p.hourly||{};const times=h.time||[];const now=c.time;let idx=times.indexOf(now); if(idx<0) idx=times.length-1; const sum=(arr,n)=>arr.slice(Math.max(0,idx-n+1),idx+1).reduce((a,v)=>a+(Number(v)||0),0);
  const r1=Number(c.precipitation??0),r24=sum(h.precipitation||[],24),r72=sum(h.precipitation||[],72); const soil=c.soil_moisture_0_to_1cm==null?(zone.soilMoisture??30):Number(c.soil_moisture_0_to_1cm)*100;
  const features={rainfall_1h:r1,rainfall_24h:r24,rainfall_72h:r72,soil_moisture:soil,...staticFeatures(zone)}; const threshold=thresholdRisk(r1,r24,r72,soil);
  let ml=null,source='Hybrid ML + threshold'; try{ml=await predictWithML(features)}catch{source='Threshold fallback (ML unavailable)'}
  const finalScore=ml?Math.round(ml.riskScore*.75+threshold.riskScore*.25):threshold.riskScore; const final={riskScore:finalScore,riskLevel:level(finalScore),method:ml?'Hybrid ensemble: 75% ML + 25% safety threshold':threshold.method};
  return {zoneId:zone.zoneId,lat:zone.lat,lng:zone.lng,updatedAt:c.time||new Date().toISOString(),precipitationMm:r1,rainMm:Number(c.rain??0),rainfall24h:Math.round(r24*10)/10,rainfall72h:Math.round(r72*10)/10,soilMoisture:Math.round(soil*10)/10,weatherCode:c.weather_code??null,windSpeedKmh:Number(c.wind_speed_10m??0),features,ml,threshold,...final,riskFactors:ml?.explanation||[],source};
 }));
 memoryStore.addPredictionHistory(data); res.json({live:true,source:'Open-Meteo + GiriRakshak Hybrid ML Engine',updatedAt:new Date().toISOString(),data});
}catch(err){try{const data=memoryStore.getZones().map(zone=>{const threshold=thresholdRisk(0,zone.rainfall24h||0,zone.rainfall72h||0,zone.soilMoisture||30);return {zoneId:zone.zoneId,lat:zone.lat,lng:zone.lng,soilMoisture:zone.soilMoisture??null,...threshold,source:'Local fallback'}});res.json({live:false,source:'Local fallback',data})}catch(e){next(e)}}}
export function getPredictionHistory(req,res){const limit=Math.min(Number(req.query.limit)||100,500);res.json(memoryStore.getPredictionHistory(limit));}
