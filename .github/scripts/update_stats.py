#!/usr/bin/env python3
"""Refresh data/stats.json from TryHackMe's public profile API."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from curl_cffi import requests


USERNAME = "l1nux"
API_URL = "https://tryhackme.com/api/v2/public-profile"
STATS_PATH = Path(__file__).resolve().parents[2] / "data" / "stats.json"
IMPERSONATIONS = ("chrome", "chrome131", "safari", "chrome120")
LEVEL_TITLES = (
    "NEOPHYTE", "APPRENTICE", "PATHFINDER", "SEEKER", "VISIONARY",
    "VOYAGER", "ADEPT", "HACKER", "MAGE", "WIZARD", "MASTER", "GURU",
    "LEGEND", "GUARDIAN", "TITAN", "SAGE", "VANGUARD", "SHOGUN",
    "ASCENDED", "MYTHIC", "GRANDMASTER",
)


def fetch_profile() -> dict:
    errors: list[str] = []

    for browser in IMPERSONATIONS:
        try:
            response = requests.get(
                API_URL,
                params={"username": USERNAME},
                impersonate=browser,
                headers={"accept": "application/json"},
                timeout=30,
            )

            content_type = response.headers.get("content-type", "")

            if response.status_code == 200 and "json" in content_type:
                payload = response.json()

                if payload.get("status") == "success" and payload.get("data"):
                    return payload["data"]

            errors.append(f"{browser}: HTTP {response.status_code}")

        except Exception as exc:
            errors.append(f"{browser}: {type(exc).__name__}")

    raise RuntimeError(
        "TryHackMe profile request failed (" + ", ".join(errors) + ")"
    )


def first_number(data: dict, keys: tuple[str, ...], fallback: int) -> int:
    for key in keys:
        value = data.get(key)

        if value is not None:
            try:
                return int(value)
            except (TypeError, ValueError):
                pass

    return fallback

def main() -> int:
    existing = json.loads(STATS_PATH.read_text(encoding="utf-8"))

    try:
        data = fetch_profile()
    except RuntimeError as exc:
        print(f"::error::{exc}")
        return 1

    level = first_number(data, ("level",), existing.get("level", 21))
    level = max(1, min(level, len(LEVEL_TITLES)))

    updated = {
        "username": data.get("username", USERNAME),
        "rank": first_number(
            data,
            ("rank",),
            existing.get("rank", 97),
        ),
        "badges": first_number(
            data,
            ("badgesNumber", "badges"),
            existing.get("badges", 95),
        ),
        "streak": first_number(
            data,
            ("streak", "currentStreak", "streakDays", "dailyStreak"),
            existing.get("streak", 52),
        ),
        "points": first_number(
            data,
            ("totalPoints", "points"),
            existing.get("points", 157258),
        ),
        "completedRooms": first_number(
            data,
            ("completedRoomsNumber", "completedRooms", "rooms"),
            existing.get("completedRooms", 1151),
        ),
        "level": level,
        "levelHex": f"0x{level:X}",
        "levelTitle": LEVEL_TITLES[level - 1],
        "updatedAt": datetime.now(timezone.utc)
        .isoformat()
        .replace("+00:00", "Z"),
        "source": "tryhackme-api",
    }

    STATS_PATH.write_text(
        json.dumps(updated, indent=2) + "\n",
        encoding="utf-8",
    )

    print(
        f"Updated {STATS_PATH}: rank #{updated['rank']}, "
        f"{updated['points']} points, "
        f"{updated['completedRooms']} rooms, "
        f"{updated['badges']} badges"
    )

    return 0

   

    return 0


if __name__ == "__main__":
    sys.exit(main())
