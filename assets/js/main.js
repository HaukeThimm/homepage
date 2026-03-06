/* ==== FILE: assets/js/main.js ===== */

/* ==== LANGUAGE TOGGLE (data-en/data-de) ==== */
/* - ersetzt nur textContent (sicher, keine HTML-Injection)
   - setzt HTML-lang Attribut
   - .is-active steuert Opacity der Flag-Buttons */
(function () {
    const buttons = document.querySelectorAll(".lang-btn");
    const translatable = document.querySelectorAll("[data-en][data-de]");

    function setLang(lang) {
        translatable.forEach((el) => {
            const val = el.getAttribute(lang === "de" ? "data-de" : "data-en");
            if (val != null) el.textContent = val;
        });

        buttons.forEach((b) => b.classList.toggle("is-active", b.dataset.lang === lang));
        document.documentElement.lang = lang === "de" ? "de" : "en";
    }

    buttons.forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
    setLang("en");
})();

/* ==== SERVICES ACCORDION (INTERAKTION + A11Y) ==== */
/* - Klick oder Enter/Space toggelt
   - aria-expanded wird aktualisiert
   - nur ein Accordion offen (closeAllExcept) */
(function () {
    const items = document.querySelectorAll("[data-service]");
    if (!items.length) return;

    items.forEach((item) => {
        const head = item.querySelector(".service-head");
        if (!head) return;

        const setExpanded = (targetItem, open) => {
            const targetHead = targetItem.querySelector(".service-head");
            targetItem.classList.toggle("open", open);
            if (targetHead) targetHead.setAttribute("aria-expanded", open ? "true" : "false");
        };

        const closeAllExcept = (exceptItem) => {
            items.forEach((it) => {
                if (it !== exceptItem) setExpanded(it, false);
            });
        };

        const toggleItem = () => {
            const willOpen = !item.classList.contains("open");
            if (willOpen) closeAllExcept(item);
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

/* ==== FEEDBACK CAROUSEL (MANUELL + ZENTRIERT) ==== */
/* Ziel:
   - keine Automatik (kein setInterval)
   - 2. Karte ist initial exakt mittig
   - Pfeile navigieren manuell mit Endlos-Loop (Clones) */
(function () {
    const track = document.getElementById("fbTrack");
    const prevBtn = document.getElementById("fbPrev");
    const nextBtn = document.getElementById("fbNext");
    if (!track) return;

    // --- 1) CLONES für nahtlosen Loop ---
    const originals = Array.from(track.querySelectorAll(".feedback-card"));
    if (originals.length < 2) return;

    const firstClone = originals[0].cloneNode(true);
    const lastClone  = originals[originals.length - 1].cloneNode(true);

    firstClone.setAttribute("data-clone", "first");
    lastClone.setAttribute("data-clone", "last");

    track.insertBefore(lastClone, originals[0]);
    track.appendChild(firstClone);

    // --- 2) Start: 2. echtes Slide soll mittig sein ---
    // track.children: [lastClone, original1, original2, ..., originalN, firstClone]
    // original2 liegt bei index = 2
    let index = Math.min(2, originals.length); // falls nur 2 Cards vorhanden sind

    // --- Helpers ---
    function cards() {
        return Array.from(track.querySelectorAll(".feedback-card"));
    }

    function realCount() {
        return originals.length;
    }

    function getGapPx() {
        const styles = window.getComputedStyle(track);
        return (parseFloat(styles.columnGap || styles.gap || "0") || 0);
    }

    function cardWidthPx() {
        const c = track.querySelector(".feedback-card");
        return c ? c.getBoundingClientRect().width : 0;
    }

    function stepPx() {
        return cardWidthPx() + getGapPx();
    }

    function centerOffsetPx() {
        const viewport = track.closest(".carousel-viewport");
        const cW = cardWidthPx();
        if (!viewport || !cW) return 0;

        const vStyles = window.getComputedStyle(viewport);
        const padL = parseFloat(vStyles.paddingLeft) || 0;
        const padR = parseFloat(vStyles.paddingRight) || 0;

        const contentW = viewport.clientWidth - padL - padR;
        return padL + Math.max(0, (contentW - cW) / 2);
    }

    function setTransition(on) {
        track.style.transition = on ? "transform 320ms ease" : "none";
    }

    function render() {
        const offset = centerOffsetPx();
        const x = offset - index * stepPx();
        track.style.transform = `translate3d(${x}px, 0, 0)`;
    }

    function goNext() {
        index += 1;
        setTransition(true);
        render();
    }

    function goPrev() {
        index -= 1;
        setTransition(true);
        render();
    }

    // --- 3) Nahtloser Reset bei Clones ---
    track.addEventListener("transitionend", () => {
        const all = cards();
        const active = all[index];
        if (!active) return;

        if (active.getAttribute("data-clone") === "first") {
            index = 1; // echtes erstes
            setTransition(false);
            render();
        }

        if (active.getAttribute("data-clone") === "last") {
            index = realCount(); // echtes letztes
            setTransition(false);
            render();
        }
    });

    // Buttons (nur manuell)
    if (nextBtn) nextBtn.addEventListener("click", goNext);
    if (prevBtn) prevBtn.addEventListener("click", goPrev);

    // Resize: neu zentrieren
    window.addEventListener("resize", () => {
        setTransition(false);
        render();
    });

    // Initial
    setTransition(false);
    render();
})();