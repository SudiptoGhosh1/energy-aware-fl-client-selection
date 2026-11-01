"""Exact models (ILP/MILP) solved with HiGHS via scipy.optimize.milp."""
import numpy as np
from scipy.optimize import milp, LinearConstraint, Bounds
from scipy.sparse import lil_matrix, csr_matrix


def single_round_ilp(inst, avail=None, budget=None, m=None, time_limit=30.0, lp=False):
    """Budgeted maximum coverage ILP for one round.
    avail: boolean mask of clients that may be used (deadline, battery); default: deadline-eligible.
    Returns (set, value, info).  lp=True returns the LP-relaxation bound."""
    K, G = inst.K, inst.G
    avail = inst.elig.copy() if avail is None else np.asarray(avail, bool)
    budget = inst.E.max() if budget is None else budget
    m = inst.m if m is None else m
    use = np.where(avail & (inst.e <= budget + 1e-9))[0]
    n = len(use)
    if n == 0:
        return [], 0.0, {"status": "empty"}
    nv = n + G                          # x_k (k in use), z_g
    c = np.concatenate([np.zeros(n), -inst.w])
    A = lil_matrix((G + 2, nv)); lo = np.full(G + 2, -np.inf); hi = np.zeros(G + 2)
    for g in range(G):                  # z_g - sum_k h_kg x_k <= 0
        A[g, n + g] = 1.0
        for j, k in enumerate(use):
            if inst.h[k, g]:
                A[g, j] = -1.0
    A[G, :n] = 1.0; hi[G] = m                   # cardinality
    A[G + 1, :n] = inst.e[use]; hi[G + 1] = budget   # energy
    integrality = np.concatenate([np.ones(n), np.zeros(G)])   # z continuous: integral at optimum
    if lp:
        integrality = np.zeros(nv)
    res = milp(c, constraints=LinearConstraint(csr_matrix(A), lo, hi),
               integrality=integrality, bounds=Bounds(0, 1),
               options={"time_limit": time_limit, "disp": False})
    if res.x is None:
        return [], 0.0, {"status": res.status}
    sel = [int(use[j]) for j in range(n) if res.x[j] > 0.5] if not lp else []
    return sel, float(-res.fun), {"status": res.status, "gap": getattr(res, "mip_gap", None)}


def multi_round_ilp(inst, t0=0, W=None, b_init=None, fairness_rho=0.0, time_limit=60.0,
                    rel_gap=1e-6, lp=False, strengthen=True):
    """Multi-round ILP of PS-7 over rounds t0..t0+W-1 (default: all rounds).

    Variables: x_kt (binary), z_gt (continuous in [0,1], integral at optimum since x binary),
    b_kt (battery at the start of round t), omega_kt >= 0 (overflow slack).
    Battery:  b_{k,t+1} = b_kt - e_k x_kt + rho_kt - omega_kt,  b_{k,t+1} <= bmax_k.
    strengthen=True applies presolve fixings (x_kt = 0 if client is deadline-ineligible or
    e_k > E_t) plus the valid cumulative inequality
        sum_{s<=t} e_k x_ks <= b_init + sum_{s<t} rho_ks    for all k,t.
    Returns dict(X (K x R, only window filled), obj, status, gap, bound, time)."""
    K, G = inst.K, inst.G
    R = inst.R if W is None else min(W, inst.R - t0)
    b_init = inst.b0 if b_init is None else b_init
    xi = lambda k, t: k * R + t
    zi = lambda g, t: K * R + g * R + t
    bi = lambda k, t: K * R + G * R + k * R + t
    wi = lambda k, t: K * R + G * R + K * R + k * (R - 1) + t   # t < R-1
    nv = K * R + G * R + K * R + K * max(R - 1, 0)
    c = np.zeros(nv)
    for g in range(G):
        for t in range(R):
            c[zi(g, t)] = -inst.w[g]
    lb = np.zeros(nv); ub = np.ones(nv)
    for k in range(K):
        for t in range(R):
            ub[bi(k, t)] = inst.bmax[k]
            if t < R - 1:
                ub[wi(k, t)] = inst.bmax[k] + inst.rho[k, t0 + t]
            ok = inst.elig[k] and inst.e[k] <= inst.E[t0 + t] + 1e-9
            if strengthen and not ok:
                ub[xi(k, t)] = 0.0
            if not inst.elig[k]:
                ub[xi(k, t)] = 0.0
        lb[bi(k, 0)] = ub[bi(k, 0)] = min(b_init[k], inst.bmax[k])
    rows, lo, hi = [], [], []
    def add(entries, l, u):
        rows.append(entries); lo.append(l); hi.append(u)
    for t in range(R):
        for g in range(G):                                   # coverage
            ent = {zi(g, t): 1.0}
            for k in np.where(inst.h[:, g])[0]:
                ent[xi(k, t)] = -1.0
            add(ent, -np.inf, 0.0)
        add({xi(k, t): 1.0 for k in range(K)}, -np.inf, inst.m)                 # clients/round
        add({xi(k, t): inst.e[k] for k in range(K)}, -np.inf, inst.E[t0 + t])   # energy budget
        for k in range(K):                                   # enough battery
            add({xi(k, t): inst.e[k], bi(k, t): -1.0}, -np.inf, 0.0)
        if t < R - 1:                                        # battery dynamics
            for k in range(K):
                add({bi(k, t + 1): 1.0, bi(k, t): -1.0, xi(k, t): inst.e[k], wi(k, t): 1.0},
                    inst.rho[k, t0 + t], inst.rho[k, t0 + t])
    if strengthen:                                           # cumulative-energy cuts
        for k in range(K):
            if not inst.elig[k]:
                continue
            for t in range(R):
                ent = {xi(k, s): inst.e[k] for s in range(t + 1)}
                add(ent, -np.inf, min(b_init[k], inst.bmax[k]) + inst.rho[k, t0:t0 + t].sum())
    need = int(np.floor(fairness_rho * (inst.R) + 1e-9))
    if need > 0 and R == inst.R:
        for k in range(K):
            if inst.elig[k]:
                add({xi(k, t): 1.0 for t in range(R)}, need, np.inf)
    A = lil_matrix((len(rows), nv))
    for r_, ent in enumerate(rows):
        for j, v in ent.items():
            A[r_, j] = v
    integrality = np.zeros(nv); integrality[:K * R] = 1
    if lp:
        integrality[:] = 0
    res = milp(c, constraints=LinearConstraint(csr_matrix(A), np.array(lo), np.array(hi)),
               integrality=integrality, bounds=Bounds(lb, ub),
               options={"time_limit": time_limit, "mip_rel_gap": rel_gap, "disp": False})
    out = {"status": res.status, "X": None, "obj": None, "gap": None, "bound": None}
    if res.x is not None:
        X = np.zeros((K, inst.R), dtype=int)
        for k in range(K):
            for t in range(R):
                X[k, t0 + t] = int(round(res.x[xi(k, t)]))
        out["X"] = X
        out["obj"] = float(-res.fun)
        out["gap"] = getattr(res, "mip_gap", None)
        db = getattr(res, "mip_dual_bound", None)
        out["bound"] = None if db is None else float(-db)
    return out
