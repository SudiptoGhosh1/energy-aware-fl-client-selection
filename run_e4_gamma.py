"""E4: tuning gamma and sensitivity to energy scarcity."""
import numpy as np, pandas as pd
from flsel.instance import generate
from flsel.policies import simulate

GAMMAS = [0, 0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8]

def main(n_seeds=30):
    rows = []
    for cfg_name, cfg in [("K60_G30_R20", dict(K=60, G=30, R=20, m=10)),
                          ("K40_G12_R15", dict(K=40, G=12, R=15, m=5))]:
        for s in range(n_seeds):
            inst = generate(seed=400 + s, **cfg)
            for g in GAMMAS:
                _, m = simulate(inst, "battery_aware", gamma=g)
                rows.append(dict(cfg=cfg_name, seed=s, gamma=g, **m))
    pd.DataFrame(rows).to_csv("results/e4_gamma.csv", index=False)
    print(pd.DataFrame(rows).groupby(["cfg", "gamma"])[["cov_pct", "jain", "exhausted_clients", "full_rounds", "overflow"]].mean().round(3))

    rows = []
    for scale in [0.25, 0.5, 1, 2, 4]:
        for s in range(n_seeds):
            inst = generate(K=60, G=30, R=20, m=10, seed=500 + s, recharge=(0.05 * scale, 0.30 * scale))
            for name, kw in [("random", {}), ("myopic", {}), ("battery_aware", {"gamma": 1.5})]:
                _, m = simulate(inst, name, seed=s, **kw)
                rows.append(dict(scale=scale, seed=s, alg=name, **m))
    df = pd.DataFrame(rows); df.to_csv("results/e4_scarcity.csv", index=False)
    print(df.groupby(["scale", "alg"])[["cov_pct", "jain", "exhausted_clients"]].mean().round(2))

if __name__ == "__main__":
    main()
