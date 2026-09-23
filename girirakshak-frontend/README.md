# GiriRakshak Frontend

## GIS features integrated
- Dark GIS, satellite imagery and terrain/elevation basemaps
- AI landslide-risk layer
- Near-real-time precipitation layer
- Soil-moisture layer
- Ground-deformation visualization layer
- Auto-refresh every 5 minutes

## Run
```bash
npm install
npm run dev
```

The frontend expects the backend at `http://localhost:5000/api` by default.
Set `VITE_API_BASE_URL` in `.env` if needed.
