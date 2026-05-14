# PulseWire News App

A fast, user-friendly news + weather dashboard with:

- live updates every 60 seconds
- date + live clock with timezone based on selected region
- built-in month calendar
- region switcher (United States, India, China, Europe)
- Tech tab for technology headlines
- weather by zipcode/city or current location

## APIs used

- News: Google News RSS (via AllOrigins proxy)
- Weather: Open-Meteo Forecast API
- Geocoding: Open-Meteo Geocoding API
- US zipcode lookup: Zippopotam

These are free public APIs/proxies and can be used without API keys for prototyping.

## Run

Because this is a static app, run with any local static server:

```bash
python3 -m http.server 8080
```

Then open:

- http://localhost:8080

## Notes

- Live refresh pauses while the browser tab is hidden or offline.
- Europe is implemented as a region preset with a second country selector.
- News and weather are fetched independently, so one can keep working if the other fails.
