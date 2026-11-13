"""Command-line interface for Energy-Aware Federated Learning Client Selection."""

import argparse
import json
import sys
from typing import Dict, Any

from flsel.instance import generate
from flsel.policies import simulate, POLICIES
from flsel.checker import check


def run_single(args: argparse.Namespace) -> None:
    """Run a single policy simulation."""
    if not args.json:
        print(f"Generating instance: K={args.clients}, G={args.groups}, R={args.rounds}, seed={args.seed}")
    inst = generate(K=args.clients, G=args.groups, R=args.rounds, seed=args.seed)

    if not args.json:
        print(f"Evaluating policy: '{args.policy}'...")
    extra_kw = {}
    if args.policy == "battery_aware" and hasattr(args, "gamma"):
        extra_kw["gamma"] = args.gamma

    X, metrics = simulate(inst, policy=args.policy, seed=args.seed, **extra_kw)
    feasible, obj, msgs = check(inst, X)

    if args.json:
        output: Dict[str, Any] = {
            "policy": args.policy,
            "feasible": feasible,
            "objective": obj,
            "metrics": metrics,
            "errors": msgs
        }
        print(json.dumps(output, indent=2))
        return

    print("\n" + "=" * 48)
    print(f"  SIMULATION SUMMARY: {args.policy.upper()}")
    print("=" * 48)
    print(f"  Feasibility:              {'[PASS]' if feasible else '[FAIL]'}")
    print(f"  Total Weighted Coverage:  {obj:.2f}")
    print(f"  Coverage Percentage:      {metrics.get('cov_pct', 0.0):.2f}%")
    print(f"  Exhausted Clients:        {metrics.get('exhausted_clients', 0)} / {inst.K}")
    print(f"  Jain's Fairness Index:    {metrics.get('jain', 0.0):.4f}")
    print(f"  Full-Coverage Rounds:     {metrics.get('full_rounds', 0.0) * 100:.1f}%")
    print(f"  Energy Overflow (Slack):  {metrics.get('overflow', 0.0):.2f}")
    print("=" * 48)

    if not feasible:
        print(f"\nChecker violations detected:\n  {msgs}", file=sys.stderr)
        sys.exit(1)


def run_compare(args: argparse.Namespace) -> None:
    """Compare all policies side-by-side on the same instance."""
    print(f"Benchmarking all policies on instance: K={args.clients}, G={args.groups}, R={args.rounds}, seed={args.seed}\n")
    inst = generate(K=args.clients, G=args.groups, R=args.rounds, seed=args.seed)

    policies = ["random", "fastest", "myopic", "battery_aware"]
    if args.include_ilp:
        policies.append("rolling_ilp")

    results = []
    for pol_name in policies:
        X, met = simulate(inst, policy=pol_name, seed=args.seed)
        feasible, obj, _ = check(inst, X)
        results.append({
            "Policy": pol_name,
            "Feasible": "Yes" if feasible else "No",
            "Coverage %": f"{met['cov_pct']:.2f}%",
            "Objective": f"{obj:.1f}",
            "Exhausted": f"{met['exhausted_clients']}/{inst.K}",
            "Jain Fairness": f"{met['jain']:.4f}",
            "Full Rounds": f"{met['full_rounds'] * 100:.1f}%"
        })

    # Print formatted Markdown / ASCII table
    headers = ["Policy", "Coverage %", "Objective", "Exhausted", "Jain Fairness", "Full Rounds", "Feasible"]
    col_widths = {h: max(len(h), max(len(str(r[h])) for r in results)) for h in headers}

    header_line = " | ".join(h.ljust(col_widths[h]) for h in headers)
    sep_line = "-+-".join("-" * col_widths[h] for h in headers)

    print(header_line)
    print(sep_line)
    for r in results:
        print(" | ".join(str(r[h]).ljust(col_widths[h]) for h in headers))


def main():
    parser = argparse.ArgumentParser(
        prog="flsel",
        description="Energy-Aware Client Selection in Federated Learning: CLI & Simulator"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # Command: run
    run_parser = subparsers.add_parser("run", help="Run a single policy simulation")
    run_parser.add_argument("--clients", "-K", type=int, default=40, help="Number of clients (default: 40)")
    run_parser.add_argument("--groups", "-G", type=int, default=20, help="Number of data groups (default: 20)")
    run_parser.add_argument("--rounds", "-R", type=int, default=10, help="Number of FL rounds (default: 10)")
    run_parser.add_argument("--policy", "-p", type=str, default="battery_aware",
                            choices=list(POLICIES.keys()),
                            help="Selection policy to evaluate")
    run_parser.add_argument("--gamma", "-g", type=float, default=1.0, help="Battery penalty coefficient gamma (default: 1.0)")
    run_parser.add_argument("--seed", "-s", type=int, default=42, help="Random seed (default: 42)")
    run_parser.add_argument("--json", action="store_true", help="Output results in JSON format")

    # Command: compare
    comp_parser = subparsers.add_parser("compare", help="Compare all policies side-by-side")
    comp_parser.add_argument("--clients", "-K", type=int, default=40, help="Number of clients (default: 40)")
    comp_parser.add_argument("--groups", "-G", type=int, default=20, help="Number of data groups (default: 20)")
    comp_parser.add_argument("--rounds", "-R", type=int, default=10, help="Number of FL rounds (default: 10)")
    comp_parser.add_argument("--seed", "-s", type=int, default=42, help="Random seed (default: 42)")
    comp_parser.add_argument("--include-ilp", action="store_true", help="Include rolling ILP solver (slower)")

    # Legacy fallback: when called with flags directly without subcommand
    if len(sys.argv) > 1 and sys.argv[1] not in ["run", "compare", "-h", "--help"]:
        # If user passed old style flags like "-K 20", treat as "run"
        sys.argv.insert(1, "run")

    args = parser.parse_args()

    if args.command == "run":
        run_single(args)
    elif args.command == "compare":
        run_compare(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
