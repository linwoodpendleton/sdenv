#!/usr/bin/env node

try{require('module-alias')(require('../../utils/paths').basePath)}catch(err){};
const fs = require('fs');
const path = require('path');
const vm = require("vm");
const { jsdomFromText, logger, simpleDecrypt } = require('sdenv');

const baseUrl = simpleDecrypt("UU1NSUoDFhZOWlNKF0pbUxdaV1BJWBdeVk8XWlc=")
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
process.env.OPENSSL_LEGACY_RENEGOTIATION = '1';


const args = process.argv.slice(2);
const files = {
  // 此处的文件可以通过运行npx rs-reverse makecode tarurl自动生成
  html: path.resolve(__dirname, 'output/makecode_input_html.html'),
  js: path.resolve(__dirname, 'output/makecode_input_js.js'),
  ts: path.resolve(__dirname, 'output/makecode_input_ts.json'),
}

function getFile(name) {
  const filepath = files[name];
  if (!filepath) throw new Error(`getFile: ${name}错误`);
  if (!fs.existsSync(filepath)) throw new Error(`文件${filepath}不存在，请使用rs-reverse工具先获取文件`);
  return fs.readFileSync(filepath);
}

function initBrowser(window, cookieJar) {
  window.$_ts = getFile('ts');
  // window.addEventListener('sdenv:location.replace', (e) => {
  //   const cookies = cookieJar.getCookieStringSync(baseUrl);
  //   logger.debug('生成cookie：', cookies);
  //   window.close();
  // })
  // const origFetch = window.fetch.bind(window);
  // window.TextEncoder = new TextEncoder;
  window.fetch = async function(input, init) {
    try {
      const url = (typeof input === "string") ? input : input.url;
      console.warn("[fetch]", url, init?.method || "GET", init);
      if (url.includes("report")){
        return new Response("", {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(window.$_ts, {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch {}


  };
}
const header = {
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 aaaa',
}

function loadPages() {
  const htmltext = getFile('html');
  const jstext = getFile('js');
  const dom = jsdomFromText(htmltext, {
    ...header,
    url: `https://www.test.com`,
    referrer: `https://www.test.com`,
    contentType: "text/html",
    runScripts: "outside-only",
  })
  // ✅ 注入一个最小 process（很多前端 bundle 只用到 process.env.NODE_ENV）
  Object.defineProperty(dom.window, "process", {
    value: process,
    configurable: true,
  });
  Object.defineProperty(dom.window, "TextEncoder", {
    value: TextEncoder,
    configurable: true,
  });
  Object.defineProperty(dom.window, "crypto", {
    value: crypto,
    configurable: true,
  });
  Object.defineProperty(dom.window, "userAgent", {
    value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.399",
    configurable: true,
  });



  initBrowser(dom.window, dom.cookieJar);
  vm.runInContext(jstext, dom.getInternalVMContext());
}

loadPages()
