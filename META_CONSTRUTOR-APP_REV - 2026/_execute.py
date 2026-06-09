#!/usr/bin/env python3
"""Execute the sender script and capture output for reading."""
import subprocess
import sys
import os

out_file = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\_send_output.txt"
script = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\_send_dia1_full.py"

os.chdir(r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026")

# Try using python from PATH
for py in [sys.executable, "python3", "python", "C:\\Users\\nicol\\AppData\\Local\\Programs\\Python\\Python311\\python.exe"]:
    if py and os.path.exists(py) if py and len(py) > 3 and "\\" in py else True:
        try:
            result = subprocess.run([py, script], capture_output=True, text=True, timeout=600)
            with open(out_file, "w", encoding="utf-8") as f:
                f.write(f"Python: {py}\nReturn code: {result.returncode}\n\n")
                f.write("=== STDOUT ===\n")
                f.write(result.stdout)
                if result.stderr:
                    f.write("\n=== STDERR ===\n")
                    f.write(result.stderr)
            print(f"SUCCESS with {py}: rc={result.returncode}")
            print(result.stdout[-500:] if len(result.stdout) > 500 else result.stdout)
            break
        except Exception as e:
            print(f"Failed with {py}: {e}")
    else:
        print(f"Skipping {py}")
