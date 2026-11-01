"""Synthetic instance generator for energy-aware client selection."""
from dataclasses import dataclass
import numpy as np


@dataclass
class Instance:
    K: int                # number of clients
    G: int                # number of data groups
    R: int                # number of rounds
    h: np.ndarray         # (K,G) 0/1, client k holds group g
    w: np.ndarray         # (G,) group weights
    tau: np.ndarray       # (K,) time per participation
    Tmax: float           # round deadline
    e: np.ndarray         # (K,) energy per participation
    E: np.ndarray         # (R,) round energy budget
    m: int                # max clients per round
    b0: np.ndarray        # (K,) initial battery
    bmax: np.ndarray      # (K,) battery capacity
    rho: np.ndarray       # (K,R) recharge in round t (after participation)
    seed: int = 0

    @property
    def elig(self):
        """Deadline-eligible clients (tau_k <= Tmax)."""
        return self.tau <= self.Tmax + 1e-12

    @property
    def Hw(self):
        return self.h * self.w[None, :]


def generate(K=40, G=20, R=10, seed=0, m=None, frac_eligible=0.7,
             groups_per_client=(2, 4), recharge=(0.05, 0.30), cap_mult=3.0,
             budget_mult=1.0, weights="random", mean_energy=10.0):
    """Generate a random instance.

    - each client holds 2-4 random groups out of G
    - tau_k log-normal, e_k proportional to tau_k (mean_energy on average)
    - Tmax = quantile so that ~frac_eligible of clients meet the deadline
    - battery capacity = cap_mult * e_k, initial battery uniform in [0.5,1]*capacity
    - recharge per round: rate r_k ~ U(recharge) times e_k, with multiplicative
      noise in [0.5,1.5]  (so a client can sustain about r_k participations/round)
    - E_t = budget_mult * m * mean(e of eligible) * U(0.8,1.2)
    """
    rng = np.random.default_rng(seed)
    h = np.zeros((K, G), dtype=int)
    for k in range(K):
        n = rng.integers(groups_per_client[0], groups_per_client[1] + 1)
        h[k, rng.choice(G, size=min(n, G), replace=False)] = 1
    w = rng.integers(1, 6, size=G).astype(float) if weights == "random" else np.ones(G)
    tau = rng.lognormal(mean=0.0, sigma=0.5, size=K)
    Tmax = float(np.quantile(tau, frac_eligible))
    e = tau / tau.mean() * mean_energy
    if m is None:
        m = max(3, G // 3)
    elig = tau <= Tmax + 1e-12
    base = m * e[elig].mean() * budget_mult
    E = base * rng.uniform(0.8, 1.2, size=R)
    bmax = cap_mult * e
    b0 = bmax * rng.uniform(0.5, 1.0, size=K)
    rate = rng.uniform(recharge[0], recharge[1], size=K)
    rho = e[:, None] * rate[:, None] * rng.uniform(0.5, 1.5, size=(K, R))
    return Instance(K, G, R, h, w, tau, Tmax, e, E, m, b0, bmax, rho, seed)
