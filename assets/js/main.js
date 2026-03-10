// ===== FILE: assets/js/main.js =====

/* ==== LANGUAGE TOGGLE (data-en / data-de) ==== */
/* Sicherer Textwechsel via textContent (keine HTML-Injection). */

(function () {
    const buttons = document.querySelectorAll(".lang-btn");
    const translatable = document.querySelectorAll("[data-en][data-de]");

    function setLang (lang) {
        translatable.forEach((el) => {
            const val = el.getAttribute(lang === "de" ? "data-de" : "data-en");
            if (val != null) {
                el.textContent = val;
            }
        });

        buttons.forEach((b) => {
            b.classList.toggle("is-active", b.dataset.lang === lang);
        });

        document.documentElement.lang = lang === "de" ? "de" : "en";
    }

    buttons.forEach((b) => {
        b.addEventListener("click", () => setLang(b.dataset.lang));
    });

    setLang("en");
})();


/* ==== SERVICES ACCORDION (KLICK + ENTER/SPACE) ==== */

(function () {
    const items = document.querySelectorAll("[data-service]");
    if (!items.length) {
        return;
    }

    items.forEach((item) => {
        const head = item.querySelector(".service-head");
        if (!head) {
            return;
        }

        const setExpanded = (targetItem, open) => {
            const targetHead = targetItem.querySelector(".service-head");
            targetItem.classList.toggle("open", open);
            if (targetHead) {
                targetHead.setAttribute("aria-expanded", open ? "true" : "false");
            }
        };

        const closeAllExcept = (exceptItem) => {
            items.forEach((it) => {
                if (it !== exceptItem) {
                    setExpanded(it, false);
                }
            });
        };

        const toggleItem = () => {
            const willOpen = !item.classList.contains("open");
            if (willOpen) {
                closeAllExcept(item);
            }
            setExpanded(item, willOpen);
        };

        head.addEventListener("click", toggleItem);

        head.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleItem();
            }
        });
    });
})();