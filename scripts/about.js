const TRACK_EVENTS = Object.freeze({
    HERO_DIAGNOSIS: "click_hero_diagnosis",
    SCOPE_SPRINT: "click_scope_sprint",
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
    ["무료 상담", "아이디어 기반 서비스 개발을 위한 빠른 진단을 도와드립니다."],
    ["1차 미팅", "고객 유형, 개발 형태, 예산, 일정, 핵심 기능을 확인합니다."],
    ["요구사항 정의", "목표, 이해관계자, 기존 자료, 운영 조건을 함께 점검합니다."],
    ["기능 범위 산정", "기능정의서, 화면 목록, 관리자 범위, 데이터 구조를 좁힙니다."],
    ["맞춤 제안·견적", "우선순위와 과업범위서를 기준으로 견적을 확정합니다."],
    ["계약/착수", "일정, 산출물, 검수 기준, 커뮤니케이션 방식을 확정합니다."],
    ["QA·배포·인수인계", "테스트, 배포, 운영 문서, 유지보수 범위를 정리해 제공합니다."],
];

const processLabels = ["CONSULTATION", "FIRST MEETING", "REQUIREMENTS", "SCOPE", "PROPOSAL", "CONTRACT", "QA & HANDOVER"];

const pageConfig = {
    navItems: [
        ["추천 패키지", "/#packages"],
        ["서비스", "/#services"],
        ["기능 컴포넌트", "/#features"],
        ["포트폴리오", "/#portfolio"],
        ["진행 방식", "#process"],
        ["FAQ", "/#faq"],
        ["공지사항", "/announcement"],
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

const renderAboutProcess = () => `
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
`;

const landingRoot = document.querySelector("#main");

document.body.insertAdjacentHTML("afterbegin", renderLandingHeader(pageConfig));

landingRoot.innerHTML = `
    <div class="about-spline-bg" aria-hidden="true">
        <iframe src="https://my.spline.design/claritystream-q3XLEZVMc4DNFxANoN99pN00/" frameborder="0" width="100%" height="100%" title="NERO 인터랙티브 회사 소개 배경"></iframe>
    </div>
    <section class="about-hero" aria-labelledby="about-title">
        <h1 class="about-hero-title reveal" id="about-title">회사 소개</h1>
    </section>
    <div class="about-content">
        ${renderAboutProcess()}
    </div>
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
    const title = document.querySelector(".about-hero-title");
    if (!hero || !title) return;

    const rect = hero.getBoundingClientRect();
    const distance = Math.min(Math.max(-rect.top, 0), window.innerHeight * 0.55);
    title.style.setProperty("--about-title-offset", `${distance * 0.34}px`);
    title.style.opacity = String(Math.max(0.18, 1 - distance / (window.innerHeight * 0.8)));
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

wireDrawer();
wireTracking();
wireAnchors();
wireHeroMotion();
wireReveal();
wireProcessTimeline();
