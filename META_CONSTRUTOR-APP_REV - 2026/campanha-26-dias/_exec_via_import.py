import sys

# Try to run the send script by importing it
sys.path.insert(0, r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026")

# Import the module which will execute its code
import importlib.util
spec = importlib.util.spec_from_file_location("send_dia01", r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\campanha-26-dias\dia01_send.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
