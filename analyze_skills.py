
import urllib.request
import urllib.parse
import json
import sys
import codecs

# Force stdout to use utf-8
sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

API_KEY = "p6VrEhm2v0t6DqvwyLYbJ3yTMatfYFbD"
BASE_URL = "https://api.neople.co.kr/df"
SERVER_ID = "cain"
CHAR_NAME = "3기암환자"

def fetch_json(url):
    try:
        with urllib.request.urlopen(url) as response:
            if response.status == 200:
                return json.loads(response.read().decode())
    except Exception as e:
        print(f"Error fetching {url}: {e}")
    return None

def fetch_char_id():
    encoded_name = urllib.parse.quote(CHAR_NAME)
    url = f"{BASE_URL}/servers/{SERVER_ID}/characters?characterName={encoded_name}&apikey={API_KEY}"
    data = fetch_json(url)
    if data and 'rows' in data and len(data['rows']) > 0:
        return data['rows'][0]['characterId']
    return None

def fetch_skills(char_id):
    url = f"{BASE_URL}/servers/{SERVER_ID}/characters/{char_id}/skill/style?apikey={API_KEY}"
    return fetch_json(url)

def main():
    char_id = fetch_char_id()
    if not char_id:
        print("Character not found")
        return

    print(f"Character ID: {char_id}")
    skills_data = fetch_skills(char_id)
    
    if not skills_data:
        print("Failed to fetch skills")
        return

    # Dump full json to file for inspection
    with open("skills_dump.json", "w", encoding="utf-8") as f:
        json.dump(skills_data, f, ensure_ascii=False, indent=2)

    # Search for Lightning Dance
    print("\nSearching for '라이트닝' in skills...")
    
    found = False
    
    def search_node(node):
        nonlocal found
        if isinstance(node, dict):
            if 'name' in node and '라이트닝' in str(node.get('name', '')):
                print(f"FOUND: {node.get('name')} (ID: {node.get('skillId')}, Level: {node.get('level')})")
                found = True
            for k, v in node.items():
                search_node(v)
        elif isinstance(node, list):
            for item in node:
                search_node(item)

    search_node(skills_data)

    if not found:
        print("NOT FOUND: '라이트닝' not found in skill data.")
    else:
        print("Check skills_dump.json for full details.")

if __name__ == "__main__":
    main()
