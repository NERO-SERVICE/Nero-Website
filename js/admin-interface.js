/**
 * 관리자 인터페이스 - 콘텐츠 데이터 CRUD 관리 시스템
 * 개발자도구 콘솔을 통한 데이터 관리 기능 제공
 */

class AdminInterface {
    constructor() {
        this.contentData = null;
        this.notificationData = null;
        this.setupConsoleCommands();
    }

    /**
     * 콘솔 명령어 설정
     */
    setupConsoleCommands() {
        // 전역 관리 함수들 등록
        window.AdminAPI = {
            // 데이터 로드
            loadData: () => this.loadAllData(),
            
            // 포트폴리오 관리
            addPortfolio: (data) => this.addPortfolioItem(data),
            updatePortfolio: (id, data) => this.updatePortfolioItem(id, data),
            deletePortfolio: (id) => this.deletePortfolioItem(id),
            listPortfolio: () => this.listPortfolioItems(),
            
            // 타임라인 관리
            addTimeline: (data) => this.addTimelineItem(data),
            updateTimeline: (id, data) => this.updateTimelineItem(id, data),
            deleteTimeline: (id) => this.deleteTimelineItem(id),
            listTimeline: () => this.listTimelineItems(),
            
            // 알림/포트폴리오 연동
            linkNotification: (notificationId, portfolioId) => this.linkNotificationToPortfolio(notificationId, portfolioId),
            
            // 데이터 내보내기/가져오기
            exportData: () => this.exportData(),
            importData: (data) => this.importData(data),
            
            // 헬프
            help: () => this.showHelp()
        };

        // 초기 데이터 로드
        this.loadAllData();
        
        console.log('🎛️ 관리자 인터페이스가 활성화되었습니다. AdminAPI.help()를 입력하여 사용법을 확인하세요.');
    }

    /**
     * 모든 데이터 로드
     */
    async loadAllData() {
        try {
            const [contentResponse, notificationResponse] = await Promise.all([
                fetch('data/content.json'),
                fetch('data/announcements.json')
            ]);

            this.contentData = await contentResponse.json();
            this.notificationData = await notificationResponse.json();
            
            console.log('✅ 데이터 로드 완료');
            return { content: this.contentData, notifications: this.notificationData };
        } catch (error) {
            console.error('❌ 데이터 로드 실패:', error);
            throw error;
        }
    }

    /**
     * 포트폴리오 아이템 추가
     */
    addPortfolioItem(data) {
        if (!this.contentData) {
            console.error('❌ 데이터가 로드되지 않았습니다. AdminAPI.loadData()를 먼저 실행하세요.');
            return;
        }

        const requiredFields = ['title', 'subtitle', 'image', 'description'];
        const missingFields = requiredFields.filter(field => !data[field]);
        
        if (missingFields.length > 0) {
            console.error('❌ 필수 필드가 누락되었습니다:', missingFields);
            return;
        }

        const newId = Math.max(...this.contentData.portfolio.map(item => item.id), 0) + 1;
        const newOrder = Math.max(...this.contentData.portfolio.map(item => item.order), 0) + 1;

        const portfolioItem = {
            id: newId,
            title: data.title,
            subtitle: data.subtitle,
            image: data.image,
            modalImage: data.modalImage || data.image,
            description: data.description,
            details: data.details || {},
            date: data.date || new Date().toISOString().split('T')[0],
            status: data.status || 'active',
            order: data.order || newOrder,
            tags: data.tags || []
        };

        this.contentData.portfolio.push(portfolioItem);
        console.log('✅ 포트폴리오 아이템이 추가되었습니다:', portfolioItem);
        
        this.updateLastModified();
        return portfolioItem;
    }

    /**
     * 포트폴리오 아이템 수정
     */
    updatePortfolioItem(id, data) {
        if (!this.contentData) {
            console.error('❌ 데이터가 로드되지 않았습니다.');
            return;
        }

        const index = this.contentData.portfolio.findIndex(item => item.id === id);
        if (index === -1) {
            console.error('❌ 해당 ID의 포트폴리오 아이템을 찾을 수 없습니다:', id);
            return;
        }

        // 기존 데이터와 병합
        this.contentData.portfolio[index] = {
            ...this.contentData.portfolio[index],
            ...data
        };

        console.log('✅ 포트폴리오 아이템이 수정되었습니다:', this.contentData.portfolio[index]);
        this.updateLastModified();
        return this.contentData.portfolio[index];
    }

    /**
     * 포트폴리오 아이템 삭제
     */
    deletePortfolioItem(id) {
        if (!this.contentData) {
            console.error('❌ 데이터가 로드되지 않았습니다.');
            return;
        }

        const index = this.contentData.portfolio.findIndex(item => item.id === id);
        if (index === -1) {
            console.error('❌ 해당 ID의 포트폴리오 아이템을 찾을 수 없습니다:', id);
            return;
        }

        const deletedItem = this.contentData.portfolio.splice(index, 1)[0];
        console.log('✅ 포트폴리오 아이템이 삭제되었습니다:', deletedItem);
        
        this.updateLastModified();
        return deletedItem;
    }

    /**
     * 포트폴리오 목록 출력
     */
    listPortfolioItems() {
        if (!this.contentData) {
            console.error('❌ 데이터가 로드되지 않았습니다.');
            return;
        }

        console.table(this.contentData.portfolio.map(item => ({
            ID: item.id,
            제목: item.title,
            부제목: item.subtitle,
            날짜: item.date,
            상태: item.status,
            순서: item.order
        })));

        return this.contentData.portfolio;
    }

    /**
     * 타임라인 아이템 추가
     */
    addTimelineItem(data) {
        if (!this.contentData) {
            console.error('❌ 데이터가 로드되지 않았습니다.');
            return;
        }

        const requiredFields = ['date', 'title', 'description', 'image'];
        const missingFields = requiredFields.filter(field => !data[field]);
        
        if (missingFields.length > 0) {
            console.error('❌ 필수 필드가 누락되었습니다:', missingFields);
            return;
        }

        const newId = Math.max(...this.contentData.about.timeline.map(item => item.id), 0) + 1;
        const newOrder = Math.max(...this.contentData.about.timeline.map(item => item.order), 0) + 1;

        const timelineItem = {
            id: newId,
            date: data.date,
            title: data.title,
            description: data.description,
            image: data.image,
            order: data.order || newOrder,
            isInverted: data.isInverted || false
        };

        this.contentData.about.timeline.push(timelineItem);
        console.log('✅ 타임라인 아이템이 추가되었습니다:', timelineItem);
        
        this.updateLastModified();
        return timelineItem;
    }

    /**
     * 타임라인 아이템 수정
     */
    updateTimelineItem(id, data) {
        if (!this.contentData) {
            console.error('❌ 데이터가 로드되지 않았습니다.');
            return;
        }

        const index = this.contentData.about.timeline.findIndex(item => item.id === id);
        if (index === -1) {
            console.error('❌ 해당 ID의 타임라인 아이템을 찾을 수 없습니다:', id);
            return;
        }

        this.contentData.about.timeline[index] = {
            ...this.contentData.about.timeline[index],
            ...data
        };

        console.log('✅ 타임라인 아이템이 수정되었습니다:', this.contentData.about.timeline[index]);
        this.updateLastModified();
        return this.contentData.about.timeline[index];
    }

    /**
     * 타임라인 아이템 삭제
     */
    deleteTimelineItem(id) {
        if (!this.contentData) {
            console.error('❌ 데이터가 로드되지 않았습니다.');
            return;
        }

        const index = this.contentData.about.timeline.findIndex(item => item.id === id);
        if (index === -1) {
            console.error('❌ 해당 ID의 타임라인 아이템을 찾을 수 없습니다:', id);
            return;
        }

        const deletedItem = this.contentData.about.timeline.splice(index, 1)[0];
        console.log('✅ 타임라인 아이템이 삭제되었습니다:', deletedItem);
        
        this.updateLastModified();
        return deletedItem;
    }

    /**
     * 타임라인 목록 출력
     */
    listTimelineItems() {
        if (!this.contentData) {
            console.error('❌ 데이터가 로드되지 않았습니다.');
            return;
        }

        console.table(this.contentData.about.timeline.map(item => ({
            ID: item.id,
            날짜: item.date,
            제목: item.title,
            순서: item.order,
            역순: item.isInverted ? 'Y' : 'N'
        })));

        return this.contentData.about.timeline;
    }

    /**
     * 알림과 포트폴리오 연동
     */
    linkNotificationToPortfolio(notificationId, portfolioId) {
        if (!this.notificationData) {
            console.error('❌ 알림 데이터가 로드되지 않았습니다.');
            return;
        }

        const notification = this.notificationData.announcements.find(item => item.id === notificationId);
        if (!notification) {
            console.error('❌ 해당 ID의 알림을 찾을 수 없습니다:', notificationId);
            return;
        }

        notification.portfolioRef = portfolioId;
        console.log('✅ 알림이 포트폴리오와 연동되었습니다:', notification);
        return notification;
    }

    /**
     * 데이터 내보내기
     */
    exportData() {
        if (!this.contentData || !this.notificationData) {
            console.error('❌ 데이터가 로드되지 않았습니다.');
            return;
        }

        const exportData = {
            content: this.contentData,
            notifications: this.notificationData,
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nero-content-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        console.log('✅ 데이터가 내보내기되었습니다.');
        return exportData;
    }

    /**
     * 데이터 가져오기
     */
    importData(data) {
        try {
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }

            if (data.content) {
                this.contentData = data.content;
            }
            if (data.notifications) {
                this.notificationData = data.notifications;
            }

            console.log('✅ 데이터가 가져오기되었습니다.');
            console.log('⚠️ 실제 적용을 위해서는 JSON 파일을 수동으로 업데이트해야 합니다.');
            return { content: this.contentData, notifications: this.notificationData };
        } catch (error) {
            console.error('❌ 데이터 가져오기 실패:', error);
            throw error;
        }
    }

    /**
     * 최종 수정일 업데이트
     */
    updateLastModified() {
        if (this.contentData && this.contentData.metadata) {
            this.contentData.metadata.lastUpdated = new Date().toISOString().split('T')[0];
        }
    }

    /**
     * 도움말 표시
     */
    showHelp() {
        console.log(`
🎛️ 네로 콘텐츠 관리 시스템 - 관리자 인터페이스

📋 데이터 관리:
  AdminAPI.loadData()                    - 모든 데이터 로드
  AdminAPI.exportData()                  - 데이터 내보내기
  AdminAPI.importData(data)              - 데이터 가져오기

📊 포트폴리오 관리:
  AdminAPI.listPortfolio()               - 포트폴리오 목록 출력
  AdminAPI.addPortfolio(data)            - 포트폴리오 추가
  AdminAPI.updatePortfolio(id, data)     - 포트폴리오 수정
  AdminAPI.deletePortfolio(id)           - 포트폴리오 삭제

⏰ 타임라인 관리:
  AdminAPI.listTimeline()                - 타임라인 목록 출력
  AdminAPI.addTimeline(data)             - 타임라인 추가
  AdminAPI.updateTimeline(id, data)      - 타임라인 수정
  AdminAPI.deleteTimeline(id)            - 타임라인 삭제

🔗 연동 관리:
  AdminAPI.linkNotification(nId, pId)    - 알림과 포트폴리오 연동

📝 사용 예시:
  // 새 포트폴리오 추가
  AdminAPI.addPortfolio({
    title: "새로운 성과",
    subtitle: "설명",
    image: "assets/img/portfolio/new.png",
    description: "상세 설명",
    details: { category: "카테고리" }
  });

  // 타임라인 수정
  AdminAPI.updateTimeline(1, { 
    title: "수정된 제목",
    description: "수정된 설명"
  });

⚠️  주의사항:
- 콘솔에서의 변경사항은 메모리에만 적용됩니다
- 실제 파일 저장을 위해서는 exportData()로 내보낸 후 수동으로 JSON 파일을 업데이트하세요
- 페이지 새로고침 시 변경사항이 초기화됩니다
        `);
    }
}

// 관리자 인터페이스 초기화
document.addEventListener('DOMContentLoaded', () => {
    new AdminInterface();
});