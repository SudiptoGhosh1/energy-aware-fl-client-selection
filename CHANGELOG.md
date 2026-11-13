# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-11-13

### Added
- Standard Python packaging with `pyproject.toml` supporting editable installation via `pip`.
- Interactive command-line interface (`flsel`) with `run` and `compare` subcommands.
- Comprehensive test suite in `tests/` covering instances, greedy approximations, policies, and checkers.
- Interactive tutorial notebook in `notebooks/quickstart_tutorial.ipynb`.
- MIT License file (`LICENSE`) and academic citation metadata (`CITATION.cff`).
- Contributor and author attribution for Khagesh Ranjan and Sudipto Ghosh across the codebase, README, and documentation.
- Type marker `flsel/py.typed` supporting PEP 561.

### Changed
- Refactored `flsel/__init__.py` to expose package version and metadata cleanly.
- Updated `README.md` with structured Quickstart guide, comparison tables, and citation block.

## [0.1.0] - 2026-11-01

### Added
- Initial implementation of the `flsel` package.
- Single-round and multi-round ILP solvers powered by HiGHS via `scipy.optimize.milp`.
- Budgeted maximum coverage greedy algorithms (Plain, Ratio, Modified, Partial Enumeration).
- Simulation suite reproducing experiments E0 through E7.
- Baseline policies: Random, Fastest-first, Myopic Greedy, Battery-aware Greedy, Rolling-horizon ILP.
