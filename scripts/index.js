const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const assetPath = (path) => path?.startsWith("/") ? path : `/${path}`;

const setupReveal = () => {
    const items = document.querySelectorAll(".test-reveal, .test-card, .test-timeline-item");
    if (!("IntersectionObserver" in window)) {
        items.forEach((item) => item.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.18 });

    items.forEach((item) => observer.observe(item));
};

const renderPortfolio = (portfolio = []) => {
    const container = document.getElementById("test-portfolio-list");
    if (!container) return;

    container.innerHTML = portfolio
        .filter((item) => item.status === "active")
        .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
        .map((item) => `
            <article class="test-card test-reveal">
                <img src="${assetPath(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" />
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.subtitle || item.description || "")}</p>
                <div class="test-badges">
                    ${(item.tags || []).slice(0, 3).map((tag) => `<span class="test-badge">${escapeHtml(tag)}</span>`).join("")}
                </div>
            </article>
        `)
        .join("");
};

const renderTimeline = (timeline = []) => {
    const container = document.getElementById("test-timeline-list");
    if (!container) return;

    container.innerHTML = timeline
        .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
        .map((item) => `
            <article class="test-timeline-item test-reveal">
                <time>${escapeHtml(item.date)}</time>
                <div>
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.description)}</p>
                </div>
            </article>
        `)
        .join("");
};

const init = async () => {
    try {
        const response = await fetch("/data/content.json");
        if (!response.ok) throw new Error(`content.json ${response.status}`);
        const data = await response.json();
        renderPortfolio(data.portfolio);
        renderTimeline(data.about?.timeline);
    } catch (error) {
        console.error("테스트 홈 데이터 로딩 실패:", error);
    } finally {
        setupReveal();
    }
};

document.addEventListener("DOMContentLoaded", init);
