"""E3: larger instances (no exact multi-round optimum) - compare with the battery-free upper bound.
UB = sum over rounds of the single-round ILP optimum that ignores batteries (valid relaxation)."""
import time, sys
import numpy as np, pandas as pd
from flsel.instance import generate
from flsel.ilp import single_round_ilp
from flsel.policies import simulate

GAMMA = 1.5

def upper_bound(inst):
    ub = 0.0
    for t in range(inst.R):
        _, v, _ = single_round_ilp(inst, budget=inst.E[t], time_limit=10)
        ub += v
    return ub

def main(n_seeds=15, n_roll=5):
    rows = []
    for cfg_name, cfg in [("K100_G30_R30", dict(K=100, G=30, R=30, m=10)),
                          ("K60_G12_R20", dict(K=60, G=12, R=20, m=5))]:
        for s in range(n_seeds):
            inst = generate(seed=300 + s, **cfg)
            ub = upper_bound(inst)
            row = dict(cfg=cfg_name, seed=s, ub=ub)
            algos = [("random", {}), ("fastest", {}), ("myopic", {}),
                     ("battery_aware", {"gamma": GAMMA})]
            if s < n_roll:
                algos.append(("rolling_ilp", {"W": 3, "time_limit": 3.0}))
            for name, kw in algos:
                t0 = time.time(); X, m = simulate(inst, name, seed=s, **kw); dt = time.time() - t0
                for k, v in m.items():
                    row[f"{name}__{k}"] = v
                row[f"{name}__time"] = dt
            rows.append(row)
            print(cfg_name, s, round(ub), {a: round(row[a + "__total"]) for a, _ in algos}, flush=True)
    pd.DataFrame(rows).to_csv("results/e3_large.csv", index=False)

    # runtime scaling of the heuristics
    sc = []
    for K in [50, 100, 200, 400, 800]:
        inst = generate(K=K, G=40, R=30, m=12, seed=7)
        for name, kw in [("myopic", {}), ("battery_aware", {"gamma": GAMMA})]:
            t0 = time.time(); simulate(inst, name, **kw); sc.append(dict(K=K, alg=name, sec=time.time() - t0))
    pd.DataFrame(sc).to_csv("results/e3_scaling.csv", index=False)
    print(pd.DataFrame(sc))

if __name__ == "__main__":
    main()
