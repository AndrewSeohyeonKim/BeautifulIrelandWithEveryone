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

// 2) Reveal-on-scroll — .reveal 클래스가 붙은 섹션을 화면 진입 시 페이드 인
(function setupScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
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
window.copyAndOpenKakao = function (message) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(message).then(function () {
      alert('📋 문의 메시지가 클립보드에 복사되었어요!\n\n카톡 채팅창에 붙여넣기(Ctrl+V / 길게 누르기) 해주세요.\n\n"' + message + '"');
      window.open('https://open.kakao.com/o/suSTEFsi', '_blank');
    }).catch(function () {
      window.open('https://open.kakao.com/o/suSTEFsi', '_blank');
    });
  } else {
    window.open('https://open.kakao.com/o/suSTEFsi', '_blank');
  }
};

// 6) 페이지별 컨텍스트 없는 일반 문의들 — 단순 메시지 → 클립보드 복사
window.inquireCustom = function () {
  copyAndOpenKakao([
    '안녕하세요! 커스텀 여행 / 성지순례 상담드립니다.',
    '✏️ 관심 있는 종류:',
    '   ☐ 1일 커스텀 코스',
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
    '   ☐ 커스텀 여행·성지순례',
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
