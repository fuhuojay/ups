// 访问统计配置。
// 部署 analytics/google-apps-script.gs 后，把 Web App URL 填到 endpoint。
window.UPS_ANALYTICS_CONFIG = {
  enabled: true,
  endpoint: "https://script.google.com/macros/s/AKfycbwYRQhaWgTG1kn4z44JMDcuWZ15WboFoT7-VXjC4N0LtsM9EtklV_lW1tYh9ZADc5AZ/exec",
  mode: "no-cors",
  collectIp: true,
  ipEndpoint: "https://api.ipify.org?format=json",
  debug: false,
  sampleRate: 1
};
