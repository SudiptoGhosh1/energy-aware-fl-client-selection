"""Create all figures (PNG, 300 dpi) and the summary tables (JSON) used in the paper."""
import json
import numpy as np, pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
plt.rcParams.update({"font.size": 8, "font.family": "serif", "axes.grid": True, "grid.alpha": .3,
                     "axes.spines.top": False, "axes.spines.right": False})
ALG = ["random", "fastest", "myopic", "battery_aware", "rolling_ilp"]
LAB = {"random": "Random", "fastest": "Fastest", "myopic": "Myopic greedy",
       "battery_aware": "Battery-aware", "rolling_ilp": "Rolling ILP (W=3)"}
COL = {"random": "#999999", "fastest": "#c9a227", "myopic": "#1f77b4", "battery_aware": "#d62728", "rolling_ilp": "#2ca02c"}
T = {}

# ---- Fig 1: E2 gap to ILP (a) and E3 % of upper bound (b)
d2 = pd.read_csv("results/e2_small.csv")
for a in ALG:
    d2["gap_" + a] = 100 * (d2.ilp - d2[a]) / d2.ilp
d3 = pd.read_csv("results/e3_large.csv")
fig, ax = plt.subplots(1, 2, figsize=(7.2, 2.7))
Ks = sorted(d2.K.unique()); wd = 0.16
for i, a in enumerate(ALG):
    m = [d2[d2.K == K]["gap_" + a].mean() for K in Ks]; s = [d2[d2.K == K]["gap_" + a].std() for K in Ks]
    ax[0].bar(np.arange(len(Ks)) + (i - 2) * wd, m, wd, yerr=s, color=COL[a], label=LAB[a], capsize=1.5, error_kw={"lw": .6})
ax[0].set_xticks(range(len(Ks))); ax[0].set_xticklabels([f"K={k}, R={d2[d2.K==k].R.iloc[0]}" for k in Ks])
ax[0].set_ylabel("gap to ILP incumbent (%)"); ax[0].set_title("(a) small instances vs exact ILP")
cfgs = list(d3.cfg.unique())
for i, a in enumerate(ALG):
    m, s = [], []
    for c in cfgs:
        sub = d3[d3.cfg == c]; col = a + "__total"
        v = (100 * sub[col] / sub.ub).dropna(); m.append(v.mean()); s.append(v.std())
    ax[1].bar(np.arange(len(cfgs)) + (i - 2) * wd, m, wd, yerr=s, color=COL[a], capsize=1.5, error_kw={"lw": .6})
ax[1].set_xticks(range(len(cfgs))); ax[1].set_xticklabels([c.replace("_", ", ") for c in cfgs])
ax[1].set_ylabel("coverage as % of battery-free UB"); ax[1].set_ylim(40, 100); ax[1].set_title("(b) large instances vs upper bound")
h_, l_ = ax[0].get_legend_handles_labels()
fig.legend(h_, l_, loc="lower center", ncol=5, fontsize=6.5, frameon=False)
plt.tight_layout(rect=(0, 0.08, 1, 1)); plt.savefig("figures/fig_compare.png", dpi=300); plt.close()

# ---- Fig 2: gamma sweep
g = pd.read_csv("results/e4_gamma.csv")
fig, ax = plt.subplots(1, 3, figsize=(7.2, 2.1))
for cfg, ls in zip(g.cfg.unique(), ["-o", "--s"]):
    s = g[g.cfg == cfg].groupby("gamma")
    for a, (col, yl) in zip(ax, [("cov_pct", "coverage (%)"), ("jain", "Jain index"), ("exhausted_clients", "# exhausted clients")]):
        mu = s[col].mean(); se = s[col].std() / np.sqrt(s[col].count())
        a.errorbar(mu.index, mu.values, yerr=se.values, fmt=ls, ms=3, lw=1, capsize=1.5, label=cfg.replace("_", " "))
        a.set_xlabel(r"$\gamma$"); a.set_ylabel(yl)
ax[0].legend(fontsize=6, frameon=False)
plt.tight_layout(); plt.savefig("figures/fig_gamma.png", dpi=300); plt.close()

# ---- Fig 3: adversarial + scarcity
d5 = pd.read_csv("results/e5_adversarial.csv"); sc = pd.read_csv("results/e4_scarcity.csv")
fig, ax = plt.subplots(1, 2, figsize=(7.2, 2.2))
ax[0].plot(d5.n, d5.ratio_myopic, "o-", color=COL["myopic"], label="Myopic greedy")
ax[0].plot(d5.n, d5.ratio_battery, "s--", color=COL["battery_aware"], label=r"Battery-aware ($\gamma=4$)")
ax[0].plot(d5.n, d5.ratio_rolling, "^-", color=COL["rolling_ilp"], label="Rolling ILP (W=2)")
ax[0].plot(d5.n, (d5.n + 1) / (2 * d5.n - 1), "k:", lw=.8, label=r"$(n+1)/(2n-1)$")
ax[0].set_xscale("log"); ax[0].set_xlabel("n (groups)"); ax[0].set_ylabel("ALG / OPT"); ax[0].set_ylim(.4, 1.05)
ax[0].set_title("(a) adversarial family"); ax[0].legend(fontsize=6, frameon=False)
for a_, c_ in [("random", COL["random"]), ("myopic", COL["myopic"]), ("battery_aware", COL["battery_aware"])]:
    s = sc[sc.alg == a_].groupby("scale")["cov_pct"]
    ax[1].errorbar(s.mean().index, s.mean().values, yerr=(s.std() / np.sqrt(s.count())).values, fmt="o-", ms=3, lw=1,
                   capsize=1.5, color=c_, label=LAB[a_])
ax[1].set_xscale("log", base=2); ax[1].set_xlabel("recharge scale (x baseline)"); ax[1].set_ylabel("coverage (%)")
ax[1].set_title("(b) sensitivity to energy scarcity"); ax[1].legend(fontsize=6, frameon=False)
plt.tight_layout(); plt.savefig("figures/fig_adv_scarcity.png", dpi=300); plt.close()

# ---- Fig 4: FL link
try:
    d7 = pd.read_csv("results/e7_fedavg.csv"); corr = json.load(open("results/e7_corr.json"))
    fig, ax = plt.subplots(figsize=(3.4, 2.4))
    for a in ["random", "fastest", "myopic", "battery_aware"]:
        s = d7[d7.alg == a]; ax.scatter(s.cov_pct, 100 * s.final_acc, s=8, color=COL[a], label=LAB[a], alpha=.7)
    z = np.polyfit(d7.cov_pct, 100 * d7.final_acc, 1); xs = np.linspace(d7.cov_pct.min(), d7.cov_pct.max(), 10)
    ax.plot(xs, np.polyval(z, xs), "k--", lw=.8)
    ax.set_xlabel("mean per-round coverage (%)"); ax.set_ylabel("final test accuracy (%)")
    ax.set_title(f"Pearson r={corr['pearson']:.2f}, Spearman={corr['spearman']:.2f}", fontsize=7)
    ax.legend(fontsize=6, frameon=False); plt.tight_layout(); plt.savefig("figures/fig_fl.png", dpi=300); plt.close()
except Exception as ex:
    print("fl fig skipped", ex)

# ---- E1 figure (distribution of ratios)
d1 = pd.read_csv("results/e1_single_round.csv")
cols = ["plain_greedy(NWF)", "ratio_greedy", "modified_greedy", "partial_enum3"]
fig, ax = plt.subplots(figsize=(3.4, 2.2))
ax.boxplot([d1[c] for c in cols], labels=["plain", "ratio", "modified", "enum-3"], widths=.5, showmeans=True)
ax.axhline(1 - 1 / np.e, color="r", lw=.8, ls="--"); ax.text(0.6, 0.64, r"$1-1/e$", color="r", fontsize=7)
ax.set_ylabel("greedy value / ILP optimum"); plt.tight_layout(); plt.savefig("figures/fig_single.png", dpi=300); plt.close()

# ---- tables
def tbl_e3():
    out = {}
    for c in cfgs:
        sub = d3[d3.cfg == c]; out[c] = {}
        for a in ALG:
            if a + "__total" not in sub or sub[a + "__total"].dropna().empty: continue
            sb = sub.dropna(subset=[a + "__total"])
            out[c][a] = {k: float(sb[f"{a}__{k}"].mean()) for k in ["cov_pct", "full_rounds", "exhausted_clients", "jain", "time"]}
            out[c][a]["pct_ub"] = float((100 * sb[a + "__total"] / sb.ub).mean()); out[c][a]["n"] = int(len(sb))
            out[c][a]["pct_ub_std"] = float((100 * sb[a + "__total"] / sb.ub).std())
    return out
T["e3"] = tbl_e3()
json.dump(T, open("results/tables.json", "w"), indent=1)
print(json.dumps(T["e3"], indent=1))
