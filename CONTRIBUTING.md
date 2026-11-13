# Contributing to Energy-Aware FL Client Selection

We welcome contributions, bug reports, and research extensions to this codebase!

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SudiptoGhosh1/energy-aware-fl-client-selection.git
   cd energy-aware-fl-client-selection
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install the package with development dependencies:**
   ```bash
   pip install -e ".[dev]"
   ```

## Running Tests

Run the test suite to ensure all algorithmic constraints and checkers pass:
```bash
pytest tests/
```

Or run via Python directly:
```bash
python -m unittest discover tests
```

## Adding New Selection Policies

To propose or benchmark a new selection policy:
1. Implement your policy function in `flsel/policies.py`:
   ```python
   def my_custom_policy(inst, t, b, avail, rng, **kw):
       ...
       return sel  # list of selected client indices
   ```
2. Register it in `POLICIES` dict in `flsel/policies.py`.
3. Verify that all selections pass the independent checker (`flsel/checker.py`).

## Pull Request Guidelines

- Ensure your code follows PEP 8.
- Add relevant unit tests in `tests/` for any new functionality.
- Update documentation and the changelog if adding new features.
- Open a Pull Request describing your changes and benchmarks.
