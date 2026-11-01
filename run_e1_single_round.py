"""E1: single-round Budgeted Max Coverage - ILP validation and greedy approximation ratios."""
import sys, time, itertools, json
import numpy as np, pandas as pd
from flsel.instance import generate
from flsel.greedy import *
from flsel.ilp import single_round_ilp


def brute_force(inst, cand, budget, m):
    best = 0.0
    for r in range(0, min(m, len(cand)) + 1):
        for S in itertools.combinations(cand, r):
            if inst.e[list(S)].sum() <= budget + 1e-9:
                best = max(best, coverage_value(inst.h, inst.w, S))
    return best


def main(n_val=60, n_ratio=150):
    # (a) validate the ILP against brute force on tiny instances
    mism = 0
    for s in range(n_val):
        inst = generate(K=14, G=10, R=1, seed=1000 + s, m=4, frac_eligible=0.85)
        cand = np.where(inst.elig)[0]
        budget = 0.3 * inst.e[cand].sum()
        _, v, _ = single_round_ilp(inst, budget=budget, m=4)
        bf = brute_force(inst, cand, budget, 4)
        mism += abs(v - bf) > 1e-6
    print("ILP vs brute force mismatches:", mism, "of", n_val)

    # (b) approximation ratios of greedy variants
    rows = []
    for setting, mm in [("knapsack_only", 10**6), ("with_cardinality_m5", 5)]:
        for s in range(n_ratio):
            inst = generate(K=26, G=15, R=1, seed=5000 + s, m=5)
            cand = np.where(inst.elig)[0]
            budget = 0.25 * inst.e[cand].sum()
            m_ = min(mm, len(cand))
            sel, opt, _ = single_round_ilp(inst, budget=budget, m=m_)
            _, lpv, _ = single_round_ilp(inst, budget=budget, m=m_, lp=True)
            if opt <= 0:
                continue
            row = dict(setting=setting, seed=s, opt=opt, lp=lpv)
            algs = {
                "plain_greedy(NWF)": lambda: plain_greedy_cardinality(inst.h, inst.w, inst.e, budget, m_, cand),
                "ratio_greedy": lambda: ratio_greedy(inst.h, inst.w, inst.e, inst.e, budget, m_, cand),
                "modified_greedy": lambda: modified_greedy(inst.h, inst.w, inst.e, inst.e, budget, m_, cand),
                "partial_enum3": lambda: partial_enum_greedy(inst.h, inst.w, inst.e, inst.e, budget, m_, cand, 3),
            }
            for name, f in algs.items():
                t0 = time.time(); S = f(); dt = time.time() - t0
                assert inst.e[S].sum() <= budget + 1e-9 and len(S) <= m_
                row[name] = coverage_value(inst.h, inst.w, S) / opt
                row[name + "_time"] = dt
            rows.append(row)
    df = pd.DataFrame(rows)
    df.to_csv("results/e1_single_round.csv", index=False)
    cols = ["plain_greedy(NWF)", "ratio_greedy", "modified_greedy", "partial_enum3"]
    summ = df.groupby("setting")[cols].agg(["mean", "min"]).round(4)
    print(summ.T)
    df["lp_gap"] = df["lp"] / df["opt"]
    print("LP bound / OPT: mean %.3f max %.3f" % (df.lp_gap.mean(), df.lp_gap.max()))
    json.dump({"ilp_bf_mismatch": int(mism), "n_val": n_val}, open("results/e1_validation.json", "w"))

    # (c) tight example for ratio-greedy alone: shows why 'best single' is needed
    # item A: cost 1, covers 1 unit weight ; item B: cost L, covers L-eps (budget L): ratio greedy takes A first
    from flsel.instance import Instance
    for L in [10, 100, 1000]:
        h = np.array([[1, 0], [0, 1]]); w = np.array([1.0, L - 1.0])
        e = np.array([1.0, float(L)])
        S_ratio = ratio_greedy(h, w, e, e, float(L), 2, [0, 1])
        S_mod = modified_greedy(h, w, e, e, float(L), 2, [0, 1])
        print("tight example L=%d: ratio-greedy value %.0f, modified %.0f, OPT %.0f" %
              (L, coverage_value(h, w, S_ratio), coverage_value(h, w, S_mod), L - 1.0))

if __name__ == "__main__":
    main()
