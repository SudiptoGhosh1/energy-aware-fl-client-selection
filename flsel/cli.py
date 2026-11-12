"""Command-line interface for Energy-Aware Federated Learning Client Selection."""

import argparse
import sys
from flsel.instance import generate
from flsel.policies import simulate
from flsel.checker import check


def main():
    parser = argparse.ArgumentParser(
        prog="flsel",
        description="Simulate energy-aware client selection policies in Federated Learning."
    )
    parser.add_argument("--clients", "-K", type=int, default=40, help="Number of clients (default: 40)")
    parser.add_argument("--groups", "-G", type=int, default=20, help="Number of data groups (default: 20)")
    parser.add_argument("--rounds", "-R", type=int, default=10, help="Number of FL rounds (default: 10)")
    parser.add_argument("--policy", "-p", type=str, default="battery_aware",
                        choices=["random", "fastest", "myopic", "battery_aware"],
                        help="Client selection policy to evaluate")
    parser.add_argument("--seed", "-s", type=int, default=42, help="Random seed (default: 42)")

    args = parser.parse_args()

    print(f"Generating instance: K={args.clients}, G={args.groups}, R={args.rounds}, seed={args.seed}")
    inst = generate(K=args.clients, G=args.groups, R=args.rounds, seed=args.seed)

    print(f"Running simulation with policy: '{args.policy}'")
    X, metrics = simulate(inst, policy=args.policy, seed=args.seed)

    feasible, obj, msgs = check(inst, X)
    print("\n--- Simulation Results ---")
    print(f"Feasibility: {'PASSED' if feasible else 'FAILED'}")
    print(f"Objective Coverage: {obj:.2f} (Coverage: {metrics.get('cov_pct', 0.0):.1f}%)")
    print(f"Exhausted Clients: {metrics.get('exhausted_clients', 'N/A')}")
    print(f"Jain Fairness Index: {metrics.get('jain', 0.0):.4f}")

    if not feasible:
        print(f"Checker issues: {msgs}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
