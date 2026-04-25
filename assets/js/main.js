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

/* ==== REFERENCES ==== */
(function () {
    const shell = document.querySelector("[data-references-shell]");
    if (!shell) return;

    const viewport = shell.querySelector("[data-ref-viewport]");
    const track = shell.querySelector("[data-ref-track]");
    const cards = Array.from(shell.querySelectorAll("[data-feedback-card]"));
    const btnPrev = shell.querySelector('[data-ref-nav="prev"]');
    const btnNext = shell.querySelector('[data-ref-nav="next"]');

    if (!viewport || !track || !cards.length || !btnPrev || !btnNext) return;

    let currentIndex = 0;

    function isMobile() {
        return window.innerWidth <= 768;
    }

    function getSuffix() {
        return document.documentElement.lang === "en" ? "… (More)" : "… (Mehr)";
    }

    function getFullText(textEl) {
        if (!textEl.dataset.fullOriginal) {
            textEl.dataset.fullOriginal = (textEl.textContent || "").trim();
        }
        return textEl.dataset.fullOriginal;
    }

    function getPreviewCharLimit() {
        const cssValue = getComputedStyle(document.documentElement)
            .getPropertyValue("--references-preview-chars")
            .trim();

        const parsed = parseInt(cssValue, 10);
        if (Number.isFinite(parsed)) return parsed;

        return isMobile() ? 205 : 190;
    }

    function truncateText(text) {
        const normalized = text.trim();
        const ending = getSuffix();
        const maxChars = getPreviewCharLimit();

        if (normalized.length <= maxChars) return normalized;

        const rawLimit = Math.max(1, maxChars - ending.length);
        let trimmed = normalized.slice(0, rawLimit).trim();

        const lastSpace = trimmed.lastIndexOf(" ");
        if (lastSpace > Math.floor(rawLimit * 0.6)) {
            trimmed = trimmed.slice(0, lastSpace).trim();
        }

        return trimmed + ending;
    }

    function anyExpanded() {
        return cards.some((card) => card.classList.contains("is-expanded"));
    }

    function getExpandedIndex() {
        return cards.findIndex((card) => card.classList.contains("is-expanded"));
    }

    function updateBodyAndShellState() {
        const expanded = anyExpanded();
        document.body.classList.toggle("references-expanded", expanded);
        shell.classList.toggle("has-expanded", expanded);
    }

    function renderCard(card) {
        const textEl = card.querySelector("[data-feedback-text]");
        const inner = card.querySelector(".reference-card-inner");
        if (!textEl || !inner) return;

        const fullText = getFullText(textEl);
        const expanded = card.classList.contains("is-expanded");

        textEl.textContent = expanded ? fullText : truncateText(fullText);
        inner.setAttribute("aria-expanded", expanded ? "true" : "false");
    }

    function renderAllCards() {
        cards.forEach(renderCard);
        updateBodyAndShellState();
        updateNavState();
    }

    function collapseAll() {
        cards.forEach((card) => card.classList.remove("is-expanded"));
    }

    function expandCard(index) {
        collapseAll();
        currentIndex = Math.max(0, Math.min(index, cards.length - 1));
        cards[currentIndex].classList.add("is-expanded");
        renderAllCards();
    }

    function toggleCard(index) {
        const card = cards[index];
        if (!card) return;

        if (card.classList.contains("is-expanded")) {
            card.classList.remove("is-expanded");
            renderAllCards();
            return;
        }

        expandCard(index);
    }

    function updateNavState() {
        if (anyExpanded()) {
            const expandedIndex = getExpandedIndex();
            btnPrev.disabled = expandedIndex <= 0;
            btnNext.disabled = expandedIndex >= cards.length - 1;
            return;
        }

        if (isMobile()) {
            btnPrev.disabled = false;
            btnNext.disabled = false;
            return;
        }

        btnPrev.disabled = false;
        btnNext.disabled = false;
    }

    function scrollMobileToIndex(index) {
        if (!isMobile()) return;
        const card = cards[index];
        if (!card) return;

        const left = card.offsetLeft - Math.max(0, (viewport.clientWidth - card.clientWidth) / 2);
        viewport.scrollTo({
            left,
            behavior: "smooth"
        });
    }

    function goPrev() {
        if (anyExpanded()) {
            const expandedIndex = getExpandedIndex();
            if (expandedIndex > 0) {
                expandCard(expandedIndex - 1);
            }
            return;
        }

        if (isMobile()) {
            currentIndex = currentIndex > 0 ? currentIndex - 1 : 0;
            scrollMobileToIndex(currentIndex);
            return;
        }

        currentIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
        cards[currentIndex].querySelector(".reference-card-inner")?.focus();
    }

    function goNext() {
        if (anyExpanded()) {
            const expandedIndex = getExpandedIndex();
            if (expandedIndex < cards.length - 1) {
                expandCard(expandedIndex + 1);
            }
            return;
        }

        if (isMobile()) {
            currentIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : cards.length - 1;
            scrollMobileToIndex(currentIndex);
            return;
        }

        currentIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
        cards[currentIndex].querySelector(".reference-card-inner")?.focus();
    }

    cards.forEach((card, index) => {
        const inner = card.querySelector(".reference-card-inner");
        if (!inner) return;

        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;

        inner.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleCard(index);
        });

        inner.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleCard(index);
            }

            if (e.key === "Escape") {
                collapseAll();
                renderAllCards();
            }

            if (e.key === "ArrowLeft") {
                e.preventDefault();
                goPrev();
            }

            if (e.key === "ArrowRight") {
                e.preventDefault();
                goNext();
            }
        });

        inner.addEventListener("touchstart", (e) => {
            const touch = e.changedTouches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }, { passive: true });

        inner.addEventListener("touchend", (e) => {
            const touch = e.changedTouches[0];
            touchEndX = touch.clientX;
            touchEndY = touch.clientY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            if (anyExpanded()) {
                if (Math.abs(deltaX) >= 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
                    if (deltaX > 0) {
                        goPrev();
                    } else {
                        goNext();
                    }
                }
                return;
            }

            if (isMobile() && Math.abs(deltaX) >= 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 0) {
                    currentIndex = Math.max(0, index - 1);
                } else {
                    currentIndex = Math.min(cards.length - 1, index + 1);
                }
                scrollMobileToIndex(currentIndex);
            }
        }, { passive: true });
    });

    btnPrev.addEventListener("click", () => {
        goPrev();
    });

    btnNext.addEventListener("click", () => {
        goNext();
    });

    document.addEventListener("click", (e) => {
        const clickedInsideReferences = e.target.closest("#references");
        const clickedCard = e.target.closest("[data-feedback-card]");

        if (!clickedInsideReferences) {
            collapseAll();
            renderAllCards();
            return;
        }

        if (anyExpanded() && !clickedCard && !e.target.closest(".references-nav")) {
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

    viewport.addEventListener("scroll", () => {
        if (!isMobile() || anyExpanded()) return;

        let nearestIndex = 0;
        let smallestDistance = Infinity;

        cards.forEach((card, index) => {
            const cardCenter = card.offsetLeft + (card.clientWidth / 2);
            const viewportCenter = viewport.scrollLeft + (viewport.clientWidth / 2);
            const distance = Math.abs(cardCenter - viewportCenter);

            if (distance < smallestDistance) {
                smallestDistance = distance;
                nearestIndex = index;
            }
        });

        currentIndex = nearestIndex;
        updateNavState();
    }, { passive: true });

    window.addEventListener("feedback:languagechange", renderAllCards);
    window.addEventListener("resize", () => {
        renderAllCards();
        if (isMobile() && !anyExpanded()) {
            scrollMobileToIndex(currentIndex);
        }
    });

    window.addEventListener("load", () => {
        renderAllCards();
        if (isMobile()) {
            scrollMobileToIndex(0);
        }
    });

    renderAllCards();
})();