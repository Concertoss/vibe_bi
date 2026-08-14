"""Initialize SQLite schema and seed default data.

Usage (from host-backend/):
    python -m scripts.init_db
"""

from __future__ import annotations

import sys
from pathlib import Path

# Allow `python scripts/init_db.py` from host-backend/
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.database import SessionLocal, init_db  # noqa: E402
from app.seed import seed_if_empty  # noqa: E402


def main() -> None:
    data_dir = ROOT / "data"
    data_dir.mkdir(parents=True, exist_ok=True)

    init_db()
    db = SessionLocal()
    try:
        seed_if_empty(db)
        print("Database initialized.")
        print("  admin / admin123  (role=admin, dept=HQ)")
        print("  viewer / viewer123  (role=viewer, dept=EAST)")
        print("  menus: template-report, sales-demo")
    finally:
        db.close()


if __name__ == "__main__":
    main()
