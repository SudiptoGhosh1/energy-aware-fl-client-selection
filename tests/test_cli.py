import unittest
import subprocess
import sys
import json


class TestCLI(unittest.TestCase):
    def test_cli_help(self):
        res = subprocess.run([sys.executable, "-m", "flsel.cli", "--help"], capture_output=True, text=True)
        self.assertEqual(res.returncode, 0)
        self.assertIn("Energy-Aware Client Selection", res.stdout)

    def test_cli_compare(self):
        res = subprocess.run(
            [sys.executable, "-m", "flsel.cli", "compare", "-K", "15", "-G", "8", "-R", "3", "-s", "1"],
            capture_output=True,
            text=True
        )
        self.assertEqual(res.returncode, 0)
        self.assertIn("battery_aware", res.stdout)
        self.assertIn("random", res.stdout)

    def test_cli_run_json(self):
        res = subprocess.run(
            [sys.executable, "-m", "flsel.cli", "run", "-K", "15", "-G", "8", "-R", "3", "--json"],
            capture_output=True,
            text=True
        )
        self.assertEqual(res.returncode, 0)
        data = json.loads(res.stdout)
        self.assertTrue(data["feasible"])
        self.assertIn("cov_pct", data["metrics"])
