"""E0: verify the Set-Cover -> client-selection reduction on tiny random instances.
Reduction: universe element u -> group u (weight 1); set S_j -> client j holding exactly the groups in S_j;
all e_j = 1, tau_j = 0, m = k, E = k, R = 1, ample batteries.  A cover of size <= k exists  <=>
optimal coverage of the constructed instance equals |U|."""
import itertools, numpy as np
from flsel.instance import Instance
from flsel.ilp import multi_round_ilp

def min_cover(U, sets):
    for r in range(1, len(sets) + 1):
        for c in itertools.combinations(range(len(sets)), r):
            if set().union(*[sets[i] for i in c]) >= set(range(U)):
                return r
    return None

def build(U, sets, k):
    n = len(sets); h = np.zeros((n, U), int)
    for j, S in enumerate(sets):
        h[j, list(S)] = 1
    return Instance(K=n, G=U, R=1, h=h, w=np.ones(U), tau=np.zeros(n), Tmax=1.0, e=np.ones(n),
                    E=np.array([float(k)]), m=k, b0=np.full(n, 10.0), bmax=np.full(n, 10.0), rho=np.zeros((n, 1)))

def main(n_inst=100):
    rng = np.random.default_rng(1); agree = tot = 0
    for _ in range(n_inst):
        U, n = 8, 8
        sets = [set(rng.choice(U, size=rng.integers(2, 5), replace=False).tolist()) for _ in range(n)]
        if set().union(*sets) != set(range(U)):
            continue
        mc = min_cover(U, sets)
        for k in range(1, n + 1):
            val = multi_round_ilp(build(U, sets, k))["obj"]
            tot += 1; agree += (abs(val - U) < 1e-6) == (k >= mc)
    print(f"reduction check: {agree}/{tot} (instance, k) pairs agree")
    open("results/e0_reduction.txt", "w").write(f"{agree} {tot}\n")

if __name__ == "__main__":
    main()
