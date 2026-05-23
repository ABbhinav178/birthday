/* ─────────────────────────────────────────────────────────────
   Birthday Website – script.js
   Features:
     1. Confetti burst on load
     2. Floating sparkles cursor trail
     3. Parallax on mouse move (card tilt)
     4. Music toggle (Web Audio beep melody)
     5. Continuous slow confetti drift
   ───────────────────────────────────────────────────────────── */

(() => {
  'use strict';

  /* ── Confetti ─────────────────────────────────────────────── */
  const canvas = document.getElementById('confetti-canvas');
  const ctx    = canvas.getContext('2d');

  const COLORS = [
    '#f472b6','#c084fc','#a855f7','#e879f9',
    '#fbcfe8','#e9d5ff','#fcd34d','#6ee7b7',
    '#93c5fd','#fca5a5','#d946ef','#38bdf8'
  ];

  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor(burst) {
      this.reset(burst);
    }
    reset(burst) {
      this.x     = burst ? Math.random() * W : Math.random() * W;
      this.y     = burst ? (Math.random() * H * .5) : -10;
      this.r     = Math.random() * 6 + 3;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.vx    = (Math.random() - .5) * (burst ? 5 : 1.2);
      this.vy    = burst ? (Math.random() * -8 - 2) : (Math.random() * 1.5 + 1);
      this.alpha = 1;
      this.decay = Math.random() * .008 + (burst ? .012 : .003);
      this.angle = Math.random() * Math.PI * 2;
      this.spin  = (Math.random() - .5) * .15;
      this.shape = Math.random() < .4 ? 'circle' : 'rect';
      this.gravity = burst ? .15 : .04;
    }
    update() {
      this.vy   += this.gravity;
      this.x    += this.vx;
      this.y    += this.vy;
      this.alpha -= this.decay;
      this.angle += this.spin;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.fillStyle   = this.color;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      if (this.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, this.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-this.r, -this.r * .5, this.r * 2, this.r);
      }
      ctx.restore();
    }
  }

  /* Initial burst */
  function burst() {
    for (let i = 0; i < 180; i++) particles.push(new Particle(true));
  }

  /* Continuous drift – add a few every couple of seconds */
  let driftInterval = setInterval(() => {
    for (let i = 0; i < 6; i++) particles.push(new Particle(false));
  }, 1800);

  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles = particles.filter(p => {
      p.update();
      p.draw();
      if (p.shape === 'rect' && (p.y > H + 20 || p.alpha <= 0)) return false;
      if (p.shape === 'circle' && p.alpha <= 0) return false;
      return true;
    });
    requestAnimationFrame(animate);
  }

  burst();
  animate();

  /* ── Cursor Sparkle Trail ─────────────────────────────────── */
  const SPARKLE_CHARS = ['✦','✧','✨','⭐','💫','🌟'];
  let lastSparkle = 0;

  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastSparkle < 80) return;
    lastSparkle = now;

    const el = document.createElement('span');
    el.textContent = SPARKLE_CHARS[Math.floor(Math.random() * SPARKLE_CHARS.length)];
    el.style.cssText = `
      position: fixed;
      left: ${e.clientX}px;
      top: ${e.clientY}px;
      font-size: ${Math.random() * 12 + 10}px;
      pointer-events: none;
      z-index: 9999;
      user-select: none;
      transform: translate(-50%, -50%);
      animation: sparkleTrail .8s forwards;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
  });

  /* Keyframes for trail sparkles – injected once */
  const trailStyle = document.createElement('style');
  trailStyle.textContent = `
    @keyframes sparkleTrail {
      0%   { opacity: 1; transform: translate(-50%,-50%) scale(1) rotate(0deg); }
      100% { opacity: 0; transform: translate(-50%,-100%) scale(.3) rotate(180deg); }
    }
  `;
  document.head.appendChild(trailStyle);

  /* ── Parallax / Card Tilt ─────────────────────────────────── */
  const card = document.getElementById('mainCard');
  let tiltActive = window.innerWidth > 700;

  window.addEventListener('resize', () => {
    tiltActive = window.innerWidth > 700;
    if (!tiltActive) {
      card.style.transform = '';
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (!tiltActive) return;
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    const rx = ((e.clientY - cy) / cy) * -4;
    const ry = ((e.clientX - cx) / cx) *  4;
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });

  document.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(900px) rotateX(0) rotateY(0)';
  });

  /* ── Music Toggle (Web Audio synth melody) ────────────────── */
  const musicBtn = document.getElementById('musicBtn');
  let audioCtx   = null;
  let playing    = false;
  let melodyTimeout = null;

  // Simple happy-birthday-ish note sequence (frequencies)
  const MELODY = [
    261.6,261.6,293.7,261.6,349.2,329.6,
    261.6,261.6,293.7,261.6,392.0,349.2,
    261.6,261.6,523.3,440.0,349.2,329.6,293.7,
    466.2,466.2,440.0,349.2,392.0,349.2
  ];
  const DURS = [
    .25,.25,.5,.5,.5,1,
    .25,.25,.5,.5,.5,1,
    .25,.25,.5,.5,.5,.5,.5,
    .25,.25,.5,.5,.5,1
  ];

  function playNote(freq, duration, startTime) {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(.18, startTime + .03);
    gain.gain.setValueAtTime(.18, startTime + duration - .05);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  function playMelody() {
    if (!playing || !audioCtx) return;
    let t = audioCtx.currentTime + .05;
    MELODY.forEach((freq, i) => {
      playNote(freq, DURS[i] * .88, t);
      t += DURS[i];
    });
    const total = DURS.reduce((a, b) => a + b, 0);
    melodyTimeout = setTimeout(playMelody, total * 1000 + 200);
  }

  musicBtn.addEventListener('click', () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    playing = !playing;
    if (playing) {
      musicBtn.classList.add('playing');
      musicBtn.title = 'Pause music';
      playMelody();
    } else {
      musicBtn.classList.remove('playing');
      musicBtn.title = 'Play music';
      clearTimeout(melodyTimeout);
    }
  });

})();
