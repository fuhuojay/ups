const EVENT_SHEET_NAME = "访问事件";
const REPORT_SHEET_NAME = "客户分析";

const EVENT_HEADERS = [
  "接收时间",
  "事件时间",
  "事件名称",
  "访客ID",
  "会话ID",
  "授权Hash",
  "页面路径",
  "来源页面",
  "UPS系列",
  "UPS型号",
  "电池系列",
  "后备时间min",
  "UPS套数",
  "并机台数/套",
  "UPS总台数",
  "需要监控仪",
  "客户指定电池",
  "指定电池型号",
  "指定电池系列",
  "单组节数",
  "组数",
  "反算后备时间",
  "价格已授权",
  "项目清单数",
  "当前页面模块",
  "报价行数",
  "报价类别",
  "设备语言",
  "设备平台",
  "视窗尺寸",
  "触屏设备",
  "访问日期",
  "访问时间",
  "访问时区",
  "公网IP",
  "原始数据"
];

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const events = Array.isArray(payload.events) ? payload.events : [];
    if (!events.length) return json_({ ok: true, received: 0 });

    setupAnalyticsWorkbook();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(EVENT_SHEET_NAME);
    const rows = events.map(eventToRow_);
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, EVENT_HEADERS.length).setValues(rows);
    return json_({ ok: true, received: rows.length });
  } catch (error) {
    return json_({ ok: false, message: String(error && error.message ? error.message : error) });
  }
}

function doGet() {
  setupAnalyticsWorkbook();
  return json_({
    ok: true,
    message: "UPS 配置工具访问统计接口正常。请在当前 Google Sheet 查看“访问事件”和“客户分析”。"
  });
}

function setupAnalyticsWorkbook() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const eventSheet = getOrCreateSheet_(ss, EVENT_SHEET_NAME);
  ensureHeaders_(eventSheet, EVENT_HEADERS);
  eventSheet.setFrozenRows(1);
  eventSheet.autoResizeColumns(1, Math.min(EVENT_HEADERS.length, 12));

  const reportSheet = getOrCreateSheet_(ss, REPORT_SHEET_NAME);
  reportSheet.clear();
  reportSheet.getRange("A1:B7").setValues([
    ["指标", "值"],
    ["事件总数", "=COUNTA('" + EVENT_SHEET_NAME + "'!A2:A)"],
    ["独立访客数", "=COUNTUNIQUE('" + EVENT_SHEET_NAME + "'!D2:D)"],
    ["导出报价次数", "=COUNTIF('" + EVENT_SHEET_NAME + "'!C:C,\"quote_exported\")"],
    ["授权成功次数", "=COUNTIF('" + EVENT_SHEET_NAME + "'!C:C,\"auth_success\")"],
    ["点击微信二维码次数", "=COUNTIF('" + EVENT_SHEET_NAME + "'!C:C,\"wechat_qr_opened\")"],
    ["客户指定电池次数", "=COUNTIF('" + EVENT_SHEET_NAME + "'!C:C,\"custom_battery_selected\")"]
  ]);
  eventSheet.getRange("A:A").setNumberFormat("yyyy-mm-dd hh:mm:ss");
  eventSheet.getRange("B:B").setNumberFormat("yyyy-mm-dd hh:mm:ss");
  reportSheet.getRange("D1").setValue("热门 UPS 型号");
  reportSheet.getRange("D2").setFormula("=QUERY('" + EVENT_SHEET_NAME + "'!J2:J,\"select J, count(J) where J is not null group by J order by count(J) desc label J 'UPS型号', count(J) '次数'\",0)");
  reportSheet.getRange("G1").setValue("热门电池系列");
  reportSheet.getRange("G2").setFormula("=QUERY('" + EVENT_SHEET_NAME + "'!K2:K,\"select K, count(K) where K is not null group by K order by count(K) desc label K '电池系列', count(K) '次数'\",0)");
  reportSheet.getRange("J1").setValue("高意向客户");
  reportSheet.getRange("J2").setFormula("=QUERY('" + EVENT_SHEET_NAME + "'!C2:F,\"select F, count(C) where F is not null and (C='quote_exported' or C='auth_success' or C='wechat_qr_opened') group by F order by count(C) desc label F '授权Hash', count(C) '高意向动作次数'\",0)");
  reportSheet.setFrozenRows(1);
  reportSheet.autoResizeColumns(1, 12);
}

function parsePayload_(e) {
  const text = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
  return JSON.parse(text);
}

function eventToRow_(event) {
  const payload = event.payload || {};
  const config = payload.config || {};
  const customBattery = config.customBattery || {};
  const page = event.page || {};
  const device = event.device || {};
  const eventDate = event.timestamp ? new Date(event.timestamp) : "";
  return [
    new Date(),
    eventDate,
    event.name || "",
    event.clientId || "",
    event.sessionId || "",
    event.authHash || payload.authHash || "",
    page.path || "",
    page.referrer || "",
    config.series || "",
    config.upsModel || "",
    config.batterySeries || "",
    config.durationMin || "",
    config.systemQty || "",
    config.parallelUnits || "",
    config.totalUpsUnits || "",
    boolText_(config.includeMonitor),
    boolText_(config.customBatteryEnabled),
    customBattery.model || "",
    customBattery.series || "",
    customBattery.cells || "",
    customBattery.strings || "",
    customBattery.runtime || "",
    boolText_(config.priceAuthorized),
    config.projectItemCount || "",
    config.workspaceTab || "",
    payload.lineCount || "",
    Array.isArray(payload.categories) ? payload.categories.join(" / ") : "",
    device.language || "",
    device.platform || "",
    device.viewport || "",
    boolText_(device.touch),
    event.localDate || "",
    event.localTime || "",
    event.timeZone || "",
    device.ip || "",
    JSON.stringify(event)
  ];
}

function getOrCreateSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function ensureHeaders_(sheet, headers) {
  const existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const same = headers.every((header, index) => existing[index] === header);
  if (!same) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function boolText_(value) {
  if (value === true) return "是";
  if (value === false) return "否";
  return "";
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
