(() => {
    if (CSS.supports("corner-shape", "squircle")) return;

    const SELECTORS = [
        '.input-group input:not([type="checkbox"])',
        "textarea",
        ".btn"
    ];

    const POWER = 2 / 4;
    const STEPS = 12;

    function polygon(w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        const points = [];

        const corner = (cx, cy, sx, sy, from, to) => {
            for (let i = 0; i <= STEPS; i++) {
                const t = from + (to - from) * (i / STEPS);
                const x = cx + sx * r * Math.cos(t) ** POWER;
                const y = cy + sy * r * Math.sin(t) ** POWER;
                pts.push(`${x.toFixed(2)}px ${y.toFixed(2)}px`);
            }
        };

        const q = Math.PI / 2;
        corner(r, r, -1, -1, 0, q);
        corner(w - r, r, 1, -1, q, 0);
        corner(w - r, h - r, 1, 1, 0, q);
        corner(r, h - r, -1, 1, q, 0);

        return `polygon(${points.join(",")})`;
    }

    function shape(el) {
        const w = el.offsetWidth, h = el.offsetHeight;
        if (!w || !h) return;
        el.style.clipPath = polygon(w, h, Number(el.dataset.squircleRadius));
    }

    const resizeObserver = new ResizeObserver(entries => entries.forEach(e => shape(e.target)));
    const adopted = new WeakSet();

    function adopt(el) {
        if (adopted.has(el)) return;
        
        const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius);
        if (!radius) return;

        adopted.add(el);
        el.dataset.squircleRadius = radius;
        el.style.borderRadius = "0";
        resizeObserver.observe(el);
    }

    function scan() {
        document.querySelectorAll(SELECTORS.join(",")).forEach(adopt);
    }

    scan();

    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
})();