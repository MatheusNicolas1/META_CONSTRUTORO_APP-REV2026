"""Execute the analysis script via subprocess"""
import subprocess, sys, os

script_dir = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
script = os.path.join(script_dir, "_full_analysis.py")

# Try several python commands
for cmd in [
    [sys.executable, script],
    ["python", script],
    ["python3", script],
    ["py", script],
]:
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, cwd=script_dir, timeout=30
        )
        if result.returncode == 0 and result.stdout.strip():
            print("CMD USED:", " ".join(cmd))
            print(result.stdout)
            break
        elif result.stderr:
            print(f"CMD {' '.join(cmd)} failed:", result.stderr[:200])
    except FileNotFoundError:
        print(f"CMD {' '.join(cmd)}: not found")
        continue
else:
    print("Nenhum comando python funcionou.")
    # Fallback: execute inline via import
    sys.path.insert(0, script_dir)
    import importlib.util
    spec = importlib.util.spec_from_file_location("full_analysis", script)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
