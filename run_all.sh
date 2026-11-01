#!/bin/sh
set -e
python3 run_e0_reduction_check.py
python3 run_e1_single_round.py
python3 run_e2_multiround_small.py   # slow: exact ILP, ~10 min
python3 run_e4_gamma.py
python3 run_e5_adversarial.py
python3 run_e6_fairness.py
python3 run_e7_fedavg.py
python3 run_e3_large.py              # slow: rolling ILP, ~10 min
python3 make_figures.py
python3 make_figures_col.py
