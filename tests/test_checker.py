import unittest
import numpy as np
from flsel.instance import generate
from flsel.checker import check


class TestChecker(unittest.TestCase):
    def test_checker_valid_solution(self):
        inst = generate(K=15, G=8, R=3, seed=1)
        X = np.zeros((inst.K, inst.R), dtype=int)
        ok, obj, msgs = check(inst, X)
        self.assertTrue(ok)
        self.assertEqual(obj, 0.0)
        self.assertEqual(len(msgs), 0)

    def test_checker_detects_cardinality_violation(self):
        inst = generate(K=15, G=8, R=2, m=2, seed=1)
        X = np.zeros((inst.K, inst.R), dtype=int)
        X[:4, 0] = 1
        ok, obj, msgs = check(inst, X)
        self.assertFalse(ok)
        self.assertTrue(any("clients" in m for m in msgs))

    def test_checker_detects_budget_violation(self):
        inst = generate(K=15, G=8, R=2, seed=1)
        X = np.zeros((inst.K, inst.R), dtype=int)
        inst.E[0] = 0.01
        eligible_idx = np.where(inst.elig)[0][0]
        X[eligible_idx, 0] = 1
        ok, obj, msgs = check(inst, X)
        self.assertFalse(ok)
        self.assertTrue(any("energy budget" in m for m in msgs))
