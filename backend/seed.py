import os
import sys

# Ensure project root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from seed import seed_database

if __name__ == "__main__":
    seed_database()
