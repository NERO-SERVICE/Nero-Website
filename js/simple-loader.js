/**
 * 단순한 콘텐츠 로더 - 모션 없이 데이터만 로드
 */

class SimpleContentLoader {
    constructor() {
        this.contentData = null;
        this.init();
    }

    async init() {
        try {
            await this.loadContentData();
            this.renderAllContent();
        } catch (error) {
            console.error('콘텐츠 로딩 실패:', error);
            this.showErrorMessage();
        }
    }

    async loadContentData() {
        try {
            const response = await fetch('data/content.json');
            if (!response.ok) {
                throw new Error(`데이터 로드 실패: ${response.status}`);
            }
            this.contentData = await response.json();
        } catch (error) {
            console.error('content.json 로드 오류:', error);
            throw error;
        }
    }

    renderAllContent() {
        this.renderPortfolio();
        this.renderAboutTimeline();
        this.renderPortfolioModals();
    }

    renderPortfolio() {
        const portfolioContainer = document.querySelector('.portfolio-grid');
        if (!portfolioContainer || !this.contentData?.portfolio) {
            return;
        }

        // 기존 콘텐츠 제거
        portfolioContainer.innerHTML = '';

        // 포트폴리오 아이템 생성
        const portfolioItems = this.contentData.portfolio
            .sort((a, b) => a.order - b.order)
            .filter(item => item.status === 'active');

        portfolioItems.forEach(item => {
            const colDiv = document.createElement('div');
            colDiv.className = 'col-lg-4 col-sm-6 mb-4';
            
            colDiv.innerHTML = `
                <div class="portfolio-item">
                    <a class="portfolio-link" data-bs-toggle="modal" href="#portfolioModal${item.id}">
                        <img class="img-fluid" src="${item.image}" alt="${item.title}" />
                        <div class="portfolio-hover">
                            <div class="portfolio-hover-content"><i class="fas fa-arrow-right"></i></div>
                        </div>
                    </a>
                    <div class="portfolio-caption">
                        <div class="portfolio-caption-heading">${item.title}</div>
                        <div class="portfolio-caption-subheading text-muted">${item.subtitle}</div>
                    </div>
                </div>
            `;
            
            portfolioContainer.appendChild(colDiv);
        });
    }

    renderAboutTimeline() {
        const timelineContainer = document.querySelector('.timeline');
        if (!timelineContainer || !this.contentData?.about?.timeline) {
            return;
        }

        // 기존 타임라인 아이템 제거 (마지막 CTA 제외)
        const existingItems = timelineContainer.querySelectorAll('li:not(:last-child)');
        existingItems.forEach(item => item.remove());

        // 타임라인 아이템 생성
        const timeline = this.contentData.about.timeline
            .sort((a, b) => a.order - b.order);

        timeline.forEach(item => {
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

            // 마지막 CTA 아이템 전에 삽입
            const ctaItem = timelineContainer.querySelector('li:last-child');
            timelineContainer.insertBefore(li, ctaItem);
        });
    }

    renderPortfolioModals() {
        // 기존 모달 제거
        document.querySelectorAll('.portfolio-modal').forEach(modal => modal.remove());

        if (!this.contentData?.portfolio) return;

        const portfolioItems = this.contentData.portfolio
            .filter(item => item.status === 'active');

        portfolioItems.forEach(item => {
            const modal = document.createElement('div');
            modal.className = 'portfolio-modal modal fade';
            modal.id = `portfolioModal${item.id}`;
            modal.setAttribute('tabindex', '-1');
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-hidden', 'true');

            // 상세 정보 렌더링
            const detailsHtml = this.renderItemDetails(item.details);

            modal.innerHTML = `
                <div class="modal-dialog modal-lg modal-dialog-centered">
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
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        });
    }

    renderItemDetails(details) {
        if (!details || Object.keys(details).length === 0) {
            return '';
        }

        const labelMap = {
            'targetCustomer': '대상 고객',
            'category': '서비스 카테고리',
            'hostOrganization': '주최 기관',
            'managingOrganization': '주관 기관',
            'selectedField': '선정 분야',
            'totalPrize': '총 상금'
        };

        const detailItems = Object.entries(details).map(([key, value]) => {
            const label = labelMap[key] || key;
            return `<li><strong>${label}:</strong> ${value}</li>`;
        }).join('');

        return `<ul class="list-inline">${detailItems}</ul>`;
    }

    showErrorMessage() {
        const portfolioContainer = document.querySelector('.portfolio-grid');
        const timelineContainer = document.querySelector('.timeline');

        const errorMessage = `
            <div class="alert alert-warning text-center" role="alert">
                콘텐츠를 불러오는 중 문제가 발생했습니다.
            </div>
        `;

        if (portfolioContainer) {
            portfolioContainer.innerHTML = errorMessage;
        }
        if (timelineContainer) {
            timelineContainer.innerHTML = errorMessage;
        }
    }
}

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    new SimpleContentLoader();
});