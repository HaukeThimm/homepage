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

/* ==== FEEDBACK CARD EQUAL HEIGHT ==== */
(function () {
    const cards = Array.from(document.querySelectorAll(".feedback-card-inner"));
    if (!cards.length) return;

    function equalizeFeedbackCardHeights() {
        cards.forEach((card) => {
            card.style.minHeight = "0px";
        });

        let maxHeight = 0;

        cards.forEach((card) => {
            const height = card.offsetHeight;
            if (height > maxHeight) maxHeight = height;
        });

        cards.forEach((card) => {
            card.style.minHeight = `${maxHeight}px`;
        });
    }

    window.addEventListener("load", equalizeFeedbackCardHeights);
    window.addEventListener("resize", equalizeFeedbackCardHeights);
})();

/* ==== REFERENCES CAROUSEL ==== */
(function () {
    const shell = document.querySelector(".credentials-carousel");
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

    function updateCarousel() {
        if (isMobile()) {
            track.style.transform = "none";

            cards.forEach((card) => {
                card.setAttribute("aria-hidden", "false");
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
            currentIndex -= 1;
            updateCarousel();
        }
    });

    btnNext.addEventListener("click", () => {
        if (isMobile()) return;
        if (currentIndex < cards.length - 1) {
            currentIndex += 1;
            updateCarousel();
        }
    });

    window.addEventListener("resize", updateCarousel);
    window.addEventListener("load", updateCarousel);

    updateCarousel();
})();