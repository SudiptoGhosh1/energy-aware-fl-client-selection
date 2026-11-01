"""Collect every number quoted in the paper/guide into results/numbers.json."""
import json, numpy as np, pandas as pd
from scipy.stats import wilcoxon
N = {}
ALG = ["random", "fastest", "myopic", "battery_aware", "rolling_ilp"]
a, b = open("results/e0_reduction.txt").read().split(); N["e0"] = dict(agree=int(a), total=int(b))
N["e1_val"] = json.load(open("results/e1_validation.json"))
d1 = pd.read_csv("results/e1_single_round.csv")
cols = ["plain_greedy(NWF)", "ratio_greedy", "modified_greedy", "partial_enum3"]
N["e1"] = {s: {c: dict(mean=float(g[c].mean()), min=float(g[c].min()), time_ms=float(1000 * g[c + "_time"].mean())) for c in cols}
           for s, g in d1.groupby("setting")}
N["e1_lp"] = dict(mean=float((d1.lp / d1.opt).mean()), max=float((d1.lp / d1.opt).max()), n=int(len(d1) // 2))
d2 = pd.read_csv("results/e2_small.csv")
N["e2"] = {}
for K, g in d2.groupby("K"):
    gaps = {x: dict(mean=float((100 * (g.ilp - g[x]) / g.ilp).mean()), max=float((100 * (g.ilp - g[x]) / g.ilp).max())) for x in ALG}
    N["e2"][int(K)] = dict(R=int(g.R.iloc[0]), gaps=gaps, optimal=int((g.ilp_status == 0).sum()), n=int(len(g)),
        max_bound_gap=float((100 * (g.ilp_bound - g.ilp) / g.ilp).max()), lp_gap=float((100 * (g.lp_bound - g.ilp) / g.ilp).mean()),
        t_strong=float(g.ilp_time.mean()), t_plain=float(g.plain_time.mean()), t_roll=float(g.rolling_ilp_time.mean()),
        t_myopic=float(g.myopic_time.mean()))
x = [100 * (d2.ilp - d2.myopic) / d2.ilp, 100 * (d2.ilp - d2.battery_aware) / d2.ilp]
N["e2_ba_vs_myopic_p"] = float(wilcoxon(x[0], x[1]).pvalue)
T = json.load(open("results/tables.json"))["e3"]; N["e3"] = T
d3 = pd.read_csv("results/e3_large.csv"); N["e3_paired"] = {}
for c, s in d3.groupby("cfg"):
    diff = 100 * (s.battery_aware__total - s.myopic__total) / s.myopic__total
    s5 = s[s.seed < 5]
    N["e3_paired"][c] = dict(mean_gain=float(diff.mean()), p=float(wilcoxon(s.battery_aware__total, s.myopic__total).pvalue),
        wins=int((s.battery_aware__total > s.myopic__total).sum()), ties=int((s.battery_aware__total == s.myopic__total).sum()), n=int(len(s)),
        first5={x_: float((100 * s5[x_ + "__total"] / s5.ub).mean()) for x_ in ALG})
sc = pd.read_csv("results/e3_scaling.csv"); N["scaling"] = {f"{r.alg}_{r.K}": float(r.sec) for r in sc.itertuples()}
g = pd.read_csv("results/e4_gamma.csv"); N["e4"] = {}
for c, s in g.groupby("cfg"):
    m = s.groupby("gamma")[["cov_pct", "jain", "exhausted_clients", "full_rounds"]].mean()
    N["e4"][c] = {str(k): {kk: float(vv) for kk, vv in r.items()} for k, r in m.iterrows()}
    a0 = s[s.gamma == 0].sort_values("seed").cov_pct.values; a1 = s[s.gamma == 1.5].sort_values("seed").cov_pct.values
    N["e4"][c]["p_1.5_vs_0"] = float(wilcoxon(a1, a0).pvalue)
sc4 = pd.read_csv("results/e4_scarcity.csv"); N["e4_scarcity"] = {}
for (s_, a_), gg in sc4.groupby(["scale", "alg"]):
    N["e4_scarcity"][f"{s_}_{a_}"] = dict(cov=float(gg.cov_pct.mean()), exh=float(gg.exhausted_clients.mean()), jain=float(gg.jain.mean()))
N["e5"] = pd.read_csv("results/e5_adversarial.csv").round(4).to_dict("records")
f = pd.read_csv("results/e6_fairness.csv")
N["e6"] = {str(k): dict(feas=int(g_.feasible.sum()), n=int(len(g_)), obj=float(g_.obj.mean()) if g_.obj.notna().any() else None,
           loss=float(g_.loss_pct.mean()) if g_.loss_pct.notna().any() else None) for k, g_ in f.groupby("varrho")}
d7 = pd.read_csv("results/e7_fedavg.csv"); N["e7"] = json.load(open("results/e7_corr.json"))
N["e7_alg"] = {k: dict(cov=float(g_.cov_pct.mean()), acc=float(100 * g_.final_acc.mean())) for k, g_ in d7.groupby("alg")}
N["e7_m"] = {int(k): dict(cov=float(g_.cov_pct.mean()), acc=float(100 * g_.final_acc.mean())) for k, g_ in d7.groupby("m")}
N["e7_within"] = {k: float(np.corrcoef(g_.cov_pct, g_.final_acc)[0, 1]) for k, g_ in d7.groupby("alg")}
json.dump(N, open("results/numbers.json", "w"), indent=1)
print(json.dumps({k: N[k] for k in ["e0", "e2", "e4_scarcity"]}, indent=1)[:2500])
