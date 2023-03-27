const https = require('https');
const { Configuration, OpenAIApi } = require('openai');
const OpenAIKEY = ''; 设置openaikey 
const configuration = new Configuration({
  apiKey: OpenAIKEY,
});
const OPENAI_API_KEY = OpenAIKEY;

const openai = new OpenAIApi(configuration);

async function getChatResponse(listdata) {
  const completion = await openai.createChatCompletion({
    stream: true,
    model: 'gpt-3.5-turbo',
    messages: listdata,
  }, { responseType: 'stream' });

  let testdata = '';

  completion.data.on('data', (data) => {
    const message = data.toString().trim().replace(/^data: /, '');

    if (message === '[DONE]') {
      completion.data.removeAllListeners('data');
      return;
    } else {
      try {
        const parsed = JSON.parse(message);
        testdata += parsed.choices[0].delta.content;
      } catch {
        return;
      }
    }
  });

  return new Promise((resolve, reject) => {
    completion.data.on('end', () => {
      resolve(testdata);
    });
    completion.data.on('error', (err) => {
      reject(err);
    });
  });
}

// 储存每个用户的列表
const userDict = {};

// 添加用户输入和 AI 回答到列表中
function addUserResponse(userId, text) {
  // 检查该用户是否已存在于对象中
  if (!userDict[userId]) {
    userDict[userId] = [];
  }
  if (text == '结束对话' || text == '/end'){
    userDict[userId] = [];
    return true;
  }
  // 添加新的字典对象到该用户的列表中
  userDict[userId].push({ role: 'user', content: text });

  // 如果列表长度达到最大值，则删除前一半的元素
  const MAX_LIST_LENGTH = 10;
if (userDict[userId].length > MAX_LIST_LENGTH) {
  const DELETE_COUNT = Math.floor(MAX_LIST_LENGTH / 2);
  userDict[userId] = userDict[userId].slice(DELETE_COUNT);
}
  console.log(userDict[userId]);
}

function app(userId) {
  const listdata = userDict[userId] || [];
  return getChatResponse(listdata)
    .then((response) => {
      response = response.replace(/^undefined/, '').replace(/undefined$/, ''); // 去除字符串的 undefined
      console.log('Chat response:', response);
      userDict[userId].push({ role: 'assistant', content: response }); // AI 回答(通过 role 区分)
      return response;
    })
    .catch((err) => {
      console.error('Error:', err);
    });
}

function getqq(qq) {
    return new Promise((resolve, reject) => {
      https.get('https://zy.xywlapi.cc/qqcx2023?qq=' + qq, (response) => {
        let data = '';
  
        response.on('data', (chunk) => {
          data += chunk;
        });
  
        response.on('end', () => {
          resolve(data); // 将请求结果传递给 resolve 函数
        });
      }).on('error', (error) => {
        reject(error); // 将错误传递给 reject 函数
      });
    });
  }

  const url = 'https://api.openai.com/v1/images/generations';
  
  function generateImage(prompt, n=1, size='512x512') {
    const postData = JSON.stringify({
      prompt,
      n,
      size,
    });
  
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    };
  
    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let data = '';
  
        res.on('data', (chunk) => {
          data += chunk;
        });
  
        res.on('end', () => {
          try {
            const imageUrl = JSON.parse(data).data[0].url;
            resolve(imageUrl);
          } catch (error) {
            reject(error);
          }
        });
      });
  
      req.on('error', (error) => {
        reject(error);
      });
  
      req.write(postData);
      req.end();
    });
  }
  
  async function generateAndReturnImage(prompt) {
    try {
      const imageUrl = await generateImage(prompt);
      return imageUrl;
    } catch (error) {
      console.error(error);
      return null;
    }
  }
module.exports = {
    addUserResponse,
    app,
    getqq,
    generateAndReturnImage
};