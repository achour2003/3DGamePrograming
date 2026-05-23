/* ============================================================
   OVERRIDE: Campus Zero — Moteur audio 100% synthétisé (Web Audio)
   Aucun fichier externe : musique + SFX générés à la volée.
   Robuste pour le déploiement (rien à télécharger, marche offline).
   API globale : window.GameAudio
   ============================================================ */
(function () {
  let ctx = null;
  let masterGain, musicGain, sfxGain;
  let musicNodes = [];     // oscillateurs/LFO du lit musical en cours
  let pulseTimer = null;   // battement rythmique du mode combat
  let mode = null;         // 'ambient' | 'combat'
  let unlocked = false;

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain(); masterGain.gain.value = 0.9;  masterGain.connect(ctx.destination);
    musicGain  = ctx.createGain(); musicGain.gain.value  = 0.0;  musicGain.connect(masterGain);
    sfxGain    = ctx.createGain(); sfxGain.gain.value    = 0.55; sfxGain.connect(masterGain);
    return ctx;
  }

  // ── Primitives SFX ─────────────────────────────────────────
  function tone(freq, dur, type, peak, slideTo, delay) {
    if (!ctx) return;
    const t0 = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak || 0.4, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(sfxGain);
    o.start(t0); o.stop(t0 + dur + 0.03);
  }

  function noise(dur, peak, filtFreq, delay) {
    if (!ctx) return;
    const t0 = ctx.currentTime + (delay || 0);
    const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filtFreq || 1400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak || 0.4, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(sfxGain);
    src.start(t0); src.stop(t0 + dur);
  }

  // ── Lits musicaux ──────────────────────────────────────────
  function stopMusic() {
    if (pulseTimer) { clearInterval(pulseTimer); pulseTimer = null; }
    const old = musicNodes; musicNodes = [];
    if (ctx) {
      // fondu de sortie puis arrêt
      try { musicGain.gain.cancelScheduledValues(ctx.currentTime); } catch (e) {}
      try { musicGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4); } catch (e) {}
    }
    setTimeout(() => { old.forEach(n => { try { n.stop(); } catch (e) {} }); }, 900);
  }

  function buildBed(freqs, types, lowpass, target) {
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = types[i] || 'sawtooth'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = 0.0;
      g.gain.setTargetAtTime(target[i], ctx.currentTime, 1.5);
      const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = lowpass;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.04 + i * 0.025;
      const lfoG = ctx.createGain(); lfoG.gain.value = lowpass * 0.4;
      lfo.connect(lfoG); lfoG.connect(filt.frequency);
      o.connect(filt); filt.connect(g); g.connect(musicGain);
      o.start(); lfo.start();
      musicNodes.push(o, lfo);
    });
  }

  function startAmbient() {
    if (!ctx || mode === 'ambient') return;
    stopMusic(); mode = 'ambient';
    setTimeout(() => {
      if (mode !== 'ambient') return;
      musicGain.gain.setTargetAtTime(0.22, ctx.currentTime, 1.5);
      // La mineur calme et dystopique : A1, E2, A2
      buildBed([55, 82.41, 110], ['sawtooth', 'sawtooth', 'triangle'], 380, [0.13, 0.10, 0.06]);
    }, 100);
  }

  function startCombat() {
    if (!ctx || mode === 'combat') return;
    stopMusic(); mode = 'combat';
    setTimeout(() => {
      if (mode !== 'combat') return;
      musicGain.gain.setTargetAtTime(0.28, ctx.currentTime, 0.8);
      // Plus tendu : ajoute une tierce mineure + quinte, filtre plus ouvert
      buildBed([55, 110, 130.81, 164.81], ['sawtooth', 'sawtooth', 'square', 'square'], 600, [0.12, 0.08, 0.05, 0.045]);
      // Battement de basse rythmique
      pulseTimer = setInterval(() => {
        if (mode !== 'combat') return;
        tone(55, 0.18, 'sine', 0.5, 30);
        noise(0.05, 0.12, 800);
      }, 600);
    }, 100);
  }

  // ── API publique ───────────────────────────────────────────
  const API = {
    unlock() {
      if (unlocked) { if (ctx && ctx.state === 'suspended') ctx.resume(); return; }
      if (!ensureCtx()) return;
      if (ctx.state === 'suspended') ctx.resume();
      unlocked = true;
      startAmbient();
    },
    ambient() { if (unlocked) startAmbient(); },
    combatMusic() { if (unlocked) startCombat(); },

    // SFX
    hit(dmg) {
      const big = Math.min(1, (dmg || 20) / 200);
      noise(0.10 + big * 0.10, 0.35 + big * 0.3, 900 + big * 1500);
      tone(140 - big * 60, 0.18, 'sine', 0.4 + big * 0.3, 50);
    },
    guard() {
      tone(320, 0.10, 'square', 0.3, 220);
      tone(180, 0.14, 'sine', 0.25, 120, 0.03);
    },
    combatStart() {
      tone(880, 0.5, 'sawtooth', 0.3, 110);  // alerte descendante
      noise(0.4, 0.25, 600, 0.05);
      tone(55, 0.6, 'sine', 0.5, 40, 0.1);   // boom
    },
    victory() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.4, 'triangle', 0.4, null, i * 0.13));
    },
    defeat() {
      [220, 174.6, 138.6, 110].forEach((f, i) => tone(f, 0.6, 'sawtooth', 0.35, null, i * 0.18));
    },
    qcmGood() { tone(659.25, 0.12, 'triangle', 0.4); tone(987.77, 0.22, 'triangle', 0.4, null, 0.1); },
    qcmBad()  { tone(160, 0.18, 'square', 0.4, 90); tone(120, 0.22, 'square', 0.4, 70, 0.18); },
    select()  { tone(660, 0.05, 'square', 0.18, 880); },
    item()    { tone(523.25, 0.10, 'sine', 0.3, null); tone(784, 0.16, 'sine', 0.3, null, 0.08); },
    jump()    { tone(300, 0.18, 'sine', 0.25, 600); }
  };

  window.GameAudio = API;

  // Déverrouillage au premier geste utilisateur (politique navigateur)
  function firstGesture() {
    API.unlock();
    window.removeEventListener('pointerdown', firstGesture);
    window.removeEventListener('keydown', firstGesture);
  }
  window.addEventListener('pointerdown', firstGesture);
  window.addEventListener('keydown', firstGesture);
})();
