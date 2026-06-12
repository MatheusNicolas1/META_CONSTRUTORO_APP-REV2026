#!/usr/bin/env python3
"""Upload new print images to Supabase storage and generate updated component code."""
import os
import json
import requests
import re

# ─── Config ──────────────────────────────────────────────
DOTENV = os.path.join(os.path.dirname(__file__), ".env")
PRINTS_DIR = os.path.join(os.path.dirname(__file__), "prints_layout")
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "public", "marketing")
COMPONENT_FILE = os.path.join(
    os.path.dirname(__file__), "src", "components", "SaasPrintsSection.tsx"
)

# Load .env
env_vars = {}
with open(DOTENV) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#"):
            k, _, v = line.partition("=")
            env_vars[k.strip()] = v.strip()

SUPABASE_URL = env_vars.get("VITE_SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = env_vars.get("SUPABASE_SERVICE_ROLE_KEY", "")
ANON_KEY = env_vars.get("VITE_SUPABASE_ANON_KEY", "")

BUCKET = "community_media"
PREFIX = "prints/mockup"  # folder inside bucket

# ─── Find new IMG files ──────────────────────────────────
IMG_FILES = sorted(
    f for f in os.listdir(PRINTS_DIR)
    if f.startswith("IMG_") and f.lower().endswith(".png")
)

print(f"📸 Found {len(IMG_FILES)} new print images:")
for f in IMG_FILES:
    sz = os.path.getsize(os.path.join(PRINTS_DIR, f))
    print(f"   {f} ({sz // 1024}KB)")

# ─── List existing folder contents ───────────────────────
print(f"\n🔍 Listing existing files in {BUCKET}/{PREFIX}/...")
r = requests.get(
    f"{SUPABASE_URL}/storage/v1/object/list/{BUCKET}",
    params={"prefix": PREFIX, "limit": 100},
    headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
    },
)
print(f"   status={r.status_code}")
if r.status_code == 200:
    existing = r.json()
    print(f"   Found {len(existing)} existing files under {PREFIX}/")
    existing_names = {e["name"] for e in existing}
else:
    print(f"   Response: {r.text[:300]}")
    # Try prefix without trailing slash
    r2 = requests.get(
        f"{SUPABASE_URL}/storage/v1/object/list/{BUCKET}",
        params={"prefix": PREFIX.rstrip("/"), "limit": 100},
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
        },
    )
    existing = r2.json() if r2.status_code == 200 else []
    existing_names = {e["name"] for e in existing}
    print(f"   (retry) Found {len(existing)} existing files")

# ─── Upload each image ───────────────────────────────────
uploaded = []
skipped = []

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
}

for fname in IMG_FILES:
    local_path = os.path.join(PRINTS_DIR, fname)
    storage_path = f"{PREFIX}/{fname}"

    if storage_path in existing_names:
        print(f"   ⏭️  {fname} already exists, skipping")
        skipped.append(fname)
        uploaded.append(storage_path)
        continue

    with open(local_path, "rb") as f:
        file_data = f.read()

    ct = "image/png"
    r = requests.post(
        f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{storage_path}",
        headers={
            **headers,
            "Content-Type": ct,
        },
        data=file_data,
    )

    if r.status_code in (200, 201):
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{storage_path}"
        print(f"   ✅ {fname} → {public_url}")
        uploaded.append(public_url)
    else:
        print(f"   ❌ {fname} failed: {r.status_code} {r.text[:200]}")

print(f"\n📊 Upload complete: {len(uploaded)} uploaded/available")

# ─── Also upload the existing mobile PNGs ────────────────
print(f"\n📱 Ensuring existing mobile PNGs are in Supabase...")
mobile_patterns = [
    "prd-prints-2026-06-04-25-rdo-mobile",
    "prd-prints-2026-06-04-26-obras-mobile",
    "prd-prints-2026-06-04-27-atividade-mobile",
]

for base in mobile_patterns:
    for ext in [".png", ".webp"]:
        local_fn = base + ext
        local_path = os.path.join(PUBLIC_DIR, local_fn)
        if not os.path.exists(local_path):
            continue
        storage_path = f"{PREFIX}/{local_fn}"
        if storage_path in existing_names:
            print(f"   ⏭️  {local_fn} already exists")
            continue
        with open(local_path, "rb") as f:
            file_data = f.read()
        ct = "image/webp" if ext == ".webp" else "image/png"
        r = requests.post(
            f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{storage_path}",
            headers={**headers, "Content-Type": ct},
            data=file_data,
        )
        if r.status_code in (200, 201):
            print(f"   ✅ {local_fn} uploaded")
        else:
            print(f"   ⏭️  {local_fn} exists or error: {r.status_code}")

# ─── Generate component update instructions ──────────────
print("\n" + "=" * 60)
print("NEXT STEPS: Replace the allImages array in SaasPrintsSection.tsx")
print("with images served from Supabase.")
print("=" * 60)

# Build the new allImages entries
img_entries = []
for i, fname in enumerate(IMG_FILES):
    # Derive a title from filename
    title = fname.replace("IMG_", "").replace(".png", "")
    # Map to descriptive titles based on visual content
    # We'll use the filenames that have numbers as descriptive placeholders
    labels = {
        "IMG_4502": "Obras no App",
        "IMG_4503": "Print Layout",
        "IMG_4505": "Tela Inicial",
        "IMG_4506": "Checklist",
        "IMG_4507": "RDO Digital",
        "IMG_4508": "Atividades",
        "IMG_4509": "Equipes",
        "IMG_4510": "Documentos",
        "IMG_4511": "Relatórios",
        "IMG_4512": "Dashboard",
        "IMG_4513": "Financeiro",
        "IMG_4514": "Fornecedores",
        "IMG_4515": "Equipamentos",
        "IMG_4516": "Configurações",
        "IMG_4517": "Notificações",
    }
    label = labels.get(fname.replace(".png", ""), f"Print {title}")
    url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{PREFIX}/{fname}"
    img_entries.append(
        f"  {{ src: {json.dumps(url)}, title: {json.dumps(label)} }}"
    )

print('\nNew allImages array to replace the existing one:\n')
print('const allImages: CarouselItem[] = [')
print('  // ── New prints from Supabase ──')
print(',\n'.join(img_entries))
print('];\n')
