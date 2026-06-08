const TRACK_EVENTS = Object.freeze({
    HERO_DIAGNOSIS: "click_hero_diagnosis",
    CONSULTATION_BOOKING: "click_consultation_booking",
    PORTFOLIO_VIEW: "click_portfolio_view",
    PACKAGE_RESEARCH: "click_package_research",
    PACKAGE_STARTUP: "click_package_startup",
    PACKAGE_GROWTH: "click_package_growth",
    PACKAGE_OPERATION: "click_package_operation",
    SERVICE_LANDING: "click_service_landing",
    SERVICE_MVP: "click_service_mvp",
    SERVICE_WEB: "click_service_web",
    SERVICE_APP: "click_service_app",
    OPEN_FEATURE_MODAL: "open_feature_modal",
    SCOPE_SPRINT: "click_scope_sprint",
    OPEN_FAQ: "open_faq",
    SUBMIT_DIAGNOSIS: "submit_project_diagnosis",
    EMAIL_CONTACT: "click_email_contact",
    SCROLL_50: "scroll_50",
    SCROLL_90: "scroll_90",
});

window.NERO_TRACK_EVENTS = TRACK_EVENTS;

const trackEvent = (eventName, payload = {}) => {
    if (!eventName) return;
    if (typeof window.gtag === "function") {
        window.gtag("event", eventName, payload);
    }
    window.dispatchEvent(new CustomEvent("nero:track", { detail: { eventName, payload } }));
};

const asset = (fileName) => `/assets/img/landing/${fileName}`;

const heroAssets = [
    {
        label: "NERO 웹·앱·관리자 제품 히어로",
        desktopFile: "hero-product-desktop.png",
        mobileFile: "hero-product-mobile.png",
        size: "large",
    },
];

const trustItems = [
    "Flutter",
    "Vite",
    "Django",
    "PostgreSQL",
    "Docker",
    "GitHub Actions",
    "Lottie",
    "Figma",
    "HealthKit",
    "Google Health Connect",
    "GA4",
    "NCP",
    "GCP",
];

const painCards = [
    {
        title: "배포 실패",
        copy: "개발은 끝났지만 도메인, 서버, 앱 심사, SSL, 운영 계정이 정리되지 않아 출시 직전에 멈춥니다.",
    },
    {
        title: "서버·DB 부재",
        copy: "보이는 화면만 있고 회원, 저장, 권한, 관리자, 데이터 흐름이 실제 서비스와 연결되지 않습니다.",
    },
    {
        title: "최종 비용 증가",
        copy: "기능 정의가 모호하면 개발 중 과업이 계속 늘고, 처음 견적과 최종 비용의 기준도 흔들립니다.",
    },
    {
        title: "관리자 부재",
        copy: "운영자가 회원, 결제, 신청, 콘텐츠, 알림을 직접 확인하고 수정할 수 없어 운영이 막힙니다.",
    },
    {
        title: "유지보수·인수인계 부재",
        copy: "코드, 서버, API, 계정, 운영 매뉴얼이 정리되지 않아 다음 담당자가 이어받기 어렵습니다.",
    },
];

const comparison = {
    general: [
        "구두 견적과 대화 중심 착수",
        "사용자 화면 중심 개발",
        "배포와 운영 계정은 별도 협의",
        "추가 비용 기준이 모호함",
        "하자·유지·개선 범위가 불명확",
        "코드만 전달하고 운영 문서는 부족함",
    ],
    nero: [
        "요구사항 정의서와 Figma 후 개발",
        "사용자 화면 + 서버·DB + 관리자 함께 설계",
        "배포 체크리스트와 운영 계정 기준 정리",
        "필수·선택·제외 기능을 분리해 과업 확정",
        "하자보수·유지보수·기능 개선을 분리",
        "Git, ERD, API, 운영 매뉴얼까지 인수인계",
    ],
};

const packages = [
    {
        id: "research",
        event: TRACK_EVENTS.PACKAGE_RESEARCH,
        name: "Research-to-Platform",
        target: "교수·연구자",
        customerValue: "교수·연구자",
        intro: "연구 아이디어를 참여자 모집, 데이터 수집, 관리자, 리포트까지 이어지는 플랫폼으로 전환합니다.",
        features: ["랜딩", "파일럿 MVP", "설문/척도", "건강데이터", "관리자/엑셀", "통계/AI"],
    },
    {
        id: "startup",
        event: TRACK_EVENTS.PACKAGE_STARTUP,
        name: "Grant-ready MVP",
        target: "예비창업자",
        customerValue: "예비창업자",
        intro: "지원사업과 초기 검증에 필요한 MVP, 관리자, 전환 측정, 배포 URL을 빠르게 정리합니다.",
        features: ["랜딩", "MVP/PoC", "GA4", "관리자", "웹/앱 배포", "로드맵"],
    },
    {
        id: "growth",
        event: TRACK_EVENTS.PACKAGE_GROWTH,
        name: "Growth Service Build",
        target: "사업가·기업",
        customerValue: "사업가·기업",
        intro: "기존 비즈니스를 회원, 결제, 예약, 알림, 관리자까지 갖춘 운영형 서비스로 만듭니다.",
        features: ["웹사이트", "웹서비스", "회원·결제·예약", "알림·관리자", "앱"],
    },
    {
        id: "operation",
        event: TRACK_EVENTS.PACKAGE_OPERATION,
        name: "Operation Care",
        target: "기존 서비스 운영자",
        customerValue: "서비스 운영자",
        intro: "이미 만들어진 서비스의 구조, 서버, 오류, 배포, API를 점검하고 운영 안정성을 회복합니다.",
        features: ["코드·서버 진단", "오류 수정", "배포 정상화", "API 대응", "월 유지보수"],
    },
];

const services = [
    {
        id: "landing",
        event: TRACK_EVENTS.SERVICE_LANDING,
        title: "전환형 랜딩·신청 페이지",
        buildValue: "전환형 랜딩·신청 페이지",
        image: "service-landing-page.png",
        label: "전환형 랜딩·신청 페이지 화면",
        includes: ["포지셔닝", "신청 폼", "리드 DB", "GA4/GTM", "관리자 목록"],
        outputs: ["랜딩 페이지", "신청 데이터", "전환 이벤트"],
    },
    {
        id: "mvp",
        event: TRACK_EVENTS.SERVICE_MVP,
        title: "검증형 MVP/PoC",
        buildValue: "MVP/PoC",
        image: "service-mvp-poc.png",
        label: "MVP 또는 PoC 제품 화면",
        includes: ["핵심 사용자 흐름", "인증", "DB/API", "시연 데이터", "배포 URL"],
        outputs: ["Figma", "MVP 웹앱", "관리자", "QA 체크리스트"],
    },
    {
        id: "web",
        event: TRACK_EVENTS.SERVICE_WEB,
        title: "운영형 웹서비스",
        buildValue: "운영형 웹서비스",
        image: "service-web-service.png",
        label: "운영형 웹서비스와 관리자 화면",
        includes: ["회원", "콘텐츠", "결제", "알림", "운영 관리자"],
        outputs: ["웹서비스", "관리자", "DB/API", "운영 매뉴얼"],
    },
    {
        id: "app",
        event: TRACK_EVENTS.SERVICE_APP,
        title: "iOS·Android 앱서비스",
        buildValue: "iOS·Android 앱서비스",
        image: "service-mobile-app.png",
        label: "iOS·Android 앱서비스 화면",
        includes: ["앱 화면", "서버", "관리자", "스토어 자료", "심사 대응"],
        outputs: ["앱 빌드", "서버", "관리자", "앱 배포 지원"],
    },
];

const featureCategories = [
    {
        id: "auth",
        label: "인증·회원",
        features: [
            {
                name: "소셜 로그인·권한",
                level: "Lv.2",
                tags: ["창업", "사업화", "운영"],
                value: "가입 장벽을 낮추고 운영자 권한을 안전하게 나눕니다.",
                customerValue: "사용자는 빠르게 시작하고, 운영자는 역할별 접근 권한을 관리할 수 있습니다.",
                preparation: "로그인 방식, 권한 그룹, 개인정보 항목",
                outputs: "인증 API, 권한 정책, 계정 관리 화면",
                portfolio: "Nero 정신건강 통합관리 플랫폼",
            },
            {
                name: "마이페이지·프로필",
                level: "Lv.2",
                tags: ["연구", "창업"],
                value: "사용자별 데이터와 신청 상태를 한곳에서 관리합니다.",
                customerValue: "서비스 이용 이력, 설문, 신청 상태를 사용자 단위로 추적합니다.",
                preparation: "프로필 항목, 수정 가능 범위, 탈퇴 정책",
                outputs: "마이페이지, 프로필 API, 상태 관리",
                portfolio: "Nero 정신건강 통합관리 플랫폼",
            },
        ],
    },
    {
        id: "data",
        label: "데이터수집",
        features: [
            {
                name: "설문·척도·동의서",
                level: "Lv.3",
                tags: ["연구", "운영"],
                value: "연구 참여자 응답과 동의 흐름을 데이터로 남깁니다.",
                customerValue: "연구 데이터 수집 과정을 표준화하고 누락을 줄입니다.",
                preparation: "문항지, 척도 계산 방식, 동의서 문안",
                outputs: "설문 화면, 응답 DB, 엑셀 내보내기",
                portfolio: "Nero 정신건강 통합관리 플랫폼",
            },
            {
                name: "파일 업로드·검수",
                level: "Lv.3",
                tags: ["사업화", "운영"],
                value: "증빙, 이미지, 문서를 관리자 검수 흐름과 연결합니다.",
                customerValue: "오프라인 제출 과정을 줄이고 처리 상태를 기록합니다.",
                preparation: "파일 종류, 용량, 보관 기간, 검수 기준",
                outputs: "업로드 API, 파일 저장소, 검수 관리자",
                portfolio: "소살리토 공식 온라인 사이트",
            },
        ],
    },
    {
        id: "community",
        label: "콘텐츠·커뮤니티",
        features: [
            {
                name: "콘텐츠 CMS",
                level: "Lv.2",
                tags: ["사업화", "운영"],
                value: "운영자가 공지, 아티클, 페이지 콘텐츠를 직접 관리합니다.",
                customerValue: "개발자 없이도 주요 콘텐츠를 수정하고 게시할 수 있습니다.",
                preparation: "콘텐츠 유형, 카테고리, 승인 흐름",
                outputs: "CMS 관리자, 게시 API, 목록/상세 화면",
                portfolio: "소살리토 공식 온라인 사이트",
            },
            {
                name: "댓글·신고·검수",
                level: "Lv.4",
                tags: ["창업", "운영"],
                value: "커뮤니티 상호작용과 운영 리스크를 함께 설계합니다.",
                customerValue: "사용자 참여를 만들되 신고와 차단 기준으로 운영 부담을 줄입니다.",
                preparation: "정책, 금칙어, 신고 처리 기준",
                outputs: "댓글 API, 신고 관리자, 차단 기능",
                portfolio: "Nero 정신건강 통합관리 플랫폼",
            },
        ],
    },
    {
        id: "payment",
        label: "결제·알림",
        features: [
            {
                name: "결제·구독",
                level: "Lv.4",
                tags: ["창업", "사업화"],
                value: "단건 결제, 정기 결제, 환불 흐름을 서비스 구조에 맞춥니다.",
                customerValue: "매출 흐름과 운영 정산 기준을 서비스 안에서 관리합니다.",
                preparation: "PG사, 상품 정책, 환불 규정, 세금계산서 여부",
                outputs: "결제 API, 결제 관리자, 정산 기준 문서",
                portfolio: "소살리토 공식 온라인 사이트",
            },
            {
                name: "이메일·SMS·알림톡",
                level: "Lv.3",
                tags: ["사업화", "운영"],
                value: "신청, 결제, 예약, 상태 변경을 자동 알림으로 연결합니다.",
                customerValue: "운영자가 반복 안내를 줄이고 사용자 이탈을 낮춥니다.",
                preparation: "발송 시점, 템플릿, 발신 프로필",
                outputs: "알림 API, 템플릿, 발송 로그",
                portfolio: "소살리토 공식 온라인 사이트",
            },
        ],
    },
    {
        id: "external",
        label: "위치·외부API",
        features: [
            {
                name: "지도·위치",
                level: "Lv.3",
                tags: ["창업", "사업화"],
                value: "위치 기반 탐색, 거리 계산, 지도 표시를 구현합니다.",
                customerValue: "오프라인 지점, 예약, 배송, 지역 매칭 기능을 만들 수 있습니다.",
                preparation: "지도 제공사, 주소 데이터, 위치 권한 정책",
                outputs: "지도 화면, 위치 API, 권한 안내",
                portfolio: "소살리토 공식 온라인 사이트",
            },
            {
                name: "공공데이터·OAuth",
                level: "Lv.5",
                tags: ["연구", "사업화"],
                value: "외부 시스템의 인증, 제한, 예외 상황을 실무 기준으로 처리합니다.",
                customerValue: "외부 데이터와 서비스 계정을 안정적으로 연결합니다.",
                preparation: "API 문서, 키 발급 계정, 호출 제한",
                outputs: "연동 API, 예외 처리, 운영 가이드",
                portfolio: "Nero 정신건강 통합관리 플랫폼",
            },
        ],
    },
    {
        id: "admin",
        label: "운영·관리자",
        features: [
            {
                name: "운영 대시보드",
                level: "Lv.3",
                tags: ["연구", "운영"],
                value: "회원, 신청, 결제, 데이터 상태를 운영자가 한눈에 봅니다.",
                customerValue: "서비스 상황을 확인하고 필요한 조치를 바로 실행합니다.",
                preparation: "운영 지표, 관리자 역할, 조회 필터",
                outputs: "관리자 화면, 통계 카드, 권한 관리",
                portfolio: "Nero 정신건강 통합관리 플랫폼",
            },
            {
                name: "엑셀·리포트",
                level: "Lv.2",
                tags: ["연구", "운영"],
                value: "수집된 데이터를 검토 가능한 형태로 내보냅니다.",
                customerValue: "연구 분석, 운영 보고, 내부 공유가 쉬워집니다.",
                preparation: "컬럼 정의, 익명화 기준, 다운로드 권한",
                outputs: "엑셀 다운로드, 리포트 템플릿, 로그",
                portfolio: "Nero 정신건강 통합관리 플랫폼",
            },
        ],
    },
    {
        id: "infra",
        label: "배포·인프라",
        features: [
            {
                name: "CI/CD·배포",
                level: "Lv.4",
                tags: ["사업화", "운영"],
                value: "배포 절차를 반복 가능하게 만들고 릴리즈 리스크를 낮춥니다.",
                customerValue: "수정 후 배포 과정이 예측 가능해져 운영 대응이 빨라집니다.",
                preparation: "서버 계정, 도메인, 저장소 권한, 배포 환경",
                outputs: "배포 파이프라인, 체크리스트, 계정 목록",
                portfolio: "소살리토 공식 온라인 사이트",
            },
            {
                name: "모니터링·백업",
                level: "Lv.4",
                tags: ["운영"],
                value: "장애 징후와 데이터 보관 기준을 프로젝트 초기에 반영합니다.",
                customerValue: "운영 중 장애와 데이터 손실 가능성을 줄입니다.",
                preparation: "장애 연락망, 백업 주기, 로그 보관 기간",
                outputs: "모니터링 설정, 백업 정책, 장애 대응 문서",
                portfolio: "Nero 정신건강 통합관리 플랫폼",
            },
        ],
    },
    {
        id: "ai",
        label: "AI·통계",
        features: [
            {
                name: "AI 요약·분류",
                level: "Lv.4",
                tags: ["연구", "사업화"],
                value: "텍스트와 기록 데이터를 분류하거나 요약해 운영 시간을 줄입니다.",
                customerValue: "반복 판단 업무를 줄이고 데이터 활용도를 높입니다.",
                preparation: "샘플 데이터, 분류 기준, 민감정보 처리 기준",
                outputs: "AI API, 프롬프트 기준, 관리자 검수 화면",
                portfolio: "Nero 정신건강 통합관리 플랫폼",
            },
            {
                name: "통계 대시보드",
                level: "Lv.3",
                tags: ["연구", "운영"],
                value: "서비스 지표와 연구 데이터를 의사결정 가능한 형태로 보여줍니다.",
                customerValue: "누적 데이터가 보고와 개선의 근거가 됩니다.",
                preparation: "지표 정의, 기간 기준, 필터 조건",
                outputs: "통계 화면, 집계 API, 리포트",
                portfolio: "Nero 정신건강 통합관리 플랫폼",
            },
        ],
    },
];

const portfolio = [
    {
        title: "Nero 정신건강 통합관리 플랫폼",
        image: "portfolio-1.png",
        label: "Nero 정신건강 통합관리 플랫폼 앱·관리자 화면",
        copy: "모바일 기록, 건강 데이터 연동, 관리자, AI 서버, 앱 배포와 장기 유지보수까지 이어진 통합 플랫폼입니다.",
        tags: [
            "Flutter",
            "Django",
            "PostgreSQL",
            "NCP",
            "Docker",
            "GitHub Actions",
            "HealthKit",
            "Google Health Connect",
            "GA4",
            "관리자",
            "AI서버",
        ],
        verification: ["앱 배포 지원", "건강데이터 연동", "운영 관리자", "장기 유지보수"],
    },
    {
        title: "소살리토 공식 온라인 사이트",
        image: "portfolio-2.png",
        label: "소살리토 공식 온라인 사이트와 운영 관리자 화면",
        copy: "브랜드 웹사이트, 결제, 알림, 배송 API, 운영 관리자와 배포 파이프라인까지 구축한 공식 온라인 사이트입니다.",
        tags: [
            "Django",
            "PostgreSQL",
            "네이버페이",
            "토스페이먼츠",
            "알림톡",
            "스마트택배API",
            "Redis",
            "Docker/CI/CD",
            "GA4",
        ],
        verification: ["결제 연동", "배송 API", "알림 자동화", "CI/CD"],
    },
    {
        title: "소프티 Softie",
        image: "portfolio-3.png",
        label: "소프티 앱 화면",
        copy: "게이미피케이션을 결합한 iOS/Android 앱으로, 앱 화면, 서버, 관리자, 스토어 자료, 심사 대응까지 지원했습니다.",
        tags: [
            "AndroidStudio",
            "Kotlin",
            "Xcode",
            "Swift",
        ],
        verification: ["반응형 애니메이션", "습관 기록", "푸시알림"],
    },
    {
        title: "레브마이크 RevMic",
        image: "portfolio-4.png",
        label: "레브마이크 앱 화면",
        copy: "음성 기반 역재생 녹음 앱",
        tags: [
            "Flutter",
            "AndroidStudio",
            "Xcode",
            "GoogleAds",
            "GA4",
        ],
        verification: ["Google PlayStore", "Apple App Store", "앱 내 광고연동", "CI/CD"],
    },
    {
        title: "서울익스플로러 Seoul Explorer",
        image: "portfolio-5.png",
        label: "서울익스플로러 화면",
        copy: "외국인 관광객 대상 서울 내 음식점 및 관광지 소개 웹사이트",
        tags: [
            "Google Firebase",
            "GitHub Actions",
            "Google Map",
            "GA4",
        ],
        verification: ["결제 연동", "배송 API", "알림 자동화", "CI/CD"],
    },
];

const partnerLogos = Array.from({ length: 7 }, (_, index) => ({
    src: `/assets/img/partner/logo_list_${index + 1}.png`,
    alt: `파트너 및 협력기관 로고 ${index + 1}`,
}));

const whyNero = [
    ["범위정리/Figma", "요구사항, 화면 목록, 예외 케이스를 개발 전 먼저 정리합니다."],
    ["운영구조", "사용자 화면과 관리자, 데이터, 권한, 운영 로그를 함께 설계합니다."],
    ["앱배포·심사", "스토어 자료, 빌드, 심사 대응을 프로젝트 일정에 반영합니다."],
    ["외부API 실무", "결제, 알림, 지도, 건강 데이터, 공공 API의 예외를 다룹니다."],
    ["의료·연구 데이터 이해", "민감 데이터, 동의 흐름, 익명화, 리포트 구조를 고려합니다."],
    ["유지보수·문서화", "운영 매뉴얼, 계정, API, 서버 기준을 정리해 넘깁니다."],
];

const processSteps = [
    ["무료 상담", "아이디어 기반 서비스 개발을 위한 빠른 진단을 도와드립니다."],
    ["1차 미팅", "고객 유형, 개발 형태, 예산, 일정, 핵심 기능을 확인합니다."],
    ["요구사항 정의", "목표, 이해관계자, 기존 자료, 운영 조건을 함께 점검합니다."],
    ["기능 범위 산정", "기능정의서, 화면 목록, 관리자 범위, 데이터 구조를 좁힙니다."],
    ["맞춤 제안·견적", "우선순위와 과업범위서를 기준으로 견적을 확정합니다."],
    ["계약/착수", "일정, 산출물, 검수 기준, 커뮤니케이션 방식을 확정합니다."],
    ["QA·배포·인수인계", "테스트, 배포, 운영 문서, 유지보수 범위를 정리해 제공합니다."],
];

const processLabels = ["CONSULTATION", "FIRST MEETING", "REQUIREMENTS", "SCOPE", "PROPOSAL", "CONTRACT", "QA & HANDOVER"];

const deliverables = [
    ["기획", "요구사항 정의서, 기능정의서, 과업범위서", "무엇을 만들고 제외하는지 명확화"],
    ["디자인", "Figma 화면설계, 사용자 플로우", "화면별 동작과 예외 케이스 확인"],
    ["개발", "웹·앱, 서버, DB, API, 관리자 페이지", "운영과 데이터 흐름 기준 설명"],
    ["검수", "QA 체크리스트, 수정 내역", "사용자·관리자 주요 시나리오 검증"],
    ["배포", "도메인, SSL, 서버, 앱 배포 체크리스트", "계정과 권한, 배포 절차 정리"],
    ["운영", "운영 매뉴얼, 관리자 사용법", "일상 운영자가 확인해야 할 항목 안내"],
    ["인수인계", "API 기준, 서버 정보, 유지보수 범위", "다음 담당자가 이어받을 수 있게 문서화"],
];

const estimates = [
    ["전환형 랜딩페이지", "50만 원~", "신청 폼, 리드 DB, 전환 이벤트"],
    ["MVP/PoC 웹서비스", "500만 원~", "핵심 흐름, API, 관리자, 배포 URL"],
    ["운영형 웹서비스", "2,000만 원~", "회원, 결제, 콘텐츠, 관리자, 운영 구조"],
    ["iOS/Android 앱서비스", "3,000만 원~", "앱 빌드, 서버, 관리자, 스토어 배포 지원"],
    ["기존 서비스 Rescue", "500만 원~", "코드·서버 진단, 오류 수정, 배포 정상화"],
    ["월 유지보수", "월 50만 원~", "장애 대응, 기능 개선, 운영 지원"],
];

const faqs = [
    ["기획서가 없어도 상담 가능한가요?", "가능합니다. 3분 진단과 1차 상담을 통해 목표, 사용자, 필요한 기능을 함께 정리합니다."],
    ["견적은 언제 확정되나요?", "상담 후 기능정의서와 과업범위서가 정리된 뒤 확정됩니다."],
    ["랜딩페이지만 제작할 수도 있나요?", "가능합니다. 신청 폼, 전환 측정, CRM 연결, 관리자 목록까지 필요한 범위를 선택할 수 있습니다."],
    ["기존 개발물을 이어받을 수 있나요?", "가능합니다. 코드, 서버, 배포 계정, 오류 현황을 점검한 뒤 Rescue 범위로 정리합니다."],
    ["앱 배포도 가능한가요?", "iOS와 Android 앱 빌드, 스토어 등록 자료, 심사 대응 범위를 프로젝트에 포함할 수 있습니다."],
    ["유지보수도 가능한가요?", "가능합니다. 배포 이후 오류 대응, 기능 개선, 서버 모니터링, 운영 지원을 월 단위로 설계합니다."],
    ["연구·의료 데이터가 포함된 프로젝트도 가능한가요?", "가능합니다. 민감 데이터, 동의 흐름, 익명화, 권한, 리포트 구조를 상담 단계에서 함께 점검합니다."],
];

const customerOptions = ["교수·연구자", "예비창업자", "사업가·기업", "서비스 운영자", "기타"];
const buildOptions = [
    "랜딩페이지 제작",
    "MVP 웹서비스 제작",
    "실운영 웹사이트 제작",
    "iOS/Android 앱서비스 제작",
    "기존 서비스 업데이트",
    "서비스 유지보수",
    "기초 논문 통계 분석",
    "변수 간 관계분석",
    "머신러닝/딥러닝 모델 학습",
    "고급 데이터 분석",
    "2차 자료 분석",
    "메타분석",
    "MLOps·LLMOps 기반 운영 고도화",
    "기타",
];
const renderSelectOptions = (placeholder, options) => `
    <option value="" disabled selected>${placeholder}</option>
    ${options.map((option) => `<option value="${option}">${option}</option>`).join("")}
`;

const AssetSlot = ({ label, file, className = "", eager = false }) => `
    <figure class="asset-slot ${className}" data-label="${label}">
        <img src="${asset(file)}" alt="" loading="${eager ? "eager" : "lazy"}" decoding="${eager ? "sync" : "async"}"${eager ? ' fetchpriority="high"' : ""} />
        <figcaption class="asset-placeholder">이미지 삽입 영역: ${label}</figcaption>
    </figure>
`;

const HeroProductSlot = ({ label, desktopFile, mobileFile, className = "" }) => `
    <figure class="asset-slot ${className}" data-label="데스크톱: ${desktopFile} / 모바일: ${mobileFile}">
        <picture>
            <source media="(max-width: 768px)" srcset="${asset(mobileFile)}" />
            <img src="${asset(desktopFile)}" alt="" loading="eager" decoding="sync" fetchpriority="high" />
        </picture>
        <figcaption class="asset-placeholder">이미지 삽입 영역: ${label}</figcaption>
    </figure>
`;

const list = (items) => items.map((item) => `<li>${item}</li>`).join("");
const badges = (items) => items.map((item) => `<span>${item}</span>`).join("");
const options = (items) => items.map((item) => `<option value="${item}">${item}</option>`).join("");

const renderPortfolioCards = (isDuplicate = false) => portfolio.map((item) => `
    <article class="portfolio-card"${isDuplicate ? ' aria-hidden="true"' : ' data-portfolio-card'}>
        ${AssetSlot({ label: item.label, file: item.image, className: "portfolio-asset" })}
        <div class="portfolio-body">
            <h3>${item.title}</h3>
            <p>${item.copy}</p>
            <div class="badge-row">${badges(item.tags)}</div>
            <div class="verification-row" aria-label="검증 배지">${badges(item.verification)}</div>
        </div>
    </article>
`).join("");

const renderPartnerCards = () => partnerLogos.map((partner) => `
    <figure class="partner-card">
        <img src="${partner.src}" alt="${partner.alt}" loading="lazy" decoding="async" />
    </figure>
`).join("");

const renderFeatureTabs = () => featureCategories.map((category, index) => `
    <button
        class="feature-tab"
        type="button"
        role="tab"
        aria-selected="${index === 0 ? "true" : "false"}"
        aria-controls="feature-panel"
        id="tab-${category.id}"
        data-feature-category="${category.id}"
    >
        ${category.label}
    </button>
`).join("");

const renderFeatureCards = (categoryId = featureCategories[0].id) => {
    const category = featureCategories.find((item) => item.id === categoryId) ?? featureCategories[0];
    return category.features.map((feature, index) => `
        <button class="feature-card reveal" type="button" data-feature="${category.id}:${index}">
            <span class="feature-level">${feature.level}</span>
            <strong>${feature.name}</strong>
            <p>${feature.value}</p>
            <span class="feature-tags">${feature.tags.map((tag) => `<em>${tag}</em>`).join("")}</span>
        </button>
    `).join("");
};

const pageConfig = {
    navItems: [
        ["추천 패키지", "#packages"],
        ["서비스", "#services"],
        ["기능 컴포넌트", "#features"],
        ["포트폴리오", "#portfolio"],
        ["진행 방식", "#process"],
        ["FAQ", "#faq"],
        ["공지사항", "/announcement"],
        ["회사소개", "/about"],
    ],
    ctaHref: "#contact",
    ctaLabel: "문의 남기기",
    contactTargetId: "contact",
    source: "home_contact",
};

const renderHeaderLinks = (items, className = "") => items
    .map(([label, href]) => `<a${className ? ` class="${className}"` : ""} href="${href}">${label}</a>`)
    .join("");

const renderLandingHeader = ({ navItems, ctaHref, ctaLabel }) => `
    <header class="site-header" aria-label="주요 메뉴">
        <a class="header-logo" href="#main" aria-label="NERO 홈">
            <img src="/assets/img/landing/nero_logo.svg" alt="NERO" />
        </a>

        <nav class="desktop-nav" aria-label="데스크톱 메뉴">
            ${renderHeaderLinks(navItems)}
        </nav>

        <a class="header-cta" href="${ctaHref}" data-track="${TRACK_EVENTS.HERO_DIAGNOSIS}">${ctaLabel}</a>
        <button class="menu-button" type="button" aria-label="모바일 메뉴 열기" aria-controls="mobile-drawer" aria-expanded="false">
            <span></span>
            <span></span>
        </button>
    </header>

    <div class="drawer-backdrop" data-drawer-close hidden></div>
    <aside class="mobile-drawer" id="mobile-drawer" aria-label="모바일 메뉴" hidden>
        <div class="drawer-head">
            <a class="header-logo" href="#main" aria-label="NERO 홈">
                <img src="/assets/img/landing/nero_logo.svg" alt="NERO" />
            </a>
            <button class="drawer-close" type="button" aria-label="모바일 메뉴 닫기" data-drawer-close>닫기</button>
        </div>
        <nav class="drawer-nav" aria-label="모바일 내비게이션">
            ${renderHeaderLinks(navItems)}
            <a class="primary-button" href="${ctaHref}" data-track="${TRACK_EVENTS.HERO_DIAGNOSIS}">${ctaLabel}</a>
        </nav>
    </aside>
`;

const renderLandingFooter = () => `
    <footer class="landing-footer">
        <div class="container landing-footer-row">
            <div class="footer-left">
                <img src="/assets/img/footer-logo.svg" alt="회사 로고" class="footer-logo" />
                <ul>
                    <li>대표이사 한동균</li>
                    <li>본사 서울특별시 중구 퇴계로 36길 2, 충무로관 본관 130호</li>
                    <li>메일 official@nero.ai.kr</li>
                </ul>
            </div>
            <div class="footer-right">
                <ul>
                    <li>&copy; Nero Inc. All rights reserved.</li>
                    <li><a href="mailto:official@nero.ai.kr" data-track="${TRACK_EVENTS.EMAIL_CONTACT}">Contact Us</a></li>
                </ul>
            </div>
        </div>
    </footer>
`;

const renderHomeQuoteSection = () => `
    <section class="home-quote-section" id="contact" aria-labelledby="quote-title">
        <div class="container home-quote-shell">
            <div class="home-quote-copy reveal">
                <h2 id="quote-title">Contact</h2>
                <p>아이디어, 기존 자료, 막연한 고민만 있어도 괜찮습니다. 문의 남겨주시면 영업일 기준 24시간 이내 빠르게 답변해드리겠습니다.</p>
            </div>
            <form class="contact-form contact-form-simple home-quote-form reveal" id="contact-form" action="/.netlify/functions/contact" method="post">
                <input type="hidden" name="source" value="${pageConfig.source}" />
                <label aria-label="이름">
                    <input type="text" name="name" autocomplete="name" placeholder="이름" required />
                </label>
                <label aria-label="이메일">
                    <input type="email" name="email" autocomplete="email" placeholder="이메일" required />
                </label>
                <label aria-label="문의자 유형">
                    <select id="customer-type" name="customerType" required>
                        ${renderSelectOptions("문의자 유형", customerOptions)}
                    </select>
                </label>
                <label aria-label="희망 목적">
                    <select id="build-type" name="projectPurpose" required>
                        ${renderSelectOptions("희망 목적", buildOptions)}
                    </select>
                </label>
                <label class="form-honeypot" aria-hidden="true">
                    <input type="text" name="company" tabindex="-1" autocomplete="off" />
                </label>
                <label class="form-wide" aria-label="문의사항">
                    <textarea name="message" rows="8" placeholder="문의사항" required></textarea>
                </label>
                <button class="primary-button form-submit" type="submit">문의 남기기</button>
                <p class="form-status form-wide" role="status" aria-live="polite"></p>
            </form>
        </div>
    </section>
`;

const landingRoot = document.querySelector("#main");

document.body.insertAdjacentHTML("afterbegin", renderLandingHeader(pageConfig));

landingRoot.innerHTML = `
    <section class="hero section-dark" aria-labelledby="hero-title">
        <div class="container hero-grid">
            <div class="hero-copy reveal">
                <p class="hero-subtitle">0 to 1 연구자/사업가를 위한 외주개발</p>
                <h1 class="hero-title" id="hero-title">웹사이트, 앱개발, AI 모델, 관리자페이지까지</h1>
                <p class="hero-content">기획, Figma 화면설계, 웹·앱, 서버·DB, 관리자, 배포, 유지보수까지 실제 운영 가능한 구조로 개발합니다</p>
                <div class="hero-actions">
                    <a class="primary-button" href="${pageConfig.ctaHref}" data-track="${TRACK_EVENTS.HERO_DIAGNOSIS}">${pageConfig.ctaLabel}</a>
                    <a class="secondary-button" href="/overview" data-track="${TRACK_EVENTS.PORTFOLIO_VIEW}">제안서 받아보기</a>
                </div>
            </div>
            <div class="hero-product-wrap reveal" aria-label="NERO 제품 히어로 이미지 영역">
                ${heroAssets.map((item) => HeroProductSlot({ ...item, className: `hero-asset hero-asset-${item.size}` })).join("")}
            </div>
        </div>
    </section>

    <section class="trust-marquee" aria-label="NERO 기술 스택">
        <div class="marquee-track">
            ${[...trustItems, ...trustItems].map((item) => `<span>${item}</span>`).join("")}
        </div>
    </section>

    <section class="section section-light" id="pain" aria-labelledby="pain-title">
        <div class="container">
            <div class="section-heading reveal">
                <p class="eyebrow">문제는 업체와 클라이언트 사이의 소통 차이입니다</p>
                <h2 id="pain-title">외주개발, 왜 불안할까요?</h2>
            </div>
            <div class="pain-grid">
                ${painCards.map((card, index) => `
                    <article class="glass-card light-card reveal">
                        <span class="card-index">${String(index + 1).padStart(2, "0")}</span>
                        <h3>${card.title}</h3>
                        <p>${card.copy}</p>
                    </article>
                `).join("")}
            </div>
            <p class="section-conclusion reveal">NERO는 기능 구현보다 먼저 범위·검수·배포·운영 기준을 명확히 합니다.</p>
        </div>
    </section>

    <section class="section section-dark comparison-section" aria-labelledby="comparison-title">
        <div class="container">
            <div class="section-heading reveal">
                <p class="eyebrow">더이상 외주개발에 불안할 필요가 없습니다</p>
                <h2 id="comparison-title">외주개발을 제품 운영 관점으로 다시 설계합니다</h2>
            </div>
            <div class="comparison-grid">
                <article class="comparison-panel reveal">
                    <span class="panel-kicker">일반 외주</span>
                    <h3>개발물 중심</h3>
                    <ul>${list(comparison.general)}</ul>
                </article>
                <article class="comparison-panel nero-panel reveal">
                    <span class="panel-kicker">NERO</span>
                    <h3>운영 가능한 제품 중심</h3>
                    <ul>${list(comparison.nero)}</ul>
                </article>
            </div>
        </div>
    </section>

    <section class="section section-dark packages-section" id="packages" aria-labelledby="packages-title">
        <div class="container">
            <div class="section-heading reveal">
                <p class="eyebrow">고객 유형별 맞춤형 추천 제안</p>
                <h2 id="packages-title">고객 유형에 맞는 시작 구성을 먼저 제안합니다</h2>
            </div>
            <div class="package-grid">
                ${packages.map((item) => `
                    <article class="package-card reveal" role="button" tabindex="0" data-customer-value="${item.customerValue}" data-track="${item.event}">
                        <span class="tag">${item.name}</span>
                        <h3>${item.target}</h3>
                        <p>${item.intro}</p>
                        <div class="badge-row">${badges(item.features)}</div>
                    </article>
                `).join("")}
            </div>
        </div>
    </section>

    <section class="section section-dark services-section" id="services" aria-labelledby="services-title">
        <div class="container">
            <div class="section-heading reveal">
                <p class="eyebrow">처음부터 비싸고 복잡한 서비스를 할 필요가 없습니다</p>
                <h2 id="services-title">목표 검증부터 정식 서비스까지 단계별로 설계합니다</h2>
            </div>
            <div class="service-grid">
                ${services.map((item, index) => `
                    <article class="service-card reveal" role="button" tabindex="0" data-build-value="${item.buildValue}" data-track="${item.event}" aria-label="${item.title} 상담하기">
                        <div class="service-head">
                            <span class="service-index">${String(index + 1).padStart(2, "0")}</span>
                            <span class="service-kicker">${item.buildValue}</span>
                        </div>
                        <div class="service-body">
                            <h3>${item.title}</h3>
                            <div class="service-data">
                                <strong>포함 기능</strong>
                                <div class="service-chip-row">
                                    ${item.includes.map((feature) => `<span>${feature}</span>`).join("")}
                                </div>
                            </div>
                            <div class="service-data">
                                <strong>대표 산출물</strong>
                                <ul class="service-output-list">
                                    ${item.outputs.map((output) => `<li>${output}</li>`).join("")}
                                </ul>
                            </div>
                        </div>
                    </article>
                `).join("")}
            </div>
        </div>
    </section>

    <section class="section section-light feature-section" id="features" aria-labelledby="features-title">
        <div class="container">
            <div class="section-heading reveal">
                <p class="eyebrow">원하시는 부분을 더 뾰족하게 알 수 있도록</p>
                <h2 id="features-title">필요한 기능을 조합해 과업 범위를 명확히 합니다</h2>
            </div>
            <div class="feature-shell reveal">
                <div class="feature-tabs" role="tablist" aria-label="기능 카테고리">
                    ${renderFeatureTabs()}
                </div>
                <div class="feature-panel" id="feature-panel" role="tabpanel" aria-labelledby="tab-${featureCategories[0].id}">
                    ${renderFeatureCards()}
                </div>
            </div>
        </div>
    </section>

    <section class="section section-dark portfolio-section" id="portfolio" aria-labelledby="portfolio-title">
        <div class="container">
            <div class="section-heading reveal">
                <h2 id="portfolio-title">포트폴리오</h2>
            </div>
            <div class="portfolio-marquee reveal" aria-label="포트폴리오 목록">
                <div class="portfolio-track">
                    <div class="portfolio-set">${renderPortfolioCards()}</div>
                    <div class="portfolio-set" aria-hidden="true">${renderPortfolioCards(true)}</div>
                </div>
                <div class="portfolio-nav" aria-label="포트폴리오 탐색">
                    <button type="button" class="portfolio-nav-button" data-portfolio-prev aria-label="이전 포트폴리오">‹</button>
                    <span class="portfolio-count" data-portfolio-count>01 / ${String(portfolio.length).padStart(2, "0")}</span>
                    <button type="button" class="portfolio-nav-button" data-portfolio-next aria-label="다음 포트폴리오">›</button>
                </div>
            </div>
        </div>
    </section>

    <section class="section section-dark partner-section" id="partners" aria-labelledby="partner-title">
        <div class="container">
            <div class="section-heading reveal">
                <h2 id="partner-title">파트너 & 협력기관</h2>
                <p class="eyebrow">함께 기술과 서비스를 검증해온 기관과 파트너입니다</p>
            </div>
            <div class="partner-orbit reveal" data-partner-orbit tabindex="0" aria-label="좌우로 스크롤하거나 드래그해서 파트너 및 협력기관 로고 보기">
                <div class="partner-orbit-stage">
                    ${renderPartnerCards()}
                </div>
            </div>
        </div>
    </section>

    <section class="section section-light why-section" aria-labelledby="why-title">
        <div class="container">
            <div class="section-heading reveal">
                <p class="eyebrow">보이지 않는 부분까지 설계가 되어야 지속 운영할 수 있습니다</p>
                <h2 id="why-title">개발 이후의 서비스 관리를 책임집니다</h2>
            </div>
            <div class="why-grid">
                ${whyNero.map(([title, copy], index) => `
                    <article class="number-card reveal">
                        <span>${String(index + 1).padStart(2, "0")}</span>
                        <h3>${title}</h3>
                        <p>${copy}</p>
                    </article>
                `).join("")}
            </div>
        </div>
    </section>

    <section class="process-section process-scroll-section" id="process" aria-labelledby="process-title" data-process-section>
        <div class="process-sticky">
            <div class="process-layout">
                <aside class="process-copy reveal">
                    <h2 id="process-title">명확한 절차로 예측 가능한 개발을 설계합니다</h2>
                    <p>상담부터 QA·배포·인수인계까지, 운영 가능한 제품을 만들기 위한 기준을 단계마다 확인합니다.</p>
                    <a class="text-cta" href="${pageConfig.ctaHref}" data-track="${TRACK_EVENTS.SCOPE_SPRINT}">${pageConfig.ctaLabel}</a>
                </aside>
                <div class="process-stage" aria-label="NERO 진행 프로세스">
                    <ol class="process-timeline" data-process-track>
                        ${processSteps.map(([title, copy], index) => `
                            <li class="process-step reveal" data-process-step>
                                <div class="process-marker" aria-hidden="true">
                                    <span class="process-number">${String(index + 1).padStart(2, "0")}</span>
                                    <span class="process-line"></span>
                                </div>
                                <article class="process-card">
                                    <div class="process-card-head">
                                        <span>${processLabels[index]}</span>
                                        <h3>${title}</h3>
                                    </div>
                                    <div class="process-card-panel">
                                        <strong>진행 기준</strong>
                                        <p>${copy}</p>
                                    </div>
                                </article>
                            </li>
                        `).join("")}
                    </ol>
                </div>
            </div>
            <div class="process-dots" aria-hidden="true">
                ${processSteps.map((_, index) => `<span data-process-dot="${index}"></span>`).join("")}
            </div>
            <button class="process-skip" type="button" data-process-skip aria-label="프로세스 섹션 건너뛰기">
                <span>skip</span>
                <span aria-hidden="true">⌄</span>
            </button>
        </div>
    </section>

    <section class="section section-light deliverables-section" aria-labelledby="deliverables-title">
        <div class="container">
            <div class="section-heading reveal">
                <p class="eyebrow">소스코드는 물론, 추후의 유지보수와 디벨롭을 고려한 자료까지 가져가실 수 있도록</p>
                <h2 id="deliverables-title">코드만 납품하지 않습니다</h2>
            </div>
            <div class="deliverable-grid">
                ${deliverables.map(([step, output, handover]) => `
                    <article class="deliverable-card reveal">
                        <span>${step}</span>
                        <h3>${output}</h3>
                        <p>${handover}</p>
                    </article>
                `).join("")}
            </div>
        </div>
    </section>

    <section class="section section-dark faq-section" id="faq" aria-labelledby="faq-title">
        <div class="container">
            <div class="section-heading reveal">
                <p class="eyebrow">FAQ</p>
                <h2 id="faq-title">자주 묻는 질문</h2>
            </div>
            <div class="faq-list">
                ${faqs.map(([question, answer]) => `
                    <details class="faq-item reveal">
                        <summary>${question}</summary>
                        <p>${answer}</p>
                    </details>
                `).join("")}
            </div>
        </div>
    </section>

    ${renderHomeQuoteSection()}

    ${renderLandingFooter()}

    <div class="modal-backdrop" id="feature-modal" hidden>
        <section class="feature-modal" role="dialog" aria-modal="true" aria-labelledby="feature-modal-title">
            <button class="modal-close" type="button" aria-label="기능 상세 닫기">닫기</button>
            <span class="feature-level" id="feature-modal-level"></span>
            <h3 id="feature-modal-title"></h3>
            <p id="feature-modal-value"></p>
            <dl>
                <div>
                    <dt>고객 가치</dt>
                    <dd id="feature-modal-customer"></dd>
                </div>
                <div>
                    <dt>필요 준비</dt>
                    <dd id="feature-modal-prep"></dd>
                </div>
                <div>
                    <dt>산출물</dt>
                    <dd id="feature-modal-output"></dd>
                </div>
                <div>
                    <dt>관련 포트폴리오</dt>
                    <dd id="feature-modal-portfolio"></dd>
                </div>
            </dl>
            <a class="primary-button" href="${pageConfig.ctaHref}" data-track="${TRACK_EVENTS.HERO_DIAGNOSIS}">이 기능 상담하기</a>
        </section>
    </div>
`;

const hydrateAssetSlots = () => {
    document.querySelectorAll(".asset-slot img").forEach((image) => {
        const slot = image.closest(".asset-slot");
        const markLoaded = () => {
            slot.dataset.loaded = "true";
        };
        const markMissing = () => {
            slot.dataset.loaded = "false";
        };

        image.addEventListener("load", markLoaded);
        image.addEventListener("error", markMissing);

        if (image.complete) {
            if (image.naturalWidth > 0) {
                markLoaded();
            } else {
                markMissing();
            }
        }
    });
};

const contactSelectAliases = {
    "#customer-type": {
        "예비창업자·지원사업": "예비창업자",
        "기존 서비스 운영자": "서비스 운영자",
    },
    "#build-type": {
        "전환형 랜딩·신청 페이지": "랜딩페이지 제작",
        "MVP/PoC": "MVP 웹서비스 제작",
        "운영형 웹서비스": "실운영 웹사이트 제작",
        "iOS·Android 앱서비스": "앱서비스 제작",
        "기존 서비스 Rescue": "기존 서비스 업데이트",
    },
};

const setContactValue = (selector, value) => {
    const element = document.querySelector(selector);
    if (!element || !value) return;
    element.value = contactSelectAliases[selector]?.[value] || value;
    element.dispatchEvent(new Event("change", { bubbles: true }));
};

const getAnchorOffset = () => {
    const headerHeight = document.querySelector(".site-header")?.offsetHeight ?? 74;
    return headerHeight + (window.matchMedia("(max-width: 768px)").matches ? 18 : 28);
};

const scrollToSection = (target, { behavior = "smooth", updateHash = true } = {}) => {
    if (!target) return;
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - getAnchorOffset());
    window.scrollTo({ top, behavior });
    if (updateHash && target.id) {
        window.history.pushState(null, "", `#${target.id}`);
    }
};

const scrollToContact = () => {
    scrollToSection(document.querySelector(`#${pageConfig.contactTargetId}`));
};

const wirePackageAndServiceCards = () => {
    document.querySelectorAll("[data-customer-value]").forEach((card) => {
        const activate = () => {
            setContactValue("#customer-type", card.dataset.customerValue);
            trackEvent(card.dataset.track, { customerType: card.dataset.customerValue });
            scrollToContact();
        };
        card.addEventListener("click", activate);
        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                activate();
            }
        });
    });

    document.querySelectorAll("[data-build-value]").forEach((card) => {
        const activate = () => {
            setContactValue("#build-type", card.dataset.buildValue);
            trackEvent(card.dataset.track, { buildType: card.dataset.buildValue });
            scrollToContact();
        };
        card.addEventListener("click", activate);
        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                activate();
            }
        });
    });
};

const wireFeatureTabs = () => {
    const panel = document.querySelector("#feature-panel");
    const tabs = document.querySelectorAll("[data-feature-category]");

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            tabs.forEach((item) => item.setAttribute("aria-selected", "false"));
            tab.setAttribute("aria-selected", "true");
            panel.setAttribute("aria-labelledby", tab.id);
            panel.innerHTML = renderFeatureCards(tab.dataset.featureCategory);
            requestAnimationFrame(() => {
                wireFeatureCards();
                prepareRevealStagger(panel);
                revealNewElements(panel);
            });
        });
    });
};

const getFeatureByKey = (key) => {
    const [categoryId, index] = key.split(":");
    const category = featureCategories.find((item) => item.id === categoryId);
    return category?.features[Number(index)];
};

const modal = document.querySelector("#feature-modal");
const closeModalButton = modal.querySelector(".modal-close");
let lastFocusedElement = null;

const openFeatureModal = (feature) => {
    if (!feature) return;
    lastFocusedElement = document.activeElement;
    modal.querySelector("#feature-modal-level").textContent = feature.level;
    modal.querySelector("#feature-modal-title").textContent = feature.name;
    modal.querySelector("#feature-modal-value").textContent = feature.value;
    modal.querySelector("#feature-modal-customer").textContent = feature.customerValue;
    modal.querySelector("#feature-modal-prep").textContent = feature.preparation;
    modal.querySelector("#feature-modal-output").textContent = feature.outputs;
    modal.querySelector("#feature-modal-portfolio").textContent = feature.portfolio;
    modal.hidden = false;
    document.body.dataset.modalOpen = "true";
    trackEvent(TRACK_EVENTS.OPEN_FEATURE_MODAL, { feature: feature.name });
    closeModalButton.focus();
};

const closeFeatureModal = () => {
    modal.hidden = true;
    delete document.body.dataset.modalOpen;
    lastFocusedElement?.focus?.();
};

const wireFeatureCards = () => {
    document.querySelectorAll("[data-feature]").forEach((card) => {
        card.addEventListener("click", () => openFeatureModal(getFeatureByKey(card.dataset.feature)));
    });
};

const wireModal = () => {
    closeModalButton.addEventListener("click", closeFeatureModal);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeFeatureModal();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) closeFeatureModal();
    });
};

const wireTracking = () => {
    document.querySelectorAll("[data-track]:not([data-customer-value]):not([data-build-value])").forEach((element) => {
        element.addEventListener("click", () => {
            trackEvent(element.dataset.track, { label: element.textContent.trim() });
        });
    });

    document.querySelectorAll(".faq-item").forEach((item) => {
        item.addEventListener("toggle", () => {
            if (item.open) {
                trackEvent(TRACK_EVENTS.OPEN_FAQ, { question: item.querySelector("summary")?.textContent.trim() });
            }
        });
    });
};

const wireContactForm = () => {
    const form = document.querySelector("#contact-form");
    if (!form) return;
    const status = form.querySelector(".form-status");
    const submitButton = form.querySelector(".form-submit");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        trackEvent(TRACK_EVENTS.SUBMIT_DIAGNOSIS, {
            hasMessage: Boolean(data.message?.trim()),
        });

        status.textContent = "아이디어를 전송하고 있습니다.";
        form.dataset.submitted = "pending";
        if (submitButton) submitButton.disabled = true;

        try {
            const response = await fetch(form.action, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.ok) {
                const suffix = result.code ? ` (${result.code})` : "";
                throw new Error(`${result.message || "전송에 실패했습니다."}${suffix}`);
            }
            status.textContent = result.message || "아이디어가 접수되었습니다. 곧 연락드리겠습니다.";
            form.dataset.submitted = "true";
            form.reset();
        } catch (error) {
            status.textContent = error.message || "전송에 실패했습니다. 잠시 후 다시 시도해주세요.";
            form.dataset.submitted = "false";
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
};

const wireProcessTimeline = () => {
    const section = document.querySelector("[data-process-section]");
    const stage = section?.querySelector(".process-stage");
    const track = section?.querySelector("[data-process-track]");
    const steps = Array.from(section?.querySelectorAll("[data-process-step]") ?? []);
    const dots = Array.from(section?.querySelectorAll("[data-process-dot]") ?? []);
    const skipButton = section?.querySelector("[data-process-skip]");
    if (!section || !stage || !track || steps.length === 0) return;

    const mobileQuery = window.matchMedia("(max-width: 900px)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let ticking = false;
    let travel = 0;
    let lead = 0;

    const setActive = (activeIndex) => {
        steps.forEach((step, index) => step.classList.toggle("is-active", index === activeIndex));
        dots.forEach((dot, index) => dot.classList.toggle("is-active", index === activeIndex));
    };

    const reset = () => {
        section.style.removeProperty("--process-height");
        track.style.transform = "";
        section.classList.remove("is-process-pinned");
        setActive(0);
    };

    const measure = () => {
        if (mobileQuery.matches || reducedMotionQuery.matches) {
            reset();
            return;
        }

        lead = Math.min(140, window.innerHeight * 0.16);
        travel = Math.max(0, track.scrollHeight - stage.clientHeight);
        section.style.setProperty("--process-height", `${window.innerHeight + lead + travel}px`);
        update();
    };

    const update = () => {
        if (mobileQuery.matches || reducedMotionQuery.matches) {
            reset();
            ticking = false;
            return;
        }

        const rect = section.getBoundingClientRect();
        const offset = Math.min(Math.max(-rect.top - lead, 0), travel);
        const progress = travel === 0 ? 0 : offset / travel;
        const activeIndex = Math.min(steps.length - 1, Math.max(0, Math.round(progress * (steps.length - 1))));

        track.style.transform = `translate3d(0, ${-offset}px, 0)`;
        section.classList.toggle("is-process-pinned", rect.top <= 0 && rect.bottom >= window.innerHeight);
        setActive(activeIndex);
        ticking = false;
    };

    const requestUpdate = () => {
        if (!ticking) {
            window.requestAnimationFrame(update);
            ticking = true;
        }
    };

    skipButton?.addEventListener("click", () => {
        const sectionBottom = section.offsetTop + section.offsetHeight;
        window.scrollTo({ top: sectionBottom, behavior: "smooth" });
    });

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", measure);
    mobileQuery.addEventListener?.("change", measure);
    reducedMotionQuery.addEventListener?.("change", measure);
    window.setTimeout(measure, 60);
    window.addEventListener("load", measure, { once: true });
    setActive(0);
};

const wirePortfolioCarousel = () => {
    const carousel = document.querySelector(".portfolio-marquee");
    const set = carousel?.querySelector(".portfolio-set:not([aria-hidden])");
    const cards = Array.from(set?.querySelectorAll("[data-portfolio-card]") ?? []);
    const prevButton = carousel?.querySelector("[data-portfolio-prev]");
    const nextButton = carousel?.querySelector("[data-portfolio-next]");
    const count = carousel?.querySelector("[data-portfolio-count]");
    if (!carousel || !set || cards.length === 0) return;

    const mobileQuery = window.matchMedia("(max-width: 768px)");
    let activeIndex = 0;
    let ticking = false;

    const setActive = (nextIndex) => {
        activeIndex = (nextIndex + cards.length) % cards.length;

        if (!mobileQuery.matches) {
            set.style.transform = "";
            cards.forEach((card) => card.removeAttribute("aria-hidden"));
            return;
        }

        set.style.transform = `translate3d(${-cards[activeIndex].offsetLeft}px, 0, 0)`;
        cards.forEach((card, index) => card.setAttribute("aria-hidden", String(index !== activeIndex)));
        if (count) count.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
    };

    const requestUpdate = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
            setActive(activeIndex);
            ticking = false;
        });
    };

    prevButton?.addEventListener("click", () => setActive(activeIndex - 1));
    nextButton?.addEventListener("click", () => setActive(activeIndex + 1));
    window.addEventListener("resize", requestUpdate);
    mobileQuery.addEventListener?.("change", requestUpdate);
    setActive(0);
};

const wirePartnerOrbit = () => {
    document.querySelectorAll("[data-partner-orbit]").forEach((orbit) => {
        const stage = orbit.querySelector(".partner-orbit-stage");
        const cards = Array.from(orbit.querySelectorAll(".partner-card"));
        if (!stage || cards.length === 0) return;

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        let rotation = 0;
        let targetRotation = 0;
        let isDragging = false;
        let lastX = 0;
        let rafId = 0;

        const measure = () => {
            const rect = orbit.getBoundingClientRect();
            return {
                radiusX: Math.max(118, Math.min(rect.width * 0.36, 420)),
                radiusY: Math.max(54, Math.min(rect.height * 0.22, 142)),
            };
        };

        let geometry = measure();

        const render = () => {
            rotation += (targetRotation - rotation) * 0.09;

            cards.forEach((card, index) => {
                const count = cards.length;
                const phi = Math.acos(-1 + (2 * (index + 0.5)) / count);
                const theta = goldenAngle * index + rotation;
                const sphereX = Math.cos(theta) * Math.sin(phi);
                const sphereY = Math.cos(phi);
                const sphereZ = Math.sin(theta) * Math.sin(phi);
                const front = (sphereZ + 1) / 2;
                const scale = 0.68 + front * 0.36;
                const opacity = 0.55 + front * 0.45;

                card.style.setProperty("--partner-x", `${sphereX * geometry.radiusX}px`);
                card.style.setProperty("--partner-y", `${sphereY * geometry.radiusY}px`);
                card.style.setProperty("--partner-scale", String(scale));
                card.style.setProperty("--partner-opacity", String(opacity));
                card.style.setProperty("--partner-blur", `${(1 - front) * 1.8}px`);
                card.style.zIndex = String(Math.round(100 + front * 100));
            });

            if (!isDragging && !reducedMotion.matches) {
                targetRotation += 0.0026;
            }
            rafId = window.requestAnimationFrame(render);
        };

        const rotateBy = (delta) => {
            targetRotation += delta;
        };

        orbit.addEventListener("wheel", (event) => {
            event.preventDefault();
            const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
            rotateBy(delta * 0.008);
        }, { passive: false });

        orbit.addEventListener("pointerdown", (event) => {
            isDragging = true;
            lastX = event.clientX;
            orbit.classList.add("is-dragging");
            orbit.setPointerCapture?.(event.pointerId);
        });

        orbit.addEventListener("pointermove", (event) => {
            if (!isDragging) return;
            const delta = event.clientX - lastX;
            lastX = event.clientX;
            rotateBy(delta * 0.014);
        });

        const stopDragging = (event) => {
            if (!isDragging) return;
            isDragging = false;
            orbit.classList.remove("is-dragging");
            orbit.releasePointerCapture?.(event.pointerId);
        };

        orbit.addEventListener("pointerup", stopDragging);
        orbit.addEventListener("pointercancel", stopDragging);
        orbit.addEventListener("keydown", (event) => {
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                rotateBy(-0.42);
            }
            if (event.key === "ArrowRight") {
                event.preventDefault();
                rotateBy(0.42);
            }
        });

        window.addEventListener("resize", () => {
            geometry = measure();
        });

        render();
        window.addEventListener("pagehide", () => window.cancelAnimationFrame(rafId), { once: true });
    });
};

const wireDrawer = () => {
    const button = document.querySelector(".menu-button");
    const drawer = document.querySelector("#mobile-drawer");
    const backdrop = document.querySelector(".drawer-backdrop");
    const closeTargets = document.querySelectorAll("[data-drawer-close], .drawer-nav a");

    const setOpen = (isOpen) => {
        button.setAttribute("aria-expanded", String(isOpen));
        if (isOpen) {
            drawer.hidden = false;
            backdrop.hidden = false;
            requestAnimationFrame(() => {
                drawer.classList.add("is-open");
                backdrop.classList.add("is-open");
                document.body.dataset.drawerOpen = "true";
            });
        } else {
            drawer.classList.remove("is-open");
            backdrop.classList.remove("is-open");
            delete document.body.dataset.drawerOpen;
            window.setTimeout(() => {
                drawer.hidden = true;
                backdrop.hidden = true;
            }, 220);
        }
    };

    button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
    closeTargets.forEach((target) => target.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") setOpen(false);
    });
};

const getHashTarget = (href) => {
    if (!href?.startsWith("#")) return null;
    const id = decodeURIComponent(href.slice(1));
    return id ? document.getElementById(id) : null;
};

const wireAnchoredNavigation = () => {
    const anchorLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
    const targetMap = new Map();

    anchorLinks.forEach((link) => {
        const href = link.getAttribute("href");
        const target = getHashTarget(href);
        if (!target) return;
        targetMap.set(target.id, target);
        link.addEventListener("click", (event) => {
            event.preventDefault();
            scrollToSection(target);
        });
    });

    const targets = Array.from(targetMap.values()).sort((a, b) => a.offsetTop - b.offsetTop);
    if (targets.length === 0) return;

    let ticking = false;
    const updateActive = () => {
        const probe = window.scrollY + getAnchorOffset() + window.innerHeight * 0.22;
        const activeTarget = targets.reduce((current, target) => {
            if (target.offsetTop <= probe) return target;
            return current;
        }, targets[0]);
        anchorLinks.forEach((link) => {
            const target = getHashTarget(link.getAttribute("href"));
            link.classList.toggle("is-active", Boolean(target && target.id === activeTarget.id));
        });
        ticking = false;
    };

    window.addEventListener("scroll", () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(updateActive);
    }, { passive: true });
    window.addEventListener("resize", updateActive);
    updateActive();
};

const prepareRevealStagger = (root = document) => {
    const groups = [
        ".pain-grid",
        ".comparison-grid",
        ".package-grid",
        ".service-grid",
        ".feature-panel",
        ".why-grid",
        ".deliverable-grid",
        ".faq-list",
        ".process-timeline",
    ];

    groups.forEach((selector) => {
        const matchedGroups = [
            ...(root.matches?.(selector) ? [root] : []),
            ...root.querySelectorAll(selector),
        ];
        matchedGroups.forEach((group) => {
            const items = group.querySelectorAll(":scope > .reveal");
            items.forEach((item, index) => {
                item.style.setProperty("--reveal-delay", `${Math.min(index * 70, 360)}ms`);
            });
        });
    });
};

let revealObserver = null;

const revealNewElements = (root = document) => {
    const elements = root.querySelectorAll(".reveal:not(.is-visible)");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        elements.forEach((element) => element.classList.add("is-visible"));
        return;
    }
    if (!revealObserver) {
        revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    }
    elements.forEach((element) => revealObserver.observe(element));
};

const wireScrollTracking = () => {
    const tracked = { 50: false, 90: false };
    let ticking = false;

    const check = () => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll <= 0 ? 100 : (window.scrollY / maxScroll) * 100;
        if (progress >= 50 && !tracked[50]) {
            tracked[50] = true;
            trackEvent(TRACK_EVENTS.SCROLL_50);
        }
        if (progress >= 90 && !tracked[90]) {
            tracked[90] = true;
            trackEvent(TRACK_EVENTS.SCROLL_90);
        }
        ticking = false;
    };

    window.addEventListener("scroll", () => {
        if (!ticking) {
            window.requestAnimationFrame(check);
            ticking = true;
        }
    }, { passive: true });
};

const scrollToInitialHash = () => {
    if (!window.location.hash) return;
    const move = () => {
        const hashId = decodeURIComponent(window.location.hash.slice(1));
        const target = document.getElementById(hashId);
        if (!target) return;
        scrollToSection(target, { behavior: "auto", updateHash: false });
        revealNewElements(document);
    };
    [0, 80, 260, 700, 1300].forEach((delay) => window.setTimeout(move, delay));
    window.addEventListener("load", () => window.setTimeout(move, 120), { once: true });
};

hydrateAssetSlots();
wireDrawer();
wireAnchoredNavigation();
wirePackageAndServiceCards();
wireFeatureTabs();
wireFeatureCards();
wireModal();
wireTracking();
wireContactForm();
wireProcessTimeline();
wirePortfolioCarousel();
wirePartnerOrbit();
wireScrollTracking();
prepareRevealStagger();
revealNewElements();
scrollToInitialHash();
