"""E2: small multi-round instances - heuristics vs exact multi-round ILP (+ LP bound, strengthening)."""
import time, sys
import numpy as np, pandas as pd
from flsel.instance import generate
from flsel.ilp import multi_round_ilp
from flsel.policies import simulate
from flsel.checker import check

CONFIGS = [dict(K=15, G=12, R=5, m=4), dict(K=20, G=15, R=8, m=5), dict(K=30, G=15, R=10, m=5)]
GAMMA = 1.5

def main(n_seeds=8, tl=30.0):
    rows = []
    for ci, cfg in enumerate(CONFIGS):
        for s in range(n_seeds):
            inst = generate(seed=200 + s, **cfg)
            t0 = time.time(); r = multi_round_ilp(inst, time_limit=tl); t_ilp = time.time() - t0
            ok, val, msgs = check(inst, r["X"]); assert ok, msgs
            t0 = time.time(); r0 = multi_round_ilp(inst, time_limit=tl, strengthen=False); t_plain = time.time() - t0
            lp = multi_round_ilp(inst, lp=True)
            ub = r["bound"] if r["bound"] is not None else r["obj"]
            row = dict(cfg=ci, K=cfg["K"], R=cfg["R"], seed=s, ilp=r["obj"], ilp_bound=ub,
                       ilp_status=r["status"], ilp_time=t_ilp, plain_time=t_plain,
                       plain_obj=r0["obj"], lp_bound=-(-lp["obj"]) if lp["obj"] is not None else np.nan)
            for name, kw in [("random", {}), ("fastest", {}), ("myopic", {}),
                             ("battery_aware", {"gamma": GAMMA}),
                             ("rolling_ilp", {"W": 3, "time_limit": 10.0})]:
                t0 = time.time(); X, m = simulate(inst, name, seed=s, **kw)
                row[name] = m["total"]; row[name + "_time"] = time.time() - t0
            rows.append(row)
            print(ci, s, round(r["obj"]), r["status"], round(t_ilp, 1), round(t_plain, 1),
                  {k: round(row[k]) for k in ["random", "fastest", "myopic", "battery_aware", "rolling_ilp"]}, flush=True)
    df = pd.DataFrame(rows); df.to_csv("results/e2_small.csv", index=False)
    for a in ["random", "fastest", "myopic", "battery_aware", "rolling_ilp"]:
        df["gap_" + a] = 100 * (df.ilp - df[a]) / df.ilp
    print(df.groupby("K")[[c for c in df.columns if c.startswith("gap_")]].mean().round(2))
    print(df.groupby("K")[["ilp_time", "plain_time"]].mean().round(2))
    print((df.ilp_status == 0).groupby(df.K).mean())

if __name__ == "__main__":
    main()
