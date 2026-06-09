with open('.env', 'r') as f:
    for line in f:
        line = line.strip()
        if line.startswith('RESEND_API_KEY='):
            parts = line.split('=', 1)
            val = parts[1].strip().strip('"').strip("'")
            print(f"LEN:{len(val)}")
            print(f"START:{val[:6]}")
            print(f"END:{val[-6:]}")
            break
