const TelegramBot = require("node-telegram-bot-api");
const https = require("https");
const fs = require("fs");
const { openaiApiRequest } = require("./test.js");
const { getqq } = require("./test.js");
const bot = new TelegramBot("机器人密钥", { polling: true });
const options = {
  key: fs.readFileSync("/root/private.key"),
  cert: fs.readFileSync("/root/cert_chain.crt"),
};
const userChatHistory = {};
function opentxt(data) {
  const stream = fs.createWriteStream("log.txt", { flags: "a" });
  stream.write(`${data}\n`);
  stream.end();
}

function echolog(userId, chatId, text) {
  if (chatId === "none") {
    return;
  }
  log = `用户:${userId}|聊天id:${chatId}|内容:${text}`;
  opentxt(log);
  console.log(`用户:${userId}|聊天id:${chatId}|内容:${text}`);
  return;
}

function updateUserChatHistory(userId, message, isUser = true) {

  if (!userChatHistory[userId]) {
    userChatHistory[userId] = [];
  }
  if (message == '结束对话'){
    userChatHistory[userId] = [];
    return true;
  }

  if(userChatHistory[userId].length > 8){   //限制储存用户内容长度大于8清空
    userChatHistory[userId] = [];
  }
  console.log(userChatHistory[userId].length)
  const prefix = isUser ? " " : "\n\n";
  userChatHistory[userId].push(prefix + message);
}

bot.on("message", async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const text = msg.text;
  switch (text) {
    case '/start':
      return bot.sendMessage(chatId, '对话开始');
    default:
      if (text.startsWith('/qq')) {
        const regex = /\/qq\s+(\d+)/;
        const match = regex.exec(text);
        if (match == null) { // 检查传入的参数是否符合要求
          return bot.sendMessage(chatId, '请输入正确的 QQ 号');
        }
        const qq = match[1];
        if (qq.length < 4) { // 检查 QQ 号是否小于 5 位
          return bot.sendMessage(chatId, '请输入正确的 QQ 号');
        }
        const data = await getqq(qq);
        return bot.sendMessage(chatId, data);
      }
  }
  echolog(userId, chatId, text);
  if(updateUserChatHistory(userId, text)){
    return bot.sendMessage(chatId,'对话已经结束');
  }
  try {
    const thinkingMessage = await bot.sendMessage(chatId, "思考中");
    const thinkingMessageId = thinkingMessage.message_id;
    const chatHistory = userChatHistory[userId].join("\n");
    const inputWithHistory = chatHistory + "\n" + text;
    const output = await openaiApiRequest(input=inputWithHistory);
    await bot.editMessageText(text + output, {
      chat_id: chatId,
      message_id: thinkingMessageId,
    });

    updateUserChatHistory(userId, output, false);
  } catch (error) {
    console.error(error);
  }
});

https
  .createServer(options, (req, res) => {
    const ip = req.connection.remoteAddress;
    console.log(`Received request from ${ip}`);
    res.end("Hello, world!");
  })


//学习参考请勿用于非法用途