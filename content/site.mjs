// Only the six routes that existed before this SEO change. No new content pages.
export const site = Object.freeze({
    origin: 'https://www.nero.ai.kr',
    name: 'NERO',
    organizationName: 'NERO',
    email: 'official@nero.ai.kr',
    logo: '/assets/img/landing/nero_logo.svg',
    image: '/assets/img/landing/hero-product-desktop.png',
});
export const absoluteUrl = (path) => new URL(path, `${site.origin}/`).href;
export const pages = [
    { path: '/', source: 'home', title: 'NERO | Home', description: '웹·앱외주개발 파트너 NERO. iOS 앱과 Android 앱개발, 서버·DB·API·관리자의 풀스택 개발과 배포·유지보수·인수인계를 지원합니다.', developmentService: true },
    { path: '/landing', source: 'landing', title: 'NERO | 연구자·창업자·기업을 위한 0→1 외주개발 파트너', description: '연구자·예비창업자·기업을 위한 웹·앱 외주개발. 지원사업과 초기 검증에 필요한 MVP/PoC, 관리자, 서버·DB·API, 앱 배포 범위를 확인하세요.', developmentService: true },
    { path: '/about', source: 'about', aboutOrganization: true, title: 'NERO | 회사 소개', description: 'NERO의 회사 소개와 공개 연혁. 정부지원사업인 2025 예비창업패키지 수료를 포함한 회사 이력과 연락처를 확인하세요.' },
    { path: '/overview', source: 'overview', title: 'NERO | 소개서 다운로드', description: 'NERO 제품 소개서가 필요하다면 기업명과 회신 정보를 남겨 소개서를 요청하세요.' },
    { path: '/services', source: 'services', title: '네로 - Services', description: 'Nero CARE는 약물 복용과 부작용 기록을 위한 환자 중심의 정신건강 통합관리 플랫폼입니다. 서비스 소개와 앱 다운로드 정보를 확인하세요.' },
    { path: '/announcement', source: 'announcement', title: 'NERO | Announcement', description: 'NERO 홈페이지에 공개된 공지사항과 기업 공고의 제목, 게시일, 내용을 확인하세요.' },
].map((page) => ({ publicationStatus: 'published', indexable: true, ...page, canonical: absoluteUrl(page.path) }));
export const publishedPages = () => pages.filter((page) => page.publicationStatus === 'published');
export const outputFile = (page) => page.path === '/' ? 'index.html' : `pages/${page.source}.html`;
export const privatePaths = ['/.git/', '/.env', '/.netlify/', '/api/', '/admin/', '/docs/', '/seo-kit/', '/tests/', '/test-results/', '/content/', '/netlify/', '/firebase/'];

// Every scope below is described in the original home/landing body. No awards,
// prices, clients, programme affiliations or unverified performance claims.
// Evidence and deferred search topics: docs/seo/keyword-targeting.md.
export const developmentService = Object.freeze({
    name: '웹·앱 외주개발',
    serviceType: '웹사이트·iOS/Android 앱개발 및 풀스택 개발',
    description: 'iOS·Android 앱과 사용자 화면, 서버·DB·API, 관리자 페이지의 풀스택 개발부터 배포·유지보수·인수인계까지 지원합니다.',
});
