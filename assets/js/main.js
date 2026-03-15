/* ===== FILE: assets/js/main.js ===== */

/* ==== LANGUAGE TOGGLE (data-en/data-de) ==== */
(function () {
    const buttons = Array.from(document.querySelectorAll(".lang-btn"));
    if (!buttons.length) return;

    const translatable = Array.from(document.querySelectorAll("[data-en][data-de]")).filter((el) => {
        return el.children.length === 0;
    });

    function applyTranslation(el, lang) {
        const value = el.getAttribute(lang === "de" ? "data-de" : "data-en");
        if (value == null) return;

        const tag = el.tagName;

        if (tag === "INPUT" || tag === "TEXTAREA") {
            if (el.hasAttribute("placeholder")) {
                el.setAttribute("placeholder", value);
            } else if (tag === "INPUT" && (el.type === "submit" || el.type === "button")) {
                el.value = value;
            } else {
                el.textContent = value;
            }

            return;
        }

        el.textContent = value;
    }

    function setLang(lang) {
        const isDe = lang === "de";

        translatable.forEach((el) => {
            applyTranslation(el, lang);
        });

        buttons.forEach((button) => {
            button.classList.toggle("is-active", button.dataset.lang === lang);
        });

        document.documentElement.lang = isDe ? "de" : "en";
    }

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const lang = button.dataset.lang;
            if (!lang) return;
            setLang(lang);
        });
    });

    /* Default Sprache: DE */
    setLang("de");
})();

/* ==== SERVICES ACCORDION (KLICK + ENTER/SPACE) ==== */
(function () {
    const items = Array.from(document.querySelectorAll("[data-service]"));
    if (!items.length) return;

    function setExpanded(item, open) {
        item.classList.toggle("open", open);

        const head = item.querySelector(".service-head");
        if (head) {
            head.setAttribute("aria-expanded", open ? "true" : "false");
        }
    }

    function closeAllExcept(exceptItem) {
        items.forEach((item) => {
            if (item !== exceptItem) {
                setExpanded(item, false);
            }
        });
    }

    items.forEach((item) => {
        const head = item.querySelector(".service-head");
        if (!head) return;

        function toggle() {
            const willOpen = !item.classList.contains("open");

            if (willOpen) {
                closeAllExcept(item);
            }

            setExpanded(item, willOpen);
        }

        head.addEventListener("click", toggle);

        head.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
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

    toggle.addEventListener("click", () => {
        const isOpen = panel.classList.contains("is-open");

        if (isOpen) {
            closePanel();
        } else {
            openPanel();
        }
    });

    document.addEventListener("click", (event) => {
        if (!panel.contains(event.target) && !toggle.contains(event.target)) {
            closePanel();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closePanel();
        }
    });

    panel.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closePanel);
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) {
            closePanel();
        }
    });
})();