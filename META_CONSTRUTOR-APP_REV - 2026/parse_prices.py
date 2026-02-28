import json

target_ids = {
    'price_1Spd6ICHfNdO9jxNRYj10lkA': 'basic_monthly',
    'price_1SpdABCHfNdO9jxNzVu49NDP': 'basic_yearly',
    'price_1Spd7HCHfNdO9jxN3PKJJdyv': 'professional_monthly',
    'price_1Spd9UCHfNdO9jxNMXy1MQs4': 'professional_yearly',
    'price_1Spd7xCHfNdO9jxNiUbb0PKG': 'master_monthly',
    'price_1Spd8ZCHfNdO9jxNIcxjZJBm': 'master_yearly'
}

try:
    with open('prices.json', 'r', encoding='utf-16') as f:
        data = json.load(f)
except Exception:
    with open('prices.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

prices = {}
for item in data['data']:
    if item['id'] in target_ids:
        prices[item['id']] = item['unit_amount']

print("-- Generated SQL Update")
print("UPDATE plans SET monthly_price_cents = CASE")
print(f"  WHEN stripe_price_id_monthly = 'price_1Spd6ICHfNdO9jxNRYj10lkA' THEN {prices.get('price_1Spd6ICHfNdO9jxNRYj10lkA', 'NULL')}")
print(f"  WHEN stripe_price_id_monthly = 'price_1Spd7HCHfNdO9jxN3PKJJdyv' THEN {prices.get('price_1Spd7HCHfNdO9jxN3PKJJdyv', 'NULL')}")
print(f"  WHEN stripe_price_id_monthly = 'price_1Spd7xCHfNdO9jxNiUbb0PKG' THEN {prices.get('price_1Spd7xCHfNdO9jxNiUbb0PKG', 'NULL')}")
print("  ELSE monthly_price_cents END,")
print("yearly_price_cents = CASE")
print(f"  WHEN stripe_price_id_yearly = 'price_1SpdABCHfNdO9jxNzVu49NDP' THEN {prices.get('price_1SpdABCHfNdO9jxNzVu49NDP', 'NULL')}")
print(f"  WHEN stripe_price_id_yearly = 'price_1Spd9UCHfNdO9jxNMXy1MQs4' THEN {prices.get('price_1Spd9UCHfNdO9jxNMXy1MQs4', 'NULL')}")
print(f"  WHEN stripe_price_id_yearly = 'price_1Spd8ZCHfNdO9jxNIcxjZJBm' THEN {prices.get('price_1Spd8ZCHfNdO9jxNIcxjZJBm', 'NULL')}")
print("  ELSE yearly_price_cents END;")
