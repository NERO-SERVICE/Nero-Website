/**
 * 네로 기업 공고 게시판 시스템
 * - 데이터 로딩 및 렌더링
 * - 필터링 및 검색 기능
 * - 페이지네이션
 * - 모달 상세 보기
 * - 접근성 지원
 */

const SITE_NAV_ITEMS = [
    ['추천 패키지', '/#packages'],
    ['서비스', '/#services'],
    ['기능 컴포넌트', '/#features'],
    ['포트폴리오', '/#portfolio'],
    ['진행 방식', '/#process'],
    ['FAQ', '/#faq'],
    ['공지사항', '/announcement'],
    ['회사소개', '/about'],
];

const SITE_NAV_CONFIG = {
    navItems: SITE_NAV_ITEMS,
    ctaHref: '/#contact',
    ctaLabel: '문의 남기기',
    activeHref: '/announcement',
};

const renderSiteHeaderLinks = (items, activeHref = '') => items
    .map(([label, href]) => `<a class="${href === activeHref ? 'is-active' : ''}" href="${href}">${label}</a>`)
    .join('');

const renderSiteHeader = ({ navItems, ctaHref, ctaLabel, activeHref }) => `
    <header class="site-header" aria-label="주요 메뉴">
        <a class="header-logo" href="/" aria-label="NERO 홈">
            <img src="/assets/img/landing/nero_logo.svg" alt="NERO" />
        </a>

        <nav class="desktop-nav" aria-label="데스크톱 메뉴">
            ${renderSiteHeaderLinks(navItems, activeHref)}
        </nav>

        <a class="header-cta" href="${ctaHref}">${ctaLabel}</a>
        <button class="menu-button" type="button" aria-label="모바일 메뉴 열기" aria-controls="mobile-drawer" aria-expanded="false">
            <span></span>
            <span></span>
        </button>
    </header>

    <div class="drawer-backdrop" data-drawer-close hidden></div>
    <aside class="mobile-drawer" id="mobile-drawer" aria-label="모바일 메뉴" hidden>
        <div class="drawer-head">
            <a class="header-logo" href="/" aria-label="NERO 홈">
                <img src="/assets/img/landing/nero_logo.svg" alt="NERO" />
            </a>
            <button class="drawer-close" type="button" aria-label="모바일 메뉴 닫기" data-drawer-close>닫기</button>
        </div>
        <nav class="drawer-nav" aria-label="모바일 내비게이션">
            ${renderSiteHeaderLinks(navItems, activeHref)}
            <a class="primary-button" href="${ctaHref}">${ctaLabel}</a>
        </nav>
    </aside>
`;

const wireSiteDrawer = () => {
    const button = document.querySelector('.menu-button');
    const drawer = document.querySelector('#mobile-drawer');
    const backdrop = document.querySelector('.drawer-backdrop');
    const closeTargets = document.querySelectorAll('[data-drawer-close], .drawer-nav a');
    if (!button || !drawer || !backdrop) return;

    const setOpen = (isOpen) => {
        button.setAttribute('aria-expanded', String(isOpen));
        if (isOpen) {
            drawer.hidden = false;
            backdrop.hidden = false;
            requestAnimationFrame(() => {
                drawer.classList.add('is-open');
                backdrop.classList.add('is-open');
                document.body.dataset.drawerOpen = 'true';
            });
        } else {
            drawer.classList.remove('is-open');
            backdrop.classList.remove('is-open');
            delete document.body.dataset.drawerOpen;
            window.setTimeout(() => {
                drawer.hidden = true;
                backdrop.hidden = true;
            }, 220);
        }
    };

    button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
    closeTargets.forEach((target) => target.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') setOpen(false);
    });
};

const mountSiteHeader = () => {
    if (!document.body.classList.contains('announcement-page') || document.querySelector('.site-header')) return;
    document.body.insertAdjacentHTML('afterbegin', renderSiteHeader(SITE_NAV_CONFIG));
    wireSiteDrawer();
};

const revealAnnouncementElements = () => {
    const items = document.querySelectorAll('.test-reveal');
    if (!('IntersectionObserver' in window)) {
        items.forEach((item) => item.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.18 });

    items.forEach((item) => observer.observe(item));
};

class AnnouncementSystem {
    constructor() {
        this.data = null;
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentCategory = '전체';
        this.currentSearchTerm = '';
        this.modalInstance = null; // 모달 인스턴스 단일화
        
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            //this.renderNotifications();
            // *** 전체 탭 자동 클릭 (최초 진입 시 필터 적용) ***
            this.handleCategoryFilter('전체');
            this.hideLoading();
        } catch (error) {
            console.error('공고 시스템 초기화 실패:', error);
            this.showError('공고를 불러오는 중 오류가 발생했습니다.');
        }
    }

    async loadData() {
        try {
            const announcementResponse = await fetch('/data/announcements.json');
            
            if (!announcementResponse.ok) {
                throw new Error(`Announcement data error! status: ${announcementResponse.status}`);
            }
            
            this.data = await announcementResponse.json();
            this.filteredData = [...this.data.announcements];
            this.itemsPerPage = this.data.settings.postsPerPage || 10;
        } catch (error) {
            console.error('데이터 로딩 실패:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // 필터 탭 이벤트
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.handleCategoryFilter(e.target.dataset.category);
            });
            
            // 키보드 접근성
            tab.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleCategoryFilter(e.target.dataset.category);
                }
            });
        });

        // 검색 기능
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.handleSearch(e.target.value);
                }, 300); // 디바운싹
            });
        }

        // 모달 이벤트 초기화
        this.initModal();
    }

    handleCategoryFilter(category) {
        this.currentCategory = category;
        this.currentPage = 1;
        this.updateActiveTab(category);
        this.applyFilters();
        this.renderNotifications();
        
        // 접근성: 스크린 리더에 변경 사항 알림
        this.announceToScreenReader(`${category} 카테고리가 선택되었습니다.`);
    }

    handleSearch(searchTerm) {
        this.currentSearchTerm = searchTerm.trim();
        this.currentPage = 1;
        this.applyFilters();
        this.renderNotifications();
        
        // 검색 결과 안내
        if (this.currentSearchTerm) {
            const resultCount = this.filteredData.length;
            this.announceToScreenReader(`${this.currentSearchTerm}에 대한 검색 결과 ${resultCount}개가 찾아졌습니다.`);
        }
    }

    applyFilters() {
        let filtered = [...this.data.announcements];

        // 카테고리 필터
        if (this.currentCategory !== '전체') {
            filtered = filtered.filter(item => item.type === this.currentCategory);
        }

        // 검색 필터
        if (this.currentSearchTerm) {
            const searchLower = this.currentSearchTerm.toLowerCase();
            filtered = filtered.filter(item => 
                item.title.toLowerCase().includes(searchLower) ||
                item.content.toLowerCase().includes(searchLower)
            );
        }

        // 날짜순 정렬 (최신순)
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        this.filteredData = filtered;
    }

    renderNotifications() {
        const container = document.getElementById('announcements-list');
        const emptyState = document.getElementById('empty-state');
        
        if (!container) return;

        // 빈 상태 처리
        if (this.filteredData.length === 0) {
            container.innerHTML = '';
            emptyState?.classList.remove('d-none');
            this.renderPagination(0);
            return;
        } else {
            emptyState?.classList.add('d-none');
        }

        // 페이지네이션 계산
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        // 공고 카드 렌더링
        container.innerHTML = pageData.map(announcement => 
            this.createAnnouncementCard(announcement)
        ).join('');

        // 카드 클릭 이벤트 추가
        this.attachCardEvents();

        // 페이지네이션 렌더링
        this.renderPagination(this.filteredData.length);

        // 스크롤 애니메이션
        this.animateCards();
    }

    createAnnouncementCard(announcement) {
        const previewText = this.truncateText(announcement.content, 120);
        const formattedDate = this.formatDate(announcement.date);
        const isExternalLink = !!announcement.externalLink;
        
        // 외부 링크가 있는 경우 다른 UI 표시
        const actionButton = isExternalLink ? `
            <button class="read-more-btn external-link-btn" 
                    data-id="${announcement.id}"
                    data-url="${announcement.externalLink.url}"
                    data-open-new-tab="${announcement.externalLink.openInNewTab}"
                    aria-label="${announcement.title} 기사 보기">
                기사 보기
                <i class="fas fa-external-link-alt ms-1"></i>
            </button>
        ` : `
            <button class="read-more-btn" 
                    data-bs-toggle="modal" 
                    data-bs-target="#announcementModal"
                    data-id="${announcement.id}"
                    aria-label="${announcement.title} 상세 내용 보기">
                자세히 보기
                <i class="fas fa-arrow-right ms-1"></i>
            </button>
        `;

        return `
            <article class="announcement-card ${announcement.isImportant ? 'important' : ''} ${isExternalLink ? 'external-link-card' : ''}"
                     data-id="${announcement.id}"
                     tabindex="0"
                     role="button"
                     aria-label="${announcement.title} ${isExternalLink ? '기사' : '공고'} 보기">
                <div class="announcement-header">
                    <div class="flex-grow-1">
                        <div class="announcement-meta">
                            <span class="announcement-type ${announcement.type}">${announcement.type}</span>
                            <span class="announcement-date">
                                <i class="fas fa-calendar-alt"></i>
                                ${formattedDate}
                            </span>
                            ${isExternalLink ? '<i class="fas fa-external-link-alt external-link-indicator" title="외부 링크"></i>' : ''}
                        </div>
                        <h3 class="announcement-title">${this.escapeHtml(announcement.title)}</h3>
                        <p class="announcement-preview">${this.escapeHtml(previewText)}</p>
                    </div>
                </div>
                <div class="announcement-actions">
                    ${actionButton}
                </div>
            </article>
        `;
    }

    attachCardEvents() {
        const cards = document.querySelectorAll('.announcement-card');
        cards.forEach(card => {
            // 클릭 이벤트
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.read-more-btn')) {
                    const button = card.querySelector('.read-more-btn');
                    if (button) this.handleButtonClick(button);
                }
            });

            // 키보드 접근성
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const button = card.querySelector('.read-more-btn');
                    if (button) this.handleButtonClick(button);
                }
            });
        });

        // 버튼별 직접 이벤트 처리
        const buttons = document.querySelectorAll('.read-more-btn');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleButtonClick(button);
            });
        });
    }

    handleButtonClick(button) {
        // 외부 링크 버튼인지 확인
        if (button.classList.contains('external-link-btn')) {
            const url = button.dataset.url;
            const openInNewTab = button.dataset.openNewTab === 'true';
            
            if (url) {
                this.handleExternalLink(url, openInNewTab, button);
            }
        } else {
            // 기존 모달 처리 - 인스턴스 재사용
            const announcementId = parseInt(button.dataset.id);
            if (announcementId) {
                this.showModal(announcementId);
            }
        }
    }

    handleExternalLink(url, openInNewTab, buttonElement) {
        // URL 검증
        if (!this.isValidUrl(url)) {
            console.error('Invalid URL:', url);
            this.announceToScreenReader('유효하지 않은 링크입니다.');
            return;
        }

        // 즉시 링크 열기 (확인 대화상자 제거)
        try {
            if (openInNewTab) {
                window.open(url, '_blank', 'noopener,noreferrer');
            } else {
                window.location.href = url;
            }
            
            // 접근성 안내
            this.announceToScreenReader('외부 기사 페이지로 이동합니다.');
        } catch (error) {
            console.error('Failed to open external link:', error);
            this.announceToScreenReader('링크를 열 수 없습니다.');
        }
    }

    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const paginationContainer = document.getElementById('pagination');
        
        if (!paginationContainer || totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHtml = '';

        // 이전 페이지
        const prevDisabled = this.currentPage === 1 ? 'disabled' : '';
        paginationHtml += `
            <li class="page-item ${prevDisabled}">
                <a class="page-link" href="#" data-page="${this.currentPage - 1}" 
                   aria-label="이전 페이지" ${prevDisabled ? 'tabindex="-1"' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // 페이지 번호들
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
            if (startPage > 2) {
                paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === this.currentPage ? 'active' : '';
            const ariaCurrent = i === this.currentPage ? 'aria-current="page"' : '';
            paginationHtml += `
                <li class="page-item ${activeClass}">
                    <a class="page-link" href="#" data-page="${i}" ${ariaCurrent}>${i}</a>
                </li>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
        }

        // 다음 페이지
        const nextDisabled = this.currentPage === totalPages ? 'disabled' : '';
        paginationHtml += `
            <li class="page-item ${nextDisabled}">
                <a class="page-link" href="#" data-page="${this.currentPage + 1}" 
                   aria-label="다음 페이지" ${nextDisabled ? 'tabindex="-1"' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        paginationContainer.innerHTML = paginationHtml;

        // 페이지네이션 클릭 이벤트
        paginationContainer.addEventListener('click', (e) => {
            e.preventDefault();
            const pageLink = e.target.closest('[data-page]');
            if (pageLink && !pageLink.closest('.disabled')) {
                const page = parseInt(pageLink.dataset.page);
                if (page !== this.currentPage && page >= 1 && page <= totalPages) {
                    this.currentPage = page;
                    this.renderNotifications();
                    
                    // 페이지 변경 시 상단으로 스크롤
                    document.querySelector('#announcements-list')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    }

    showAnnouncementDetail(id) {
        const announcement = this.data.announcements.find(item => item.id === id);
        if (!announcement) return;

        const modalTitle = document.getElementById('announcementModalLabel');
        const modalBody = document.getElementById('announcementModalBody');

        if (modalTitle) {
            modalTitle.textContent = announcement.title;
        }

        if (modalBody) {
            const formattedDate = this.formatDate(announcement.date);

            modalBody.innerHTML = `
                <div class="mb-3">
                    <span class="announcement-type ${announcement.type} me-2">${announcement.type}</span>
                    <span class="text-muted">
                        <i class="fas fa-calendar-alt me-1"></i>
                        ${formattedDate}
                    </span>
                </div>
                <div class="announcement-content">
                    ${this.formatContent(announcement.content)}
                </div>
            `;
        }
    }

    formatContent(content) {
        // 줄바꿈을 <br>로 변환하고 특별한 형식 처리
        return this.escapeHtml(content)
            .replace(/\n/g, '<br>')
            .replace(/■/g, '<strong>■</strong>')
            .replace(/- (.+?):/g, '<strong>- $1:</strong>');
    }

    updateActiveTab(category) {
        const tabs = document.querySelectorAll('.filter-tab');
        tabs.forEach(tab => {
            const isActive = tab.dataset.category === category;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive);
        });
    }

    animateCards() {
        const cards = document.querySelectorAll('.announcement-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    hideLoading() {
        const loadingSpinner = document.getElementById('loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
    }

    showError(message) {
        const container = document.getElementById('announcements-list');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="color: var(--announcement-warning);"></i>
                    <h3>오류 발생</h3>
                    <p>${this.escapeHtml(message)}</p>
                </div>
            `;
        }
        this.hideLoading();
    }

    // 유틸리티 함수들
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    isTrustedDomain(url) {
        const trustedDomains = [
            'moneytoday.co.kr',
            'mk.co.kr',
            'etnews.com',
            'yakup.com',
            'hankyung.com',
            'naver.com',
            'daum.net',
            'joins.com',
            'chosun.com',
            'donga.com',
            'hani.co.kr',
            'khan.co.kr',
            'yna.co.kr',
            'newsis.com',
            'ytn.co.kr',
            'sbs.co.kr',
            'kbs.co.kr',
            'mbc.co.kr'
        ];

        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.toLowerCase();
            
            return trustedDomains.some(domain => 
                hostname === domain || hostname.endsWith('.' + domain)
            );
        } catch (_) {
            return false;
        }
    }

    // 모달 인스턴스 초기화 및 이벤트 처리
    initModal() {
        const modalElement = document.getElementById('announcementModal');
        if (!modalElement) return;

        // 단일 모달 인스턴스 생성
        this.modalInstance = new bootstrap.Modal(modalElement);
        
        // 모달 닫기 이벤트 처리 - 스크롤 복원
        modalElement.addEventListener('hidden.bs.modal', () => {
            this.restoreBodyScroll();
        });

        // 모달 열기 이벤트 처리 (기존 방식 유지)
        modalElement.addEventListener('show.bs.modal', (e) => {
            const announcementId = parseInt(e.relatedTarget?.dataset.id);
            if (announcementId) {
                this.showAnnouncementDetail(announcementId);
            }
        });
    }

    // 안전한 모달 열기
    showModal(announcementId) {
        if (!this.modalInstance) {
            this.initModal();
        }
        
        this.showAnnouncementDetail(announcementId);
        this.modalInstance.show();
    }

    // Body 스크롤 복원 로직
    restoreBodyScroll() {
        try {
            // Bootstrap이 실패한 경우 강제 복원
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            document.body.classList.remove('modal-open');
            
            // 백드롭 잔여물 제거
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => {
                if (backdrop.parentNode) {
                    backdrop.parentNode.removeChild(backdrop);
                }
            });
            
            // 추가 안전장치: body 스타일 완전 정리
            setTimeout(() => {
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }, 100);
            
        } catch (error) {
            console.warn('모달 정리 중 오류:', error);
            // 최후 수단: 강제 스크롤 복원
            document.body.style.overflow = 'auto';
        }
    }

    announceToScreenReader(message) {
        // 스크린 리더를 위한 라이브 리전 생성
        let liveRegion = document.getElementById('live-region');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'live-region';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            document.body.appendChild(liveRegion);
        }
        
        liveRegion.textContent = message;
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    }
}

// 페이지 로드 완료 시 시스템 초기화
document.addEventListener('DOMContentLoaded', () => {
    mountSiteHeader();
    revealAnnouncementElements();
    new AnnouncementSystem();
});

// 브라우저 뒤로가기/앞으로가기 지원
window.addEventListener('popstate', (e) => {
    if (e.state && e.state.page) {
        // 상태 복원 로직 (필요시 구현)
    }
});

// 페이지 가시성 API를 이용한 성능 최적화
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // 페이지가 숨겨졌을 때 애니메이션 중지
        document.querySelectorAll('.announcement-card').forEach(card => {
            card.style.animationPlayState = 'paused';
        });
    } else {
        // 페이지가 다시 보일 때 애니메이션 재개
        document.querySelectorAll('.announcement-card').forEach(card => {
            card.style.animationPlayState = 'running';
        });
    }
});
