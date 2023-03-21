const https = require('https');

async function openaiApiRequest(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input');
  }

  const data = JSON.stringify({
    model: 'text-davinci-003',
    prompt: input,
    temperature: 0.7,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  });

  const options = {
    hostname: 'api.openai.com',
    path: '/v1/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + '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' // replace with your API key
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const responseJson = JSON.parse(data);
          if (responseJson.choices && responseJson.choices.length > 0) {
            resolve(responseJson.choices[0].text);
          } else {
            reject(new Error('No response from OpenAI API'));
          }
        } catch (error) {
          reject(new Error('Failed to parse response from OpenAI API'));
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

module.exports = { openaiApiRequest };