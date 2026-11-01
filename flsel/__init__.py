"""Energy-aware client selection in federated learning (PS-7).
Package layout:
  instance.py  - synthetic instance generator
  checker.py   - independent feasibility checker + objective recomputation
  greedy.py    - single-round budgeted max-coverage algorithms
  ilp.py       - single-round and multi-round ILPs (HiGHS through scipy)
  policies.py  - multi-round selection policies + simulator + metrics
  fedavg.py    - optional FL (FedAvg) link on a non-IID digits split
"""
