import subprocess, sys, os

script = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\_send_dia1_batch_150_199.py"
out_file = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\_send_output.txt"

os.chdir(r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026")

# Check what python we're running
print(f"sys.executable: {sys.executable}")

try:
    result = subprocess.run([sys.executable, script], capture_output=True, text=True, timeout=300)
    with open(out_file, "w", encoding="utf-8") as f:
        f.write("STDOUT:\n")
        f.write(result.stdout)
        f.write("\n\nSTDERR:\n")
        f.write(result.stderr)
        f.write(f"\n\nReturn code: {result.returncode}")
    print(f"Done. stdout len={len(result.stdout)}, stderr len={len(result.stderr)}")
except Exception as e:
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(f"ERROR: {e}")
    print(f"Error: {e}")
