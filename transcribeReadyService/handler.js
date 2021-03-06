const https = require('https');

exports.transcribeJobStateChanged = (event, context) => {

  let body = '';

  const options = {
    host: 'myapp.ngrok.io', // <-- replace this
    path: '/webhooks/transcription',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const req = https.request(options, (res) => {
    res.on('data', (chunk) => {
      body += chunk;
    });

    context.succeed(body);
  });

  req.write(JSON.stringify(event));
  req.end();
};
