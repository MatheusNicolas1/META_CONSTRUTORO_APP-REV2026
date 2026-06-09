#!/usr/bin/env python3
"""Execute sender using subprocess from the available Python."""
import subprocess
import sys
import os

os.chdir(r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026")

script = os.path.abspath("_send_dia1_full.py")
result_file = os.path.abspath("_send_output.txt")

python = sys.executable or "python"
print(f"Using Python: {python}")

proc = subprocess.Popen(
    [python, script],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    cwd=os.path.dirname(script)
)
stdout, stderr = proc.communicate(timeout=600)

# Write everything to result file for reading later
with open(result_file, "w", encoding="utf-8") as f:
    f.write(f"Return code: {proc.returncode}\n\n")
    f.write("=== STDOUT ===\n")
    f.write(stdout)
    if stderr:
        f.write("\n=== STDERR ===\n")
        f.write(stderr)

print(f"Done. Return code: {proc.returncode}")
print(f"stdout: {len(stdout)} chars, stderr: {len(stderr)} chars")
# Print first 2000 chars of stdout for immediate visibility
print("\n--- First 2000 chars of output ---")
print(stdout[:2000])
