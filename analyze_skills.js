
const https = require('https');
const fs = require('fs');

const API_KEY = "p6VrEhm2v0t6DqvwyLYbJ3yTMatfYFbD";
const BASE_URL = "https://api.neople.co.kr/df";
const SERVER_ID = "cain";
const CHAR_NAME = "3기암환자";

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    try {
        const encodedName = encodeURIComponent(CHAR_NAME);
        const charUrl = `${BASE_URL}/servers/${SERVER_ID}/characters?characterName=${encodedName}&apikey=${API_KEY}`;

        console.log(`Fetching character ID for ${CHAR_NAME}...`);
        const charData = await fetchJson(charUrl);

        if (!charData.rows || charData.rows.length === 0) {
            console.log("Character not found");
            return;
        }

        const charId = charData.rows[0].characterId;
        console.log(`Character ID: ${charId}`);

        const skillUrl = `${BASE_URL}/servers/${SERVER_ID}/characters/${charId}/skill/style?apikey=${API_KEY}`;
        console.log("Fetching skills...");
        const skillData = await fetchJson(skillUrl);

        fs.writeFileSync('skills_dump.json', JSON.stringify(skillData, null, 2));
        console.log("Saved skills_dump.json");

        // Search
        let found = false;
        function search(node) {
            if (!node) return;
            if (Array.isArray(node)) {
                node.forEach(search);
            } else if (typeof node === 'object') {
                if (node.name && node.name.includes('라이트닝')) {
                    console.log(`FOUND: ${node.name} (ID: ${node.skillId}, Level: ${node.level})`);
                    found = true;
                }
                Object.values(node).forEach(search);
            }
        }

        search(skillData);

        if (!found) {
            console.log("NOT FOUND: '라이트닝' not found in skill data.");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
