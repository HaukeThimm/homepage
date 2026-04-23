/* ==== LANGUAGE TOGGLE (data-en/data-de + placeholders) ==== */
(function () {
    const buttons = Array.from(document.querySelectorAll(".lang-btn"));
    if (!buttons.length) return;

    const translatable = Array.from(document.querySelectorAll("[data-en][data-de]")).filter((el) => {
        const tag = el.tagName;
        const hasElementChildren = el.children && el.children.length > 0;

        /* Keine Sprachumschaltung für Referenztexte */
        if (el.hasAttribute("data-feedback-text")) return false;

        if ((tag === "A" || tag === "BUTTON") && hasElementChildren) return false;

        return true;
    });

    const placeholderFields = Array.from(
        document.querySelectorAll("[data-placeholder-en][data-placeholder-de]")
    );

    const localizedLinks = Array.from(
        document.querySelectorAll("[data-href-en][data-href-de]")
    );

    function setLang(lang) {
        const isDe = lang === "de";

        translatable.forEach((el) => {
            const val = el.getAttribute(isDe ? "data-de" : "data-en");
            if (val != null) el.textContent = val;
        });

        placeholderFields.forEach((field) => {
            const val = field.getAttribute(isDe ? "data-placeholder-de" : "data-placeholder-en");
            if (val != null) field.setAttribute("placeholder", val);
        });

        localizedLinks.forEach((link) => {
            const href = link.getAttribute(isDe ? "data-href-de" : "data-href-en");
            if (href) link.setAttribute("href", href);
        });

        buttons.forEach((b) => b.classList.toggle("is-active", b.dataset.lang === lang));
        document.documentElement.lang = isDe ? "de" : "en";

        window.dispatchEvent(new Event("feedback:languagechange"));
        window.dispatchEvent(new Event("nav:languagechange"));
    }

    buttons.forEach((b) => {
        b.addEventListener("click", () => {
            const lang = b.dataset.lang;
            if (lang) setLang(lang);
        });
    });

    setLang("de");
})();

/* ==== SERVICES ACCORDION (KLICK + ENTER/SPACE) ==== */
(function () {
    const items = Array.from(document.querySelectorAll("[data-service]"));
    if (!items.length) return;

    function setExpanded(item, open) {
        item.classList.toggle("open", open);
        const head = item.querySelector(".service-head");
        if (head) head.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function closeAllExcept(exceptItem) {
        items.forEach((it) => {
            if (it !== exceptItem) setExpanded(it, false);
        });
    }

    items.forEach((item) => {
        const head = item.querySelector(".service-head");
        if (!head) return;

        function toggle() {
            const willOpen = !item.classList.contains("open");
            if (willOpen) closeAllExcept(item);
            setExpanded(item, willOpen);
        }

        head.addEventListener("click", toggle);
        head.addEventListener("keydown", (e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            toggle();
        });
    });
})();

/* ==== MOBILE NAV DROPDOWN ==== */
(function () {
    const toggle = document.querySelector(".nav-menu-toggle");
    const panel = document.querySelector(".nav-mobile-panel");
    if (!toggle || !panel) return;

    function closePanel() {
        panel.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
    }

    function openPanel() {
        panel.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
    }

    toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = panel.classList.contains("is-open");

        if (isOpen) {
            closePanel();
        } else {
            openPanel();
        }
    });

    document.addEventListener("click", (e) => {
        if (!panel.contains(e.target) && !toggle.contains(e.target)) {
            closePanel();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closePanel();
    });

    panel.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closePanel);
    });
})();

/* ==== ACTIVE NAV SECTION TRACKING ==== */
(function () {
    const sectionIds = ["about", "services", "approach", "references", "contact-cta"];
    const navLinks = Array.from(document.querySelectorAll(".nav-link, .nav-mobile-link"));

    if (!navLinks.length) return;

    const linkMap = new Map();

    sectionIds.forEach((id) => {
        const matching = navLinks.filter((link) => {
            const href = link.getAttribute("href") || "";
            return href === `#${id}` || href === `/#${id}`;
        });
        linkMap.set(id, matching);
    });

    function clearActive() {
        navLinks.forEach((link) => link.classList.remove("is-active"));
    }

    function setActive(id) {
        clearActive();
        const links = linkMap.get(id) || [];
        links.forEach((link) => link.classList.add("is-active"));
    }

    const sections = sectionIds
        .map((id) => document.getElementById(id))
        .filter(Boolean);

    if (!sections.length) return;

    function updateActiveSection() {
        const viewportOffset = window.innerHeight * 0.25;
        let activeId = sectionIds[0];

        for (const section of sections) {
            const rect = section.getBoundingClientRect();
            if (rect.top - viewportOffset <= 0) {
                activeId = section.id;
            }
        }

        setActive(activeId);
    }

    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            const href = link.getAttribute("href") || "";
            const match = href.match(/#([a-zA-Z0-9\-_]+)$/);
            if (!match) return;
            const targetId = match[1];
            if (!sectionIds.includes(targetId)) return;
            setActive(targetId);
        });
    });

    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("load", updateActiveSection);
    window.addEventListener("resize", updateActiveSection);
    window.addEventListener("nav:languagechange", updateActiveSection);

    updateActiveSection();
})();

/* ==== FEEDBACK TEXT TRUNCATION + EXPAND/COLLAPSE + MOBILE SWIPE ==== */
(function () {
    const shell = document.querySelector(".references-carousel");
    const cards = Array.from(document.querySelectorAll("[data-feedback-card]"));
    if (!shell || !cards.length) return;

    const viewport = shell.querySelector(".carousel-viewport");
    const btnPrev = shell.querySelector(".carousel-btn.left");
    const btnNext = shell.querySelector(".carousel-btn.right");

    function isMobile() {
        return window.innerWidth <= 768;
    }

    function getMaxChars() {
        const cssValue = getComputedStyle(document.documentElement)
            .getPropertyValue("--references-preview-chars")
            .trim();

        const parsed = parseInt(cssValue, 10);
        return Number.isFinite(parsed) ? parsed : 150;
    }

    function getSuffix() {
        return document.documentElement.lang === "en" ? "... (More)" : "... (Mehr)";
    }

    /* Referenzen bleiben immer im Original und werden NICHT übersetzt */
    function getFullText(textEl) {
        if (!textEl.dataset.fullOriginal) {
            textEl.dataset.fullOriginal = (textEl.textContent || "").trim();
        }
        return textEl.dataset.fullOriginal;
    }

    function truncateText(text, maxChars) {
        const normalized = text.trim();
        const ending = getSuffix();

        if (normalized.length <= maxChars) return normalized;

        const rawLimit = Math.max(1, maxChars - ending.length);
        let trimmed = normalized.slice(0, rawLimit).trim();

        const lastSpace = trimmed.lastIndexOf(" ");
        if (lastSpace > Math.floor(rawLimit * 0.6)) {
            trimmed = trimmed.slice(0, lastSpace).trim();
        }

        return trimmed + ending;
    }

    function updateBodyState() {
        const hasExpanded = cards.some((card) => card.classList.contains("is-expanded"));
        document.body.classList.toggle("references-expanded", hasExpanded);
    }

    function renderCard(card) {
        const maxChars = getMaxChars();
        const textEl = card.querySelector("[data-feedback-text]");
        if (!textEl) return;

        const fullText = getFullText(textEl);
        const expanded = card.classList.contains("is-expanded");

        textEl.textContent = expanded ? fullText : truncateText(fullText, maxChars);
        card.setAttribute("aria-expanded", expanded ? "true" : "false");
    }

    function renderAllCards() {
        cards.forEach(renderCard);
        updateBodyState();
        window.dispatchEvent(new Event("references:render"));
    }

    function collapseAllExcept(exceptionCard) {
        cards.forEach((card) => {
            if (card !== exceptionCard) {
                card.classList.remove("is-expanded");
            }
        });
    }

    function collapseAll() {
        cards.forEach((card) => card.classList.remove("is-expanded"));
    }

    function toggleCard(card) {
        const wasExpanded = card.classList.contains("is-expanded");

        if (wasExpanded) {
            card.classList.remove("is-expanded");
        } else {
            collapseAllExcept(card);
            card.classList.add("is-expanded");
        }

        renderAllCards();
    }

    cards.forEach((card) => {
        const inner = card.querySelector(".feedback-card-inner");
        if (!inner) return;

        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;

        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "button");
        card.setAttribute("aria-expanded", "false");

        inner.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleCard(card);
        });

        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleCard(card);
            }

            if (e.key === "Escape") {
                card.classList.remove("is-expanded");
                renderAllCards();
            }
        });

        inner.addEventListener("touchstart", (e) => {
            if (!card.classList.contains("is-expanded")) return;
            const touch = e.changedTouches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }, { passive: true });

        inner.addEventListener("touchend", (e) => {
            if (!card.classList.contains("is-expanded")) return;
            const touch = e.changedTouches[0];
            touchEndX = touch.clientX;
            touchEndY = touch.clientY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            if (Math.abs(deltaX) >= 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
                card.classList.remove("is-expanded");
                renderAllCards();
            }
        }, { passive: true });
    });

    document.addEventListener("click", (e) => {
        const clickedCard = e.target.closest("[data-feedback-card]");
        if (!clickedCard) {
            collapseAll();
            renderAllCards();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            collapseAll();
            renderAllCards();
        }
    });

    if (viewport && btnPrev && btnNext) {
        btnPrev.addEventListener("click", () => {
            if (!isMobile()) return;
            const step = viewport.clientWidth * 0.9;
            viewport.scrollBy({ left: -step, behavior: "smooth" });
        });

        btnNext.addEventListener("click", () => {
            if (!isMobile()) return;
            const step = viewport.clientWidth * 0.9;
            viewport.scrollBy({ left: step, behavior: "smooth" });
        });
    }

    window.addEventListener("feedback:languagechange", renderAllCards);
    window.addEventListener("load", renderAllCards);
    window.addEventListener("resize", renderAllCards);

    renderAllCards();
})();