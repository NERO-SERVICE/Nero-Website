const TRACK_EVENTS = Object.freeze({
    SUBMIT_OVERVIEW: "submit_overview_download",
    EMAIL_CONTACT: "click_email_contact",
});

const trackEvent = (eventName, payload = {}) => {
    if (!eventName) return;
    if (typeof window.gtag === "function") {
        window.gtag("event", eventName, payload);
    }
    window.dispatchEvent(new CustomEvent("nero:track", { detail: { eventName, payload } }));
};

const pageConfig = {
    navItems: [
        ["추천 패키지", "/#packages"],
        ["서비스", "/#services"],
        ["기능 컴포넌트", "/#features"],
        ["포트폴리오", "/#portfolio"],
        ["진행 방식", "/#process"],
        ["FAQ", "/#faq"],
        ["공지사항", "/announcement"],
        ["회사소개", "/about"],
    ],
    ctaHref: "/#contact",
    ctaLabel: "문의 남기기",
    source: "overview_download",
};

const renderHeaderLinks = (items) => items
    .map(([label, href]) => `<a href="${href}">${label}</a>`)
    .join("");

const renderSiteHeader = ({ navItems, ctaHref, ctaLabel }) => `
    <header class="site-header" aria-label="주요 메뉴">
        <a class="header-logo" href="/" aria-label="NERO 홈">
            <img src="/assets/img/landing/nero_logo.svg" alt="NERO" />
        </a>

        <nav class="desktop-nav" aria-label="데스크톱 메뉴">
            ${renderHeaderLinks(navItems)}
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
            ${renderHeaderLinks(navItems)}
            <a class="primary-button" href="${ctaHref}">${ctaLabel}</a>
        </nav>
    </aside>
`;

const renderSiteFooter = () => `
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

const landingRoot = document.querySelector("#main");

document.body.insertAdjacentHTML("afterbegin", renderSiteHeader(pageConfig));

landingRoot.innerHTML = `
    <section class="overview-section" aria-labelledby="overview-title">
        <div class="container overview-shell">
            <div class="overview-heading reveal">
                <h2 id="overview-title">소개서 다운로드</h2>
                <p>상세한 제품 소개서를 이메일로 보내드립니다</p>
            </div>
            <form class="contact-form overview-form reveal" id="overview-form" action="/.netlify/functions/contact" method="post">
                <input type="hidden" name="source" value="${pageConfig.source}" />
                <label class="form-wide" aria-label="기업명">
                    <input type="text" name="companyName" autocomplete="organization" placeholder="기업명" required />
                </label>
                <label aria-label="성함">
                    <input type="text" name="name" autocomplete="name" placeholder="성함" required />
                </label>
                <label aria-label="연락처">
                    <input type="tel" name="phone" autocomplete="tel" placeholder="연락처" required />
                </label>
                <label aria-label="부서명">
                    <input type="text" name="department" autocomplete="organization-title" placeholder="부서명" required />
                </label>
                <label aria-label="직급">
                    <input type="text" name="position" placeholder="직급" required />
                </label>
                <label aria-label="이메일">
                    <input type="email" name="email" autocomplete="email" placeholder="이메일" required />
                </label>
                <label aria-label="방문 경로">
                    <input type="text" name="visitPath" placeholder="방문 경로" required />
                </label>
                <label class="form-honeypot" aria-hidden="true">
                    <input type="text" name="company" tabindex="-1" autocomplete="off" />
                </label>
                <label class="form-wide" aria-label="문의사항">
                    <textarea name="message" rows="6" placeholder="(선택) 문의사항"></textarea>
                </label>
                <button class="primary-button form-submit" type="submit">제출하기</button>
                <p class="form-status form-wide" role="status" aria-live="polite"></p>
            </form>
        </div>
    </section>
    ${renderSiteFooter()}
`;

const wireDrawer = () => {
    const button = document.querySelector(".menu-button");
    const drawer = document.querySelector("#mobile-drawer");
    const backdrop = document.querySelector(".drawer-backdrop");
    const closeTargets = document.querySelectorAll("[data-drawer-close], .drawer-nav a");
    if (!button || !drawer || !backdrop) return;

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
            return;
        }

        drawer.classList.remove("is-open");
        backdrop.classList.remove("is-open");
        delete document.body.dataset.drawerOpen;
        window.setTimeout(() => {
            drawer.hidden = true;
            backdrop.hidden = true;
        }, 220);
    };

    button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
    closeTargets.forEach((target) => target.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") setOpen(false);
    });
};

const revealNewElements = () => {
    const elements = document.querySelectorAll(".reveal:not(.is-visible)");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
        elements.forEach((element) => element.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });

    elements.forEach((element) => observer.observe(element));
};

const wireOverviewForm = () => {
    const form = document.querySelector("#overview-form");
    if (!form) return;
    const status = form.querySelector(".form-status");
    const submitButton = form.querySelector(".form-submit");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());

        trackEvent(TRACK_EVENTS.SUBMIT_OVERVIEW, {
            hasMessage: Boolean(data.message?.trim()),
            visitPath: data.visitPath,
        });

        status.textContent = "소개서 요청을 전송하고 있습니다.";
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

            status.textContent = result.message || "소개서 요청이 접수되었습니다.";
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

document.addEventListener("DOMContentLoaded", () => {
    wireDrawer();
    wireOverviewForm();
    revealNewElements();
});
