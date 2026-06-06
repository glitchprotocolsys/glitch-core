import asyncio
import json
import random
import time
import math

MINT_ADDRESS = "vsz3TJPiZ4jktJdZWvPjf71ah9WV6WEABBcEnsYYFJk"
TREASURY_POOL = "FB4N1uC2vukKaS9CcKkYFXSmDNVdNWNuPf6unGraFpef"
FURNACE_POOL = "AJQvKufhparwWHHV2u7ewAkWDoSi4pFyagv5YPgNt5KW"

data_state = {
    "price": 0.001000,
    "price_history": [10, 11, 10, 12, 14, 13, 12, 11, 13, 14, 15, 16, 15, 14, 16],
    "volume_24h": 1250.00,
    "total_supply": 1000000000,
    "burned": 1540000,
    "treasury_sol": 46.2000,
    "status": "MONITOR_ACTIVE",
    "recent_txs": [],
    "alerts": [],
    "portal_count": 412,
    "portal_velocity": 14,
    "x_mentions_24h": 84,
    "top_nodes_holding": 84.2,
    "sniper_risk_score": 0.05
}

async def generate_live_metrics():
    tick = 0
    while True:
        tick += 1
        price_change = random.choice([-0.000015, 0.000022, -0.000008, 0.000031, -0.000025])
        data_state["price"] = max(0.00001, data_state["price"] + price_change)
        
        current_scaled = max(1, min(19, int(data_state["price"] * 10000)))
        data_state["price_history"].append(current_scaled)
        if len(data_state["price_history"]) > 24:
            data_state["price_history"].pop(0)

        tx_volume = random.uniform(50, 850)
        data_state["volume_24h"] += tx_volume
        
        if tick % 5 == 0:
            joins = random.randint(1, 3)
            data_state["portal_count"] += joins
            data_state["portal_velocity"] = int((data_state["portal_velocity"] * 0.9) + (joins * 1.5))
            data_state["x_mentions_24h"] += random.randint(0, 2)

        if random.random() > 0.3:
            burn_amount = random.randint(1000, 45000)
            timestamp = time.strftime("%H:%M:%S", time.localtime())
            
            if burn_amount > 35000:
                data_state["alerts"] = [f"[{timestamp}] THREAT ALERT: SNIPER BLOCK INTERCEPTED"]
                tx_label = "NODE_ALERT"
                data_state["sniper_risk_score"] = min(1.0, data_state["sniper_risk_score"] + 0.15)
            elif burn_amount > 22000:
                data_state["alerts"] = [f"[{timestamp}] METRIC SPIKE: WHALE WALLET ACCUMULATION"]
                tx_label = "WHALE_BUY"
            else:
                tx_label = random.choice(["BUY", "SELL", "BURN_CORE"])
                data_state["sniper_risk_score"] = max(0.05, data_state["sniper_risk_score"] - 0.01)

            data_state["burned"] += burn_amount
            data_state["treasury_sol"] += (burn_amount * 0.00003)
            data_state["top_nodes_holding"] = round(max(50.0, min(95.0, data_state["top_nodes_holding"] + random.uniform(-0.05, 0.06))), 2)

            log_line = f"[{timestamp}] {tx_label.ljust(12)} | +{burn_amount:,} $GLITCH"
            data_state["recent_txs"].append(log_line)
            if len(data_state["recent_txs"]) > 6:
                data_state["recent_txs"].pop(0)
        
        if tick % 6 == 0:
            data_state["alerts"] = []

        with open("metrics.json", "w") as f:
            json.dump(data_state, f)
            
        await asyncio.sleep(0.7)

if __name__ == "__main__":
    try:
        asyncio.run(generate_live_metrics())
    except KeyboardInterrupt:
        pass
