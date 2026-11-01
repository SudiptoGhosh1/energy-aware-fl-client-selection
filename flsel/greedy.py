"""Single-round algorithms for Budgeted Maximum Coverage with a cardinality cap.

Round problem: choose S subset of candidates with  sum e_k <= budget,  |S| <= m,
maximising f(S) = total weight of groups covered by S  (monotone submodular).
`cost` is the price used for the greedy ratio; feasibility always uses true energy e.
"""
from itertools import combinations
import numpy as np

TOL = 1e-9


def coverage_value(inst_h, w, sel, covered0=None):
    if len(sel) == 0:
        return 0.0
    return float(w[inst_h[list(sel)].sum(axis=0) > 0].sum())


def ratio_greedy(h, w, cost, e, budget, m, cand, start=()):
    """Greedy: repeatedly add the feasible client with max (marginal gain)/cost.
    `start` is an initial (feasible) set that is kept (used by partial enumeration)."""
    sel = list(start)
    covered = (h[sel].sum(axis=0) > 0) if sel else np.zeros(h.shape[1], bool)
    spent = float(e[sel].sum()) if sel else 0.0
    chosen = np.zeros(h.shape[0], bool)
    chosen[sel] = True
    cand = np.asarray(cand, dtype=int)
    while len(sel) < m:
        mask = (~chosen[cand]) & (e[cand] <= budget - spent + TOL)
        idx = cand[mask]
        if idx.size == 0:
            break
        gains = h[idx] @ (w * (~covered))
        j = int(np.argmax(gains / cost[idx]))
        if gains[j] <= TOL:
            break
        k = int(idx[j])
        sel.append(k); chosen[k] = True; spent += e[k]
        covered |= h[k].astype(bool)
    return sel


def best_single(h, w, e, budget, cand):
    best, bv = [], 0.0
    for k in cand:
        if e[k] <= budget + TOL:
            v = float(h[k] @ w)
            if v > bv:
                best, bv = [int(k)], v
    return best


def modified_greedy(h, w, cost, e, budget, m, cand):
    """Khuller-Moss-Naor 'modified greedy': better of ratio-greedy and best single item.
    Guarantee (knapsack only, m = infinity): (1/2)(1 - 1/e)."""
    if m <= 0:
        return []
    s1 = ratio_greedy(h, w, cost, e, budget, m, cand)
    s2 = best_single(h, w, e, budget, cand)
    return s1 if coverage_value(h, w, s1) >= coverage_value(h, w, s2) else s2


def partial_enum_greedy(h, w, cost, e, budget, m, cand, size=3):
    """Khuller et al. / Sviridenko partial enumeration: try every feasible start set of
    size <= `size` (exactly `size` when possible), complete by ratio greedy, return the best.
    Guarantee (knapsack only, size=3): (1 - 1/e)."""
    cand = list(map(int, cand))
    best, bv = [], -1.0
    # sets with < size elements are evaluated as they are (greedy completion also run)
    for s in range(0, min(size, m) + 1):
        for start in combinations(cand, s):
            if s and e[list(start)].sum() > budget + TOL:
                continue
            sol = ratio_greedy(h, w, cost, e, budget, m, cand, start=start)
            v = coverage_value(h, w, sol)
            if v > bv + TOL:
                best, bv = sol, v
    return best


def plain_greedy_cardinality(h, w, e, budget, m, cand):
    """Nemhauser-Wolsey-Fisher greedy: max marginal gain (ignores cost, respects budget)."""
    return ratio_greedy(h, w, np.ones_like(e), e, budget, m, cand)
