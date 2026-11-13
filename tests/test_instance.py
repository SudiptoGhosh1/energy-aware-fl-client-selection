import unittest
import numpy as np
from flsel.instance import generate, Instance


class TestInstance(unittest.TestCase):
    def test_generate_default(self):
        inst = generate(K=40, G=20, R=10, seed=42)
        self.assertEqual(inst.K, 40)
        self.assertEqual(inst.G, 20)
        self.assertEqual(inst.R, 10)
        self.assertEqual(inst.h.shape, (40, 20))
        self.assertEqual(len(inst.w), 20)
        self.assertEqual(len(inst.tau), 40)
        self.assertEqual(len(inst.e), 40)
        self.assertEqual(len(inst.E), 10)
        self.assertEqual(len(inst.b0), 40)
        self.assertEqual(len(inst.bmax), 40)
        self.assertEqual(inst.rho.shape, (40, 10))

    def test_deadline_eligibility(self):
        inst = generate(K=50, G=10, R=5, frac_eligible=0.6, seed=7)
        eligible_count = inst.elig.sum()
        self.assertTrue(25 <= eligible_count <= 35)

    def test_reproducibility(self):
        inst1 = generate(K=20, G=10, R=5, seed=99)
        inst2 = generate(K=20, G=10, R=5, seed=99)
        np.testing.assert_array_equal(inst1.h, inst2.h)
        np.testing.assert_allclose(inst1.b0, inst2.b0)

