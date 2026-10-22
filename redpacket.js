/*!
 * RedPacketFloat v1.0.0
 * 京东红包悬浮动画组件 —— 零依赖 / Shadow DOM 样式隔离 / 可嵌入任意网页
 *
 * 用法 A（推荐）：手动初始化
 *   <script src="redpacket.js"></script>
 *   <script>
 *     RedPacketFloat.init({
 *       link: 'https://u.jd.com/FaBv8fi',
 *       title: '无门槛红包',
 *       subtitle: '最高 26888 元等你来抢'
 *     });
 *   </script>
 *
 * 用法 B：自动初始化
 *   <script src="redpacket.js"
 *           data-redpacket-auto
 *           data-redpacket-link="https://u.jd.com/FaBv8fi"
 *           data-redpacket-title="无门槛红包"
 *           data-redpacket-subtitle="最高 26888 元等你来抢"
 *           data-redpacket-side="right"
 *           data-redpacket-interval="5200"
 *           data-redpacket-max-show="0"></script>
 */
(function () {
  'use strict';

  if (typeof window === 'undefined' || window.RedPacketFloat) return;

  var VERSION = '1.0.0';
  var HOST_ID = 'redpacket-float-host';

  /* ------------------------------------------------------------------ 样式 */
  var CSS_TEXT = `
:host {
  all: initial;
  position: fixed !important;
  left: 0 !important;
  top: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  z-index: 2147483647 !important;
  display: block !important;
  pointer-events: none !important;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
:host * { box-sizing: border-box; margin: 0; padding: 0; }

.rp-anchor {
  position: absolute;
  left: 50%; top: 50%;
  width: 0; height: 0;
}

.rp-mover {
  position: absolute;
  left: 0; top: 0;
  width: 0; height: 0;
  opacity: 1;
  transform: translate3d(var(--rp-dock-x, 50vw), 0, 0) rotate(var(--rp-dock-rot, 0deg)) scale(var(--rp-dock-scale, 1));
  will-change: transform;
  backface-visibility: hidden;
}
/* 停靠在页面侧边（只露出红包一半）。注意：不做hover位移，否则红包会在鼠标移上去时滑走、导致点空 */
.rp-mover.is-docked { transition: transform .5s cubic-bezier(.34, 1.3, .64, 1); }

/* 停靠侧边时轻微呼吸，提示还能点击 */
.rp-mover.is-docked .rp-card { animation: rp-dock-pulse 2.8s ease-in-out infinite; }
@keyframes rp-dock-pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.05); }
}
.rp-mover.is-docked .rp-pack:hover .rp-card { animation: none; transform: scale(1.06); }
.rp-mover.is-docked .rp-glow { opacity: .55; }

/* ---------------- 提示气泡 ---------------- */
.rp-bubble {
  position: absolute;
  left: 0;
  bottom: 101px;
  transform: translateX(-50%);
  padding: 9px 15px 10px;
  border-radius: 14px;
  white-space: nowrap;
  text-align: center;
  background: linear-gradient(140deg, #fffdf5 0%, #ffedc4 55%, #ffd995 100%);
  box-shadow: 0 10px 24px rgba(110, 8, 18, .38), inset 0 0 0 1px rgba(255, 255, 255, .85), 0 0 22px rgba(255, 196, 90, .5);
  pointer-events: auto;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  opacity: 1;
  transition: opacity .32s ease;
}
/* 红包缩回侧边时，气泡收起来（否则会被屏幕边缘裁掉一半） */
.rp-mover.is-docked .rp-bubble { opacity: 0; pointer-events: none; }
.rp-bubble::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -6px;
  width: 13px; height: 13px;
  margin-left: -6.5px;
  border-radius: 2px;
  background: #ffdd9a;
  transform: rotate(45deg);
}
.rp-bubble-t1 { display: block; font-size: 15px; font-weight: 800; line-height: 1.25; color: #a8111c; letter-spacing: .3px; }
.rp-bubble-t2 { display: block; font-size: 12px; font-weight: 600; line-height: 1.45; color: #c6501a; }
.rp-bubble-t2 em { font-style: normal; font-size: 14px; font-weight: 800; color: #e0221b; }

.rp-close {
  position: absolute;
  right: -7px; top: -9px;
  width: 20px; height: 20px;
  border: 0;
  border-radius: 50%;
  background: rgba(96, 10, 16, .88);
  color: #ffe3ab;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .3);
  transition: transform .18s ease, background .18s ease;
}
.rp-close:hover { background: #c8161d; transform: scale(1.12); }

/* ---------------- 红包本体 ---------------- */
.rp-pack {
  position: absolute;
  left: 0; top: 0;
  width: 140px; height: 186px;
  transform: translate(-50%, -50%);
  cursor: pointer;
  pointer-events: auto;
  -webkit-tap-highlight-color: transparent;
}

.rp-glow {
  position: absolute;
  left: 50%; top: 50%;
  width: 240px; height: 280px;
  margin: -140px 0 0 -120px;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255, 118, 58, .8), rgba(255, 186, 66, .38) 52%, rgba(255, 210, 120, 0) 78%);
  filter: blur(5px);
  pointer-events: none;
  animation: rp-breathe 2.4s ease-in-out infinite;
}
@keyframes rp-breathe {
  0%, 100% { transform: scale(.85); opacity: .5; }
  50%      { transform: scale(1.1); opacity: .95; }
}

.rp-card {
  position: absolute;
  inset: 0;
  transition: transform .3s cubic-bezier(.34, 1.56, .64, 1), filter .3s ease;
  filter: drop-shadow(0 16px 22px rgba(110, 0, 12, .45));
}
.rp-pack:hover .rp-card {
  transform: scale(1.06);
  filter: drop-shadow(0 20px 30px rgba(150, 8, 20, .55)) drop-shadow(0 0 16px rgba(255, 176, 60, .9));
}
.rp-pack:active .rp-card { transform: scale(.97); }
.rp-card svg { display: block; width: 100%; height: 100%; }

.rp-shine { position: absolute; inset: 0; border-radius: 19px; overflow: hidden; pointer-events: none; }
.rp-shine::after {
  content: '';
  position: absolute;
  top: -45%;
  left: -85%;
  width: 48%;
  height: 190%;
  background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.62), rgba(255,255,255,0));
  transform: rotate(20deg);
  animation: rp-sweep 2.8s ease-in-out infinite;
}
@keyframes rp-sweep {
  0%   { left: -85%; }
  42%  { left: 145%; }
  100% { left: 145%; }
}

/* ---------------- 飘出的金色粒子 ---------------- */
.rp-coin {
  position: absolute;
  top: 15%;
  left: 50%;
  width: 11px; height: 11px;
  margin-left: -5.5px;
  border-radius: 50%;
  background: radial-gradient(circle at 32% 28%, #fff8d8, #ffd85f 46%, #d2931c 100%);
  box-shadow: 0 0 10px rgba(255, 200, 80, .95);
  opacity: 0;
  pointer-events: none;
  animation: rp-coin 2.6s cubic-bezier(.2, .7, .4, 1) infinite;
}
@keyframes rp-coin {
  0%   { opacity: 0; transform: translate3d(0, 0, 0) scale(.4); }
  18%  { opacity: 1; }
  100% { opacity: 0; transform: translate3d(var(--rp-dx, 0px), -96px, 0) scale(1.05); }
}

@media (max-width: 520px) {
  .rp-pack { width: 112px; height: 149px; }
  .rp-bubble { bottom: 83px; padding: 8px 13px 9px; }
  .rp-bubble-t1 { font-size: 13.5px; }
  .rp-bubble-t2 { font-size: 11px; }
  .rp-bubble-t2 em { font-size: 12.5px; }
  .rp-glow { width: 190px; height: 220px; margin: -110px 0 0 -95px; }
  .rp-shine { border-radius: 15px; }
}
`;

  /* ------------------------------------------------------------------ 红包 SVG */
  var SVG = '' +
    '<svg viewBox="0 0 140 186" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
      '<defs>' +
        '<linearGradient id="rpBody" x1="6%" y1="0%" x2="94%" y2="100%">' +
          '<stop offset="0%" stop-color="#ff7a63"/>' +
          '<stop offset="30%" stop-color="#ef3125"/>' +
          '<stop offset="72%" stop-color="#cf1119"/>' +
          '<stop offset="100%" stop-color="#8f0710"/>' +
        '</linearGradient>' +
        '<linearGradient id="rpGold" x1="10%" y1="0%" x2="70%" y2="100%">' +
          '<stop offset="0%" stop-color="#fff6cf"/>' +
          '<stop offset="26%" stop-color="#ffdd8a"/>' +
          '<stop offset="58%" stop-color="#e9b13c"/>' +
          '<stop offset="100%" stop-color="#b0781a"/>' +
        '</linearGradient>' +
        '<radialGradient id="rpGloss" cx="30%" cy="16%" r="78%">' +
          '<stop offset="0%" stop-color="#ffffff" stop-opacity=".38"/>' +
          '<stop offset="52%" stop-color="#ffffff" stop-opacity=".05"/>' +
          '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>' +
        '</radialGradient>' +
      '</defs>' +
      '<rect x="2" y="2" width="136" height="182" rx="18" fill="url(#rpBody)"/>' +
      '<rect x="2" y="2" width="136" height="182" rx="18" fill="url(#rpGloss)"/>' +
      '<rect x="2.5" y="2.5" width="135" height="181" rx="17.5" fill="none" stroke="#7a040c" stroke-opacity=".5" stroke-width="1.5"/>' +
      '<path d="M2 20 A18 18 0 0 1 20 2 H120 A18 18 0 0 1 138 20 V44 Q70 68 2 44 Z" fill="url(#rpGold)"/>' +
      '<path d="M2 44 Q70 68 138 44" fill="none" stroke="#9d6c0d" stroke-opacity=".5" stroke-width="1.6"/>' +
      '<path d="M7 25 A16 16 0 0 1 23 7 H116" fill="none" stroke="#fffbe8" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>' +
      '<circle cx="70" cy="120" r="30" fill="url(#rpGold)"/>' +
      '<circle cx="70" cy="120" r="30" fill="none" stroke="#a4740d" stroke-opacity=".45" stroke-width="1.4"/>' +
      '<circle cx="70" cy="120" r="24.5" fill="none" stroke="#a4740d" stroke-opacity=".32" stroke-width="1" stroke-dasharray="3 3.4"/>' +
      '<text x="70" y="120" text-anchor="middle" dominant-baseline="central" font-size="31" font-weight="800" ' +
        'fill="#b3121a" font-family="-apple-system, PingFang SC, Microsoft YaHei, Segoe UI, Arial, sans-serif">\u00a5</text>' +
    '</svg>';

  var COINS = '' +
    '<i class="rp-coin" style="left:36%;--rp-dx:-54px;animation-delay:.10s"></i>' +
    '<i class="rp-coin" style="left:52%;--rp-dx:-8px;animation-delay:.55s"></i>' +
    '<i class="rp-coin" style="left:64%;--rp-dx:44px;animation-delay:.30s"></i>' +
    '<i class="rp-coin" style="left:44%;--rp-dx:-30px;animation-delay:.95s"></i>' +
    '<i class="rp-coin" style="left:58%;--rp-dx:26px;animation-delay:1.35s"></i>';

  /* ------------------------------------------------------------------ 配置 */
  var DEFAULTS = {
    link: 'https://u.jd.com/FaBv8fi',
    target: '_blank',
    title: '无门槛红包',
    subtitle: '最高 26888 元等你来抢',
    side: 'right',   // right | left
    delay: 800,      // 首次出现延迟(ms)
    interval: 8000,  // 两次飞入之间的间隔(ms)
    maxShow: 0,      // 播放次数，0 = 无限循环
    closeable: true,
    oncePerDay: true // 点过或者关闭后当天不再出现，次日0点自动恢复
  };

  /* ------------------------------------------------------------------ 动画关键帧 */
  var SHAKE = [
    { transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)' },
    { transform: 'translate3d(-9px, -7px, 0) rotate(-14deg) scale(1.06)', offset: .10 },
    { transform: 'translate3d(9px, 2px, 0) rotate(13deg) scale(1.03)', offset: .27 },
    { transform: 'translate3d(-8px, -5px, 0) rotate(-11deg) scale(1.07)', offset: .44 },
    { transform: 'translate3d(7px, 2px, 0) rotate(10deg) scale(1.03)', offset: .60 },
    { transform: 'translate3d(-5px, -3px, 0) rotate(-6deg) scale(1.05)', offset: .75 },
    { transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)', offset: 1 }
  ];

  var HOLD = [
    { transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)' },
    { transform: 'translate3d(0, -11px, 0) rotate(2.5deg) scale(1.025)', offset: .5 },
    { transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)' }
  ];

  /* ------------------------------------------------------------------ 工具 */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function buildMarkup(o) {
    return '' +
      '<div class="rp-anchor">' +
        '<div class="rp-mover">' +
          '<div class="rp-bubble" role="button" tabindex="0" aria-label="' + esc(o.title) + '，点击领取">' +
            '<span class="rp-bubble-t1">' + esc(o.title) + '</span>' +
            '<span class="rp-bubble-t2">' + esc(o.subtitle) + '</span>' +
            (o.closeable ? '<button class="rp-close" type="button" aria-label="关闭红包广告">\u00d7</button>' : '') +
          '</div>' +
          '<div class="rp-pack" role="button" tabindex="0" aria-label="点击领取红包">' +
            '<div class="rp-glow"></div>' +
            '<div class="rp-card">' + SVG + '<div class="rp-shine"></div></div>' +
            COINS +
          '</div>' +
        '</div>' +
      '</div>';
  }

  /* --------------------------------------- 当天只弹窗一次（localStorage）*/
  var STORE_KEY = 'redpacket_dismissed_date';
  var nextDayTimer = null;

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  // 必须使用本地时间。toISOString是UTC，国内用户会等到早上8点才换天。
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function isDismissedToday() {
    try { return window.localStorage.getItem(STORE_KEY) === todayStr(); }
    catch (e) { return false; } // 隐私模式/被禁止存储时降级，每次都显示。
  }

  function markDismissedToday() {
    try { window.localStorage.setItem(STORE_KEY, todayStr()); } catch (e) {}
  }

  function msUntilTomorrow() {
    var n = new Date();
    var t = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 3, 0);
    return t.getTime() - n.getTime();
  }

  /* ------------------------------------------------------------------ 主体 */
  var current = null;

  function init(options) {
    if (current) return current;
    if (typeof document === 'undefined') return null;

    var o = {};
    for (var k in DEFAULTS) if (Object.prototype.hasOwnProperty.call(DEFAULTS, k)) o[k] = DEFAULTS[k];
    if (options) {
      for (var k2 in options) {
        if (Object.prototype.hasOwnProperty.call(options, k2) && options[k2] !== undefined && options[k2] !== null) {
          o[k2] = options[k2];
        }
      }
    }

    // 当天已经点过/关闭 -> 不显示；再挂一个到次日0点的定时器，
    // 让页面一直开着不关的用户第二天也能看到
    if (o.oncePerDay !== false && isDismissedToday()) {
      if (nextDayTimer) clearTimeout(nextDayTimer);
      nextDayTimer = setTimeout(function () {
        nextDayTimer = null;
        if (!current) init(options);
      }, msUntilTomorrow());
      return null;
    }

    var mount = document.documentElement || document.body;
    if (!mount) return null;

    var host = document.createElement('div');
    host.id = HOST_ID;
    host.setAttribute('data-redpacket-float', '1');
    host.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:2147483647;pointer-events:none;';

    var shadow = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    var styleEl = document.createElement('style');
    styleEl.textContent = CSS_TEXT;
    shadow.appendChild(styleEl);

    var holder = document.createElement('div');
    holder.innerHTML = buildMarkup(o);
    while (holder.firstChild) shadow.appendChild(holder.firstChild);

    mount.appendChild(host);

    var mover = shadow.querySelector('.rp-mover');
    var packEl = shadow.querySelector('.rp-pack');
    var bubbleEl = shadow.querySelector('.rp-bubble');
    var closeEl = shadow.querySelector('.rp-close');

    var dir = o.side === 'left' ? -1 : 1;
    var dockRot = 8 * dir;
    var dockScale = .85;
    var dockX = 0;

    // 计算【停靠侧边】的位置：红包中心落在屏幕边缘内侧8px → 只露出一半
    function applyDock() {
      var vw = window.innerWidth || document.documentElement.clientWidth || 1024;
      dockX = dir * (vw / 2 - 8);
      mover.style.setProperty('--rp-dock-x', dockX.toFixed(1) + 'px');
      mover.style.setProperty('--rp-dock-rot', dockRot + 'deg');
      mover.style.setProperty('--rp-dock-rot-in', (3 * dir) + 'deg');
      mover.style.setProperty('--rp-dock-scale', String(dockScale));
      mover.style.setProperty('--rp-in', '62px');
      mover.style.setProperty('--rp-dir', String(dir));
    }
    applyDock();
    mover.classList.add('is-docked');

    var onResize = function () { applyDock(); };
    window.addEventListener('resize', onResize, false);

    var lastAnim = null;
    var timer = null;
    var closed = false;
    var destroyed = false;
    var shown = 0;

    function play(frames, duration, easing) {
      return new Promise(function (resolve) {
        if (lastAnim) lastAnim.cancel();
        var a = mover.animate(frames, {
          duration: duration,
          easing: easing || 'ease-in-out',
          fill: 'both'
        });
        lastAnim = a;
        a.onfinish = function () { resolve(); };
        a.oncancel = function () { resolve(); };
      });
    }

    function sleep(ms) {
      return new Promise(function (resolve) {
        timer = setTimeout(resolve, ms);
      });
    }

    function enterFrames() {
      return [
        { transform: 'translate3d(' + dockX + 'px, 0, 0) rotate(' + dockRot + 'deg) scale(' + dockScale + ')', opacity: 1 },
        { transform: 'translate3d(' + (7 * dir) + 'px, -8px, 0) rotate(' + (-6 * dir) + 'deg) scale(1.08)', opacity: 1, offset: .72 },
        { transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)', opacity: 1 }
      ];
    }

    function exitFrames() {
      return [
        { transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)', opacity: 1 },
        { transform: 'translate3d(' + (-16 * dir) + 'px, 0, 0) rotate(' + (-9 * dir) + 'deg) scale(1.1)', opacity: 1, offset: .2 },
        { transform: 'translate3d(' + dockX + 'px, 0, 0) rotate(' + dockRot + 'deg) scale(' + dockScale + ')', opacity: 1 }
      ];
    }

    function go() {
      if (!o.link) return;
      // 点过就记录，并且把当前这个收起来：新标签打开后回到本页也不会再浮动
      if (o.oncePerDay !== false) {
        markDismissedToday();
        setTimeout(destroy, 0);
      }
      var a = document.createElement('a');
      a.href = o.link;
      a.target = o.target || '_blank';
      a.rel = 'noopener noreferrer';
      a.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;';
      (document.body || mount).appendChild(a);
      a.click();
      setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, 0);
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      closed = true;
      if (timer) clearTimeout(timer);
      if (lastAnim) { try { lastAnim.cancel(); } catch (e) {} }
      window.removeEventListener('resize', onResize, false);
      if (host.parentNode) host.parentNode.removeChild(host);
      if (current && current.host === host) current = null;
    }

    // 用户主动关闭（点 ×）：当天不再出现
    function close() {
      if (closed) return;
      if (o.oncePerDay !== false) markDismissedToday();
      destroy();
    }

    packEl.addEventListener('click', function (e) { e.preventDefault(); go(); });
    if (bubbleEl) {
      bubbleEl.addEventListener('click', function (e) {
        if (closeEl && (e.target === closeEl || (e.target.closest && e.target.closest('.rp-close')))) return;
        e.preventDefault();
        go();
      });
      bubbleEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
      });
    }
    packEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
    if (closeEl) {
      closeEl.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        close();
      });
    }

    // 节奏：停靠侧边 → 飞出 1.3s → 抖动 2.6s → 中间停留 2.8s → 缩回侧边 1.2s
    var T_ENTER = 1300;
    var T_SHAKE = 2600;
    var T_HOLD = 1400;
    var T_EXIT = 1200;

    async function run() {
      var wait = o.delay;
      while (!closed && !destroyed) {
        // ① 停靠侧边（只露一半），等一会
        mover.classList.add('is-docked');
        await sleep(wait);
        wait = o.interval;
        if (closed || destroyed) break;

        // ② 飞到页面中间
        mover.classList.remove('is-docked');
        await play(enterFrames(), T_ENTER, 'cubic-bezier(.2,.9,.25,1)');
        if (closed || destroyed) break;

        // ③ 抖动几下
        await play(SHAKE, T_SHAKE, 'ease-in-out');
        if (closed || destroyed) break;

        // ④ 在中间停住，留出点击时间
        await play(HOLD, T_HOLD, 'ease-in-out');
        if (closed || destroyed) break;

        await play(HOLD, T_HOLD, 'ease-in-out');
        if (closed || destroyed) break;

        // ⑤ 收回侧边，缩着露出一半（不消失）
        await play(exitFrames(), T_EXIT, 'cubic-bezier(.2,.85,.3,1)');
        if (closed || destroyed) break;

        shown++;
        if (lastAnim) { try { lastAnim.cancel(); } catch (e) {} lastAnim = null; }
        mover.classList.add('is-docked');
        if (o.maxShow > 0 && shown >= o.maxShow) break;
      }
    }

    run();

    current = {
      host: host,
      shadow: shadow,
      options: o,
      close: close,
      destroy: destroy,
      get shown() { return shown; }
    };
    return current;
  }

  function destroy() {
    if (current) current.destroy();
  }

  window.RedPacketFloat = {
    version: VERSION,
    init: init,
    destroy: destroy,
    get instance() { return current; }
  };

  /* ------------------------------------------------------------------ 自动初始化 */
  var cs = document.currentScript;
  if (!cs) {
    var list = document.getElementsByTagName('script');
    cs = list[list.length - 1];
  }
  if (cs && cs.hasAttribute('data-redpacket-auto')) {
    var autoOpts = {};
    var map = {
      'data-redpacket-link': 'link',
      'data-redpacket-target': 'target',
      'data-redpacket-title': 'title',
      'data-redpacket-subtitle': 'subtitle',
      'data-redpacket-side': 'side',
      'data-redpacket-delay': 'delay',
      'data-redpacket-interval': 'interval',
      'data-redpacket-max-show': 'maxShow'
    };
    for (var attr in map) {
      if (Object.prototype.hasOwnProperty.call(map, attr) && cs.hasAttribute(attr)) {
        var raw = cs.getAttribute(attr);
        var field = map[attr];
        autoOpts[field] = (field === 'delay' || field === 'interval' || field === 'maxShow') ? parseInt(raw, 10) : raw;
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { init(autoOpts); });
    } else {
      init(autoOpts);
    }
  }
})();

