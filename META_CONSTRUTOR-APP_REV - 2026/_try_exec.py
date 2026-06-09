#!/usr/bin/env python3
"""Execute sender using subprocess - try multiple python paths."""
import subprocess
import sys
import os

script = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\_send_dia1_full.py"
out_file = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\_send_output.txt"

os.chdir(r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026")

python_paths = [
    sys.executable,
    "python",
    "python3",
    r"C:\Users\nicol\AppData\Local\Programs\Python\Python311\python.exe",
    r"C:\Python311\python.exe",
    r"C:\Users\nicol\AppData\Local\Microsoft\WindowsApps\python.exe",
]

for py in python_paths:
    if py is None:
        continue
    try:
        print(f"Trying: {py}")
        result = subprocess.run(
            [py, script],
            capture_output=True,
            text=True,
            timeout=600
        )
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(f"Python: {py}\nReturn code: {result.returncode}\n\n=== STDOUT ===\n")
            f.write(result.stdout)
            if result.stderr:
                f.write("\n=== STDERR ===\n")
                f.write(result.stderr)
        print(f"SUCCESS! rc={result.returncode}")
        # Print last few lines
        lines = result.stdout.strip().split('\n')
        for line in lines[-20:]:
            print(line)
        break
    except FileNotFoundError:
        print(f"  Not found")
    except subprocess.TimeoutExpired:
        print(f"  Timeout")
    except Exception as e:
        print(f"  Error: {e}")
else:
    print("ALL FAILED - no Python found")
    with open(out_file, "w", encoding="utf-8") as f:
        f.write("ERROR: No Python executable found to run the script")
