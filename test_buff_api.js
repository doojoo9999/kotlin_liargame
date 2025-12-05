const https = require('https');

const apiKey = 'p6VrEhm2v0t6DqvwyLYbJ3yTMatfYFbD';
const name = encodeURIComponent('뮤즈');

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    console.error("Parse error for URL:", url, data);
                    resolve({});
                }
            });
        }).on('error', reject);
    });
}

async function run() {
    // 1. Search
    const searchUrl = `https://api.neople.co.kr/df/servers/all/characters?characterName=${name}&apikey=${apiKey}&limit=1`;
    console.log("Searching...");
    const searchResult = await fetchUrl(searchUrl);

    if (!searchResult.rows || searchResult.rows.length === 0) {
        console.log("No character found.");
        return;
    }

    const char = searchResult.rows[0];
    console.log(`Found: ${char.characterName} (${char.jobGrowName}) on ${char.serverId}`);

    // 2. Status
    const statusUrl = `https://api.neople.co.kr/df/servers/${char.serverId}/characters/${char.characterId}/status?apikey=${apiKey}`;
    const statusResult = await fetchUrl(statusUrl);
    console.log("\n--- Status ---");
    // Print first few buffs or stats to see if "Buff Power" is there
    if (statusResult.buff) {
        console.log("Buff Info found in Status:", JSON.stringify(statusResult.buff, null, 2));
    } else {
        console.log("No 'buff' field in Status. Checking 'status' fields...");
        console.log(JSON.stringify(statusResult.status, null, 2));
    }

    // 3. Buff Equipment
    const buffEquipUrl = `https://api.neople.co.kr/df/servers/${char.serverId}/characters/${char.characterId}/skill/buff/equip/equipment?apikey=${apiKey}`;
    const buffEquipResult = await fetchUrl(buffEquipUrl);
    console.log("\n--- Buff Equipment ---");
    console.log(JSON.stringify(buffEquipResult, null, 2));
}

run();
