"""Try to execute Python via subprocess with shell=True"""
import subprocess, os

os.chdir(r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026")

# Try different approaches
for cmd in [
    [sys.executable, "-c", "print('hello from python')"],
    ["python", "-c", "print('hello from python')"],
    ["python3", "-c", "print('hello from python3')"],
]:
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        print(f"CMD: {cmd[0]} -> RC={result.returncode}, out={result.stdout.strip()}, err={result.stderr[:100]}")
    except FileNotFoundError:
        print(f"CMD: {cmd[0]} -> NOT FOUND")
    except Exception as e:
        print(f"CMD: {cmd[0]} -> ERROR: {e}")
