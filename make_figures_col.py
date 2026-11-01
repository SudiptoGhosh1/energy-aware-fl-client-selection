"""Single-column (3.4in) versions of the figures for the two-column paper."""
import numpy as np, pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
plt.rcParams.update({"font.size": 7, "font.family": "serif", "axes.grid": True, "grid.alpha": .3,
                     "axes.spines.top": False, "axes.spines.right": False})
ALG = ["random", "fastest", "myopic", "battery_aware", "rolling_ilp"]
LAB = {"random": "Random", "fastest": "Fastest", "myopic": "Myopic", "battery_aware": "Battery-aware", "rolling_ilp": "Rolling ILP"}
COL = {"random": "#999999", "fastest": "#c9a227", "myopic": "#1f77b4", "battery_aware": "#d62728", "rolling_ilp": "#2ca02c"}

d2 = pd.read_csv("results/e2_small.csv"); d3 = pd.read_csv("results/e3_large.csv")
for a in ALG: d2["gap_" + a] = 100 * (d2.ilp - d2[a]) / d2.ilp
fig, ax = plt.subplots(2, 1, figsize=(3.4, 3.9)); wd = .16
Ks = sorted(d2.K.unique())
for i, a in enumerate(ALG):
    m = [d2[d2.K == K]["gap_" + a].mean() for K in Ks]; s = [d2[d2.K == K]["gap_" + a].std() for K in Ks]
    ax[0].bar(np.arange(3) + (i - 2) * wd, m, wd, yerr=s, color=COL[a], label=LAB[a], capsize=1.2, error_kw={"lw": .5})
ax[0].set_xticks(range(3)); ax[0].set_xticklabels([f"K={k}, R={d2[d2.K==k].R.iloc[0]}" for k in Ks])
ax[0].set_ylabel("gap to ILP (%)"); ax[0].set_title("(a) small instances, exact ILP reference", fontsize=7)
cfgs = list(d3.cfg.unique())
for i, a in enumerate(ALG):
    m, s = [], []
    for c in cfgs:
        sub = d3[d3.cfg == c]; v = (100 * sub[a + "__total"] / sub.ub).dropna(); m.append(v.mean()); s.append(v.std())
    ax[1].bar(np.arange(2) + (i - 2) * wd, m, wd, yerr=s, color=COL[a], capsize=1.2, error_kw={"lw": .5})
ax[1].set_xticks(range(2)); ax[1].set_xticklabels([c.replace("_", ", ") for c in cfgs])
ax[1].set_ylabel("% of battery-free UB"); ax[1].set_ylim(40, 101); ax[1].set_title("(b) large instances (Rolling ILP: 5 seeds)", fontsize=7)
h_, l_ = ax[0].get_legend_handles_labels(); fig.legend(h_, l_, loc="lower center", ncol=3, fontsize=6, frameon=False)
plt.tight_layout(rect=(0, .07, 1, 1)); plt.savefig("figures/c_compare.png", dpi=300); plt.close()

g = pd.read_csv("results/e4_gamma.csv")
fig, ax = plt.subplots(3, 1, figsize=(3.4, 4.1), sharex=True)
for cfg, ls in zip(g.cfg.unique(), ["-o", "--s"]):
    s = g[g.cfg == cfg].groupby("gamma")
    for a, (col, yl) in zip(ax, [("cov_pct", "coverage (%)"), ("jain", "Jain index"), ("exhausted_clients", "# exhausted")]):
        mu = s[col].mean(); se = s[col].std() / np.sqrt(s[col].count())
        a.errorbar(mu.index, mu.values, yerr=se.values, fmt=ls, ms=2.5, lw=.9, capsize=1.2, label=cfg.replace("_", " ")); a.set_ylabel(yl)
ax[0].legend(fontsize=6, frameon=False); ax[2].set_xlabel(r"battery price weight $\gamma$")
plt.tight_layout(); plt.savefig("figures/c_gamma.png", dpi=300); plt.close()

d5 = pd.read_csv("results/e5_adversarial.csv"); sc = pd.read_csv("results/e4_scarcity.csv")
fig, ax = plt.subplots(2, 1, figsize=(3.4, 3.7))
ax[0].plot(d5.n, d5.ratio_myopic, "o-", ms=3, color=COL["myopic"], label="Myopic")
ax[0].plot(d5.n, d5.ratio_battery, "s--", ms=3, color=COL["battery_aware"], label=r"Battery-aware ($\gamma$=4)")
ax[0].plot(d5.n, d5.ratio_rolling, "^-", ms=3, color=COL["rolling_ilp"], label="Rolling ILP (W=2)")
ax[0].set_xscale("log"); ax[0].set_xlabel("n (groups)"); ax[0].set_ylabel("ALG / OPT"); ax[0].set_ylim(.4, 1.05)
ax[0].set_title("(a) adversarial family", fontsize=7); ax[0].legend(fontsize=6, frameon=False, loc="center right")
for a_ in ["random", "myopic", "battery_aware"]:
    s = sc[sc.alg == a_].groupby("scale")["cov_pct"]
    ax[1].errorbar(s.mean().index, s.mean().values, yerr=(s.std() / np.sqrt(s.count())).values, fmt="o-", ms=3, lw=.9, capsize=1.2, color=COL[a_], label=LAB[a_])
ax[1].set_xscale("log", base=2); ax[1].set_xlabel("recharge scale (x baseline)"); ax[1].set_ylabel("coverage (%)")
ax[1].set_title("(b) sensitivity to energy scarcity", fontsize=7); ax[1].legend(fontsize=6, frameon=False)
plt.tight_layout(); plt.savefig("figures/c_adv.png", dpi=300); plt.close()
