const Sfx = (() => {
  let volume = 100;
  let ctx = null;

  function context() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function setVolume(value) {
    volume = Math.max(0, Math.min(100, value));
  }

  function tone(freq, sec, type = "sine", slide = 0) {
    if (volume <= 0) return;
    const ac = context();
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), now + sec);
    const amp = (volume / 100) * 0.12;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(amp, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + sec);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + sec + 0.02);
  }

  function chirp(f0, f1, sec) { tone(f0, sec, "sine", f1 - f0); }
  function two(a, sa, b, sb) {
    tone(a, sa);
    setTimeout(() => tone(b, sb), sa * 1000);
  }
  function arpeggio(notes, each = 0.07) {
    notes.forEach((n, i) => setTimeout(() => tone(n, each + (i === notes.length - 1 ? 0.05 : 0)), i * each * 1000));
  }

  return {
    get Volume() { return volume; },
    setVolume,
    resume: () => { try { context(); } catch { /* audio blocked until gesture */ } },
    Flap() { chirp(620, 380, 0.07); },
    Score() { two(880, 0.05, 1320, 0.07); },
    Death() { tone(280, 0.32, "sawtooth", -200); },
    Buy() { two(980, 0.05, 1310, 0.08); },
    Pause() { chirp(440, 330, 0.08); },
    Revive() { two(420, 0.06, 760, 0.10); },
    Mission() { arpeggio([523, 659, 784], 0.08); },
    Unlock() { arpeggio([523, 659, 784, 1046], 0.07); },
    Click() { chirp(520, 520, 0.04); },
  };
})();
