import { memoryStore } from "../store/memoryStore.js";

// Stands in for a real IMD rainfall-forecast API integration. Swap the body
// of this function for an axios call to IMD's forecast endpoint when you
// have API access — the response shape ([{ day, mm }, ...]) is the contract
// the frontend chart is already built against.
export async function getRainfallForecast(_req, res, next) {
  try {
    res.json(memoryStore.getForecast());
  } catch (err) {
    next(err);
  }
}
