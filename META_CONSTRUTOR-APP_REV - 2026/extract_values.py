import json

target_ids = {
    'price_1Spd6ICHfNdO9jxNRYj10lkA': 'Basic Monthly',
    'price_1SpdABCHfNdO9jxNzVu49NDP': 'Basic Yearly',
    'price_1Spd7HCHfNdO9jxN3PKJJdyv': 'Professional Monthly',
    'price_1Spd9UCHfNdO9jxNMXy1MQs4': 'Professional Yearly',
    'price_1Spd7xCHfNdO9jxNiUbb0PKG': 'Master Monthly',
    'price_1Spd8ZCHfNdO9jxNIcxjZJBm': 'Master Yearly'
}

try:
    with open('prices.json', 'r', encoding='utf-16') as f:
        data = json.load(f)
except Exception:
    with open('prices.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

for item in data['data']:
    if item['id'] in target_ids:
        print(f"{target_ids[item['id']]}: {item['unit_amount']}")
