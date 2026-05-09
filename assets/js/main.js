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

/* =============== REFERENCES =============== */
(function () {
    const section = document.getElementById("references");
    if (!section) return;

    const shell = section.querySelector(".references-shell");
    const viewport = section.querySelector(".references-viewport");
    const track = section.querySelector(".references-track");
    const cards = Array.from(section.querySelectorAll(".reference-card"));
    const btnPrev = section.querySelector(".references-nav--left");
    const btnNext = section.querySelector(".references-nav--right");

    if (!shell || !viewport || !track || !cards.length) return;

    let desktopIndex = 0;

    function isMobile() {
        return window.innerWidth <= 768;
    }

    function getVisibleDesktopCount() {
        return Math.min(3, cards.length);
    }

    function getPreviewChars() {
        const raw = getComputedStyle(document.documentElement)
            .getPropertyValue("--references-preview-chars")
            .trim();

        const parsed = parseInt(raw, 10);
        return Number.isFinite(parsed) ? parsed : 95;
    }

    function getSuffix() {
        return document.documentElement.lang === "en" ? "... (More)" : "... (Mehr)";
    }

    function getFullText(textEl) {
        if (!textEl.dataset.fullOriginal) {
            textEl.dataset.fullOriginal = (textEl.textContent || "").trim();
        }
        return textEl.dataset.fullOriginal;
    }

    function truncateText(text, maxChars) {
        const normalized = text.trim();
        const suffix = getSuffix();

        if (normalized.length <= maxChars) return normalized;

        const limit = Math.max(1, maxChars - suffix.length);
        let cut = normalized.slice(0, limit).trim();

        const lastSpace = cut.lastIndexOf(" ");
        if (lastSpace > Math.floor(limit * 0.6)) {
            cut = cut.slice(0, lastSpace).trim();
        }

        return cut + suffix;
    }

    function getExpandedCard() {
        return cards.find((card) => card.classList.contains("is-expanded")) || null;
    }

    function lockBodyScroll() {
        const body = document.body;
        if (body.classList.contains("references-expanded")) return;

        const scrollY = window.scrollY || window.pageYOffset || 0;
        body.dataset.scrollY = String(scrollY);
        body.style.setProperty("--scroll-lock-top", `-${scrollY}px`);
        body.classList.add("references-expanded");
    }

    function unlockBodyScroll() {
        const body = document.body;
        if (!body.classList.contains("references-expanded")) return;

        const scrollY = parseInt(body.dataset.scrollY || "0", 10);
        body.classList.remove("references-expanded");
        body.style.removeProperty("--scroll-lock-top");
        delete body.dataset.scrollY;

        /* Wichtig: exakt an die alte Position zurück, kein Sprung zu den Referenzen */
        window.scrollTo(0, scrollY);
    }

    function updateBodyState() {
        const expanded = !!getExpandedCard();

        if (expanded) {
            lockBodyScroll();
        } else {
            unlockBodyScroll();
        }

        shell.classList.toggle("has-expanded", expanded);
    }

    function applyDesktopWindow() {
        if (isMobile()) {
            cards.forEach((card, index) => {
                card.style.display = "";
                card.style.order = String(index);
            });
            track.style.transform = "";
            return;
        }

        const expanded = getExpandedCard();
        if (expanded) {
            cards.forEach((card, index) => {
                card.style.display = "";
                card.style.order = String(index);
            });
            track.style.transform = "";
            return;
        }

        const visibleCount = getVisibleDesktopCount();

        cards.forEach((card, index) => {
            const normalized = (index - desktopIndex + cards.length) % cards.length;
            const visible = normalized < visibleCount;

            card.style.order = String(normalized);
            card.style.display = visible ? "" : "none";
        });

        track.style.transform = "";
    }

    function renderCard(card) {
        const textEl = card.querySelector(".feedback-text");
        if (!textEl) return;

        const expanded = card.classList.contains("is-expanded");
        const fullText = getFullText(textEl);
        const maxChars = getPreviewChars();

        textEl.textContent = expanded ? fullText : truncateText(fullText, maxChars);
        card.setAttribute("aria-expanded", expanded ? "true" : "false");

        const inner = card.querySelector(".reference-card-inner");
        if (inner) {
            inner.setAttribute("aria-expanded", expanded ? "true" : "false");
        }
    }

    function renderAllCards() {
        cards.forEach(renderCard);
        applyDesktopWindow();
        updateBodyState();
        updateNavState();
    }

    function collapseAll() {
        cards.forEach((card) => card.classList.remove("is-expanded"));
    }

    function expandCard(card) {
        collapseAll();
        card.classList.add("is-expanded");
    }

    function collapseCard(card) {
        if (!card) return;
        card.classList.remove("is-expanded");
    }

    function toggleCard(card) {
        const expanded = card.classList.contains("is-expanded");

        if (expanded) {
            collapseCard(card);
        } else {
            expandCard(card);
        }

        renderAllCards();
    }

    function getCurrentIndex() {
        const expanded = getExpandedCard();
        if (expanded) return cards.indexOf(expanded);

        if (!isMobile()) return desktopIndex;

        const viewportRect = viewport.getBoundingClientRect();
        const viewportCenter = viewportRect.left + viewportRect.width / 2;

        let bestIndex = 0;
        let bestDistance = Infinity;

        cards.forEach((card, index) => {
            const rect = card.getBoundingClientRect();
            const center = rect.left + rect.width / 2;
            const distance = Math.abs(center - viewportCenter);

            if (distance < bestDistance) {
                bestDistance = distance;
                bestIndex = index;
            }
        });

        return bestIndex;
    }

    function scrollToCard(index, behavior = "smooth") {
        const card = cards[index];
        if (!card) return;

        const left = card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2;

        viewport.scrollTo({
            left,
            behavior
        });
    }

    function showPrev() {
        const expanded = getExpandedCard();

        if (expanded) {
            const currentIndex = cards.indexOf(expanded);
            const prevIndex = (currentIndex - 1 + cards.length) % cards.length;
            expandCard(cards[prevIndex]);
            renderAllCards();
            return;
        }

        if (isMobile()) {
            const currentIndex = getCurrentIndex();
            const prevIndex = Math.max(0, currentIndex - 1);
            scrollToCard(prevIndex);
            updateNavState();
            return;
        }

        desktopIndex = (desktopIndex - 1 + cards.length) % cards.length;
        renderAllCards();
    }

    function showNext() {
        const expanded = getExpandedCard();

        if (expanded) {
            const currentIndex = cards.indexOf(expanded);
            const nextIndex = (currentIndex + 1) % cards.length;
            expandCard(cards[nextIndex]);
            renderAllCards();
            return;
        }

        if (isMobile()) {
            const currentIndex = getCurrentIndex();
            const nextIndex = Math.min(cards.length - 1, currentIndex + 1);
            scrollToCard(nextIndex);
            updateNavState();
            return;
        }

        desktopIndex = (desktopIndex + 1) % cards.length;
        renderAllCards();
    }

    function updateNavState() {
        if (!btnPrev || !btnNext) return;

        const expanded = getExpandedCard();

        if (expanded) {
            btnPrev.disabled = cards.length <= 1;
            btnNext.disabled = cards.length <= 1;
            return;
        }

        if (isMobile()) {
            const currentIndex = getCurrentIndex();
            btnPrev.disabled = currentIndex <= 0;
            btnNext.disabled = currentIndex >= cards.length - 1;
            return;
        }

        btnPrev.disabled = cards.length <= 1;
        btnNext.disabled = cards.length <= 1;
    }

    cards.forEach((card) => {
        const inner = card.querySelector(".reference-card-inner");
        if (!inner) return;

        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "button");
        card.setAttribute("aria-expanded", "false");

        /* Verhindert unerwünschte Fokus-/Scroll-Sprünge beim Klicken */
        inner.addEventListener("mousedown", (e) => {
            e.preventDefault();
        });

        inner.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCard(card);
        });

        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleCard(card);
            }

            if (e.key === "Escape") {
                collapseAll();
                renderAllCards();
            }

            if (e.key === "ArrowLeft") {
                e.preventDefault();
                showPrev();
            }

            if (e.key === "ArrowRight") {
                e.preventDefault();
                showNext();
            }
        });

        let touchStartX = 0;
        let touchStartY = 0;

        inner.addEventListener("touchstart", (e) => {
            const touch = e.changedTouches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }, { passive: true });

        inner.addEventListener("touchend", (e) => {
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;

            const expanded = card.classList.contains("is-expanded");

            if (expanded) {
                if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
                    if (deltaX > 0) {
                        showPrev();
                    } else {
                        showNext();
                    }
                }
                return;
            }

            if (isMobile() && Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 0) {
                    showPrev();
                } else {
                    showNext();
                }
            }
        }, { passive: true });
    });

    document.addEventListener("click", (e) => {
        const insideReferenceCard = e.target.closest(".reference-card");
        const insideReferenceNav = e.target.closest(".references-nav");

        if (!insideReferenceCard && !insideReferenceNav) {
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

    if (btnPrev) {
        btnPrev.addEventListener("mousedown", (e) => {
            e.preventDefault();
        });

        btnPrev.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            showPrev();
        });
    }

    if (btnNext) {
        btnNext.addEventListener("mousedown", (e) => {
            e.preventDefault();
        });

        btnNext.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            showNext();
        });
    }

    viewport.addEventListener("scroll", updateNavState, { passive: true });

    window.addEventListener("resize", () => {
        collapseAll();
        renderAllCards();
    });

    window.addEventListener("load", renderAllCards);
    window.addEventListener("feedback:languagechange", renderAllCards);

    renderAllCards();
})();