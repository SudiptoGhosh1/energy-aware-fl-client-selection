"""E6: fairness variant (i): minimum participation fraction varrho, solved exactly."""
import numpy as np, pandas as pd
from flsel.instance import generate
from flsel.ilp import multi_round_ilp
from flsel.checker import check

def main(n_seeds=8):
    rows = []
    for s in range(n_seeds):
        inst = generate(K=20, G=15, R=10, m=6, seed=600 + s, recharge=(0.2, 0.6))
        base = None
        for rr in [0.0, 0.1, 0.2, 0.3, 0.4, 0.5]:
            r = multi_round_ilp(inst, fairness_rho=rr, time_limit=20)
            if r["X"] is None:
                rows.append(dict(seed=s, varrho=rr, feasible=0, obj=np.nan, loss_pct=np.nan)); continue
            ok, v, msgs = check(inst, r["X"], fairness_rho=rr); assert ok, msgs
            if base is None: base = v
            rows.append(dict(seed=s, varrho=rr, feasible=1, obj=v, loss_pct=100 * (base - v) / base))
    df = pd.DataFrame(rows); df.to_csv("results/e6_fairness.csv", index=False)
    print(df.groupby("varrho").agg(feasible=("feasible", "mean"), obj=("obj", "mean"), loss=("loss_pct", "mean")).round(2))

if __name__ == "__main__":
    main()
