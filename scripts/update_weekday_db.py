import json

import requests

url = "https://viikkonro.fi/api/year"
years = []
for x in range(10):
    years.append(str(2026 + x))

if __name__ == "__main__":
    holidays = []

    for year in years:
        data = requests.get(f"https://viikkonro.fi/api/year/{year}.json").json()

        holidays += data["holidays"] + data["flagDays"]

    with open("../data/holidays.json", "w", encoding="utf-8") as f:
        json.dump(holidays, f, ensure_ascii=False, indent=4)
