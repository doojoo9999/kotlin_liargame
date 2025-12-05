const https = require('https');

const apiKey = 'p6VrEhm2v0t6DqvwyLYbJ3yTMatfYFbD';
const name = encodeURIComponent('아처');
const url = `https://api.neople.co.kr/df/servers/all/characters?characterName=${name}&apikey=${apiKey}&limit=1`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(JSON.stringify(JSON.parse(data), null, 2));
  });
}).on('error', (err) => {
  console.error("Error: " + err.message);
});
