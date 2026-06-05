const TRACK_EVENTS = Object.freeze({
    HERO_DIAGNOSIS: "click_hero_diagnosis",
    SCOPE_SPRINT: "click_scope_sprint",
    EMAIL_CONTACT: "click_email_contact",
});

window.NERO_TRACK_EVENTS = TRACK_EVENTS;

const trackEvent = (eventName, payload = {}) => {
    if (!eventName) return;
    if (typeof window.gtag === "function") {
        window.gtag("event", eventName, payload);
    }
    window.dispatchEvent(new CustomEvent("nero:track", { detail: { eventName, payload } }));
};

const processSteps = [
    ["2026.03", "2026 서울캠퍼스타운 입주기업 선정", ["동국대학교 HAI-STARTUP TOWN 입주경진대회 선발"]],
    ["2026.02", "2025 예비창업패키지 수료", ["중소벤처기업부 창업사업화 지원사업", "벤처기업협회 소셜벤처 인증"]],
    ["2025.09", "2025 KIMES 국제의료기기박람회 서비스 출품", ["부산 BEXCO 공식 부스 운영"]],
    [
        "2025.08",
        "2025 보건의료빅데이터활용 창업경진대회 수상",
        [
            "건강보험심사평가원, 보건복지부 주최",
            "제품&서비스분야 본선 3위",
            "심평원 청구자료 및 맞춤형연구분석DB 수수료 면제(3년)",
        ],
    ],
    ["2025.07", "의료마이데이터 기반 온디바이스 AI 기술 특허 출원", ["PATENT-2025-0027805"]],
    ["2025.07", "주식회사 네로 법인 설립", ["2025.07.29 설립"]],
    ["2025.03", "2025 한국장학재단 서울청년창업센터 입주", ["컨설팅", "네트워크", "법률상담"]],
    ["2025.03", "시계열 건강데이터 기반 건강위험도 계층화 및 위험도 분석 알고리즘 특허 출원", ["PATENT-2025-0096616"]],
    ["2024.12", "2024 국민체육진흥공단 창업경진대회 수상", ["국민체육진흥공단 주최", "건강데이터 기반 AI 모델 개발 및 활용"]],
];

const pageConfig = {
    navItems: [
        ["추천 패키지", "/#packages"],
        ["서비스", "/#services"],
        ["기능 컴포넌트", "/#features"],
        ["포트폴리오", "/#portfolio"],
        ["진행 방식", "#process"],
        ["FAQ", "/#faq"],
        ["공지사항", "/announcement"],
        ["회사소개", "/about"],
    ],
    ctaHref: "/#contact",
    ctaLabel: "문의 남기기",
};

const renderHeaderLinks = (items, className = "") => items
    .map(([label, href]) => `<a${className ? ` class="${className}"` : ""} href="${href}">${label}</a>`)
    .join("");

const renderLandingHeader = ({ navItems, ctaHref, ctaLabel }) => `
    <header class="site-header" aria-label="주요 메뉴">
        <a class="header-logo" href="/" aria-label="NERO 홈">
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
            <a class="header-logo" href="/" aria-label="NERO 홈">
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

const renderProcessDetails = (details) => {
    const lines = Array.isArray(details) ? details : [details];
    return `
        <ul class="process-detail-list">
            ${lines.map((line) => `<li>${line}</li>`).join("")}
        </ul>
    `;
};

const renderAboutProcess = () => `
    <section class="process-section process-scroll-section" id="process" aria-labelledby="process-title" data-process-section>
        <div class="process-sticky">
            <div class="process-layout">
                <aside class="process-copy reveal">
                    <h2 id="process-title">네로가 걸어온 길</h2>
                    <p>입주, 수상, 특허, 법인 설립까지 제품과 기술을 검증해온 이력</p>
                    <a class="text-cta" href="${pageConfig.ctaHref}" data-track="${TRACK_EVENTS.SCOPE_SPRINT}">${pageConfig.ctaLabel}</a>
                </aside>
                <div class="process-stage" aria-label="NERO 진행 프로세스">
                    <ol class="process-timeline" data-process-track>
                        ${processSteps.map(([date, title, details], index) => `
                            <li class="process-step reveal" data-process-step>
                                <div class="process-marker" aria-hidden="true">
                                    <span class="process-number">${String(index + 1).padStart(2, "0")}</span>
                                    <span class="process-line"></span>
                                </div>
                                <article class="process-card">
                                    <div class="process-card-head">
                                        <span>${date}</span>
                                        <h3>${title}</h3>
                                    </div>
                                    <div class="process-card-panel">
                                        <strong>주요 내용</strong>
                                        ${renderProcessDetails(details)}
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
        </div>
    </section>
`;

const landingRoot = document.querySelector("#main");

document.body.insertAdjacentHTML("afterbegin", renderLandingHeader(pageConfig));

landingRoot.innerHTML = `
    <div class="about-spline-bg" aria-hidden="true">
        <iframe src="https://my.spline.design/claritystream-q3XLEZVMc4DNFxANoN99pN00/" frameborder="0" width="100%" height="100%" title="NERO 인터랙티브 회사 소개 배경"></iframe>
    </div>
    <section class="about-hero" aria-labelledby="about-title">
        <div class="about-hero-copy reveal">
            <h1 class="about-hero-title" id="about-title">회사 소개</h1>
            <p class="about-hero-content">회사의 연혁과 이력을 소개합니다</p>
        </div>
    </section>
    <div class="about-content">
        ${renderAboutProcess()}
    </div>
    ${renderLandingFooter()}
`;

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

const wireAnchors = () => {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (event) => {
            const target = document.querySelector(anchor.getAttribute("href"));
            if (!target) return;
            event.preventDefault();
            scrollToSection(target);
        });
    });

    if (window.location.hash) {
        window.setTimeout(() => {
            const target = document.querySelector(window.location.hash);
            if (target) scrollToSection(target, { behavior: "auto", updateHash: false });
        }, 80);
    }
};

const wireDrawer = () => {
    const button = document.querySelector(".menu-button");
    const drawer = document.querySelector("#mobile-drawer");
    const backdrop = document.querySelector("[data-drawer-close]");
    const closeButtons = document.querySelectorAll("[data-drawer-close]");
    if (!button || !drawer || !backdrop) return;

    const setOpen = (isOpen) => {
        drawer.hidden = !isOpen;
        backdrop.hidden = !isOpen;
        button.setAttribute("aria-expanded", String(isOpen));
        document.body.dataset.drawerOpen = String(isOpen);
    };

    button.addEventListener("click", () => setOpen(true));
    closeButtons.forEach((item) => item.addEventListener("click", () => setOpen(false)));
    drawer.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setOpen(false);
    });
};

const wireTracking = () => {
    document.querySelectorAll("[data-track]").forEach((element) => {
        element.addEventListener("click", () => {
            trackEvent(element.dataset.track, { label: element.textContent.trim() });
        });
    });
};

const updateHeroTitleMotion = () => {
    const hero = document.querySelector(".about-hero");
    const copy = document.querySelector(".about-hero-copy");
    if (!hero || !copy) return;

    const rect = hero.getBoundingClientRect();
    const distance = Math.min(Math.max(-rect.top, 0), window.innerHeight * 0.55);
    copy.style.setProperty("--about-title-offset", `${distance * 0.34}px`);
    copy.style.opacity = String(Math.max(0.18, 1 - distance / (window.innerHeight * 0.8)));
};

const wireHeroMotion = () => {
    let ticking = false;
    const requestUpdate = () => {
        if (ticking) return;
        window.requestAnimationFrame(() => {
            updateHeroTitleMotion();
            ticking = false;
        });
        ticking = true;
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    updateHeroTitleMotion();
};

const wireReveal = () => {
    const elements = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
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
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    elements.forEach((element, index) => {
        element.style.setProperty("--reveal-delay", `${Math.min(index * 35, 180)}ms`);
        observer.observe(element);
    });
};

const wireProcessTimeline = () => {
    const section = document.querySelector("[data-process-section]");
    const stage = section?.querySelector(".process-stage");
    const track = section?.querySelector("[data-process-track]");
    const steps = Array.from(section?.querySelectorAll("[data-process-step]") ?? []);
    const dots = Array.from(section?.querySelectorAll("[data-process-dot]") ?? []);
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

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", measure);
    mobileQuery.addEventListener?.("change", measure);
    reducedMotionQuery.addEventListener?.("change", measure);
    window.setTimeout(measure, 60);
    window.addEventListener("load", measure, { once: true });
    setActive(0);
};

wireDrawer();
wireTracking();
wireAnchors();
wireHeroMotion();
wireReveal();
wireProcessTimeline();
