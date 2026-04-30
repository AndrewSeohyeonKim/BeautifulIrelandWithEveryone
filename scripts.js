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
