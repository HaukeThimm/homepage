/* ==== LANGUAGE TOGGLE (TEXTUMSCHALTUNG) ==== */
/* Schaltet alle Elemente mit data-en/data-de um.
   Wichtig: Es wird textContent gesetzt (keine HTML-Injection). */
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
    setLang("en"); /* Default */
})();

/* ==== SERVICES ACCORDION (INTERAKTION + A11Y) ==== */
/* - Klick oder Enter/Space toggelt den Block
   - aria-expanded wird synchron gehalten
   - immer nur ein Block offen (closeAllExcept) */
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

/* ==== FEEDBACK CAROUSEL (ENDLOS + ZENTRIERT) ==== */
/* Ziel:
   - Karten sind immer optisch zentriert (berechnet aus Viewport-Padding und Card-Breite)
   - Endlos-Loop durch Clones (first/last)
   - Auto-Advance per Timer (INTERVAL_MS)
   - Resize re-render (Layout bleibt stabil bei Breakpoints) */
(function () {
    const track = document.getElementById("fbTrack");
    const prevBtn = document.getElementById("fbPrev");
    const nextBtn = document.getElementById("fbNext");
    if (!track) return;

    const INTERVAL_MS = 4000;
    let timerId = null;

    const originals = Array.from(track.querySelectorAll(".feedback-card"));
    if (originals.length < 2) return;

    const firstClone = originals[0].cloneNode(true);
    const lastClone  = originals[originals.length - 1].cloneNode(true);

    firstClone.setAttribute("data-clone", "first");
    lastClone.setAttribute("data-clone", "last");

    track.insertBefore(lastClone, originals[0]);
    track.appendChild(firstClone);

    /* index zeigt auf das aktive Element in track.children (inkl. clones) */
    let index = 1;

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

    /* Zentrierung:
       - berücksichtigt das Padding der .carousel-viewport (damit Full-bleed sauber wirkt)
       - positioniert die aktive Card in der Content-Mitte */
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

    /* Clone-Reset ohne sichtbare Animation */
    track.addEventListener("transitionend", () => {
        const all = cards();
        const active = all[index];
        if (!active) return;

        if (active.getAttribute("data-clone") === "first") {
            index = 1;
            setTransition(false);
            render();
        }

        if (active.getAttribute("data-clone") === "last") {
            index = realCount();
            setTransition(false);
            render();
        }
    });

    function resetTimer() {
        if (timerId) clearInterval(timerId);
        timerId = setInterval(goNext, INTERVAL_MS);
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            goNext();
            resetTimer();
        });
    }
    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            goPrev();
            resetTimer();
        });
    }

    window.addEventListener("resize", () => {
        setTransition(false);
        render();
    });

    setTransition(false);
    render();
    resetTimer();
})();