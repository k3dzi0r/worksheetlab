const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'dl.dafont.com',
  port: 443,
  path: '/dl/?f=elementarz',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  }
};

const req = https.request(options, (res) => {
  if (res.statusCode === 301 || res.statusCode === 302) {
    console.log('Redirect to:', res.headers.location);
  }
  const file = fs.createWriteStream('elementarz.zip');
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Download completed.');
  });
});

req.on('error', (e) => {
  console.error(e);
});
req.end();
