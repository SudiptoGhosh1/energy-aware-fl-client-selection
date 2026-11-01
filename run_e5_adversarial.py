"""E5: adversarial family for the myopic per-round greedy (and for the battery-aware price).
Clients: A covers all n groups, cost 1, battery for exactly ONE participation;
         B covers n-1 groups, cost 2, one participation;  W covers one group, cost 1, plenty of battery.
Rounds: R=2, m=1, budgets E=(2,1).  Myopic takes A in round 1 (best ratio and best coverage);
in round 2 B is unaffordable (2>1) and A is exhausted -> W.  OPT: B in round 1, A in round 2."""
import numpy as np, pandas as pd
from flsel.instance import Instance
from flsel.policies import simulate
from flsel.ilp import multi_round_ilp

def adversarial(n):
    h = np.zeros((3, n), int); h[0, :] = 1; h[1, :n - 1] = 1; h[2, 0] = 1
    e = np.array([1.0, 2.0, 1.0])
    return Instance(K=3, G=n, R=2, h=h, w=np.ones(n), tau=np.ones(3), Tmax=1.0, e=e,
                    E=np.array([2.0, 1.0]), m=1, b0=np.array([1.0, 2.0, 100.0]),
                    bmax=np.array([1.0, 2.0, 100.0]), rho=np.zeros((3, 2)))

def main():
    rows = []
    for n in [5, 10, 20, 50, 100, 1000]:
        inst = adversarial(n)
        opt = multi_round_ilp(inst)["obj"]
        row = dict(n=n, opt=opt)
        for name, kw in [("myopic", {}), ("battery_aware", {"gamma": 4.0}), ("rolling_ilp", {"W": 2})]:
            _, m = simulate(inst, name, **kw); row[name] = m["total"]
        row["ratio_myopic"] = row["myopic"] / opt; row["ratio_battery"] = row["battery_aware"] / opt
        row["ratio_rolling"] = row["rolling_ilp"] / opt
        rows.append(row)
    df = pd.DataFrame(rows); df.to_csv("results/e5_adversarial.csv", index=False); print(df.round(4))

if __name__ == "__main__":
    main()
