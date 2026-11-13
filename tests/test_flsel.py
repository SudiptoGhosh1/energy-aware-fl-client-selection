import unittest
import numpy as np
from flsel.instance import generate
from flsel.checker import check
from flsel.policies import simulate
from flsel.greedy import modified_greedy, coverage_value


class TestFlselIntegration(unittest.TestCase):
    def test_instance_generation(self):
        inst = generate(K=20, G=10, R=5, seed=123)
        self.assertEqual(inst.K, 20)
        self.assertEqual(inst.G, 10)
        self.assertEqual(inst.R, 5)
        self.assertEqual(inst.h.shape, (20, 10))
        self.assertEqual(len(inst.w), 10)
        self.assertEqual(len(inst.e), 20)

    def test_modified_greedy(self):
        h = np.array([
            [1, 1, 0],
            [0, 1, 1],
            [1, 0, 1]
        ])
        w = np.array([1.0, 1.0, 1.0])
        cost = np.array([1.0, 1.0, 1.0])
        e = cost.copy()
        budget = 2.0
        m = 2
        cand = [0, 1, 2]

        sel = modified_greedy(h, w, cost, e, budget, m, cand)
        self.assertLessEqual(len(sel), m)
        val = coverage_value(h, w, sel)
        self.assertEqual(val, 3.0)

    def test_policies_and_checker(self):
        inst = generate(K=15, G=8, R=4, seed=42)
        for pol in ["random", "fastest", "myopic", "battery_aware"]:
            X, metrics = simulate(inst, policy=pol, seed=42)
            feasible, obj, msgs = check(inst, X)
            self.assertTrue(feasible, f"Policy {pol} generated infeasible solution: {msgs}")
            self.assertGreaterEqual(obj, 0.0)
