# 艾特网能 UPS 蓄电池配置计算

静态网页工具，用于按艾特网能 UPS、蓄电池和电池监控仪资料快速计算推荐配置。

## 功能

- UPS 蓄电池推荐配置查询
- 祁连 UM 系列模块/机柜容量联动蓄电池配置
- SP-b、SPG-b、GFMD-B、GBT 彩页产品参数校准
- 按销售配置指导书输出通讯卡、并机、LBS、POD、电池开关等配置建议
- 配置选择可勾选电池监控仪，并联动带出监控仪清单和报价
- 支持 UPS 套数、并机台数和多型号项目清单汇总报价
- 结果区展示负载功率、W/cell、最大放电电流和开关电压等级计算过程
- 手机号授权后显示目录价；未授权时页面和导出报价金额显示为星号
- UPS、蓄电池、电池监控仪参考价带入，并支持逐项折扣
- 一键导出可继续编辑的 Excel 报价文件
- 手动核算 W/cell 和最大放电电流
- 电池监控仪配置计算
- 电池监控仪目录价自动汇总

## 部署

这是纯静态页面，GitHub Pages 可直接从仓库根目录发布 `index.html`。

## 访问统计

页面内置轻量统计模块，默认记录页面访问、配置变更、手机号授权结果、客户指定电池、加入项目清单、导出 Excel、点击微信二维码等事件。

统计不会记录明文手机号；授权用户只会上报手机号 SHA-256 哈希，便于后续按授权客户做行为分析。公网 IP 为客户当前网络出口 IP，可能是公司网关、运营商 NAT、代理或 VPN，不等同于客户个人设备的真实内网地址。

推荐用 Google Sheet 做统计收件箱：

1. 新建一个 Google Sheet，例如“UPS 配置工具访问统计”
2. 打开“扩展程序 > Apps Script”
3. 把 `analytics/google-apps-script.gs` 的内容复制进去并保存
4. 在 Apps Script 中运行一次 `setupAnalyticsWorkbook`，授权后会自动生成“访问事件”和“客户分析”两个工作表
5. 点击“部署 > 新建部署 > Web 应用”
6. 执行身份选择“我”，访问权限选择“任何人”
7. 复制 Web App URL，填到项目根目录 `analytics-config.js` 的 `endpoint`

配置示例：

```html
window.UPS_ANALYTICS_CONFIG = {
  enabled: true,
  endpoint: "https://你的统计接口地址",
  mode: "no-cors",
  collectIp: true,
  ipEndpoint: "https://api.ipify.org?format=json",
  debug: false,
  sampleRate: 1
};
```

如果 `endpoint` 为空，事件只会暂存在当前浏览器的 `localStorage` 队列 `ups-analytics-queue` 中，不会向外发送，也不影响报价工具使用。

上线后查看统计：打开对应 Google Sheet，看“访问事件”明细和“客户分析”汇总。高意向客户可以优先看 `auth_success`、`quote_exported`、`wechat_qr_opened` 这些事件。

## 授权手机号

授权名单在 `authorized-phones.js` 中维护，文件只保存手机号哈希。

图形化添加手机号：

1. 双击项目根目录里的 `启动授权管理.command`
2. 浏览器会打开 `http://localhost:8010/admin.html`
3. 输入手机号，点击“添加授权”
4. 提交 GitHub 前确认 `authorized-phones.js` 已更新

快捷添加手机号：

```bash
node tools/add-phone.mjs 13800138000
```

脚本会自动把手机号转成 SHA-256 哈希并写入 `authorized-phones.js`，重复添加同一个手机号时不会重复写入。

只生成哈希、不写入文件：

```bash
node tools/hash-phone.mjs 13800138000
```

未授权用户仍能使用配置计算，但目录价、折后价和合计金额会显示为 `****`，页面会提示联系开发者 Michael，并引导用户加微信反馈项目建议。

注意：当前是 GitHub Pages 静态页级别的前端显示控制，适合隐藏普通页面展示；如果需要防止技术用户从源码或数据文件读取价格，需要接入真实后端鉴权并由后端按权限返回价格数据。
