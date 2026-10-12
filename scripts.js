/* ============================================================
   🇮🇪 Beautiful Ireland with Everyone — Shared Scripts
   ============================================================ */

// 1) (제거됨 2026-09-06) 내부 링크 클릭 시 220ms 페이드아웃 후 이동하던 코드.
//    모든 페이지 이동을 0.2초씩 늦춰 체감 속도만 깎았다. 진입 애니메이션(body pageFadeIn)만 남긴다.


// 2) Reveal-on-scroll — .reveal 섹션과 .stagger-fade 그리드를 화면 진입 시 발동
//    .reveal / .stagger-fade 를 감추는 CSS는 <html class="js">에만 걸려 있어서,
//    JS가 꺼져 있거나 실패해도 콘텐츠는 그대로 보입니다. (index 등 <head> 인라인 스니펫 참고)
(function setupScrollReveal() {
  var targets = document.querySelectorAll('.reveal, .stagger-fade, .dt-map');
  if (!targets.length) return;

  function showAll() {
    targets.forEach(function (el) { el.classList.add('in-view'); });
  }

  if (!('IntersectionObserver' in window)) { showAll(); return; }

  var observerWorked = false;
  var io = new IntersectionObserver(function (entries) {
    observerWorked = true;
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

  targets.forEach(function (el) {
    // 첫 화면에 이미 들어와 있는 요소는 관찰 없이 바로 표시 — 새로고침 시 깜빡임 방지
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
      el.classList.add('in-view');
    } else {
      io.observe(el);
    }
  });

  // 안전장치 — 관찰자가 단 한 번도 콜백을 주지 않았을 때만 전부 표시.
  // (정상 동작 중이라면 아무것도 하지 않는다 — 스크롤 리빌을 망치지 않도록)
  setTimeout(function () { if (!observerWorked) showAll(); }, 3000);
})();

// 3) 햄버거 메뉴 — aria-expanded, 바깥 클릭·Esc·링크 클릭으로 닫힘, 열린 동안 뒤 페이지 스크롤 잠금
(function setupMenu() {
  var nav = document.querySelector('nav.topnav');
  var ham = nav ? nav.querySelector('.ham') : null;
  var menu = nav ? nav.querySelector('.menu') : null;
  if (!ham || !menu) return;
  var backdrop = document.createElement('div');
  backdrop.className = 'menu-backdrop';
  document.body.appendChild(backdrop);
  function setOpen(open) {
    menu.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    backdrop.classList.toggle('show', open);
    document.body.classList.toggle('menu-locked', open);
    ham.setAttribute('aria-expanded', open ? 'true' : 'false');
    ham.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  }
  ham.addEventListener('click', function () { setOpen(!menu.classList.contains('open')); });
  backdrop.addEventListener('click', function () { setOpen(false); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) { setOpen(false); ham.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 960 && menu.classList.contains('open')) setOpen(false); });
})();

// 4) FAQ 토글이 이미 inline onclick으로 처리되므로 별도 처리 없음

// 5) 카톡 문의 헬퍼 — 메시지를 클립보드에 복사하고 카톡 오픈채팅을 새 탭으로 염
//    페이지별 inquireXxx() 함수는 각 페이지 inline 스크립트에서 컨텍스트를 만들어 호출
// 인앱 브라우저(카톡·인스타)와 사파리는 클릭 제스처가 끊기면 window.open()을 차단합니다.
// 그래서 alert()·프라미스 콜백 뒤가 아니라, 클릭과 같은 동기 흐름에서 바로 열고
// 차단되면 현재 탭으로 이동합니다. (서비스 페이지들과 동일한 방식)
var KAKAO_OPENCHAT_URL = 'https://open.kakao.com/o/suSTEFsi';

window.copyTextSync = function (text) {
  // 1) 동기 폴백(execCommand)을 먼저 — 인앱 브라우저에서 가장 확실함
  var ok = false;
  try {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed; top:0; left:0; width:1px; height:1px; opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    ok = document.execCommand('copy');
    document.body.removeChild(ta);
  } catch (e) { ok = false; }
  // 2) 최신 클립보드 API도 시도 — 실패해도 조용히 무시(콘솔 오류 방지)
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      var pr = navigator.clipboard.writeText(text);
      if (pr && pr.then) { pr.then(function () {}, function () {}); }
      ok = true;
    }
  } catch (e) { /* 무시 */ }
  return ok;
};

// 카톡·인스타 인앱 브라우저는 window.open()을 자주 막고, 막혔는지도 정확히 알려주지 않는다.
// 그래서 (1) 인앱 브라우저면 새 창 시도 없이 바로 현재 탭에서 연다 (인앱이 open.kakao.com을 알아서 처리)
//        (2) 일반 브라우저는 새 창 시도 후 실패하면 현재 탭으로.
window.isInAppBrowser = function () {
  var ua = navigator.userAgent || '';
  return /KAKAOTALK|Instagram|FBAN|FBAV|Line\/|NAVER\(inapp|DaumApps|everytimeApp/i.test(ua);
};
window.openLinkSafely = function (url) {
  if (window.isInAppBrowser()) { window.location.href = url; return; }
  var win = null;
  try { win = window.open(url, '_blank'); } catch (e) { win = null; }
  if (!win) window.location.href = url;
};

// 문의 버튼이 진짜 <a href="https://open.kakao.com/..." target="_blank">이면
// 브라우저가 링크 이동을 직접 처리하게 두고(팝업 차단·인앱 문제 없음), JS는 메시지 복사만 한다.
// 캡처 단계에서 "이 클릭은 카톡 링크에서 시작됐다"는 표시를 남기고, 같은 클릭 안에서만 유효하다.
window.__kakaoNativeNav = false;
document.addEventListener('click', function (e) {
  var a = e.target && e.target.closest ? e.target.closest('a[href*="open.kakao.com"]') : null;
  if (!a) return;
  window.__kakaoNativeNav = true;
  setTimeout(function () { window.__kakaoNativeNav = false; }, 0);
}, true);

window.showToast = function (msg) {
  var el = document.getElementById('site-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'site-toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.style.cssText = 'position:fixed; left:50%; bottom:calc(96px + env(safe-area-inset-bottom)); transform:translateX(-50%);'
      + ' background:rgba(18,29,48,0.96); color:#fff; padding:14px 20px; border-radius:12px;'
      + ' font-size:14px; font-weight:600; line-height:1.5; max-width:88vw; text-align:center;'
      + ' box-shadow:0 8px 28px rgba(0,0,0,0.25); z-index:99999; opacity:0; transition:opacity .22s;';
    (document.querySelector('main') || document.body).appendChild(el);
  }
  el.textContent = msg;
  requestAnimationFrame(function () { el.style.opacity = '1'; });
  clearTimeout(el._t);
  el._t = setTimeout(function () { el.style.opacity = '0'; }, 3200);
};

window.copyAndOpenKakao = function (message) {
  var copied = window.copyTextSync(message);
  window.showToast(copied
    ? '문의 메시지를 복사했습니다. 카톡 채팅창에 붙여넣기 해주세요.'
    : '카톡 채팅창을 엽니다. 문의 내용을 적어주세요.');
  // 카톡 링크(<a href>) 클릭에서 온 호출이면 브라우저가 링크를 열고 있으므로 여기서 또 열지 않는다
  if (window.__kakaoNativeNav) return;
  window.openLinkSafely(KAKAO_OPENCHAT_URL);
};

// 6) 페이지별 컨텍스트 없는 일반 문의들 — 단순 메시지 → 클립보드 복사
window.inquireCustom = function () {
  copyAndOpenKakao([
    '안녕하세요! 맞춤 여행 문의드립니다.',
    '✏️ 관심 있는 종류:',
    '   ☐ 맞춤 1일 코스',
    '   ☐ 2박 3일 이상 장기 여행',
    '   ☐ 통역·현지 코디네이션',
    '   ☐ 기자단·취재 동행',
    '🗓️ 희망 일정: ',
    '👥 인원: ',
    '🎯 관심사: ',
    '확인 부탁드립니다 🙏'
  ].join('\n'));
};

window.inquireGeneral = function () {
  copyAndOpenKakao([
    '안녕하세요! Andrew의 아일랜드 동행 문의드립니다.',
    '🛎️ 관심 있는 서비스:',
    '   ☐ 공항 픽업·드랍',
    '   ☐ 당일 로드트립',
    '   ☐ 이사 (간단 이사·전체 이사)',
    '   ☐ 성지순례·피정',
    '   ☐ 맞춤 여행·장기 여행',
    '🗓️ 희망 날짜: ',
    '👥 인원: ',
    '확인 부탁드립니다 🙏'
  ].join('\n'));
};

window.inquireMusic = function () {
  copyAndOpenKakao([
    '안녕하세요! Classical Music for Everyone 음악 봉사 프로젝트 문의드립니다.',
    '🎵 관심 분야:',
    '   ☐ 후원·기부',
    '   ☐ 연주자·자원봉사 참여',
    '   ☐ 공연 요청 (요양원·기관 등)',
    '   ☐ 단순 궁금증',
    '함께 이야기 나누고 싶습니다 🙏'
  ].join('\n'));
};


// 6.5) 모금 현황 패널 — fund.json 을 읽어 #fund-panel 을 채웁니다.
//      숫자를 바꿀 때는 fund.json 한 파일만 고치면 모든 페이지에 반영됩니다.
//      파일이 없거나 raised 값이 없으면 패널은 조용히 숨겨둡니다 (빈 칸이 보이지 않도록).
(function setupFundPanel() {
  var panel = document.getElementById('fund-panel');
  if (!panel) return;

  // 서브폴더(services/)에서도 루트의 fund.json 을 찾도록 경로를 맞춥니다
  var base = location.pathname.indexOf('/services/') >= 0 ? '../' : './';

  fetch(base + 'fund.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || typeof d.raised !== 'number' || !(d.raised > 0)) return;

      function euro(n) {
        return n.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
      }
      function ymd(v) {
        var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
        return m ? (m[1] + '년 ' + (+m[2]) + '월 ' + (+m[3]) + '일') : null;
      }

      document.getElementById('fund-amount').textContent = euro(d.raised);
      var ft = document.getElementById('fact-trips'), fd = document.getElementById('fact-trips-date');
      if (ft && typeof d.trips === 'number' && d.trips > 0) ft.textContent = d.trips + '건';
      if (fd && ymd(d.updated)) fd.textContent = '(' + ymd(d.updated) + ' 기준)';

      var meta = [];
      var since = ymd(d.since);
      if (since) meta.push(since + '부터');
      if (typeof d.trips === 'number' && d.trips > 0) meta.push('정산을 마친 동행 <b>' + d.trips + '건</b>');
      var metaEl = document.getElementById('fund-meta');
      metaEl.innerHTML = meta.length
        ? meta.join(' · ') + '에서 모였습니다.'
        : '';

      // 배분 내역 — gross·operating·vehicle 이 모두 있을 때만 보여줍니다
      if (typeof d.gross === 'number' && typeof d.operating === 'number' && typeof d.vehicle === 'number') {
        var split = document.getElementById('fund-split');
        split.innerHTML =
          '<div><dt>받은 금액</dt><dd>\u20ac' + euro(d.gross) + '</dd></div>' +
          '<div><dt>운영 실비</dt><dd>\u20ac' + euro(d.operating) + '</dd></div>' +
          '<div><dt>차량 예비비</dt><dd>\u20ac' + euro(d.vehicle) + '</dd></div>';
        split.hidden = false;
      }

      var note = [];
      if (d.note) note.push(d.note);
      var upd = ymd(d.updated);
      if (upd) note.push(upd + ' 기준 · 운영 장부에서 옮겨 적습니다.');
      document.getElementById('fund-note').textContent = note.join(' ');

      panel.hidden = false;
    })
    .catch(function () { /* 조용히 무시 — 패널은 숨겨진 채로 둡니다 */ });
})();


// 7) 방문자 분석 — 카톡 문의 클릭 집계 (GoatCounter 이벤트)
//    GoatCounter가 없거나 로드 전이면 아무 일도 하지 않음 — 사이트 동작에 영향 없음
(function setupKakaoTracking() {
  function track() {
    try {
      if (window.goatcounter && window.goatcounter.count) {
        var page = location.pathname.split('/').pop() || 'index.html';
        window.goatcounter.count({ path: 'kakao-click/' + page, title: '카톡 문의 클릭 — ' + page, event: true });
      }
    } catch (e) { /* 무시 */ }
  }
  // (a) 카톡 오픈채팅 직접 링크 클릭
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href*="open.kakao.com"]') : null;
    if (a && !a.onclick) track();   // onclick이 달린 버튼은 아래 래퍼에서 집계
  });
  // (b) 문의 버튼(클립보드 복사형) — copyAndOpenKakao 호출 시 집계
  var orig = window.copyAndOpenKakao;
  if (typeof orig === 'function') {
    window.copyAndOpenKakao = function (message) { track(); return orig(message); };
  }
})();

// ============================================================
// 6) 클릭 가능한 div의 키보드 접근성 (WCAG 2.1.1 / 4.1.2)
//    onclick만 달린 div는 마우스로만 열립니다. 키보드 사용자와
//    스크린리더, 그리고 접근성 트리를 읽는 AI 에이전트가 같은
//    동작을 하도록 role/tabindex/aria를 붙이고 Enter·Space를 연결합니다.
// ============================================================
(function setupClickableA11y() {
  // (a) FAQ 아코디언 — 펼침 상태를 aria-expanded로 노출
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    if (!q) return;
    q.setAttribute('role', 'button');
    q.setAttribute('tabindex', '0');
    q.setAttribute('aria-expanded', item.classList.contains('open') ? 'true' : 'false');
    if (a) {
      if (!a.id) a.id = 'faq-a-' + Math.random().toString(36).slice(2, 9);
      q.setAttribute('aria-controls', a.id);
    }
    q.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        item.classList.toggle('open');
        q.setAttribute('aria-expanded', item.classList.contains('open') ? 'true' : 'false');
      }
    });
    item.addEventListener('click', function () {
      q.setAttribute('aria-expanded', item.classList.contains('open') ? 'true' : 'false');
    });
  });

  // (b) 그 밖의 onclick div (코스 카드·서비스 카드 등)
  document.querySelectorAll('div[onclick]').forEach(function (el) {
    if (el.classList.contains('faq-item')) return;      // 위에서 처리
    if (el.querySelector('a, button')) return;          // 내부에 진짜 버튼이 있으면 그쪽이 접근 경로
    if (el.hasAttribute('tabindex')) return;
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    if (!el.hasAttribute('aria-label')) {
      var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (t) el.setAttribute('aria-label', t.slice(0, 80));
    }
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); el.click(); }
    });
  });

  // (c) 가로 스크롤 영역은 키보드로도 스크롤되어야 함 (axe: scrollable-region-focusable)
  document.querySelectorAll('.tour-pricing-table-wrap, .places-gallery-wrap').forEach(function (el) {
    if (!el.hasAttribute('tabindex')) {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'region');
      if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', '가로로 스크롤되는 표');
    }
  });
})();

// ============================================================
// 8) 모션·상호작용 (2026-10-11 정리) — 내비 스크롤 상태, FAQ 높이 애니메이션 래퍼,
//    서브페이지 자동 리빌, 모금액 카운트업. 패럴랙스·카드 기울기·진행선은 2026-10-11에 뺐다.
//    prefers-reduced-motion 이면 JS 모션은 건너뛴다 (CSS 쪽은 styles.css 에서 끔).
// ============================================================
(function setupMotion() {
  var reduce = false;
  try { reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  // (a) 내비: 스크롤하면 .is-scrolled (홈에서는 사진 위 투명 → 흰 바탕)
  var nav = document.querySelector('nav.topnav');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || window.pageYOffset || 0;
      if (nav) nav.classList.toggle('is-scrolled', y > 24);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // (d) FAQ 답을 .faq-a-inner 로 감싼다 — CSS grid 0fr→1fr 높이 애니메이션용
  document.querySelectorAll('.faq-a').forEach(function (a) {
    if (a.querySelector(':scope > .faq-a-inner')) return;
    var inner = document.createElement('div');
    inner.className = 'faq-a-inner';
    while (a.firstChild) inner.appendChild(a.firstChild);
    a.appendChild(inner);
  });

  // (e) 서브페이지 자동 리빌 — index 처럼 .reveal 을 직접 쓰지 않은 페이지에만.
  //     고정 요소(모달 등)를 품은 컨테이너는 제외한다 (transform 이 fixed 의 기준이 되는 것을 막기 위해).
  if (!document.querySelector('.reveal') && document.querySelector('main')) {
    var added = [];
    document.querySelectorAll('main > section .section-title, main > section > .container, main > section > div[class]').forEach(function (el) {
      if (el.classList.contains('reveal') || el.closest('.reveal')) return;
      if (el.querySelector('.modal-overlay, [style*="position:fixed"], [style*="position: fixed"]')) return;
      if (el.closest('header.hero')) return;
      el.classList.add('reveal');
      added.push(el);
    });
    // 카드 그리드는 자식 stagger
    document.querySelectorAll('main .feature-grid, main .use-grid, main .package-grid, main .channel-grid, main .mission-grid, main .diff-grid, main .pg-grid, main .other-services .links').forEach(function (g) {
      if (g.children.length > 1 && g.children.length < 13) { g.classList.add('auto-stagger'); added.push(g); }
    });
    if (added.length && 'IntersectionObserver' in window) {
      var io2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in-view'); io2.unobserve(en.target); } });
      }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
      added.forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.92) el.classList.add('in-view');
        else io2.observe(el);
      });
      setTimeout(function () { added.forEach(function (el) { el.classList.add('in-view'); }); }, 4000);
    } else {
      added.forEach(function (el) { el.classList.add('in-view'); });
    }
  }

  // (f) 모금액 카운트업 — 패널이 보일 때 0에서 실제 값까지 (setupFundPanel 이 값을 채운 뒤)
  var amountEl = document.getElementById('fund-amount');
  if (amountEl && !reduce && 'IntersectionObserver' in window) {
    var done = false;
    var io3 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting || done) return;
        var raw = (amountEl.textContent || '').replace(/[^\d.]/g, '');
        var target = parseFloat(raw);
        if (!(target > 0)) return;
        done = true; io3.disconnect();
        var decimals = raw.indexOf('.') >= 0 ? raw.split('.')[1].length : 0;
        var start = null, dur = 1400;
        function frame(ts) {
          if (!start) start = ts;
          var p = Math.min(1, (ts - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          var v = target * eased;
          amountEl.textContent = v.toLocaleString('ko-KR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
          if (p < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
    }, { threshold: 0.4 });
    io3.observe(amountEl);
  }
})();

// ============================================================
// 9) 빠른 문의 막대(.dock) — 히어로의 문의 버튼이 보이는 동안·푸터가 보이는 동안 숨긴다.
//    누르면 링크가 카톡을 열고, data-inquire 에 적힌 페이지별 함수가 문의 메시지를 복사한다.
// ============================================================
(function setupDock() {
  var dock = document.querySelector('.dock');
  if (!dock) return;
  document.body.classList.add('has-dock');
  // 문의 버튼이 이미 보이는 구역(히어로 버튼, 홈의 메시지 만들기 카드)과 푸터가 보이면 숨긴다
  var zones = Array.prototype.slice.call(document.querySelectorAll('[data-dock-hide], header.hero .cta, footer.contact'));
  var visible = new Set();
  var scrolled = false;
  function update() {
    var show = scrolled && visible.size === 0;
    dock.classList.toggle('is-hidden', !show);
    dock.setAttribute('aria-hidden', show ? 'false' : 'true');
    dock.tabIndex = show ? 0 : -1;
  }
  function onScroll() { scrolled = (window.scrollY || 0) > 320; update(); }
  window.addEventListener('scroll', onScroll, { passive: true });
  if ('IntersectionObserver' in window && zones.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) visible.add(en.target); else visible.delete(en.target); });
      update();
    }, { rootMargin: '0px 0px -60px 0px' });
    zones.forEach(function (z) { io.observe(z); });
  }
  onScroll();
  dock.addEventListener('click', function () {
    var fn = window[dock.getAttribute('data-inquire') || 'inquireGeneral'];
    try { (typeof fn === 'function' ? fn : window.inquireGeneral)(); } catch (e) { window.inquireGeneral && window.inquireGeneral(); }
  });
})();

// ============================================================
// 10) 홈 — 문의 메시지 만들기. 고른 값으로 카톡에 보낼 문장을 만들고, 보내기를 누르면 복사한다.
// ============================================================
(function setupComposer() {
  var form = document.getElementById('ask-form');
  if (!form) return;
  var bubble = document.getElementById('ask-bubble');
  var hint = document.getElementById('ask-hint');
  var dateEl = document.getElementById('ask-date');
  var out = document.getElementById('ask-people');
  var minus = document.getElementById('ask-minus');
  var plus = document.getElementById('ask-plus');
  var label = document.getElementById('ask-people-label');
  var people = 2;
  var SVC = {
    airport:    { name: '공항 픽업·드랍', unit: '인원', min: 1, max: 6, extra: '도착 픽업/출발 드랍: \n항공편명: \n숙소 주소: \n캐리어 수: ', hint: '도착 픽업인지 출발 드랍인지, 항공편명과 숙소 주소를 함께 보내 주시면 금액을 바로 안내합니다.' },
    tour:       { name: '당일 로드트립', unit: '인원', min: 1, max: 6, extra: '가고 싶은 코스: ', hint: '가고 싶은 코스 이름을 함께 적어 주세요. 1~2인은 모집 일정 합류도 가능합니다.' },
    moving:     { name: '이사', unit: '작업 인원', min: 1, max: 2, extra: '출발지: \n도착지: \n짐의 양: \n층수·엘리베이터: ', hint: '출발지와 도착지, 짐의 양(캐리어·박스 수, 가구), 층수와 엘리베이터 여부를 함께 적어 주세요.' },
    pilgrimage: { name: '성지순례·피정', unit: '인원', min: 1, max: 6, extra: '가고 싶은 성지·미사 일정: ', hint: '가고 싶은 성지나 원하시는 미사 시간이 있으면 함께 적어 주세요.' },
    custom:     { name: '맞춤 여행·통역 동행', unit: '인원', min: 1, max: 6, extra: '일정과 관심사: ', hint: '기간, 관심사, 예산을 아는 만큼 적어 주세요. 후보 일정을 먼저 보내 드립니다.' }
  };
  var today = new Date();
  try { dateEl.min = today.toLocaleDateString('en-CA', { timeZone: 'Europe/Dublin' }); } catch (e) {}
  function svcKey() { var c = form.querySelector('input[name="ask-svc"]:checked'); return c ? c.value : 'airport'; }
  function fmtDate(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
    if (!m) return '미정';
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    var w = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
    return (+m[1]) + '년 ' + (+m[2]) + '월 ' + (+m[3]) + '일 (' + w + ')';
  }
  function message(withExtra) {
    var s = SVC[svcKey()];
    var unitText = svcKey() === 'moving' ? (people === 2 ? '2인 작업 (운반 인력 추가)' : '1인 작업') : people + '명';
    var lines = ['안녕하세요. 아일랜드 동행 문의드립니다.', '· 서비스: ' + s.name, '· 날짜: ' + fmtDate(dateEl.value), '· ' + s.unit + ': ' + unitText];
    if (withExtra) lines.push('', s.extra.replace(/\\n/g, '\n'));
    return lines.join('\n');
  }
  function render() {
    var s = SVC[svcKey()];
    people = Math.min(Math.max(people, s.min), s.max);
    label.textContent = s.unit;
    out.textContent = svcKey() === 'moving' ? (people === 2 ? '2인' : '1인') : people + '명';
    minus.disabled = people <= s.min; plus.disabled = people >= s.max;
    hint.textContent = s.hint;
    // 말풍선: 고른 값만 굵게
    var esc = function (t) { return String(t).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };
    var unitText = svcKey() === 'moving' ? (people === 2 ? '2인 작업 (운반 인력 추가)' : '1인 작업') : people + '명';
    bubble.innerHTML = '안녕하세요. 아일랜드 동행 문의드립니다.\n· 서비스: <span class="b-filled">' + esc(s.name) + '</span>\n· 날짜: <span class="b-filled">' + esc(fmtDate(dateEl.value)) + '</span>\n· ' + esc(s.unit) + ': <span class="b-filled">' + esc(unitText) + '</span>';
  }
  var lastSvc = svcKey();
  form.addEventListener('change', function () {
    var k = svcKey();
    if (k !== lastSvc) {
      if (k === 'moving') people = 1;
      else if (lastSvc === 'moving') people = 2;
      lastSvc = k;
    }
    render();
  });
  dateEl.addEventListener('input', render);
  minus.addEventListener('click', function () { people--; render(); });
  plus.addEventListener('click', function () { people++; render(); });
  if (!/^\d/.test(dateEl.value)) { /* 날짜를 비워 두면 "미정" */ }
  render();
  window.inquireComposer = function () { window.copyAndOpenKakao(message(true)); };
})();

// ============================================================
// 11) 홈 — 당일 코스 지도: 목록에 마우스·키보드 초점을 두면 그 경로가 금색으로
// ============================================================
(function setupDayMap() {
  var list = document.getElementById('dt-list');
  var map = document.getElementById('dt-map');
  if (!list || !map) return;
  function on(key) {
    map.querySelectorAll('[data-dest]').forEach(function (el) { el.classList.toggle('is-on', el.getAttribute('data-dest') === key); });
    list.querySelectorAll('a[data-dest]').forEach(function (el) { el.classList.toggle('is-on', el.getAttribute('data-dest') === key); });
  }
  list.querySelectorAll('a[data-dest]').forEach(function (a) {
    var k = a.getAttribute('data-dest');
    a.addEventListener('mouseenter', function () { on(k); });
    a.addEventListener('focus', function () { on(k); });
  });
  map.querySelectorAll('.dt-label[data-dest]').forEach(function (a) {
    a.addEventListener('mouseenter', function () { on(a.getAttribute('data-dest')); });
  });
  list.addEventListener('mouseleave', function () { on(null); });
  map.addEventListener('mouseleave', function () { on(null); });
})();

// ============================================================
// 12) 홈 — 사진 줄 이전·다음 버튼
// ============================================================
(function setupRail() {
  var rail = document.getElementById('jr-rail');
  if (!rail) return;
  var prev = document.querySelector('.jr-btn.prev');
  var next = document.querySelector('.jr-btn.next');
  function step() { var it = rail.querySelector('.jr-item'); return it ? it.getBoundingClientRect().width + 16 : 300; }
  function sync() {
    if (!prev || !next) return;
    prev.disabled = rail.scrollLeft < 8;
    next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8;
  }
  if (prev) prev.addEventListener('click', function () { rail.scrollBy({ left: -step() * 2, behavior: 'smooth' }); });
  if (next) next.addEventListener('click', function () { rail.scrollBy({ left: step() * 2, behavior: 'smooth' }); });
  rail.addEventListener('scroll', function () { window.requestAnimationFrame(sync); }, { passive: true });
  window.addEventListener('resize', sync);
  sync();
})();

// ============================================================
// 13) 가운뎃점(·)이 줄 첫머리에 오지 않게 (2026-10-12)
//     Chrome은 word-break:keep-all 이어도 한글과 U+00B7 사이에서 줄을 바꿔 "이사 / ·성지순례"처럼 된다.
//     점 앞에만 보이지 않는 단어 결합자(U+2060)를 넣어 점이 앞 낱말에 붙게 한다 — 점 뒤에서는 그대로 줄이 바뀐다.
//     원본 HTML(검색엔진·llms-full이 읽는 글)은 그대로이고, 나중에 JS가 그리는 카드·창에도 적용된다.
// ============================================================
(function setupDotJoin() {
  var WJ = '\u2060', DOT = '\u00b7', NBSP = '\u00a0';
  var RE = /(^|[^\s\u2060])\u00b7/g;      // 붙여 쓴 점: 앞에 단어 결합자
  var RE_SPACED = / \u00b7(?=\s)/g;         // 띄어 쓴 "가 · 나": 점 앞 공백을 줄바꿈 없는 공백으로
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, OPTION: 1, SELECT: 1, INPUT: 1 };
  function fix(root) {
    if (!root || SKIP[root.nodeName]) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p || SKIP[p.nodeName] || n.nodeValue.indexOf(DOT) < 0) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var list = [], n;
    while ((n = walker.nextNode())) list.push(n);
    list.forEach(function (t) {
      var v = t.nodeValue.replace(RE_SPACED, NBSP + DOT).replace(RE, '$1' + WJ + DOT);
      if (v !== t.nodeValue) t.nodeValue = v;
    });
  }
  function run() {
    fix(document.body);
    if (!('MutationObserver' in window)) return;
    new MutationObserver(function (records) {
      records.forEach(function (r) {
        r.addedNodes.forEach(function (a) {
          if (a.nodeType === 1) fix(a);
          else if (a.nodeType === 3 && a.parentNode) fix(a.parentNode);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();

// ============================================================
// 14) 모션 강화 (2026-10-12) — 사진 액자 열기, 요금 그래프·진행 순서 선 그리기,
//     계산기 금액 반응, 이사 짐칸 비교(빈 짐칸 → 가득 실은 날). CSS 는 styles.css "모션 강화".
//     모두 화면에 들어올 때 한 번만. 줄임 모션이면 건너뛴다(짐칸 비교 버튼은 그대로 동작).
// ============================================================
(function setupMotion2() {
  var reduce = false;
  try { reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var hasIO = 'IntersectionObserver' in window;

  function onceVisible(el, cb, opts) {
    if (!hasIO) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { io.disconnect(); cb(); } });
    }, opts || { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });
    io.observe(el);
  }

  // (a) 사진 — 액자가 열리듯. 첫 화면에 이미 보이는 사진·창 안의 사진은 건드리지 않는다
  if (!reduce && hasIO) {
    var PHOTOS = '.svc-media img, .jr-img img, .op-img img, .mp-img img, .ab-vphotos img, .load-row img, .pg-media img';
    var batch = 0, batchTimer = null;
    document.querySelectorAll(PHOTOS).forEach(function (img) {
      if (img.closest('.modal, .modal-overlay, [hidden]')) return;
      var r = img.getBoundingClientRect();
      if (r.width === 0 || r.top < window.innerHeight * 0.9) return;
      img.classList.add('ph');
      onceVisible(img, function () {
        // 같은 순간 들어온 사진끼리는 0.09초씩 차례로
        var delay = batch++ * 90;
        clearTimeout(batchTimer); batchTimer = setTimeout(function () { batch = 0; }, 120);
        setTimeout(function () {
          img.classList.add('ph-in');
          setTimeout(function () { img.classList.remove('ph', 'ph-in'); }, 1500);
        }, delay);
      }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });
    });
  }

  // (b) 거리별 요금 그래프 — 선이 왼쪽부터 그어지고 점·금액이 차례로
  document.querySelectorAll('.km-chart').forEach(function (chart) {
    var line = chart.querySelector('.line');
    if (reduce || !hasIO || !line || !line.getTotalLength) return;
    var len = Math.ceil(line.getTotalLength());
    line.style.strokeDasharray = len;
    line.style.strokeDashoffset = len;
    chart.classList.add('kc-pre');
    var pts = chart.querySelectorAll('.pt'), labs = chart.querySelectorAll('.lab'), guides = chart.querySelectorAll('.guide');
    [pts, labs, guides].forEach(function (list) {
      list.forEach(function (el, i) { el.style.transitionDelay = (0.45 + i * 0.16) + 's'; });
    });
    onceVisible(chart, function () {
      chart.classList.add('kc-in');
      line.style.strokeDashoffset = 0;
    }, { threshold: 0.35 });
  });

  // (c) 진행 순서(공항·이사) — 위 선이 차례로 그어진다
  document.querySelectorAll('.timeline').forEach(function (tl) {
    if (reduce || !hasIO) return;
    if (tl.getBoundingClientRect().top < window.innerHeight * 0.85) return;
    tl.classList.add('tl-pre');
    onceVisible(tl, function () { tl.classList.add('tl-in'); }, { threshold: 0.25 });
  });

  // (d) 계산기 금액 — 숫자가 바뀌면 한 번 반응. 글자는 바로 최종값(문의 메시지가 이 값을 읽는다)
  if (!reduce && 'MutationObserver' in window) {
    document.querySelectorAll('.result-price').forEach(function (el) {
      var last = el.textContent;
      new MutationObserver(function () {
        if (el.textContent === last) return;
        last = el.textContent;
        el.classList.remove('is-bumped');
        void el.offsetWidth;
        el.classList.add('is-bumped');
      }).observe(el, { childList: true, characterData: true, subtree: true });
      el.addEventListener('animationend', function () { el.classList.remove('is-bumped'); });
    });
  }

  // (e) 이사 짐칸 비교 — 화면에 들어오면 빈 짐칸에서 가득 실은 날로 한 번 차오른다. 버튼으로 다시 볼 수 있다
  document.querySelectorAll('[data-load-compare]').forEach(function (fig) {
    var btns = fig.querySelectorAll('[data-show]');
    var cap = fig.querySelector('.lc-cap');
    var timer = null;
    function set(state, animate) {
      fig.setAttribute('data-state', state);
      btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-show') === state ? 'true' : 'false'); });
      if (cap && cap.getAttribute('data-' + state)) cap.textContent = cap.getAttribute('data-' + state);
      if (animate && !reduce) {
        fig.classList.add('is-moving');
        clearTimeout(timer);
        timer = setTimeout(function () { fig.classList.remove('is-moving'); }, 1300);
      }
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () { set(b.getAttribute('data-show'), true); });
    });
    if (reduce || !hasIO) return;               // 처음부터 가득 실은 사진
    if (fig.getBoundingClientRect().top < window.innerHeight * 0.6) return;  // 이미 보이는 자리면 그대로
    fig.classList.add('lc-instant');           // 화면 밖에서 빈 짐칸으로 바꿀 때는 움직이지 않게
    set('empty', false);
    void fig.offsetWidth;
    fig.classList.remove('lc-instant');
    var imgs = fig.querySelectorAll('img');
    onceVisible(fig, function () {
      var ready = Array.prototype.map.call(imgs, function (im) {
        im.loading = 'eager';
        return (im.decode ? im.decode() : Promise.resolve()).catch(function () {});
      });
      Promise.all(ready).then(function () {
        setTimeout(function () { if (fig.getAttribute('data-state') === 'empty') set('full', true); }, 650);
      });
    }, { threshold: 0.45 });
  });
})();
