/* ============================================================
   🇮🇪 Beautiful Ireland with Everyone — Shared Scripts
   ============================================================ */

// 1) 페이지 전환 — 같은 사이트 내부 링크 클릭 시 부드러운 페이드아웃 후 이동
(function setupPageTransitions() {
  // prefers-reduced-motion 사용자에겐 적용 안 함
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.addEventListener('click', function (e) {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href) return;
    // 외부 링크/앵커/특수 프로토콜/타겟블랭크 제외
    if (link.target === '_blank') return;
    if (href.startsWith('http') && !href.includes(window.location.host)) return;
    if (href.startsWith('#')) return;
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return;
    // javascript: 링크·onclick 전용 버튼(카톡 문의 등)은 페이지 이동이 아님 → 가로채지 않음
    if (href.toLowerCase().startsWith('javascript:')) return;
    if (link.hasAttribute('onclick')) return;
    if (link.hasAttribute('download')) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    document.body.classList.add('is-leaving');
    setTimeout(() => { window.location.href = link.href; }, 220);
  });

  // bfcache 복귀 시 fade-out 클래스 제거
  window.addEventListener('pageshow', function () {
    document.body.classList.remove('is-leaving');
  });
})();

// 1.5) 서비스 오픈 안내 배너 — 2026년 6월 17일이 되면 자동으로 사라짐
//      .launch-notice 클래스가 붙은 요소는 17일 0시(기기 현지 시각)부터 제거됨.
//      서비스 오픈 후 별도 코드 수정 없이 안내가 자동 종료되도록 설계.
(function setupLaunchNotice() {
  var LAUNCH_DATE = new Date(2026, 5, 17); // 2026-06-17 00:00 (월은 0부터: 5 = 6월)
  if (new Date() >= LAUNCH_DATE) {
    document.querySelectorAll('.launch-notice').forEach(function (el) { el.remove(); });
  }
})();

// 2) Reveal-on-scroll — .reveal 섹션과 .stagger-fade 그리드를 화면 진입 시 발동
//    .reveal / .stagger-fade 를 감추는 CSS는 <html class="js">에만 걸려 있어서,
//    JS가 꺼져 있거나 실패해도 콘텐츠는 그대로 보입니다. (index 등 <head> 인라인 스니펫 참고)
(function setupScrollReveal() {
  var targets = document.querySelectorAll('.reveal, .stagger-fade');
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

// 3) 햄버거 메뉴 토글은 inline onclick으로 이미 처리됨
//    — 여기서는 외부 클릭 시 닫기만 추가
document.addEventListener('click', function (e) {
  const menu = document.querySelector('nav.topnav .menu');
  const ham = document.querySelector('nav.topnav .ham');
  if (!menu || !menu.classList.contains('open')) return;
  if (e.target === ham || ham?.contains(e.target)) return;
  if (e.target === menu || menu.contains(e.target)) return;
  menu.classList.remove('open');
});

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

window.openLinkSafely = function (url) {
  var win = null;
  try { win = window.open(url, '_blank'); } catch (e) { win = null; }
  if (!win) window.location.href = url;
};

window.showToast = function (msg) {
  var el = document.getElementById('site-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'site-toast';
    el.style.cssText = 'position:fixed; left:50%; bottom:28px; transform:translateX(-50%);'
      + ' background:rgba(20,35,45,0.95); color:#fff; padding:13px 20px; border-radius:10px;'
      + ' font-size:14px; font-weight:600; line-height:1.5; max-width:88vw; text-align:center;'
      + ' box-shadow:0 8px 28px rgba(0,0,0,0.25); z-index:99999; opacity:0; transition:opacity .22s;';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  requestAnimationFrame(function () { el.style.opacity = '1'; });
  clearTimeout(el._t);
  el._t = setTimeout(function () { el.style.opacity = '0'; }, 3200);
};

window.copyAndOpenKakao = function (message) {
  var copied = window.copyTextSync(message);
  window.showToast(copied
    ? '📋 문의 메시지를 복사했어요 — 카톡 채팅창에 붙여넣기 해주세요'
    : '💬 카톡 채팅창을 여는 중이에요 — 문의 내용을 적어주세요');
  window.openLinkSafely(KAKAO_OPENCHAT_URL);
};

// 6) 페이지별 컨텍스트 없는 일반 문의들 — 단순 메시지 → 클립보드 복사
window.inquireCustom = function () {
  copyAndOpenKakao([
    '안녕하세요! 맞춤 여행 / 성지순례 상담드립니다.',
    '✏️ 관심 있는 종류:',
    '   ☐ 맞춤 1일 코스',
    '   ☐ 2박 3일 이상 장기 여행',
    '   ☐ 아일랜드 성지순례',
    '   ☐ 기자단·취재 동행',
    '👥 인원·일정·관심사 함께 알려주세요 🙏'
  ].join('\n'));
};

window.inquireGeneral = function () {
  copyAndOpenKakao([
    '안녕하세요! Andrew의 아일랜드 동행 문의드립니다.',
    '🛎️ 관심 있는 서비스:',
    '   ☐ 공항 픽업·드랍',
    '   ☐ 당일 로드트립',
    '   ☐ 이사·운송·IKEA·장보기',
    '   ☐ 맞춤 여행·성지순례',
    '간단히 일정·인원만 알려주시면 안내드릴게요 🙏'
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
    if (a) track();
  });
  // (b) 문의 버튼(클립보드 복사형) — copyAndOpenKakao 호출 시 집계
  var orig = window.copyAndOpenKakao;
  if (typeof orig === 'function') {
    window.copyAndOpenKakao = function (message) { track(); return orig(message); };
  }
})();
