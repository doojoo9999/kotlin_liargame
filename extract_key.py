
import os

try:
    with open('src/main/resources/.env', 'r', encoding='utf-8') as f:
        for line in f:
            if 'DNF' in line:
                print(line.strip())
except Exception as e:
    print(f"Error: {e}")
