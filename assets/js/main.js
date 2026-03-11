/* ===== FILE: assets/js/main.js ===== */

/* ==== LANGUAGE TOGGLE (data-en/data-de) ==== */
(function () {
    const buttons = Array.from(document.querySelectorAll(".lang-btn"));
    if (!buttons.length) return;

    const translatable = Array.from(document.querySelectorAll("[data-en][data-de]")).filter((el) => {
        const tag = el.tagName;
        const hasElementChildren = el.children && el.children.length > 0;

        /* A/BUTTON nur übersetzen, wenn sie keine weiteren Elemente kapseln (sonst wird Markup zerstört) */
        if ((tag === "A" || tag === "BUTTON") && hasElementChildren) return false;

        return true;
    });

    function setLang(lang) {
        const isDe = lang === "de";

        translatable.forEach((el) => {
            const val = el.getAttribute(isDe ? "data-de" : "data-en");
            if (val != null) el.textContent = val;
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