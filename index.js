const { WechatyBuilder } = require("wechaty");
const Qrterminal = require("qrcode-terminal");
const nodemailer = require("nodemailer");
const qrTerm = require("qrcode-terminal");
const qrImg = require("qr-image");
const config = require("./config");
const moment = require("moment");

let transporter;

let timer;

async function saveQrCode(qrcodeValue) {
  qrTerm.generate(qrcodeValue, { small: true }); // show qrcode on console
  const { email } = config;
  if (!email.enable) {
    return;
  }
  const { loginEmail, targetEmail } = email;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.qq.com",
      port: 465,
      secure: true,
      auth: {
        user: loginEmail.user,
        pass: loginEmail.pass,
      },
    });
  }
  const qrpng = qrImg.image(qrcodeValue, { type: "png" });
  qrpng.pipe(require("fs").createWriteStream("./qrcode.png"));
  const info = await transporter.sendMail({
    from: loginEmail.user,
    to: targetEmail,
    subject: "登录微信",
    text: `请使用微信扫描二维码登录`,
    html: `<p>请使用微信扫描以下二维码登录</p><br/><img src="cid:qrcode"/>`,
    attachments: [
      {
        filename: "qrcode.png",
        path: "./qrcode.png",
        cid: "qrcode",
      },
    ],
  });
  console.log(`已发送二维码链接到邮箱：${info.messageId}`);
}

const bot = WechatyBuilder.build({
  name: "WechatEveryDay",
  puppet: "wechaty-puppet-wechat",
  puppetOptions: {
    uos: true,
  },
});

bot.on("scan", async (qrcodeValue, status) => {
  if (status === 2) {
    await saveQrCode(qrcodeValue);
  }
});

bot.on("login", async (user) => {
  console.log(`登录成功，用户名：${user}`);
  await main();
  const { fashi } = await getContactor();
  setInterval(() => {
    const { h, m, week } = getTime();
    if (h === 17 && m === 45 && week && week < 6) {
      fashi.say("alive");
    }
  }, 1000 * 60);
});

bot.on("logout", async (user) => {
  console.log(`用户${user}已退出登录`);
  process.exit(0);
});

const receivedList = [
  "1",
  "收到",
  "好的",
  "打了",
  "嗯",
  "好的",
  "下班",
  "走人",
];

bot.on("message", async (message) => {
  const talker = message.talker();
  if (talker.payload.alias !== "发狮" && talker.payload.alias !== "心雨")
    return;
  const msgTime = new Date(message.date()).getTime();
  // 超过一分钟以上的消息不加入逻辑，防止重启服务时发送过多消息
  if (Math.abs(msgTime - Date.now()) > 1000 * 60 * 10) return;
  const text = message.text();
  const endTalk = receivedList.some((x) => x.includes(text));
  if (endTalk) {
    closeTalk();
    return;
  }
  if (text.includes("加班")) {
    workOverTime();
    return;
  }
  talker.say(repeatEmoji(getRadomEmoji()));
});

bot.on("error", async (err) => {
  console.error(err);
});

bot.start();

async function main() {
  const { fashi, xinyu } = await getContactor();
  setInterval(() => {
    const { h, m, week } = getTime();
    if (h === 18 && m === 0 && week && week < 6) {
      fashi.say("打卡提醒送达");
      xinyu.say("下班啦，不要忘记打卡哦" + repeatEmoji(getRadomEmoji()));
      sendRepeat();
    }
  }, 1000 * 60);
}
async function workOverTime() {
  clearInterval(timer);
  timer = null;
  const { fashi, xinyu } = await getContactor();
  fashi.say("需要加班");
  xinyu.say(repeatEmoji("[加油]"));
  xinyu.say(
    "那我八点再提醒" +
      repeatEmoji(getRadomEmoji(["[爱心]", "[拥抱]", "[加油]"]))
  );
  const timer8 = setInterval(function () {
    const { h, m, week } = getTime();
    try {
      if (h === 20 && m === 0 && week && week < 6) {
        fashi.say("加班打卡提醒送达");
        xinyu.say("怎么样啦，不要忘记打卡哦" + repeatEmoji(getRadomEmoji()));
        sendRepeat();
        clearInterval(timer8);
      }
    } catch (error) {
      console.log(error);
    }
  }, 1000 * 60);
}
async function sendRepeat() {
  const { fashi, xinyu } = await getContactor();
  timer = setInterval(() => {
    fashi.say("已重复发送");
    xinyu.say("你还没有打卡哦~");
  }, 1000 * 60 * 8);
}

async function closeTalk() {
  const { fashi, xinyu } = await getContactor();
  fashi.say("对方已接收");
  xinyu.say("好的~[好的]");
  xinyu.say(repeatEmoji(getRadomEmoji()));

  clearInterval(timer);
}

async function getContactor() {
  const fashi = await bot.Contact.find({ alias: "发狮" });
  const xinyu = await bot.Contact.find({ alias: "心雨" });
  return { fashi, xinyu };
}

function getTime() {
  const h = moment().hour();
  const m = moment().minute();
  const week = moment().weekday();
  return { h, m, week };
}

function getRadomEmoji(defaultList) {
  const emojiList = defaultList || [
    "[嘿哈]",
    "[转圈]",
    "[跳跳]",
    "[吃瓜]",
    "[耶]",
    "[哇]",
    "[机智]",
  ];
  const index = Math.floor(Math.random() * emojiList.length);
  return emojiList[index];
}

function repeatEmoji(emoji) {
  let res = "";
  const count = Math.ceil(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    res += emoji;
  }
  return res;
}
