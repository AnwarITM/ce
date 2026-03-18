(() => {
  const EFFECTS_ENABLED = true;

  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  const year = now.getFullYear();
  const today = new Date(year, month, day);
  const isSnow = month === 11 && day <= 30;
  const isFireworks = (month === 11 && day >= 31) || (month === 0 && day <= 2);
  const isRamadan = isWithinRange(1, 18, 2, 17);
  const isEid = isWithinRange(2, 18, 2, 26);

  function isWithinRange(startMonth, startDay, endMonth, endDay) {
    const start = new Date(year, startMonth, startDay);
    const end = new Date(year, endMonth, endDay);
    return today >= start && today <= end;
  }

  const mode = selectMode();

  if (!EFFECTS_ENABLED || !mode) {
    return;
  }

  function selectMode() {
    if (isRamadan) return 'ramadan';
    if (isEid) return 'eid';
    if (isFireworks) return 'fireworks';
    if (isSnow) return 'snow';
    return null;
  }

  const titleTag = {
    snow: 'SNOW',
    fireworks: 'NY',
    ramadan: 'RAM',
    eid: 'EID'
  };
  const icon = titleTag[mode] || 'SEASON';

  const state = {
    mode,
    paused: false,
    animationId: null,
    layers: [],
    canvas: null,
    ctx: null,
    w: 0,
    h: 0
  };

  function setVar(name, value) {
    document.documentElement.style.setProperty(name, value);
  }

  function applySeasonalTheme() {
    if (mode === 'snow') {
      setVar('--primary-color', '#5bbce8');
      setVar('--primary-hover', '#379ad8');
      setVar('--gradient-primary', 'linear-gradient(135deg, #b7f3ff 0%, #6bb8ff 100%)');
      setVar('--accent-color', '#e0f2fe');
    } else if (mode === 'fireworks') {
      setVar('--primary-color', '#f59e0b');
      setVar('--primary-hover', '#d97706');
      setVar('--gradient-primary', 'linear-gradient(135deg, #fde047 0%, #f59e0b 100%)');
      setVar('--accent-color', '#f97316');
    } else if (mode === 'ramadan') {
      setVar('--primary-color', '#1f7a6b');
      setVar('--primary-hover', '#115e4f');
      setVar('--gradient-primary', 'linear-gradient(135deg, #0f4c5c 0%, #1f7a6b 100%)');
      setVar('--accent-color', '#f3c969');
    } else if (mode === 'eid') {
      setVar('--primary-color', '#2f855a');
      setVar('--primary-hover', '#276749');
      setVar('--gradient-primary', 'linear-gradient(135deg, #34d399 0%, #2f855a 100%)');
      setVar('--accent-color', '#fef3c7');
    }
  }

  function applySeasonalTitles() {
    const baseTitle = document.title.replace(/^(SNOW|NY|RAM|EID|SEASON)\s+/, '');
    document.title = `${icon} ${baseTitle}`;

    document.querySelectorAll('[data-seasonal-title]').forEach((el) => {
      if (el.querySelector('.seasonal-title-icon')) return;
      const span = document.createElement('span');
      span.className = 'seasonal-title-icon';
      span.textContent = icon;
      el.appendChild(span);
    });
  }

  function applyFooterTip() {
    const tip = document.createElement('div');
    tip.className = 'seasonal-footer-tip';
    if (mode === 'fireworks') {
      tip.textContent = 'Happy New Year';
    } else if (mode === 'ramadan') {
      tip.textContent = 'Ramadan Kareem';
    } else if (mode === 'eid') {
      tip.textContent = 'Selamat Idul Fitri';
    } else {
      return;
    }
    document.body.appendChild(tip);
  }

  function handleVisibility() {
    state.paused = document.hidden;
  }

  function ensureContentLayer() {
    const body = document.body;
    let wrapper = body.querySelector('.seasonal-content-layer');
    if (wrapper) return wrapper;

    wrapper = document.createElement('div');
    wrapper.className = 'seasonal-content-layer';

    while (body.firstChild) {
      wrapper.appendChild(body.firstChild);
    }

    body.appendChild(wrapper);
    return wrapper;
  }

  function setupFullCanvas() {
    const contentLayer = ensureContentLayer();
    const canvas = document.createElement('canvas');
    canvas.className = 'seasonal-effects-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(canvas, contentLayer);
    state.canvas = canvas;
    state.ctx = canvas.getContext('2d');
    resizeFullCanvas();
    window.addEventListener('resize', resizeFullCanvas);
  }

  function resizeFullCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.w = window.innerWidth;
    state.h = window.innerHeight;
    state.canvas.width = Math.floor(state.w * dpr);
    state.canvas.height = Math.floor(state.h * dpr);
    state.canvas.style.width = `${state.w}px`;
    state.canvas.style.height = `${state.h}px`;
    state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeFlake(layer) {
    return {
      x: Math.random() * layer.w,
      y: Math.random() * layer.h,
      r: 1 + Math.random() * 2.5,
      speed: 0.6 + Math.random() * 1.6,
      drift: -0.4 + Math.random() * 0.8,
      opacity: 0.5 + Math.random() * 0.5
    };
  }

  function desiredFlakeCount() {
    const base = Math.floor((state.w * state.h) / 15000);
    return Math.max(20, Math.min(80, base));
  }

  function syncFlakes() {
    const count = desiredFlakeCount();
    const layer = state.fullSnowLayer;
    if (!layer) return;

    if (layer.flakes.length > count) {
      layer.flakes.length = count;
    } else {
      while (layer.flakes.length < count) {
        layer.flakes.push(makeFlake(layer));
      }
    }
  }

  function createSnowLayer(target) {
    const canvas = document.createElement('canvas');
    canvas.className = 'seasonal-snow-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    target.appendChild(canvas);

    const layer = {
      target,
      canvas,
      ctx: canvas.getContext('2d'),
      flakes: [],
      w: 0,
      h: 0
    };

    layer.resize = () => {
      const w = target.clientWidth;
      const h = target.clientHeight;
      if (!w || !h) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      layer.w = w;
      layer.h = h;
      layer.canvas.width = Math.floor(w * dpr);
      layer.canvas.height = Math.floor(h * dpr);
      layer.canvas.style.width = `${w}px`;
      layer.canvas.style.height = `${h}px`;
      layer.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      syncFlakes(layer);
    };

    layer.resize();

    if (window.ResizeObserver) {
      layer.ro = new ResizeObserver(() => layer.resize());
      layer.ro.observe(target);
    }

    return layer;
  }

  function startSnow() {
    setupFullCanvas();
    state.fullSnowLayer = {
      w: state.w,
      h: state.h,
      flakes: [],
      ctx: state.ctx
    };

    syncFlakes();

    const animateSnow = () => {
      if (state.paused) {
        state.animationId = requestAnimationFrame(animateSnow);
        return;
      }

      const layer = state.fullSnowLayer;
      const ctx = state.ctx;

      layer.w = state.w;
      layer.h = state.h;
      syncFlakes();

      ctx.clearRect(0, 0, layer.w, layer.h);
      ctx.fillStyle = '#ffffff';

      for (const f of layer.flakes) {
        f.x += f.drift;
        f.y += f.speed;

        if (f.y > layer.h + 5) {
          f.y = -5;
          f.x = Math.random() * layer.w;
        }
        if (f.x > layer.w + 5) f.x = -5;
        if (f.x < -5) f.x = layer.w + 5;

        ctx.globalAlpha = f.opacity;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      state.animationId = requestAnimationFrame(animateSnow);
    };

    animateSnow();
  }

  function startFireworks() {
    setupFullCanvas();
    const particles = [];
    const colors = ['#ff4d4d', '#ffb84d', '#ffe34d', '#7cff4d', '#4dd2ff', '#b84dff'];
    const gravity = 0.04;
    let lastBurst = 0;
    let burstInterval = 700;

    function spawnBurst() {
      const x = state.w * (0.15 + Math.random() * 0.7);
      const y = state.h * (0.15 + Math.random() * 0.45);
      const count = 40 + Math.floor(Math.random() * 50);
      const color = colors[Math.floor(Math.random() * colors.length)];

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3.5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          ttl: 50 + Math.random() * 40,
          size: 1 + Math.random() * 2,
          color
        });
      }
    }

    function animate(ts) {
      if (state.paused) {
        state.animationId = requestAnimationFrame(animate);
        return;
      }

      if (!lastBurst) lastBurst = ts;
      if (ts - lastBurst > burstInterval) {
        spawnBurst();
        lastBurst = ts;
        burstInterval = 600 + Math.random() * 400;
      }

      const ctx = state.ctx;
      ctx.clearRect(0, 0, state.w, state.h);
      ctx.globalCompositeOperation = 'lighter';

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;
        const alpha = 1 - p.life / p.ttl;

        if (alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      state.animationId = requestAnimationFrame(animate);
    }

    animate(0);
  }

  function startRamadan() {
    setupFullCanvas();
    const stars = [];
    const crescents = [];
    const baseCount = Math.max(35, Math.floor((state.w * state.h) / 22000));
    const crescentCount = Math.max(6, Math.floor((state.w * state.h) / 120000));
    const crescentImg = new Image();
    crescentImg.decoding = 'async';
    crescentImg.src = 'bulan bintang.svg';

    function makeStar() {
      return {
        x: Math.random() * state.w,
        y: Math.random() * state.h,
        r: 0.8 + Math.random() * 1.6,
        twinkle: 0.4 + Math.random() * 0.8,
        speed: 0.03 + Math.random() * 0.12,
        drift: -0.12 + Math.random() * 0.24,
        phase: Math.random() * Math.PI * 2
      };
    }

    function makeCrescent() {
      return {
        x: Math.random() * state.w,
        y: Math.random() * state.h,
        r: 12 + Math.random() * 18,
        thickness: 6 + Math.random() * 6,
        speed: 0.02 + Math.random() * 0.08,
        drift: -0.08 + Math.random() * 0.16,
        angle: Math.random() * Math.PI * 2
      };
    }

    for (let i = 0; i < baseCount; i++) {
      stars.push(makeStar());
    }
    for (let i = 0; i < crescentCount; i++) {
      crescents.push(makeCrescent());
    }

    const glow = 'rgba(243, 201, 105, 0.9)';

    function drawCrescent(ctx, c) {
      if (!crescentImg.complete) return;
      const size = c.r * 2.2;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.angle);
      ctx.globalAlpha = 0.9;
      ctx.drawImage(crescentImg, -size / 2, -size / 2, size, size);
      ctx.restore();
    }

    function animate() {
      if (state.paused) {
        state.animationId = requestAnimationFrame(animate);
        return;
      }

      const ctx = state.ctx;
      ctx.clearRect(0, 0, state.w, state.h);

      for (const c of crescents) {
        c.y -= c.speed;
        c.x += c.drift * 0.2;
        c.angle += 0.002;
        if (c.y < -30) c.y = state.h + 30;
        if (c.x > state.w + 30) c.x = -30;
        if (c.x < -30) c.x = state.w + 30;
        drawCrescent(ctx, c);
      }

      for (const s of stars) {
        s.phase += s.twinkle * 0.03;
        s.y -= s.speed;
        s.x += s.drift * 0.2;
        if (s.y < -5) s.y = state.h + 5;
        if (s.x > state.w + 5) s.x = -5;
        if (s.x < -5) s.x = state.w + 5;

        const alpha = 0.3 + Math.abs(Math.sin(s.phase)) * 0.6;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      state.animationId = requestAnimationFrame(animate);
    }

    animate();
  }

  function startEid() {
    setupFullCanvas();
    const ketupat = [];
    const stars = [];
    const crescents = [];
    const ketupatCount = Math.max(40, Math.floor((state.w * state.h) / 25000));
    const starCount = Math.max(30, Math.floor((state.w * state.h) / 26000));
    const crescentCount = Math.max(5, Math.floor((state.w * state.h) / 140000));

    const ketupatImg = new Image();
    ketupatImg.decoding = 'async';
    ketupatImg.src = 'ketupat.png';
    const crescentImg = new Image();
    crescentImg.decoding = 'async';
    crescentImg.src = 'bulan bintang.svg';

    function makeKetupat() {
      return {
        x: Math.random() * state.w,
        y: -20 - Math.random() * state.h,
        size: 10 + Math.random() * 16,
        speed: 0.4 + Math.random() * 1.1,
        drift: -0.6 + Math.random() * 1.2,
        rotation: Math.random() * Math.PI,
        spin: -0.02 + Math.random() * 0.04
      };
    }

    function makeStar() {
      return {
        x: Math.random() * state.w,
        y: Math.random() * state.h,
        r: 0.7 + Math.random() * 1.4,
        twinkle: 0.4 + Math.random() * 0.8,
        speed: 0.02 + Math.random() * 0.1,
        drift: -0.1 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2
      };
    }

    function makeCrescent() {
      return {
        x: Math.random() * state.w,
        y: Math.random() * state.h,
        r: 10 + Math.random() * 16,
        thickness: 5 + Math.random() * 5,
        speed: 0.02 + Math.random() * 0.07,
        drift: -0.06 + Math.random() * 0.12,
        angle: Math.random() * Math.PI * 2
      };
    }

    for (let i = 0; i < ketupatCount; i++) {
      ketupat.push(makeKetupat());
    }
    for (let i = 0; i < starCount; i++) {
      stars.push(makeStar());
    }
    for (let i = 0; i < crescentCount; i++) {
      crescents.push(makeCrescent());
    }

    const starGlow = 'rgba(255, 244, 214, 0.9)';
    function drawCrescent(ctx, c) {
      if (!crescentImg.complete) return;
      const size = c.r * 2.2;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.angle);
      ctx.globalAlpha = 0.9;
      ctx.drawImage(crescentImg, -size / 2, -size / 2, size, size);
      ctx.restore();
    }

    function drawKetupat(ctx, p) {
      const size = p.size * 2.6;
      if (!ketupatImg.complete) return;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = 0.95;
      ctx.drawImage(ketupatImg, -size, -size, size * 2, size * 2.2);
      ctx.restore();
    }

    function animate() {
      if (state.paused) {
        state.animationId = requestAnimationFrame(animate);
        return;
      }

      const ctx = state.ctx;
      ctx.clearRect(0, 0, state.w, state.h);

      for (const c of crescents) {
        c.y -= c.speed;
        c.x += c.drift * 0.2;
        c.angle += 0.002;
        if (c.y < -30) c.y = state.h + 30;
        if (c.x > state.w + 30) c.x = -30;
        if (c.x < -30) c.x = state.w + 30;
        drawCrescent(ctx, c);
      }

      for (const s of stars) {
        s.phase += s.twinkle * 0.03;
        s.y -= s.speed;
        s.x += s.drift * 0.2;
        if (s.y < -5) s.y = state.h + 5;
        if (s.x > state.w + 5) s.x = -5;
        if (s.x < -5) s.x = state.w + 5;

        const alpha = 0.25 + Math.abs(Math.sin(s.phase)) * 0.6;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = starGlow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const p of ketupat) {
        p.y += p.speed;
        p.x += p.drift * 0.2;
        p.rotation += p.spin;

        if (p.y > state.h + 20) {
          p.y = -20;
          p.x = Math.random() * state.w;
        }
        if (p.x > state.w + 20) p.x = -20;
        if (p.x < -20) p.x = state.w + 20;

        drawKetupat(ctx, p);
      }

      ctx.globalAlpha = 1;
      state.animationId = requestAnimationFrame(animate);
    }

    animate();
  }

  function init() {
    applySeasonalTheme();
    applySeasonalTitles();
    applyFooterTip();
    document.addEventListener('visibilitychange', handleVisibility);

    if (state.mode === 'fireworks') {
      startFireworks();
    } else if (state.mode === 'ramadan') {
      startRamadan();
    } else if (state.mode === 'eid') {
      startEid();
    } else {
      startSnow();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
