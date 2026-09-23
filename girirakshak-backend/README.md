# GiriRakshak Backend

## Run
```bash
npm install
npm run dev
```

## New GIS environmental endpoint
`GET /api/environment/live`

It retrieves near-real-time precipitation, rain, soil moisture, weather code and wind data for monitored zones using Open-Meteo. If the provider is unavailable, it returns a local fallback so the demo remains functional.
