/* ==== LANGUAGE TOGGLE (data-en/data-de + placeholders) ==== */
(function () {
    const buttons = Array.from(document.querySelectorAll(".lang-btn"));
    if (!buttons.length) return;

    const translatable = Array.from(document.querySelectorAll("[data-en][data-de]")).filter((el) => {
        const tag = el.tagName;
        const hasElementChildren = el.children && el.children.length > 0;

        if ((tag === "A" || tag === "BUTTON") && hasElementChildren) return false;

        return true;
    });

    const placeholderFields = Array.from(
        document.querySelectorAll("[data-placeholder-en][data-placeholder-de]")
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

/* ==== FEEDBACK TEXT TRUNCATION + EXPAND/COLLAPSE ==== */
(function () {
    const cards = Array.from(document.querySelectorAll("[data-feedback-card]"));
    if (!cards.length) return;

    const MAX_CHARS = 200;

    function currentLang() {
        return document.documentElement.lang === "en" ? "en" : "de";
    }

    function suffix(lang) {
        return lang === "en" ? "... (More)" : "... (Mehr)";
    }

    function getFullText(textEl, lang) {
        return textEl.getAttribute(`data-${lang}`) || textEl.textContent.trim();
    }

    function truncateText(text, lang) {
        const normalized = text.trim();
        if (normalized.length <= MAX_CHARS) return normalized;
        return normalized.slice(0, MAX_CHARS).trim() + suffix(lang);
    }

    function collapseAllExcept(exceptionCard) {
        cards.forEach((card) => {
            if (card !== exceptionCard) {
                card.classList.remove("is-expanded");
            }
        });
    }

    function renderFeedbackTexts() {
        const lang = currentLang();

        cards.forEach((card) => {
            const textEl = card.querySelector("[data-feedback-text]");
            if (!textEl) return;

            const full = getFullText(textEl, lang);
            const expanded = card.classList.contains("is-expanded");

            textEl.textContent = expanded ? full : truncateText(full, lang);
        });

        window.dispatchEvent(new Event("feedback:contentchange"));
    }

    cards.forEach((card) => {
        const inner = card.querySelector(".feedback-card-inner");
        if (!inner) return;

        inner.addEventListener("click", () => {
            const wasExpanded = card.classList.contains("is-expanded");

            if (!wasExpanded) {
                collapseAllExcept(card);
                card.classList.add("is-expanded");
            } else {
                card.classList.remove("is-expanded");
            }

            renderFeedbackTexts();
            window.dispatchEvent(new Event("resize"));
        });
    });

    window.addEventListener("feedback:languagechange", renderFeedbackTexts);
    window.addEventListener("load", renderFeedbackTexts);

    renderFeedbackTexts();
})();

/* ==== FEEDBACK CARD EQUAL HEIGHT ==== */
(function () {
    const cards = Array.from(document.querySelectorAll(".feedback-card"));
    if (!cards.length) return;

    function isMobile() {
        return window.innerWidth <= 768;
    }

    function equalizeFeedbackCardHeights() {
        const innerCards = cards
            .filter((card) => !card.classList.contains("is-expanded"))
            .map((card) => card.querySelector(".feedback-card-inner"))
            .filter(Boolean);

        if (!innerCards.length) return;

        innerCards.forEach((card) => {
            card.style.minHeight = "";
        });

        if (isMobile()) return;

        let maxHeight = 0;

        innerCards.forEach((card) => {
            const height = card.offsetHeight;
            if (height > maxHeight) maxHeight = height;
        });

        innerCards.forEach((card) => {
            card.style.minHeight = `${maxHeight}px`;
        });
    }

    window.addEventListener("load", equalizeFeedbackCardHeights);
    window.addEventListener("resize", equalizeFeedbackCardHeights);
    window.addEventListener("feedback:contentchange", equalizeFeedbackCardHeights);

    equalizeFeedbackCardHeights();
})();

/* ==== REFERENCES CAROUSEL ==== */
(function () {
    const shell = document.querySelector(".references-carousel");
    if (!shell) return;

    const track = shell.querySelector(".carousel-track");
    const cards = Array.from(shell.querySelectorAll(".feedback-card"));
    const btnPrev = shell.querySelector(".carousel-btn.left");
    const btnNext = shell.querySelector(".carousel-btn.right");

    if (!track || !cards.length || !btnPrev || !btnNext) return;

    let currentIndex = 0;

    function isMobile() {
        return window.innerWidth <= 768;
    }

    function collapseExpandedCards() {
        cards.forEach((card) => card.classList.remove("is-expanded"));
        window.dispatchEvent(new Event("feedback:contentchange"));
    }

    function updateCarousel() {
        if (isMobile()) {
            track.style.transform = "none";

            cards.forEach((card) => {
                card.setAttribute("aria-hidden", "false");
                card.classList.remove("is-active");
            });

            btnPrev.disabled = false;
            btnNext.disabled = false;
            return;
        }

        const viewport = shell.querySelector(".carousel-viewport");
        if (!viewport) return;

        const viewportWidth = viewport.clientWidth;
        const translateX = -(currentIndex * viewportWidth);

        track.style.transform = `translate3d(${translateX}px, 0, 0)`;

        cards.forEach((card, index) => {
            card.classList.toggle("is-active", index === currentIndex);
            card.setAttribute("aria-hidden", index === currentIndex ? "false" : "true");
        });

        btnPrev.disabled = currentIndex === 0;
        btnNext.disabled = currentIndex === cards.length - 1;
    }

    btnPrev.addEventListener("click", () => {
        if (isMobile()) return;
        if (currentIndex > 0) {
            collapseExpandedCards();
            currentIndex -= 1;
            updateCarousel();
            window.dispatchEvent(new Event("resize"));
        }
    });

    btnNext.addEventListener("click", () => {
        if (isMobile()) return;
        if (currentIndex < cards.length - 1) {
            collapseExpandedCards();
            currentIndex += 1;
            updateCarousel();
            window.dispatchEvent(new Event("resize"));
        }
    });

    window.addEventListener("resize", updateCarousel);
    window.addEventListener("load", updateCarousel);
    window.addEventListener("feedback:contentchange", updateCarousel);

    updateCarousel();
})();