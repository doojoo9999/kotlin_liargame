
const fs = require('fs');

try {
    const data = fs.readFileSync('src/main/resources/.env', 'utf8');
    const lines = data.split('\n');
    for (const line of lines) {
        if (line.includes('DNF')) {
            console.log(line);
        }
    }
} catch (err) {
    console.error(err);
}
