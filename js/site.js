(() => {
  const CALL = 'YO3DVL';
  const WPM = 18;                 // PARIS standard: 1 unit = 1200 / WPM ms
  const UNIT = 1200 / WPM;
  const TONE = 600;               // Hz sidetone
  const REPEAT_GAP = 3000;        // ms pause before sending again
  const M = { Y: '-.--', O: '---', '3': '...--', D: '-..', V: '...-', L: '.-..' };

  const el = document.getElementById('morse');
  const elems = [];               // [{node, units}]
  for (const ch of CALL) {
    const s = document.createElement('span'); s.title = ch;
    for (const sym of M[ch]) {
      const b = document.createElement('b'); b.className = sym === '.' ? 'd' : 'l';
      s.appendChild(b); elems.push({ node: b, units: sym === '.' ? 1 : 3, last: false });
    }
    elems[elems.length - 1].last = true;   // last element of a letter
    el.appendChild(s);
  }

  // Sidetone toggle — audio only starts after a click (browser autoplay rules).
  const btn = document.createElement('button');
  btn.className = 'key'; btn.type = 'button'; btn.setAttribute('aria-pressed', 'false');
  btn.innerHTML = '<i></i><span>Sound off</span>';
  el.appendChild(btn);
  let audio = null, gain = null, soundOn = false;
  btn.addEventListener('click', () => {
    soundOn = !soundOn;
    btn.setAttribute('aria-pressed', soundOn);
    btn.querySelector('span').textContent = soundOn ? `Sound on · ${WPM} WPM` : 'Sound off';
    if (soundOn && !audio) {
      audio = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audio.createOscillator(); osc.type = 'sine'; osc.frequency.value = TONE;
      gain = audio.createGain(); gain.gain.value = 0;
      osc.connect(gain).connect(audio.destination); osc.start();
    }
    if (audio) audio.resume();
  });

  function keyDown() {
    btn.classList.add('tx');
    if (soundOn && gain) gain.gain.setTargetAtTime(0.15, audio.currentTime, 0.004); // ~5 ms ramp: no clicks
  }
  function keyUp() {
    btn.classList.remove('tx');
    if (gain) gain.gain.setTargetAtTime(0, audio.currentTime, 0.004);
  }

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function send() {
    for (;;) {
      elems.forEach((e) => e.node.classList.remove('sent'));
      for (const e of elems) {
        e.node.classList.add('on'); keyDown();
        await wait(e.units * UNIT);
        e.node.classList.remove('on'); e.node.classList.add('sent'); keyUp();
        await wait((e.last ? 3 : 1) * UNIT);   // 1 unit between elements, 3 between letters
      }
      await wait(4 * UNIT + REPEAT_GAP);        // word gap (7 total) + pause
    }
  }
  send();
})();
