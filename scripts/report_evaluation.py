"""Create the required honest market-level report from published h=5 artifacts."""
import argparse
import json
from pathlib import Path

import numpy as np


def report(root):
    groups = {"in": [], "us": []}
    for path in root.glob("*/h5.json"):
        artifact = json.loads(path.read_text())
        winner = next(m for m in artifact["models"] if m["name"] == artifact["winner"])
        groups[artifact["market"]].append(winner["metrics"])
    rows = []
    for market, items in groups.items():
        accuracy = np.array([item["directional_accuracy"] for item in items])
        skill = [item["skill_vs_naive"] for item in items]
        samples = np.random.default_rng(42).choice(accuracy, size=(5000, len(items))).mean(axis=1)
        low, high = np.quantile(samples, [.025, .975])
        rows.append(f"| {'India (NSE)' if market == 'in' else 'United States'} | {len(items)} | "
                    f"{np.median(skill):.2%} | {sum(s > 0 for s in skill)}/{len(items)} ({np.mean(np.array(skill)>0):.1%}) | "
                    f"{accuracy.mean():.1%} ({low:.1%}–{high:.1%}) |")
    return "\n".join(rows)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("artifacts", type=Path)
    print(report(parser.parse_args().artifacts))
