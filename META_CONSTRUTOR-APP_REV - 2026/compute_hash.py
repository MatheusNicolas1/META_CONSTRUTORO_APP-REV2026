import hashlib
CONTATOS_CSV = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv"
with open(CONTATOS_CSV, "rb") as f:
    h = hashlib.sha256(f.read()).hexdigest()
print(f"Current hash: {h}")
print(f"Saved hash:   af3be25b078e24619e3939ee5a684926e4a055e83840b6acff41ed7f16ecc30b")
print(f"Match: {h == 'af3be25b078e24619e3939ee5a684926e4a055e83840b6acff41ed7f16ecc30b'}")
