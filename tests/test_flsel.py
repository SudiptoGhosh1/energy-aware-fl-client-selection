import numpy as np
from flsel.instance import generate
from flsel.checker import check
from flsel.policies import simulate
from flsel.greedy import modified_greedy, coverage_value


def test_instance_generation():
    inst = generate(K=20, G=10, R=5, seed=123)
    assert inst.K == 20
    assert inst.G == 10
    assert inst.R == 5
    assert inst.h.shape == (20, 10)
    assert len(inst.w) == 10
    assert len(inst.e) == 20


def test_modified_greedy():
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
    assert len(sel) <= m
    val = coverage_value(h, w, sel)
    assert val == 3.0


def test_policies_and_checker():
    inst = generate(K=15, G=8, R=4, seed=42)
    for pol in ["random", "fastest", "myopic", "battery_aware"]:
        X, metrics = simulate(inst, policy=pol, seed=42)
        feasible, obj, msgs = check(inst, X)
        assert feasible, f"Policy {pol} generated infeasible solution: {msgs}"
        assert obj >= 0.0
