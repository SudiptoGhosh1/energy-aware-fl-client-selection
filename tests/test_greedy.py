import unittest
import numpy as np
from flsel.greedy import (
    ratio_greedy,
    modified_greedy,
    partial_enum_greedy,
    coverage_value
)


class TestGreedy(unittest.TestCase):
    def test_coverage_value(self):
        h = np.array([
            [1, 0, 1],
            [0, 1, 0]
        ])
        w = np.array([2.0, 3.0, 5.0])
        self.assertEqual(coverage_value(h, w, []), 0.0)
        self.assertEqual(coverage_value(h, w, [0]), 7.0)
        self.assertEqual(coverage_value(h, w, [1]), 3.0)
        self.assertEqual(coverage_value(h, w, [0, 1]), 10.0)

    def test_modified_greedy_knapsack(self):
        h = np.array([
            [1, 1, 0],
            [0, 0, 1],
            [1, 0, 1]
        ])
        w = np.array([10.0, 10.0, 10.0])
        cost = np.array([5.0, 2.0, 5.0])
        e = cost.copy()
        budget = 5.0
        m = 2
        cand = [0, 1, 2]

        sel = modified_greedy(h, w, cost, e, budget, m, cand)
        self.assertLessEqual(len(sel), m)
        self.assertLessEqual(e[sel].sum(), budget + 1e-9)
        self.assertGreaterEqual(coverage_value(h, w, sel), 20.0)

    def test_partial_enum_greedy(self):
        h = np.eye(4, dtype=int)
        w = np.array([1.0, 2.0, 3.0, 4.0])
        cost = np.ones(4)
        e = np.ones(4)
        budget = 2.0
        m = 2
        cand = [0, 1, 2, 3]

        sel = partial_enum_greedy(h, w, cost, e, budget, m, cand, size=2)
        self.assertEqual(set(sel), {2, 3})
        self.assertEqual(coverage_value(h, w, sel), 7.0)
