# 🇮🇪 Beautiful Ireland with Everyone — Andrew의 아일랜드 동행

**더블린 기반 한국어 프라이빗 차량·동행 서비스** 공식 웹사이트.

🔗 **[andrewseohyeonkim.github.io/BeautifulIrelandWithEveryone](https://andrewseohyeonkim.github.io/BeautifulIrelandWithEveryone/)**

---

## 📋 서비스

| 서비스 | 페이지 | 시작 가격 |
|---|---|---|
| ✈️ 공항 픽업·드랍 | [services/airport.html](services/airport.html) | €40 (거리당 정찰·톨비 포함) |
| 🌿 당일치기 로드트립 22코스 | [services/tours.html](services/tours.html) | 1인 €35 |
| 🏠 이사·IKEA·가구 픽업 운송 | [services/moving.html](services/moving.html) | €40 (거리당 정찰) |
| ⛪ 가톨릭 성지순례·피정 | [services/pilgrimage.html](services/pilgrimage.html) | 1:1 견적 |
| ✏️ 맞춤 여행·장기·통역 동행 | [services/custom.html](services/custom.html) | 1:1 견적 |

전체 가격표: **[pricing.md](pricing.md)**

특징: 7인승 MPV 단독 이용(합승 없음) · 도어투도어 · 코스 커스텀 · 플랫폼 중개 수수료 없음.

## 👤 운영자

**서현 Andrew** (Andrew Seohyeon Kim)

- 더블린 4년차 거주 · 유럽 운전 경력 6년 이상
- 더블린 무료 한국어 워킹투어 운영자
- 대전교구 아일랜드 성지순례단 9일 일정 가이드
- 레지오 마리애 본부(Concilium) 한국어 통역 봉사
- 아일랜드천주교한인공동체 청년회장
- 한국 기자단 더블린 안내 경력

서비스 운영 수익은 음악 봉사 프로젝트 **Classical Music for Everyone** 운영 자금으로 순환됩니다.

## 💬 문의

- **카카오톡 오픈채팅** (가장 빠름): https://open.kakao.com/o/suSTEFsi
- **인스타그램 DM**: [@ireland.sosik](https://www.instagram.com/ireland.sosik/)
- **이메일**: sby05034@gmail.com

## 🛠️ 기술 정보

빌드 도구·프레임워크 없는 정적 사이트. GitHub Pages에서 그대로 서빙됩니다.

```
├── index.html              # 홈 (서비스 개요 + FAQ 10문항)
├── about.html              # 운영자 소개 + 차량 정보
├── contact.html            # 문의 채널
├── terms.html              # 이용약관 · 환불·책임 정책
├── services/
│   ├── airport.html        # 공항 픽업·드랍 (가격 계산기)
│   ├── tours.html          # 로드트립 22코스 (지도·계산기·비교표)
│   ├── moving.html         # 이사·IKEA·가구 픽업 (가격 계산기)
│   ├── pilgrimage.html     # 성지순례·피정 6개 프로그램
│   └── custom.html         # 맞춤 여행·장기·통역
├── styles.css              # 전체 페이지 공용 스타일 (팔레트 정본)
├── scripts.js              # 공용 스크립트
├── images/                 # 코스·차량 사진
├── robots.txt              # 검색엔진 + AI 크롤러 정책
├── sitemap.xml             # 사이트맵
├── llms.txt                # AI 검색용 사이트 컨텍스트
└── pricing.md              # 기계 판독용 전체 가격표
```

- 폰트: Noto Sans KR 단일
- 팔레트: 네이비 `#1a2942` + 금색 `#c9a96e` (정본은 `styles.css`의 `:root`)
- 구조화 데이터: Schema.org — TravelAgency / LocalBusiness / Person / Service / Offer / TouristTrip / FAQPage / BreadcrumbList
- AI 검색 크롤러(GPTBot, ClaudeBot, PerplexityBot, Google-Extended 등) 명시 허용

---

© 2026 🇮🇪 Beautiful Ireland with Everyone · Andrew의 아일랜드 동행 · Dublin, Ireland
