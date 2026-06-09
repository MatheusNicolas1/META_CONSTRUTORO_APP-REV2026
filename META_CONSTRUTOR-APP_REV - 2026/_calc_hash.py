"""Calculate SHA256 hash of contatos_master.csv."""
import hashlib

content = open(r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv", "rb").read()
h = hashlib.sha256(content).hexdigest()
print(f"SHA256: {h}")
print(f"First 16: {h[:16]}")
print(f"File size: {len(content)} bytes")
