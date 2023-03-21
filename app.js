const TelegramBot = require("node-telegram-bot-api");
const https = require("https");
const fs = require("fs");
const { openaiApiRequest } = require("./test.js");
const bot = new TelegramBot("5643705204:AAG7FmPMBAyUiN7ppy9oe9nIgYpLKl97FsE", { polling: true });
const options = {
  key: fs.readFileSync("/root/private.key"),
  cert: fs.readFileSync("/root/cert_chain.crt"),
};

// 当收到'/start'命令时，发送一条欢迎消息
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "欢迎使用我的机器人！");
});

function opentxt(data) {
  const stream = fs.createWriteStream("log.txt", { flags: "a" });

  // 持续写入数据
  stream.write(`${data}\n`);

  // 结束写入并关闭流
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

// 当收到文字消息时，原样返回
bot.on("message", async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const text = msg.text;
  echolog(userId, chatId, text);
  try {
    const thinkingMessage = await bot.sendMessage(chatId, "思考中");
    const thinkingMessageId = thinkingMessage.message_id;
    const output = await openaiApiRequest(text);
    console.log(output);
    await bot.editMessageText(text + output, {
      chat_id: chatId,
      message_id: thinkingMessageId,
    });
  } catch (error) {
    console.error(error);
  }
});
// 创建 HTTPS 服务器
https
  .createServer(options, (req, res) => {
    const ip = req.connection.remoteAddress;
    console.log(`Received request from ${ip}`);
    res.end("Hello, world!");
  })
  .listen(443, "0.0.0.0");