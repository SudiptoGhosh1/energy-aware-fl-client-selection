"""Multi-round selection policies, simulator and metrics."""
import numpy as np
from .greedy import modified_greedy, partial_enum_greedy, coverage_value, ratio_greedy
from .ilp import multi_round_ilp
from .checker import check


# ----------------------------------------------------------------- policies
def _fill(inst, order, avail, budget):
    """Take clients in the given order while the energy budget / cardinality allow."""
    sel, spent = [], 0.0
    for k in order:
        if len(sel) >= inst.m:
            break
        if avail[k] and spent + inst.e[k] <= budget + 1e-9:
            sel.append(int(k)); spent += inst.e[k]
    return sel


def random_policy(inst, t, b, avail, rng, **kw):
    order = rng.permutation(inst.K)
    return _fill(inst, order, avail, inst.E[t])


def fastest_first(inst, t, b, avail, rng, **kw):
    return _fill(inst, np.argsort(inst.tau, kind="stable"), avail, inst.E[t])


def myopic_greedy(inst, t, b, avail, rng, enum=0, **kw):
    """Round-wise greedy (best of ratio greedy / best single); price = true energy."""
    cand = np.where(avail)[0]
    if enum:
        return partial_enum_greedy(inst.h, inst.w, inst.e, inst.e, inst.E[t], inst.m, cand, size=enum)
    return modified_greedy(inst.h, inst.w, inst.e, inst.e, inst.E[t], inst.m, cand)


def battery_aware_greedy(inst, t, b, avail, rng, gamma=1.0, enum=0, **kw):
    """Round-wise greedy with battery-aware price  e_k * (1 + gamma * depletion_k),
    depletion_k = 1 - b_kt / bmax_k  (0: full battery, 1: empty).  The *budget* still uses true e_k."""
    price = inst.e * (1.0 + gamma * (1.0 - b / inst.bmax))
    cand = np.where(avail)[0]
    if enum:
        return partial_enum_greedy(inst.h, inst.w, price, inst.e, inst.E[t], inst.m, cand, size=enum)
    return modified_greedy(inst.h, inst.w, price, inst.e, inst.E[t], inst.m, cand)


def rolling_ilp(inst, t, b, avail, rng, W=3, time_limit=10.0, **kw):
    """Receding-horizon policy: solve the multi-round ILP for rounds t..t+W-1 starting from the
    current batteries (recharge in the window assumed known), commit only round t."""
    r = multi_round_ilp(inst, t0=t, W=W, b_init=b, time_limit=time_limit, rel_gap=1e-4)
    if r["X"] is None:
        return myopic_greedy(inst, t, b, avail, rng)
    return [int(k) for k in np.where(r["X"][:, t] == 1)[0]]


POLICIES = {
    "random": random_policy,
    "fastest": fastest_first,
    "myopic": myopic_greedy,
    "battery_aware": battery_aware_greedy,
    "rolling_ilp": rolling_ilp,
}


# ---------------------------------------------------------------- simulator
def jain(x):
    x = np.asarray(x, float)
    s = (x ** 2).sum()
    return float(x.sum() ** 2 / (len(x) * s)) if s > 0 else 0.0


def simulate(inst, policy, seed=0, **kw):
    """Run a policy for R rounds, track batteries, return (X, metrics)."""
    rng = np.random.default_rng(seed)
    pol = POLICIES[policy] if isinstance(policy, str) else policy
    K, R = inst.K, inst.R
    b = inst.b0.copy()
    X = np.zeros((K, R), dtype=int)
    exhausted_rounds = np.zeros(K, int)       # rounds in which a deadline-eligible client could not afford e_k
    overflow = 0.0
    for t in range(R):
        can_afford = b >= inst.e - 1e-9
        avail = inst.elig & can_afford
        exhausted_rounds += (inst.elig & ~can_afford).astype(int)
        sel = pol(inst, t, b, avail, rng, **kw)
        X[sel, t] = 1
        nb = b - inst.e * X[:, t] + inst.rho[:, t]
        overflow += float(np.maximum(nb - inst.bmax, 0).sum())
        b = np.minimum(inst.bmax, nb)
    ok, total, msgs = check(inst, X)
    assert ok, msgs
    cov_round = np.array([coverage_value(inst.h, inst.w, np.where(X[:, t] == 1)[0]) for t in range(R)])
    full = float(np.mean(cov_round >= inst.w.sum() - 1e-9))
    part = X.sum(axis=1)[inst.elig]
    met = dict(total=total, cov_pct=100 * total / (R * inst.w.sum()),
               full_rounds=full,
               exhausted_clients=int((exhausted_rounds[inst.elig] > 0).sum()),
               exhausted_client_rounds=int(exhausted_rounds.sum()),
               jain=jain(part), overflow=overflow, min_round_cov=float(cov_round.min()))
    return X, met
