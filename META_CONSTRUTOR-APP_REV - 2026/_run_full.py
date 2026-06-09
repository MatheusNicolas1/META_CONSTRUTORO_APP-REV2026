"""Run onboard_novo_lead.py --verificar and report."""
import subprocess
import sys
import os

script = os.path.join(os.path.dirname(__file__), "onboard_novo_lead.py")

# Step 1: Verify
print("=" * 60)
print("STEP 1: Verifying new leads...")
print("=" * 60)
result = subprocess.run(
    [sys.executable, script, "--verificar"],
    capture_output=True, text=True, timeout=120
)
stdout = result.stdout.strip()
stderr = result.stderr.strip()
print(stdout)
if stderr:
    print("STDERR:", stderr)
print("EXIT_CODE:", result.returncode)

# Step 2: Check if there are new leads
has_new_leads = "novo(s) lead(s) detectado(s)" in stdout.lower()

if has_new_leads:
    print("\n" + "=" * 60)
    print("STEP 2: New leads detected! Processing...")
    print("=" * 60)
    result2 = subprocess.run(
        [sys.executable, script, "--processar"],
        capture_output=True, text=True, timeout=600
    )
    print(result2.stdout)
    if result2.stderr:
        print("STDERR:", result2.stderr)
    print("EXIT_CODE:", result2.returncode)
else:
    print("\nNo new leads to process.")

print("\n" + "=" * 60)
print("FINAL REPORT")
print("=" * 60)

# Get hash summary
result3 = subprocess.run(
    [sys.executable, script, "--hash"],
    capture_output=True, text=True, timeout=30
)
print(result3.stdout)

# Get status summary
result4 = subprocess.run(
    [sys.executable, script, "--status"],
    capture_output=True, text=True, timeout=30
)
print(result4.stdout)
