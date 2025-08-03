/**
 * 공통 컴포넌트 JavaScript
 * - 네비게이션 바 기능
 * - 페이지 공통 기능
 */

// 네비게이션 바 축소 기능
window.addEventListener('DOMContentLoaded', event => {
    // Navbar shrink function
    var navbarShrink = function () {
        const navbarCollapsible = document.body.querySelector('#mainNav');
        if (!navbarCollapsible) {
            return;
        }
        if (window.scrollY === 0) {
            navbarCollapsible.classList.remove('navbar-shrink')
        } else {
            navbarCollapsible.classList.add('navbar-shrink')
        }
    };

    // Shrink the navbar 
    navbarShrink();

    // Shrink the navbar when page is scrolled
    document.addEventListener('scroll', navbarShrink);

    // Activate Bootstrap navbar collapse
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.Collapse(mainNav, {
            toggle: false
        });
    }
});

/**
 * 공통 컴포넌트 로더
 */
class ComponentLoader {
    static async loadComponent(componentName, targetElement) {
        try {
            const response = await fetch(`components/${componentName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load ${componentName}: ${response.status}`);
            }
            const html = await response.text();
            
            if (targetElement) {
                targetElement.innerHTML = html;
            }
            
            return html;
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
            return null;
        }
    }

    static async loadNavbar() {
        const navContainer = document.getElementById('navbar-container');
        if (navContainer) {
            await this.loadComponent('navbar', navContainer);
        }
    }

    static async loadFooter() {
        const footerContainer = document.getElementById('footer-container');
        if (footerContainer) {
            await this.loadComponent('footer', footerContainer);
        }
    }

    static async loadAllComponents() {
        await Promise.all([
            this.loadNavbar(),
            this.loadFooter()
        ]);
    }
}

// 페이지 로드 시 컴포넌트 자동 로드
document.addEventListener('DOMContentLoaded', () => {
    ComponentLoader.loadAllComponents();
});

/**
 * 현재 페이지에 따른 네비게이션 활성화
 */
function setActiveNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        
        if (href === currentPage || 
            (currentPage === '' && href === 'index.html') ||
            (currentPage === 'index.html' && href.includes('#'))) {
            link.classList.add('active');
        }
    });
}

// 컴포넌트 로드 후 네비게이션 활성화
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(setActiveNavigation, 100);
});

/**
 * 유틸리티 함수들
 */
const Utils = {
    // 스무스 스크롤
    smoothScrollTo: (target, duration = 1000) => {
        const targetElement = document.querySelector(target);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    },

    // 로딩 스피너 표시/숨김
    showLoading: (containerId) => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="d-flex justify-content-center align-items-center" style="min-height: 200px;">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `;
        }
    },

    hideLoading: (containerId) => {
        const container = document.getElementById(containerId);
        if (container) {
            const spinner = container.querySelector('.spinner-border');
            if (spinner) {
                spinner.parentElement.style.display = 'none';
            }
        }
    }
};