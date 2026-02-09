/* ------------------------------------------
 * Light Collector - Healing Shooter
 * A cozy game where a cat collects falling stars
 *
 * Controls:
 * - Arrow keys / A,D: Move left/right
 * - Space / Click: Shoot waves to collect stars
 *
 * Modes:
 * - 60s Mode: Collect stars from night to dawn
 * - Endless: Day/night cycle until you miss a star
 * ----------------------------------------- */
(() => {
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    const DPI = window.devicePixelRatio || 1;

    // DOM Elements
    const overlay = document.getElementById("overlay");
    const hudEl = document.getElementById("hud");
    const mainUI = document.getElementById("mainUI");
    const challengeCheckbox = document.getElementById("challengeCheckbox");
    const resultEl = document.getElementById("result");
    const scoreEl = document.getElementById("score");
    const timerEl = document.getElementById("timer");
    const comboEl = document.getElementById("combo");

    // Game States
    const STATE = { OPENING: "opening", MAIN: "main", PLAY: "play", OVER: "over" };
    let state = STATE.OPENING;

    const MODE = { TIMED: "timed", ENDLESS: "endless" };
    let mode = MODE.TIMED;

    // Game Settings
    const sessionSeconds = 60;
    let score = 0;
    let timeLeft = sessionSeconds;
    let modeElapsed = 0;
    let maxCombo = 1.0;

    // Combo System
    const COMBO_WINDOW = 2.0;
    const COMBO_MAX = 5.0;
    let combo = 1.0;
    let comboTimer = 0;

    // Input
    const keys = new Set();

    // World dimensions
    let W = 0, H = 0;

    // Opening Sequence
    const opening = {
        phase: 0, // 0: sleeping, 1: waking up, 2: climbing, 3: transition to main
        timer: 0,
        sleepDuration: 1.5,
        wakeDuration: 1.0,
        climbDuration: 2.0,
        fadeDuration: 0.5,
        startY: 0,
        targetY: 0,
        eyeOpen: 0,
    };

    // Player (Cat)
    const player = {
        x: 0,
        y: 0,
        w: 46,
        h: 32,
        speed: 380,
        cooldown: 0,
        cooldownMax: 0.24,
    };

    // Entities
    const waves = [];
    const stars = [];
    const fx = [];
    let starTimer = 0;

    // Utilities
    const rnd = (min, max) => Math.random() * (max - min) + min;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, t) => a + (b - a) * t;

    function clampPlayerX(x) {
        const margin = player.w * 0.5 + 8;
        return clamp(x, margin, W - margin);
    }

    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.floor(W * DPI);
        canvas.height = Math.floor(H * DPI);
        canvas.style.width = W + "px";
        canvas.style.height = H + "px";
        ctx.setTransform(DPI, 0, 0, DPI, 0, 0);

        // Opening positions
        opening.startY = H + 80;
        opening.targetY = H - 60;

        // Update player position based on state
        if (state === STATE.OPENING) {
            player.x = clampPlayerX(W * 0.5);
            if (opening.phase < 2) {
                player.y = opening.startY;
            }
        }
    }

    window.addEventListener("resize", resize);
    resize();

    // Initialize player position
    player.x = clampPlayerX(W * 0.5);
    player.y = opening.startY;

    // Color utilities
    function hexToRgb(hex) {
        const raw = hex.replace("#", "");
        const bigint = parseInt(raw, 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255,
        };
    }

    function rgbToHex(r, g, b) {
        const toHex = (v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0");
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    function mixColor(a, b, t) {
        const ca = hexToRgb(a);
        const cb = hexToRgb(b);
        return rgbToHex(lerp(ca.r, cb.r, t), lerp(ca.g, cb.g, t), lerp(ca.b, cb.b, t));
    }

    function sampleGradient(progress, palette) {
        const p = clamp(progress, 0, 1);
        for (let i = 0; i < palette.length - 1; i++) {
            const a = palette[i];
            const b = palette[i + 1];
            if (p >= a.stop && p <= b.stop) {
                const local = (p - a.stop) / (b.stop - a.stop || 1);
                return {
                    top: mixColor(a.top, b.top, local),
                    bottom: mixColor(a.bottom, b.bottom, local),
                };
            }
        }
        const last = palette[palette.length - 1];
        return { top: last.top, bottom: last.bottom };
    }

    // Sky gradients
    const TIMED_SKY = [
        { stop: 0.0, top: "#050716", bottom: "#0a1533" },
        { stop: 0.35, top: "#0d2249", bottom: "#1d2f6b" },
        { stop: 0.65, top: "#2a4f7c", bottom: "#f58a65" },
        { stop: 1.0, top: "#7ec8ff", bottom: "#ffe6a8" },
    ];

    const ENDLESS_SKY = [
        { stop: 0.0, top: "#050917", bottom: "#0b1738" },
        { stop: 0.18, top: "#132d59", bottom: "#213f77" },
        { stop: 0.33, top: "#2f5384", bottom: "#ff9a67" },
        { stop: 0.48, top: "#6db6ff", bottom: "#ffe5a2" },
        { stop: 0.64, top: "#a5dfff", bottom: "#fff8d4" },
        { stop: 0.8, top: "#f1797a", bottom: "#381c4b" },
        { stop: 0.94, top: "#100a24", bottom: "#070a16" },
        { stop: 1.0, top: "#050917", bottom: "#0b1738" },
    ];

    const ENDLESS_CYCLE_SECONDS = 90;

    const ENDLESS_PHASES = [
        { from: 0.0, to: 0.18, label: "Night" },
        { from: 0.18, to: 0.33, label: "Dawn" },
        { from: 0.33, to: 0.48, label: "Morning" },
        { from: 0.48, to: 0.64, label: "Noon" },
        { from: 0.64, to: 0.8, label: "Evening" },
        { from: 0.8, to: 1.0, label: "Night" },
    ];

    function describeEndlessPhase(progress) {
        const p = ((progress % 1) + 1) % 1;
        for (const phase of ENDLESS_PHASES) {
            if (p >= phase.from && p < phase.to) return phase.label;
        }
        return "Night";
    }

    function describeTimedPhase(progress) {
        if (progress < 0.33) return "Night";
        if (progress < 0.72) return "Dawn";
        return "Morning";
    }

    // UI Functions
    function showResult(text) {
        if (resultEl) resultEl.textContent = text || "";
    }

    function updateTimerHUD() {
        if (mode === MODE.TIMED) {
            const progress = clamp(1 - timeLeft / sessionSeconds, 0, 1);
            timerEl.textContent = `${Math.max(0, timeLeft).toFixed(1)}s · ${describeTimedPhase(progress)}`;
        } else {
            const cycle = (modeElapsed % ENDLESS_CYCLE_SECONDS) / ENDLESS_CYCLE_SECONDS;
            timerEl.textContent = `∞ · ${describeEndlessPhase(cycle)}`;
        }
    }

    // Game Functions
    function resetGame() {
        score = 0;
        timeLeft = sessionSeconds;
        modeElapsed = 0;
        maxCombo = 1.0;
        combo = 1.0;
        comboTimer = 0;
        starTimer = 0;

        waves.length = 0;
        stars.length = 0;
        fx.length = 0;

        player.x = clampPlayerX(W * 0.5);
        player.y = H - 60;
        player.cooldown = 0;

        // Pre-spawn stars
        for (let i = 0; i < 5; i++) spawnStar(true);

        scoreEl.textContent = "0";
        if (comboEl) comboEl.textContent = "x1.0";
        updateTimerHUD();
    }

    function spawnStar(initial = false) {
        const isRare = Math.random() < 0.08;
        const baseHue = rnd(180, 220);
        stars.push({
            x: rnd(30, W - 30),
            y: initial ? rnd(-H * 0.6, -20) : -20,
            r: isRare ? rnd(7, 10) : rnd(4, 7),
            vy: isRare ? rnd(40, 65) : rnd(30, 55),
            hue: baseHue,
            tw: rnd(0.5, 1.0),
            rare: isRare,
            hueOff: rnd(0, Math.PI * 2),
        });
    }

    function shoot() {
        if (player.cooldown > 0) return;
        player.cooldown = player.cooldownMax;

        waves.push({
            x: player.x,
            y: player.y - player.h * 0.5 - 6,
            vy: -500,
            r: 7,
            life: 1,
        });

        // Muzzle particles
        for (let i = 0; i < 5; i++) {
            fx.push({
                x: player.x + rnd(-5, 5),
                y: player.y - player.h * 0.4,
                vx: rnd(-35, 35),
                vy: rnd(-100, -50),
                life: rnd(0.25, 0.5),
                size: rnd(1.5, 2.5),
                hue: rnd(185, 215),
            });
        }

        ping(640, 0.04);
    }

    // Audio
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let actx = null;

    function ensureAudio() {
        if (!actx) {
            actx = new AudioCtx();
        }
    }

    function ping(freq = 600, dur = 0.05) {
        if (!actx) return;
        try {
            const t = actx.currentTime;
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.type = "sine";
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(0.12, t + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            osc.connect(gain).connect(actx.destination);
            osc.start(t);
            osc.stop(t + dur + 0.02);
        } catch (e) {
            // Audio failed silently
        }
    }

    // Input Events
    window.addEventListener("keydown", (e) => {
        keys.add(e.key.toLowerCase());

        if (state === STATE.MAIN && (e.key === " " || e.key === "Enter")) {
            e.preventDefault();
            startGame();
        } else if (state === STATE.OVER && (e.key === " " || e.key === "Enter")) {
            e.preventDefault();
            startGame();
        } else if (state === STATE.PLAY && e.key === " ") {
            e.preventDefault();
            shoot();
        }
    });

    window.addEventListener("keyup", (e) => {
        keys.delete(e.key.toLowerCase());
    });

    // Pointer events
    canvas.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        ensureAudio();

        if (state === STATE.MAIN) {
            startGame();
        } else if (state === STATE.PLAY) {
            shoot();
        } else if (state === STATE.OVER) {
            startGame();
        }
    });

    canvas.addEventListener("pointermove", (e) => {
        if (state === STATE.PLAY && e.clientY > H * 0.5) {
            player.x = clampPlayerX(e.clientX);
        }
    });

    // Prevent default touch behaviors
    document.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });

    // Mode toggle
    if (challengeCheckbox) {
        challengeCheckbox.addEventListener("change", () => {
            mode = challengeCheckbox.checked ? MODE.ENDLESS : MODE.TIMED;
        });
    }

    // Game state transitions
    function startGame() {
        ensureAudio();
        mode = challengeCheckbox && challengeCheckbox.checked ? MODE.ENDLESS : MODE.TIMED;
        state = STATE.PLAY;
        resetGame();

        mainUI.classList.remove("visible");
        hudEl.classList.add("visible");
        overlay.classList.remove("show");
        showResult("");

        // First shot
        setTimeout(() => shoot(), 80);
    }

    function endGame(reason = "time") {
        if (state !== STATE.PLAY) return;
        state = STATE.OVER;

        const reasonText = reason === "miss" ? "Star missed!" : "Time's up!";
        const summary = `${reasonText}\nScore: ${score} | Max Combo: x${maxCombo.toFixed(1)}`;

        showResult(summary);
        overlay.classList.add("show");
        hudEl.classList.remove("visible");
    }

    // Opening Animation
    function updateOpening(dt) {
        opening.timer += dt;

        if (opening.phase === 0) {
            // Sleeping - cat at bottom, eyes closed
            if (opening.timer >= opening.sleepDuration) {
                opening.phase = 1;
                opening.timer = 0;
            }
        } else if (opening.phase === 1) {
            // Waking up - eyes open
            opening.eyeOpen = clamp(opening.timer / opening.wakeDuration, 0, 1);
            if (opening.timer >= opening.wakeDuration) {
                opening.phase = 2;
                opening.timer = 0;
                opening.eyeOpen = 1;
            }
        } else if (opening.phase === 2) {
            // Climbing up
            const progress = clamp(opening.timer / opening.climbDuration, 0, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            player.y = lerp(opening.startY, opening.targetY, eased);

            if (opening.timer >= opening.climbDuration) {
                opening.phase = 3;
                opening.timer = 0;
            }
        } else if (opening.phase === 3) {
            // Transition to main screen
            if (opening.timer >= opening.fadeDuration) {
                state = STATE.MAIN;
                mainUI.classList.add("visible");
                // Spawn stars for main screen ambiance
                for (let i = 0; i < 10; i++) spawnStar(true);
            }
        }
    }

    // Main Update Loop
    function update(dt) {
        modeElapsed += dt;

        // Timer
        if (mode === MODE.TIMED) {
            timeLeft -= dt;
            if (timeLeft <= 0) {
                timeLeft = 0;
                updateTimerHUD();
                endGame("time");
                return;
            }
        }

        updateTimerHUD();

        // Player movement
        const left = keys.has("arrowleft") || keys.has("a");
        const right = keys.has("arrowright") || keys.has("d");
        if (left) player.x -= player.speed * dt;
        if (right) player.x += player.speed * dt;
        player.x = clampPlayerX(player.x);

        // Continuous shooting with space
        if (keys.has(" ")) shoot();

        // Cooldown
        player.cooldown = Math.max(0, player.cooldown - dt);

        // Star spawning
        starTimer -= dt;
        if (starTimer <= 0) {
            spawnStar(false);
            const interval = mode === MODE.TIMED
                ? clamp(1.3 - (sessionSeconds - timeLeft) * 0.004, 0.7, 1.3)
                : clamp(1.2 - modeElapsed * 0.0015, 0.8, 1.2);
            starTimer = interval;
        }

        // Update stars
        for (let i = stars.length - 1; i >= 0; i--) {
            const s = stars[i];
            s.y += s.vy * dt;
            s.x += Math.sin((performance.now() * 0.001 + i) * s.tw) * 12 * dt;
            if (s.rare) s.hueOff += dt * 2;

            // Star fell off screen
            if (s.y > H + 30) {
                if (mode === MODE.ENDLESS) {
                    endGame("miss");
                    return;
                }
                stars.splice(i, 1);
            }
        }

        // Update waves
        for (let i = waves.length - 1; i >= 0; i--) {
            const w = waves[i];
            w.y += w.vy * dt;
            w.life -= dt * 0.3;
            if (w.y < -20 || w.life <= 0) waves.splice(i, 1);
        }

        // Collision detection
        for (let i = stars.length - 1; i >= 0; i--) {
            const s = stars[i];
            for (let j = waves.length - 1; j >= 0; j--) {
                const w = waves[j];
                const dx = s.x - w.x;
                const dy = s.y - w.y;
                const dist = (s.r + w.r) * 1.2;

                if (dx * dx + dy * dy <= dist * dist) {
                    stars.splice(i, 1);
                    waves.splice(j, 1);

                    // Score calculation
                    const base = Math.floor(10 + s.r * 2);
                    const rareBonus = s.rare ? 30 : 0;

                    comboTimer = COMBO_WINDOW;
                    combo = Math.min(COMBO_MAX, combo + 0.25);
                    maxCombo = Math.max(maxCombo, combo);

                    const gained = Math.floor((base + rareBonus) * combo);
                    score += gained;
                    scoreEl.textContent = score;

                    // Combo display
                    if (comboEl) {
                        comboEl.textContent = "x" + combo.toFixed(1);
                        comboEl.classList.add("combo-pop");
                        setTimeout(() => comboEl.classList.remove("combo-pop"), 100);
                    }

                    // Burst particles
                    const burstCount = s.rare ? 24 : 14;
                    for (let k = 0; k < burstCount; k++) {
                        const angle = (k / burstCount) * Math.PI * 2;
                        fx.push({
                            x: s.x,
                            y: s.y,
                            vx: Math.cos(angle) * rnd(50, 130),
                            vy: Math.sin(angle) * rnd(50, 130),
                            life: rnd(0.3, 0.8),
                            size: rnd(1.5, s.rare ? 3 : 2.5),
                            hue: (s.hue + (s.rare ? k * 15 : rnd(-15, 15))) % 360,
                        });
                    }

                    ping(s.rare ? rnd(800, 950) : rnd(700, 850), 0.05);
                    break;
                }
            }
        }

        // Combo decay
        if (comboTimer > 0) {
            comboTimer -= dt;
        } else if (combo > 1.0) {
            combo = Math.max(1.0, combo - dt * 0.6);
            if (comboEl) comboEl.textContent = "x" + combo.toFixed(1);
        }

        // Update particles
        for (let i = fx.length - 1; i >= 0; i--) {
            const p = fx[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.97;
            p.vy *= 0.97;
            p.life -= dt;
            if (p.life <= 0) fx.splice(i, 1);
        }
    }

    // Render Functions
    function renderBackground(progress) {
        const palette = mode === MODE.TIMED ? TIMED_SKY : ENDLESS_SKY;
        const sky = sampleGradient(progress, palette);

        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, sky.top);
        g.addColorStop(1, sky.bottom);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        // Draw some background stars for ambiance
        if (progress < 0.6 || mode === MODE.ENDLESS) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
            for (let i = 0; i < 30; i++) {
                const bx = (i * 137.5) % W;
                const by = (i * 89.3) % (H * 0.7);
                const br = 0.5 + (i % 3) * 0.3;
                ctx.beginPath();
                ctx.arc(bx, by, br, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function renderStars() {
        for (const s of stars) {
            const hue = s.rare ? (s.hue + Math.sin(s.hueOff) * 180) % 360 : s.hue;

            // Glow layers
            for (let k = 3; k >= 0; k--) {
                const alpha = 0.06 + k * 0.05;
                ctx.fillStyle = `hsla(${hue}, 80%, ${55 - k * 10}%, ${alpha})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r + k * 3.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Core
            ctx.fillStyle = s.rare ? `hsl(${(hue + 30) % 360}, 95%, 88%)` : `hsl(${hue}, 90%, 85%)`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function renderWaves() {
        for (const w of waves) {
            const grd = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, 18);
            grd.addColorStop(0, `rgba(200, 240, 255, ${w.life * 0.9})`);
            grd.addColorStop(1, "rgba(120, 200, 255, 0)");
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(w.x, w.y, 18, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = `rgba(180, 220, 255, ${w.life * 0.8})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(w.x, w.y, 7, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    function renderPlayer() {
        ctx.save();
        ctx.translate(player.x, player.y);

        const eyeOpenness = state === STATE.OPENING ? opening.eyeOpen : 1;
        const tailWave = Math.sin(performance.now() * 0.002) * 0.25;

        // Colors
        const bodyColor = "#fbe4ba";
        const bodyShade = "#f6d0a0";
        const earColor = "#f4c796";
        const innerEar = "rgba(255, 186, 200, 0.85)";
        const eyeColor = "#3b2a30";
        const noseColor = "#d98c8c";

        const bodyRadiusX = player.w * 0.42;
        const bodyRadiusY = player.h * 0.35;
        const headRadiusX = player.w * 0.32;
        const headRadiusY = player.h * 0.32;

        // Shadow
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = "#06121f";
        ctx.beginPath();
        ctx.ellipse(0, player.h * 0.5, player.w * 0.5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Tail
        ctx.save();
        ctx.rotate(tailWave * 0.15);
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(-player.w * 0.44, 5, player.w * 0.16, player.h * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Body
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, 6, bodyRadiusX, bodyRadiusY, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = bodyShade;
        ctx.beginPath();
        ctx.ellipse(player.w * 0.06, 9, bodyRadiusX * 0.65, bodyRadiusY * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, -8, headRadiusX, headRadiusY, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.fillStyle = earColor;
        // Left ear
        ctx.beginPath();
        ctx.moveTo(-headRadiusX * 0.75, -headRadiusY * 1.25);
        ctx.lineTo(-headRadiusX * 1.25, -headRadiusY * 0.2);
        ctx.lineTo(-headRadiusX * 0.25, -headRadiusY * 0.55);
        ctx.closePath();
        ctx.fill();
        // Right ear
        ctx.beginPath();
        ctx.moveTo(headRadiusX * 0.75, -headRadiusY * 1.25);
        ctx.lineTo(headRadiusX * 1.25, -headRadiusY * 0.2);
        ctx.lineTo(headRadiusX * 0.25, -headRadiusY * 0.55);
        ctx.closePath();
        ctx.fill();

        // Inner ears
        ctx.fillStyle = innerEar;
        ctx.beginPath();
        ctx.moveTo(-headRadiusX * 0.85, -headRadiusY);
        ctx.lineTo(-headRadiusX * 0.75, -headRadiusY * 0.35);
        ctx.lineTo(-headRadiusX * 0.35, -headRadiusY * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(headRadiusX * 0.85, -headRadiusY);
        ctx.lineTo(headRadiusX * 0.75, -headRadiusY * 0.35);
        ctx.lineTo(headRadiusX * 0.35, -headRadiusY * 0.6);
        ctx.closePath();
        ctx.fill();

        // Eyes
        if (eyeOpenness > 0) {
            ctx.fillStyle = eyeColor;
            ctx.beginPath();
            ctx.ellipse(-headRadiusX * 0.4, -8, headRadiusX * 0.17, headRadiusY * 0.3 * eyeOpenness, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(headRadiusX * 0.4, -8, headRadiusX * 0.17, headRadiusY * 0.3 * eyeOpenness, 0, 0, Math.PI * 2);
            ctx.fill();

            // Eye highlights
            if (eyeOpenness > 0.5) {
                ctx.fillStyle = "rgba(255,255,255,0.6)";
                ctx.beginPath();
                ctx.arc(-headRadiusX * 0.45, -10, 1.5, 0, Math.PI * 2);
                ctx.arc(headRadiusX * 0.35, -10, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Nose
        ctx.fillStyle = noseColor;
        ctx.beginPath();
        ctx.moveTo(0, -3);
        ctx.lineTo(-headRadiusX * 0.12, -5.5);
        ctx.lineTo(headRadiusX * 0.12, -5.5);
        ctx.closePath();
        ctx.fill();

        // Mouth
        ctx.strokeStyle = noseColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -3);
        ctx.lineTo(0, -1);
        ctx.moveTo(0, -1);
        ctx.quadraticCurveTo(-headRadiusX * 0.2, 1, -headRadiusX * 0.4, 0.5);
        ctx.moveTo(0, -1);
        ctx.quadraticCurveTo(headRadiusX * 0.2, 1, headRadiusX * 0.4, 0.5);
        ctx.stroke();

        // Whiskers
        ctx.strokeStyle = "rgba(120, 98, 90, 0.8)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        const wy = -2;
        const wo = headRadiusX * 0.25;
        ctx.moveTo(-wo, wy);
        ctx.lineTo(-wo - headRadiusX * 0.55, wy - 1);
        ctx.moveTo(-wo, wy + 2);
        ctx.lineTo(-wo - headRadiusX * 0.55, wy + 3.5);
        ctx.moveTo(wo, wy);
        ctx.lineTo(wo + headRadiusX * 0.55, wy - 1);
        ctx.moveTo(wo, wy + 2);
        ctx.lineTo(wo + headRadiusX * 0.55, wy + 3.5);
        ctx.stroke();

        ctx.restore();
    }

    function renderParticles() {
        for (const p of fx) {
            ctx.fillStyle = `hsla(${p.hue}, 85%, 70%, ${clamp(p.life, 0, 1)})`;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
    }

    function render(progress) {
        renderBackground(progress);
        renderStars();
        renderWaves();
        renderPlayer();
        renderParticles();
    }

    // Main Loop
    let last = performance.now();

    function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;

        // Calculate sky progress based on state
        let skyProgress = 0;
        if (state === STATE.PLAY) {
            if (mode === MODE.TIMED) {
                skyProgress = clamp(modeElapsed / sessionSeconds, 0, 1);
            } else {
                skyProgress = (modeElapsed % ENDLESS_CYCLE_SECONDS) / ENDLESS_CYCLE_SECONDS;
            }
        } else if (state === STATE.OVER) {
            if (mode === MODE.TIMED) {
                skyProgress = 1;
            } else {
                skyProgress = (modeElapsed % ENDLESS_CYCLE_SECONDS) / ENDLESS_CYCLE_SECONDS;
            }
        }

        // State updates
        if (state === STATE.OPENING) {
            updateOpening(dt);
        } else if (state === STATE.PLAY) {
            update(dt);
        } else if (state === STATE.MAIN) {
            // Ambient star movement on main screen
            for (let i = stars.length - 1; i >= 0; i--) {
                const s = stars[i];
                s.y += s.vy * dt * 0.5;
                s.x += Math.sin((now * 0.001 + i) * s.tw) * 8 * dt;
                if (s.y > H + 30) {
                    stars.splice(i, 1);
                    spawnStar(false);
                }
            }
        }

        // Render
        render(skyProgress);

        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
})();
