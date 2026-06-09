#!/usr/bin/env python3
"""Wrapper that executes the sender script and captures output."""
import subprocess
import sys
import os

script = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\_send_dia1_full.py"
out_file = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\_send_output.txt"

python = sys.executable

try:
    result = subprocess.run(
        [python, script],
        capture_output=True,
        text=True,
        timeout=600,
        cwd=r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
    )
    # Write full output
    with open(out_file, "a", encoding="utf-8") as f:
        f.write("\n=== SUBPROCESS STDOUT ===\n")
        f.write(result.stdout)
        if result.stderr:
            f.write("\n=== SUBPROCESS STDERR ===\n")
            f.write(result.stderr)
        f.write(f"\n=== RETURN CODE: {result.returncode} ===\n")

    print(f"Script executed. Return code: {result.returncode}")
    print(f"stdout: {len(result.stdout)} chars, stderr: {len(result.stderr)} chars")
except Exception as e:
    with open(out_file, "a", encoding="utf-8") as f:
        f.write(f"\n=== EXECUTION ERROR: {e} ===\n")
    print(f"Execution error: {e}")
