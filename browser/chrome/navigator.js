module.exports = (sdenv) => {
  const window = sdenv.memory.window;
  const { setFuncNative } = sdenv.tools;

  // ====== 你原来的内容（略） ======
  const DeprecatedStorageQuota = function DeprecatedStorageQuota() {
    throw new TypeError("Illegal constructor");
  };
  DeprecatedStorageQuota.prototype = {
    queryUsageAndQuota() {},
    requestQuota() {},
  };
  sdenv.tools.setObjName(DeprecatedStorageQuota.prototype, "DeprecatedStorageQuota");

  const NetworkInformation = function NetworkInformation() {
    throw new TypeError("Illegal constructor");
  };
  sdenv.tools.setObjName(NetworkInformation.prototype, "NetworkInformation");

  // ====== 新增：固定插件 + 屏幕信息（用于测试） ======
  const FIXED = {
    pluginNames: [
      "PDF Viewer",
      "Chrome PDF Viewer",
      "Chromium PDF Viewer",
      "Microsoft Edge PDF Viewer",
      "WebKit built-in PDF",
    ],
    screenWidth: 2560,
    screenHeight: 1440,
    innerWidth: 1316,
    colorDepth: 24,
  };

  function makePluginArray(names) {
    const plugins = names.map((name) => ({
      name,
      description: "",
      filename: "",
    }));

    // 类 PluginArray：支持 length / [i] / item / namedItem / 可迭代
    const pluginArray = Object.create(null);

    Object.defineProperty(pluginArray, Symbol.toStringTag, {
      value: "PluginArray",
      configurable: true,
    });

    Object.defineProperty(pluginArray, "length", {
      get() { return plugins.length; },
      enumerable: true,
      configurable: true,
    });

    pluginArray.item = (i) => (i >= 0 && i < plugins.length ? plugins[i] : null);
    pluginArray.namedItem = (name) => plugins.find((p) => p.name === name) || null;
    pluginArray.refresh = () => {}; // 一些老代码会调用

    plugins.forEach((p, i) => {
      Object.defineProperty(pluginArray, i, {
        value: p,
        enumerable: true,
        configurable: true,
      });
    });

    pluginArray[Symbol.iterator] = function* () {
      for (const p of plugins) yield p;
    };

    return pluginArray;
  }

  const fixedPluginsArray = makePluginArray(FIXED.pluginNames);

  // 固定 screen / innerWidth（让你生成 screenInfo 的逻辑稳定）
  if (!window.screen) window.screen = {};
  Object.defineProperty(window.screen, "width", {
    get: () => FIXED.screenWidth,
    configurable: true,
  });
  Object.defineProperty(window.screen, "height", {
    get: () => FIXED.screenHeight,
    configurable: true,
  });
  Object.defineProperty(window.screen, "colorDepth", {
    get: () => FIXED.colorDepth,
    configurable: true,
  });

  Object.defineProperty(window, "innerWidth", {
    get: () => FIXED.innerWidth,
    configurable: true,
  });

  // 你给的固定字符串
  function buildScreenInfo() {
    return `${FIXED.screenWidth}-${FIXED.screenHeight}-${FIXED.innerWidth}-${FIXED.colorDepth}-*-*-*`;
  }
  function buildDupedPlugins() {
    return `${FIXED.pluginNames.join(" ")} ||${buildScreenInfo()}`;
  }

  class NavigatorCustomize {
    get webkitPersistentStorage() {
      return { __proto__: DeprecatedStorageQuota.prototype };
    }
    get connection() {
      return {
        __proto__: NetworkInformation.prototype,
        downlink: 3.85,
        effectiveType: "4g",
        onchange: null,
        rtt: 100,
        saveData: false,
      };
    }
    get userAgent() {
      if (window.userAgent) return window.userAgent;
      return "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
    }
    get appVersion() {
      if (window.userAgent) return window.userAgent.replace("Mozilla/", "");
      return "5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
    }
    get platform() {
      return "MacIntel";
    }
    get vendor() {
      return "Google Inc.";
    }

    // ✅ 新增：navigator.plugins（固定）
    get plugins() {
      return fixedPluginsArray;
    }
  }

  // mixin 增加 plugins
  sdenv.tools.mixin(window.navigator, NavigatorCustomize.prototype, [
    "userAgent",
    "platform",
    "appVersion",
    "vendor",
    "plugins",
    "sendBeacon",
  ]);

  // 让 getter 看起来更“原生”（你原来只处理了 navigator.__proto__，这里补一下 own props）
  const uaGet = Object.getOwnPropertyDescriptor(window.navigator, "userAgent")?.get;
  const avGet = Object.getOwnPropertyDescriptor(window.navigator, "appVersion")?.get;
  const pfGet = Object.getOwnPropertyDescriptor(window.navigator, "platform")?.get;
  const vdGet = Object.getOwnPropertyDescriptor(window.navigator, "vendor")?.get;
  const plGet = Object.getOwnPropertyDescriptor(window.navigator, "plugins")?.get;
  if (uaGet) sdenv.tools.setFuncNative(uaGet, "get");
  if (avGet) sdenv.tools.setFuncNative(avGet, "get");
  if (pfGet) sdenv.tools.setFuncNative(pfGet, "get");
  if (vdGet) sdenv.tools.setFuncNative(vdGet, "get");
  if (plGet) sdenv.tools.setFuncNative(plGet, "get");

  // 你原来的逻辑：把原生 navigator proto 上的 getter 也标 native
  Object.keys(window.navigator.__proto__).forEach((name) => {
    sdenv.tools.setFuncNative(
        Object.getOwnPropertyDescriptor(window.navigator.__proto__, name)?.get,
        "get"
    );
  });

  setFuncNative((window.navigator.sendBeacon = function sendBeacon(url) {}));

  // ✅ 可选：直接提供你要的 payload（用于测试断言）
  window.__TEST_FP__ = {
    plugins: FIXED.pluginNames.map((n) => ({ name: n, str: n + " " })),
    dupedPlugins: buildDupedPlugins(),
    screenInfo: buildScreenInfo(),
  };
  setFuncNative((window.__GET_TEST_FP__ = function __GET_TEST_FP__() {
    return window.__TEST_FP__;
  }));
};
