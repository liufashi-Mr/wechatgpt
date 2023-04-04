module.exports = {
  email: {
    enable: false, // 为true时 loginEmail targetEmail 必填
    loginEmail: {
      user: "2424547314",
      pass: "sbtengxun..",
    },
    targetEmail: "1325178274@qq.com",
  },
  proxy: {
    enable: false, // 如果使用代理请改为true
    baseURL: "https://api.openai.com/v1", //这个是固定的不用修改
    host: "127.0.0.1", // 修改为自己的代理host
    port: 1080, // 修改为自己的代理端口
    protocol: "socks", // 支持http,https,socks
  },
  historyCount: 3, // 不同用户，保留历史对话数
  apikey: "xxxxxxx",
};