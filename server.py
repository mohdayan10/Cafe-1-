#!/usr/bin/env python3
"""lightHouse* — static site + booking API.

    python3 server.py [port]

Serves the site and a small reservations service backed by SQLite (bookings.db).

    GET  /api/health
    GET  /api/availability?date=YYYY-MM-DD   -> {"seats": {"18:30": 4, ...}}
    POST /api/bookings                       -> the stored booking
    GET  /api/bookings?date=YYYY-MM-DD       -> the day's book, for the counter
"""
import json
import re
import sqlite3
import sys
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs

ROOT = Path(__file__).resolve().parent
DB = ROOT / "bookings.db"
CAPACITY = 14          # seats bookable per half-hour sitting
HOURS = {0: (8, 23), 1: (8, 23), 2: (8, 23), 3: (8, 23), 4: (8, 24), 5: (8, 24), 6: (9, 23)}  # Mon=0
LAST_SEATING = 1.5     # hours before close

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
TIME_RE = re.compile(r"^([01]\d|2[0-3]):(00|30)$")


def db():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    con.execute("""CREATE TABLE IF NOT EXISTS bookings(
        ref TEXT PRIMARY KEY, date TEXT NOT NULL, time TEXT NOT NULL, party INTEGER NOT NULL,
        name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, note TEXT, placed TEXT NOT NULL)""")
    con.execute("CREATE INDEX IF NOT EXISTS bookings_day ON bookings(date)")
    return con


def seats_taken(con, date):
    rows = con.execute("SELECT time, SUM(party) AS n FROM bookings WHERE date=? GROUP BY time", (date,))
    return {r["time"]: r["n"] for r in rows}


def valid_sitting(date, time):
    d = datetime.strptime(date, "%Y-%m-%d")
    open_h, close_h = HOURS[d.weekday()]
    h, m = int(time[:2]), int(time[3:])
    t = h + m / 60
    return open_h <= t <= close_h - LAST_SEATING


class Handler(SimpleHTTPRequestHandler):
    server_version = "lightHouse/1.0"

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    def log_message(self, fmt, *args):
        if "/api/" in (self.path or "") or not self.path.endswith((".css", ".js", ".jpg", ".png", ".svg")):
            sys.stderr.write("%s  %s\n" % (self.command, self.path))

    def send_json(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/api/health":
            return self.send_json({"ok": True, "service": "lighthouse-bookings", "capacity": CAPACITY})
        if u.path == "/api/availability":
            date = (parse_qs(u.query).get("date") or [""])[0]
            if not DATE_RE.match(date):
                return self.send_json({"error": "bad date"}, 400)
            with db() as con:
                return self.send_json({"date": date, "capacity": CAPACITY, "seats": seats_taken(con, date)})
        if u.path == "/api/bookings":
            date = (parse_qs(u.query).get("date") or [""])[0]
            with db() as con:
                if DATE_RE.match(date):
                    rows = con.execute("SELECT * FROM bookings WHERE date=? ORDER BY time", (date,))
                else:
                    rows = con.execute("SELECT * FROM bookings ORDER BY date, time")
                return self.send_json({"bookings": [dict(r) for r in rows]})
        return super().do_GET()

    def do_POST(self):
        if urlparse(self.path).path != "/api/bookings":
            return self.send_json({"error": "no such endpoint"}, 404)
        try:
            n = int(self.headers.get("Content-Length") or 0)
            if n > 8000:
                return self.send_json({"error": "too much"}, 413)
            b = json.loads(self.rfile.read(n) or b"{}")
        except Exception:
            return self.send_json({"error": "could not read that"}, 400)

        date, time = str(b.get("date", "")), str(b.get("time", ""))
        try:
            party = int(b.get("party", 0))
        except (TypeError, ValueError):
            party = 0
        name, phone = str(b.get("name", "")).strip(), str(b.get("phone", "")).strip()

        if not DATE_RE.match(date) or not TIME_RE.match(time):
            return self.send_json({"error": "that date and time do not look right"}, 400)
        if not valid_sitting(date, time):
            return self.send_json({"error": "we are not seating then"}, 400)
        if not 1 <= party <= 8:
            return self.send_json({"error": "parties of one to eight, please"}, 400)
        if len(name) < 2 or len(re.sub(r"\D", "", phone)) < 7:
            return self.send_json({"error": "we need a name and a number"}, 400)
        if datetime.strptime(date + " " + time, "%Y-%m-%d %H:%M") < datetime.now():
            return self.send_json({"error": "that sitting has passed"}, 400)

        ref = str(b.get("ref") or "").strip().upper() or "LH-" + datetime.now().strftime("%H%M%S")
        with db() as con:
            taken = seats_taken(con, date).get(time, 0)
            if taken + party > CAPACITY:
                return self.send_json({"error": "only %d seats left at %s" % (CAPACITY - taken, time)}, 409)
            try:
                con.execute("INSERT INTO bookings VALUES (?,?,?,?,?,?,?,?,?)",
                            (ref, date, time, party, name, phone,
                             str(b.get("email", ""))[:120], str(b.get("note", ""))[:400],
                             datetime.now().isoformat(timespec="seconds")))
            except sqlite3.IntegrityError:
                return self.send_json({"error": "that reference already exists"}, 409)
            row = con.execute("SELECT * FROM bookings WHERE ref=?", (ref,)).fetchone()
        return self.send_json(dict(row), 201)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    db().close()
    print("lightHouse*  http://localhost:%d   (bookings -> %s)" % (port, DB.name), flush=True)
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
