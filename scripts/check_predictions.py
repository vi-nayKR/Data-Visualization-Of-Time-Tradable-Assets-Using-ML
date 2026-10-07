"""Run the leakage, evaluation, determinism and read-only serving checks."""
from pathlib import Path
import subprocess
import sys
raise SystemExit(subprocess.call([sys.executable, "-m", "pytest", "tests", "-q"], cwd=Path(__file__).resolve().parents[1] / "backend"))
