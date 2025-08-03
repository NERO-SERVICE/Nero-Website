/**
 * 동적 콘텐츠 로더 - 데이터 기반 렌더링 시스템
 * 포트폴리오 및 About 타임라인을 JSON 데이터로부터 동적 생성
 */

class ContentLoader {
    constructor() {
        this.contentData = null;
        this.notificationData = null;
        this.initializeLoader();
    }

    async initializeLoader() {
        try {
            await this.loadContentData();
            await this.loadNotificationData();
            this.renderContent();
        } catch (error) {
            console.error('콘텐츠 로딩 실패:', error);
            this.showErrorMessage();
        }
    }

    /**
     * 콘텐츠 데이터 로드
     */
    async loadContentData() {
        try {
            const response = await fetch('data/content.json');
            if (!response.ok) {
                throw new Error(`콘텐츠 데이터 로드 실패: ${response.status}`);
            }
            this.contentData = await response.json();
        } catch (error) {
            console.error('content.json 로드 오류:', error);
            throw error;
        }
    }

    /**
     * 알림 데이터 로드 (포트폴리오 연동용)
     */
    async loadNotificationData() {
        try {
            const response = await fetch('data/notifications.json');
            if (!response.ok) {
                throw new Error(`알림 데이터 로드 실패: ${response.status}`);
            }
            this.notificationData = await response.json();
        } catch (error) {
            console.error('notifications.json 로드 오류:', error);
            throw error;
        }
    }

    /**
     * 전체 콘텐츠 렌더링
     */
    renderContent() {
        this.renderPortfolio();
        this.renderAboutTimeline();
        this.attachEventListeners();
    }

    /**
     * 포트폴리오 섹션 렌더링
     */
    renderPortfolio() {
        const portfolioContainer = document.querySelector('.portfolio-grid');
        if (!portfolioContainer || !this.contentData?.portfolio) {
            console.warn('포트폴리오 컨테이너 또는 데이터를 찾을 수 없습니다.');
            return;
        }

        // 기존 콘텐츠 제거
        portfolioContainer.innerHTML = '';

        // 포트폴리오 아이템 생성
        this.contentData.portfolio
            .sort((a, b) => a.order - b.order)
            .filter(item => item.status === 'active')
            .forEach((item, index) => {
                const portfolioItem = this.createPortfolioItem(item);
                portfolioContainer.appendChild(portfolioItem);
            });

        // 모달 렌더링
        this.renderPortfolioModals();
    }

    /**
     * 개별 포트폴리오 아이템 생성
     */
    createPortfolioItem(item) {
        const gridItem = document.createElement('div');
        gridItem.className = 'portfolio-grid-item';

        gridItem.innerHTML = `
            <div class="portfolio-item">
                <a class="portfolio-link" data-bs-toggle="modal" href="#portfolioModal${item.id}">
                    <img src="${item.image}" alt="${item.title}" />
                    <div class="portfolio-hover">
                        <div class="portfolio-hover-content"><i class="fas fa-arrow-right"></i></div>
                    </div>
                </a>
                <div class="portfolio-caption">
                    <div class="portfolio-caption-heading">${item.title}</div>
                    <div class="portfolio-caption-subheading">${item.subtitle}</div>
                </div>
            </div>
        `;

        return gridItem;
    }

    /**
     * 포트폴리오 모달 렌더링
     */
    renderPortfolioModals() {
        // 기존 모달 제거
        document.querySelectorAll('.portfolio-modal').forEach(modal => modal.remove());

        const modalsContainer = document.querySelector('body');
        
        this.contentData.portfolio
            .filter(item => item.status === 'active')
            .forEach(item => {
                const modal = this.createPortfolioModal(item);
                modalsContainer.appendChild(modal);
            });
    }

    /**
     * 개별 포트폴리오 모달 생성
     */
    createPortfolioModal(item) {
        const modal = document.createElement('div');
        modal.className = 'portfolio-modal modal fade';
        modal.id = `portfolioModal${item.id}`;
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-hidden', 'true');

        // 상세 정보 렌더링
        const detailsHtml = this.renderItemDetails(item.details);

        modal.innerHTML = `
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${item.title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="닫기"></button>
                    </div>
                    <div class="modal-body">
                        <img class="img-fluid d-block mx-auto" src="${item.modalImage}" alt="${item.title}" />
                        <p>${item.description}</p>
                        ${detailsHtml}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>
                    </div>
                </div>
            </div>
        `;

        return modal;
    }

    /**
     * 아이템 상세 정보 렌더링
     */
    renderItemDetails(details) {
        if (!details || Object.keys(details).length === 0) {
            return '';
        }

        const detailItems = Object.entries(details).map(([key, value]) => {
            const labelMap = {
                'targetCustomer': '대상 고객',
                'category': '서비스 카테고리',
                'hostOrganization': '주관 기관',
                'selectedField': '선정 분야',
                'managingOrganization': '주관 기관',
                'totalPrize': '총 상금'
            };

            const label = labelMap[key] || key;
            return `
                <div>
                    <strong>${label}</strong>
                    ${value}
                </div>
            `;
        }).join('');

        return `
            <div class="list-inline">
                ${detailItems}
            </div>
        `;
    }

    /**
     * About 타임라인 렌더링
     */
    renderAboutTimeline() {
        const timelineContainer = document.querySelector('.timeline');
        if (!timelineContainer || !this.contentData?.about?.timeline) {
            console.warn('타임라인 컨테이너 또는 데이터를 찾을 수 없습니다.');
            return;
        }

        // 기존 타임라인 아이템 제거 (마지막 CTA 제외)
        const existingItems = timelineContainer.querySelectorAll('li:not(:last-child)');
        existingItems.forEach(item => item.remove());

        // 타임라인 아이템 생성
        const timeline = this.contentData.about.timeline
            .sort((a, b) => a.order - b.order);

        timeline.forEach((item, index) => {
            const timelineItem = this.createTimelineItem(item);
            
            // 마지막 CTA 아이템 전에 삽입
            const ctaItem = timelineContainer.querySelector('li:last-child');
            timelineContainer.insertBefore(timelineItem, ctaItem);
        });
    }

    /**
     * 개별 타임라인 아이템 생성
     */
    createTimelineItem(item) {
        const li = document.createElement('li');
        if (item.isInverted) {
            li.className = 'timeline-inverted';
        }

        li.innerHTML = `
            <div class="timeline-image">
                <img class="rounded-circle img-fluid" src="${item.image}" alt="${item.title}" />
            </div>
            <div class="timeline-panel">
                <div class="timeline-heading">
                    <h4>${item.date}</h4>
                    <h4 class="subheading">${item.title}</h4>
                </div>
                <div class="timeline-body">
                    <p class="text-muted">${item.description}</p>
                </div>
            </div>
        `;

        return li;
    }

    /**
     * 이벤트 리스너 연결
     */
    attachEventListeners() {
        // 애니메이션 시스템 설정 (통합된 방식)
        this.setupPortfolioAnimations();
        this.setupTimelineAnimations();
        
        // 외부 애니메이션 시스템에 렌더링 완료 알림
        this.notifyAnimationSystem();
    }

    /**
     * 포트폴리오 애니메이션 설정
     */
    setupPortfolioAnimations() {
        const portfolioItems = document.querySelectorAll('.portfolio-item');
        
        // 향상된 Intersection Observer 설정
        const observerOptions = {
            threshold: [0.1, 0.5],
            rootMargin: '0px 0px -80px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // 스태거드 애니메이션
                    const index = Array.from(portfolioItems).indexOf(entry.target);
                    setTimeout(() => {
                        entry.target.classList.add('animate');
                    }, index * 150);
                    
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        portfolioItems.forEach((item, index) => {
            // 초기 상태 설정
            item.style.opacity = '0';
            item.style.transform = 'translateY(60px) scale(0.9)';
            
            observer.observe(item);

            // 향상된 호버 효과
            item.addEventListener('mouseenter', () => {
                if (item.classList.contains('animate')) {
                    item.style.transform = 'translateY(-15px) scale(1.03)';
                    item.style.boxShadow = '0 20px 60px rgba(0,0,0,0.25)';
                }
            });
            
            item.addEventListener('mouseleave', () => {
                if (item.classList.contains('animate')) {
                    item.style.transform = 'translateY(0) scale(1)';
                    item.style.boxShadow = '';
                }
            });
        });
    }

    /**
     * 타임라인 애니메이션 설정 - About 섹션 전용
     */
    setupTimelineAnimations() {
        const timeline = document.querySelector('.timeline');
        const timelineItems = document.querySelectorAll('.timeline li:not(:last-child)');
        
        if (timelineItems.length === 0) return;
        
        // About 섹션 전체에 대한 옵저버
        const aboutObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateTimelineItems(timelineItems);
                    aboutObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });

        if (timeline) {
            aboutObserver.observe(timeline);
        }

        // 호버 효과 설정
        this.setupTimelineHoverEffects(timelineItems);
    }

    /**
     * 타임라인 아이템 순차 애니메이션
     */
    animateTimelineItems(timelineItems) {
        timelineItems.forEach((item, index) => {
            // 초기 상태 설정
            item.style.opacity = '0';
            item.style.transform = 'translateY(80px)';
            
            // 스태거드 애니메이션
            setTimeout(() => {
                item.classList.add('animate');
                
                // 타임라인 패널 추가 애니메이션
                const panel = item.querySelector('.timeline-panel');
                if (panel) {
                    setTimeout(() => {
                        panel.style.transform = 'translateX(0)';
                        panel.style.opacity = '1';
                    }, 200);
                }
                
                // 이미지 스케일 효과
                const image = item.querySelector('.timeline-image img');
                if (image) {
                    setTimeout(() => {
                        image.style.transform = 'scale(1)';
                        image.style.opacity = '1';
                    }, 400);
                }
            }, index * 200);
        });
    }

    /**
     * 타임라인 호버 효과 설정
     */
    setupTimelineHoverEffects(timelineItems) {
        timelineItems.forEach(item => {
            const timelineImage = item.querySelector('.timeline-image');
            const timelinePanel = item.querySelector('.timeline-panel');
            
            if (timelineImage && timelinePanel) {
                item.addEventListener('mouseenter', () => {
                    timelineImage.style.transform = 'scale(1.08)';
                    timelinePanel.style.transform = 'translateY(-5px)';
                    timelinePanel.style.boxShadow = '0 15px 35px rgba(255, 200, 0, 0.15)';
                });
                
                item.addEventListener('mouseleave', () => {
                    timelineImage.style.transform = 'scale(1)';
                    timelinePanel.style.transform = 'translateY(0)';
                    timelinePanel.style.boxShadow = '';
                });
            }
        });
    }

    /**
     * 외부 애니메이션 시스템에 렌더링 완료 알림
     */
    notifyAnimationSystem() {
        // 전역 이벤트 발생으로 외부 시스템에 알림
        const event = new CustomEvent('contentLoaded', {
            detail: {
                portfolioItems: document.querySelectorAll('.portfolio-item').length,
                timelineItems: document.querySelectorAll('.timeline li:not(:last-child)').length
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 에러 메시지 표시
     */
    showErrorMessage() {
        const portfolioContainer = document.querySelector('.portfolio-grid');
        const timelineContainer = document.querySelector('.timeline');

        const errorMessage = `
            <div class="alert alert-warning text-center" role="alert">
                <i class="fas fa-exclamation-triangle"></i>
                콘텐츠를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
            </div>
        `;

        if (portfolioContainer) {
            portfolioContainer.innerHTML = errorMessage;
        }
        if (timelineContainer) {
            timelineContainer.innerHTML = errorMessage;
        }
    }

    /**
     * 데이터 새로고침
     */
    async refreshContent() {
        await this.initializeLoader();
    }

    /**
     * 포트폴리오와 notification 데이터 연동 확인
     */
    getLinkedNotifications(portfolioId) {
        if (!this.notificationData?.announcements) {
            return [];
        }

        return this.notificationData.announcements.filter(
            announcement => announcement.portfolioRef === portfolioId
        );
    }
}

// 전역 인스턴스 생성
let contentLoader;

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    contentLoader = new ContentLoader();
});

// 외부에서 접근 가능한 API
window.ContentAPI = {
    refresh: () => contentLoader?.refreshContent(),
    getPortfolioData: () => contentLoader?.contentData?.portfolio,
    getTimelineData: () => contentLoader?.contentData?.about?.timeline,
    getLinkedNotifications: (portfolioId) => contentLoader?.getLinkedNotifications(portfolioId)
};