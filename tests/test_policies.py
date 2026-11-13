import unittest
import numpy as np
from flsel.instance import generate
from flsel.policies import simulate, POLICIES
from flsel.checker import check


class TestPolicies(unittest.TestCase):
    def test_all_policies_feasible(self):
        inst = generate(K=20, G=10, R=4, seed=10)
        for pol in ["random", "fastest", "myopic", "battery_aware"]:
            X, metrics = simulate(inst, policy=pol, seed=10)
            feasible, obj, msgs = check(inst, X)
            self.assertTrue(feasible, f"Policy {pol} failed feasibility: {msgs}")
            self.assertEqual(metrics["total"], obj)
            self.assertTrue(0.0 <= metrics["cov_pct"] <= 100.0)

    def test_battery_aware_gamma_impact(self):
        inst = generate(K=30, G=15, R=8, seed=42)
        X_g0, met_g0 = simulate(inst, policy="battery_aware", gamma=0.0, seed=42)
        X_g2, met_g2 = simulate(inst, policy="battery_aware", gamma=2.0, seed=42)

        ok0, _, _ = check(inst, X_g0)
        ok2, _, _ = check(inst, X_g2)
        self.assertTrue(ok0)
        self.assertTrue(ok2)
