"""E7 (optional ML link): does round coverage correlate with FL accuracy?
Each (policy, m, seed) gives one run; we correlate mean per-round coverage with final test accuracy."""
import numpy as np, pandas as pd
from scipy.stats import pearsonr, spearmanr
from flsel.instance import generate
from flsel.policies import simulate
from flsel.fedavg import load_data, run_fedavg


def main(n_seeds=12):
    data = load_data(0)
    rows = []
    for m in [2, 3, 4, 6]:
        for s in range(n_seeds):
            inst = generate(K=40, G=10, R=25, m=m, seed=700 + s, groups_per_client=(2, 4),
                            weights="uniform", recharge=(0.05, 0.30))
            for name, kw in [("random", {}), ("fastest", {}), ("myopic", {}), ("battery_aware", {"gamma": 1.5})]:
                X, met = simulate(inst, name, seed=s, **kw)
                acc = run_fedavg(inst, X, data, seed=s)
                rows.append(dict(m=m, seed=s, alg=name, cov_pct=met["cov_pct"], jain=met["jain"],
                                 final_acc=acc[-1], acc_r10=acc[9]))
        print("m", m, "done", flush=True)
    df = pd.DataFrame(rows); df.to_csv("results/e7_fedavg.csv", index=False)
    print(df.groupby("alg")[["cov_pct", "final_acc"]].mean().round(3))
    r, p = pearsonr(df.cov_pct, df.final_acc); rs, ps = spearmanr(df.cov_pct, df.final_acc)
    print("Pearson r=%.3f (p=%.2g)  Spearman rho=%.3f (p=%.2g)  n=%d" % (r, p, rs, ps, len(df)))
    pd.Series(dict(pearson=r, pearson_p=p, spearman=rs, spearman_p=ps, n=len(df))).to_json("results/e7_corr.json")

if __name__ == "__main__":
    main()
