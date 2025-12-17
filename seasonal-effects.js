(() => {
  const EFFECTS_ENABLED = true;

  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  const isSnow = month === 11 && day <= 30;
  const isFireworks = (month === 11 && day >= 31) || (month === 0 && day <= 2);

  if (!EFFECTS_ENABLED || (!isSnow && !isFireworks)) {
    return;
  }

  const mode = isFireworks ? 'fireworks' : 'snow';
  const icon = mode === 'fireworks' ? '🎆' : '❄';

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
    } else {
      setVar('--primary-color', '#f59e0b');
      setVar('--primary-hover', '#d97706');
      setVar('--gradient-primary', 'linear-gradient(135deg, #fde047 0%, #f59e0b 100%)');
      setVar('--accent-color', '#f97316');
    }
  }

  function applySeasonalTitles() {
    const baseTitle = document.title.replace(/^[❄🎆]\s+/, '');
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
    if (mode !== 'fireworks') return;
    const tip = document.createElement('div');
    tip.className = 'seasonal-footer-tip';
    tip.textContent = 'Happy New Year';
    document.body.appendChild(tip);
  }

  function handleVisibility() {
    state.paused = document.hidden;
  }

  function setupFullCanvas() {
    const canvas = document.createElement('canvas');
    canvas.className = 'seasonal-effects-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
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

  function desiredFlakeCount(layer) {
    const base = Math.floor((layer.w * layer.h) / 7000);
    return Math.max(30, Math.min(160, base));
  }

  function syncFlakes(layer) {
    const count = desiredFlakeCount(layer);
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

  function setupSnowLayers() {
    const targets = Array.from(document.querySelectorAll('.seasonal-snow-target'));
    state.layers = targets.map(createSnowLayer).filter(Boolean);
    window.addEventListener('resize', () => {
      state.layers.forEach((layer) => layer.resize());
    });
  }

  function animateSnow() {
    if (state.paused) {
      state.animationId = requestAnimationFrame(animateSnow);
      return;
    }

    for (const layer of state.layers) {
      if (!layer.w || !layer.h) continue;
      const ctx = layer.ctx;
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
    }

    state.animationId = requestAnimationFrame(animateSnow);
  }

  function startSnow() {
    setupSnowLayers();
    if (state.layers.length === 0) return;
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

  function init() {
    applySeasonalTheme();
    applySeasonalTitles();
    applyFooterTip();
    document.addEventListener('visibilitychange', handleVisibility);

    if (state.mode === 'fireworks') {
      startFireworks();
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
