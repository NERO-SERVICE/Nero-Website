const revealTestElements = () => {
    const items = document.querySelectorAll(".test-reveal");
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

document.addEventListener("DOMContentLoaded", revealTestElements);
