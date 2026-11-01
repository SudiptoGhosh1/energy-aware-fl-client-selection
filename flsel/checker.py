"""Independent checker: recomputes feasibility, battery trajectory and objective
from scratch given only the 0/1 selection matrix X (K x R)."""
import numpy as np


def check(inst, X, fairness_rho=0.0, tol=1e-7):
    """Return (feasible, objective, messages)."""
    X = np.asarray(X).astype(int)
    msgs = []
    K, R = inst.K, inst.R
    assert X.shape == (K, R)
    b = inst.b0.astype(float).copy()
    total = 0.0
    for t in range(R):
        sel = np.where(X[:, t] == 1)[0]
        if np.any(~inst.elig[sel]):
            msgs.append(f"round {t}: deadline violated")
        if len(sel) > inst.m:
            msgs.append(f"round {t}: {len(sel)} > m clients")
        if inst.e[sel].sum() > inst.E[t] + tol:
            msgs.append(f"round {t}: energy budget exceeded")
        if np.any(inst.e[sel] > b[sel] + tol):
            msgs.append(f"round {t}: battery insufficient")
        covered = inst.h[sel].sum(axis=0) > 0 if len(sel) else np.zeros(inst.G, bool)
        total += inst.w[covered].sum()
        b = np.minimum(inst.bmax, b - inst.e * X[:, t] + inst.rho[:, t])
    need = int(np.floor(fairness_rho * R + 1e-9))
    if need > 0:
        bad = np.where(inst.elig & (X.sum(axis=1) < need))[0]
        if len(bad):
            msgs.append(f"fairness violated for {len(bad)} clients")
    return (len(msgs) == 0), total, msgs
