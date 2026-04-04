import json
import urllib.request
from datetime import datetime

def get_live_events():
    """
    Fetches real-world public holidays for Ethiopia from Nager.Date API.
    Returns a unified list of 'events' compatible with the dashboard yield/action systems.
    """
    current_year = datetime.now().year
    url = f"https://date.nager.at/api/v3/PublicHolidays/{current_year}/ET"
    
    events = []
    
    # 1. We keep one static Diplomatic Event so the AI has a Conference tag to analyze for Demo purposes
    events.append({
        "name": "African Union Summit", 
        "days_away": 3, 
        "type": "Conference", 
        "demand_impact": "High"
    })
    
    # 2. Fetch live data
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Kuriftu Server)'})
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                today = datetime.now()
                
                # Parse holidays
                for holiday in data:
                    try:
                        hol_date = datetime.strptime(holiday["date"], "%Y-%m-%d")
                        delta = (hol_date - today).days
                        
                        # We only care about events in the future (0 to 365 days out)
                        if delta >= 0 and delta <= 365:
                            events.append({
                                "name": holiday.get("localName", holiday.get("name")),
                                "days_away": delta,
                                "type": "Cultural",  # Default all public holidays to Cultural
                                "demand_impact": "Surge" if delta <= 30 else "Moderate"
                            })
                    except Exception as parse_error:
                        continue
                        
    except Exception as e:
        print(f"Failed to fetch live events from API: {e}")
        # Fallback to mock data if no internet connection or API fails
        events.append({
            "name": "Ethiopian Epiphany (Timkat)", 
            "days_away": 14, 
            "type": "Cultural", 
            "demand_impact": "Surge"
        })
        
    # Sort events by days_away so we show the most imminent ones first
    events.sort(key=lambda x: x["days_away"])
    
    # Return the top 4 imminent events
    return events[:4]
