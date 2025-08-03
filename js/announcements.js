/**
 * 네로 기업 공고 게시판 시스템
 * - 데이터 로딩 및 렌더링
 * - 필터링 및 검색 기능 (포트폴리오 포함)
 * - 포트폴리오 연동 표시
 * - 페이지네이션
 * - 모달 상세 보기
 * - 접근성 지원
 */

class AnnouncementSystem {
    constructor() {
        this.data = null;
        this.portfolioData = null;
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentCategory = '전체';
        this.currentSearchTerm = '';
        
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
            // 공고 데이터와 포트폴리오 데이터 동시 로드
            const [announcementResponse, portfolioResponse] = await Promise.all([
                fetch('data/announcements.json'),
                fetch('data/content.json')
            ]);
            
            if (!announcementResponse.ok) {
                throw new Error(`Announcement data error! status: ${announcementResponse.status}`);
            }
            if (!portfolioResponse.ok) {
                throw new Error(`Portfolio data error! status: ${portfolioResponse.status}`);
            }
            
            this.data = await announcementResponse.json();
            this.portfolioData = await portfolioResponse.json();
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
                }, 300); // 디바운싱
            });
        }

        // 모달 이벤트
        const modal = document.getElementById('announcementModal');
        if (modal) {
            modal.addEventListener('show.bs.modal', (e) => {
                const announcementId = parseInt(e.relatedTarget?.dataset.id);
                if (announcementId) {
                    this.showAnnouncementDetail(announcementId);
                }
            });
        }
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
        const portfolioEmptyState = document.getElementById('portfolio-empty-state');
        
        if (!container) return;

        // 빈 상태 처리
        if (this.filteredData.length === 0) {
            container.innerHTML = '';
            
            // 포트폴리오 카테고리인 경우 포트폴리오 전용 빈 상태 표시
            if (this.currentCategory === '포트폴리오') {
                portfolioEmptyState?.classList.remove('d-none');
                emptyState?.classList.add('d-none');
            } else {
                emptyState?.classList.remove('d-none');
                portfolioEmptyState?.classList.add('d-none');
            }
            
            this.renderPagination(0);
            return;
        } else {
            emptyState?.classList.add('d-none');
            portfolioEmptyState?.classList.add('d-none');
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
        const importantBadge = announcement.isImportant ? '' : '';
        
        // 포트폴리오 연동 정보 추가
        const portfolioLinkInfo = this.getPortfolioLinkInfo(announcement);
        const portfolioLink = portfolioLinkInfo ? `
            <div class="portfolio-link-info">
                <a href="index.html#portfolio" class="btn btn-outline-secondary btn-sm">
                    <i class="fas fa-external-link-alt me-1"></i>
                    메인 페이지에서 보기
                </a>
            </div>
        ` : '';

        // 외부 링크 정보 처리
        const externalLinkInfo = this.getExternalLinkInfo(announcement);
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

        // 외부 링크 소스 정보 제거 (아이콘만 유지)
        const sourceInfo = '';

        return `
            <article class="announcement-card ${announcement.isImportant ? 'important' : ''} ${announcement.type === '포트폴리오' ? 'portfolio-card' : ''} ${isExternalLink ? 'external-link-card' : ''}" 
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
                        ${sourceInfo}
                        ${portfolioLink}
                    </div>
                    ${importantBadge}
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
            // 기존 모달 처리
            const announcementId = parseInt(button.dataset.id);
            if (announcementId) {
                this.showAnnouncementDetail(announcementId);
                // Bootstrap 모달 열기
                const modal = new bootstrap.Modal(document.getElementById('announcementModal'));
                modal.show();
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
                    document.querySelector('.announcements-container').scrollIntoView({
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
            
            // 포트폴리오 연동 정보 확인
            const portfolioInfo = this.getPortfolioLinkInfo(announcement);
            const portfolioSection = portfolioInfo ? `
                <div class="alert alert-info mt-3">
                    <h6><i class="fas fa-link me-2"></i>연동된 포트폴리오 항목</h6>
                    <p class="mb-2"><strong>${portfolioInfo.title}</strong></p>
                    <p class="mb-2">${portfolioInfo.description}</p>
                    <a href="index.html#portfolio" class="btn btn-outline-primary btn-sm">
                        <i class="fas fa-external-link-alt me-1"></i>
                        메인 페이지에서 자세히 보기
                    </a>
                </div>
            ` : '';

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
                ${portfolioSection}
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

    getPortfolioLinkInfo(announcement) {
        // 포트폴리오 타입 공고에 대한 연동 정보 반환
        if (announcement.type === '포트폴리오' && announcement.portfolioRef && this.portfolioData) {
            const portfolioItem = this.portfolioData.portfolio.find(
                item => item.id === announcement.portfolioRef
            );
            return portfolioItem || null;
        }
        return null;
    }

    getExternalLinkInfo(announcement) {
        // 외부 링크 정보 반환
        return announcement.externalLink || null;
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