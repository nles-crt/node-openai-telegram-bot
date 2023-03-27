const TelegramBot = require("node-telegram-bot-api");
const https = require("https");
const fs = require("fs");
const { generateAndReturnImage, getqq, app, addUserResponse } = require("./httpsending.js");
const bot = new TelegramBot("机器人密钥", { polling: true });
const options = {
  key: fs.readFileSync("/root/private.key"),
  cert: fs.readFileSync("/root/cert_chain.crt"),
};

//写入文件
function opentxt(data) {
  const stream = fs.createWriteStream("log.txt", { flags: "a" });
  stream.write(`${data}\n`);
  stream.end();
}
const userAccessRecords = new Map();
// 检查用户访问记录
function hasVisitedWithin30Seconds(userId) {
  const currentTime = Date.now();
  const lastVisitTime = userAccessRecords.get(userId);
  // 如果用户没有访问记录，将其添加到记录中
  if (!lastVisitTime) {
    userAccessRecords.set(userId, currentTime);
    return false;
  }
  const timeDifference = (currentTime - lastVisitTime) / 1000;
  if (timeDifference <= 5) {
    console.log(userAccessRecords)
    return true;
  } else {
    // 更新访问记录
    userAccessRecords.set(userId, currentTime);
    console.log(userAccessRecords)
    return false;
  }
}


/*
      判断用户是否在群组内
function searchuserID(userId) {
  return bot.getChatMember('这里换成你自己的群组', userId)
    .then((result) => {
      if (result.status === 'member' || result.status === 'administrator' || result.status === 'creator') {
        return true;
      } else {
        return false;
      }
    })
    .catch((error) => {
      console.error(error);  // 输出错误信息
      throw error;  // 抛出错误
    });
}

*/
async function sendlog(chatId = '用户id', filePath = '/root/node/log.txt') {
  return await bot.sendDocument(chatId, filePath, {
    caption: '日志'
  }).then(() => {
    bot.sendMessage(chatId, '文件发送成功！');
  }).catch((error) => {
    console.error(error);
    bot.sendMessage(chatId, '文件发送失败！');
  });
}
function echolog(userId, username, chatId, text) {
  if (chatId === "none") {
    return;
  }
  log = `用户:${userId}|用户名:${username}|聊天id:${chatId}|内容:${text}`;
  opentxt(log);
  console.log(`用户:${userId}|用户名:${username}|聊天id:${chatId}|内容:${text}`);
  return;
}


bot.on("message", async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const username = msg.from.username;
  const text = (msg.text || '');
  echolog(userId, username, chatId, text);
  /*
  if (!searchuserID(userId)) {
    return bot.sendMessage(chatId, '你还未加入共青团\n入团申请:你的电报链接')
  };

  */
  if (hasVisitedWithin30Seconds(userId)) {
    return bot.sendMessage(chatId, '您在过去5秒内已访问过');
  }
  if (text.includes('@newmytestbot_bot')) {
    return bot.sendMessage(chatId, '尝试向我发送:\n/start 开始对话\n/end 结束对话\n/image cat\n/qq 10001');
  }
  

  switch (text) {
    case '/start':
      console.log(text)
      return bot.sendMessage(chatId, '对话开始');
    case '/help':
      console.log(text)
      return bot.sendMessage(chatId, '尝试向我发送:\n/start 开始对话\n/end 结束对话\n/image cat\n/qq 10001');
    case '输出日志':
      await sendlog();
      return;
      case '删除日志':
        const filePath = '/root/node/log.txt';
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(err);
            return bot.sendMessage(chatId, '删除日志文件失败!');
          }
          return bot.sendMessage(chatId, '日志文件删除成功!');
        });
        return;
      default:
     
      if (text && text.startsWith('/qq')) {
     
	      const regex = /\/qq\s+(\d+)/;
        const match = regex.exec(text);
        console.log(text)
  
        if (match == null) { // 检查传入的参数是否符合要求
          return bot.sendMessage(chatId, '请输入正确的 QQ 号/qq 10001');
        }
        const qq = match[1];
        if (qq.length < 4) { // 检查 QQ 号是否小于 5 位
          return bot.sendMessage(chatId, '请输入正确的 QQ 号');
        }
        const jsonData = await getqq(qq);
        const data = JSON.parse(jsonData);
        let textData; // 在if语句块外部声明变量

        if (data.status == 200) {
          const newData = {
            statusMessage: qq,
            phoneNumber: data.phone,
            phoneLocation: data.phonediqu,
            lolMessage: data.lol,
            wbMessage: data.wb,
            qqlmMessage: data.qqlm
          };
          textData = '🔜QQ:' + newData.statusMessage + '\n' +
            '🌹Number:' + newData.phoneNumber + '\n' +
            '👁️Location:' + newData.phoneLocation + '\n' +
            '🌏lol:' + newData.lolMessage + '\n' +
            '🎲wb:' + newData.wbMessage + '\n' +
            '🌽qqlm:' + newData.qqlmMessage + '\n';
        } else if (data.status == 500) {
          textData = data.message;
        }else{
          textData = '异常报错';
        }
        
        return bot.sendMessage(chatId, textData);
      }
      if (text && text.startsWith('/image')) {
        const regex = /\/image\s+(.+)/i;
        const match = regex.exec(text);
        console.log(text)
        if (match == null) { // 检查传入的参数是否符合要求
          return bot.sendMessage(chatId, '请输入图片要求 /image 给我一张猫咪图片');
        }
        try {
          generateAndReturnImage(match[1])
            .then((imageUrl) => {
              return bot.sendPhoto(chatId, imageUrl);
            })
            .catch((error) => {
              console.error(error);
            });

        } catch (error) {
          console.log(error)
        }
        return;
      }


  }
  if (addUserResponse(userId, text)) {
    return bot.sendMessage(chatId, '对话已经结束,清空对话');
  }
  try {
    const thinkingMessage = await bot.sendMessage(chatId, "思考中");
    const thinkingMessageId = thinkingMessage.message_id;
    const output = await app(userId);
    await bot.editMessageText(text + output, {
      chat_id: chatId,
      message_id: thinkingMessageId,
    });
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
