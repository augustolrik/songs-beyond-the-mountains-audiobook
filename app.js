const STORAGE_KEY = 'songs-beyond-mountains-player-v2';
const state = {
  language: 'en', book: 'songs-beyond-mountains', mode: 'listen', theme: 'cody', chapters: [], chapter: 0, paragraph: 0, rate: 1, playing: false,
  voices: { en: '', da: '' }, positions: { en: { chapter: 0, paragraph: 0 }, da: { chapter: 0, paragraph: 0 } },
  narrators: { en: 'microsoftUk', da: 'da' },
  audioTimes: {}
};
const uiText = {
  en: { language: 'Language', book: 'Book', theme: 'Theme', listen: 'Listen', read: 'Read', chapter: 'Chapter', speed: 'Speed', voice: 'Voice', saved: 'Your place is saved automatically.', playing: 'Playing · your place is saved automatically', finished: 'The story is finished.', stopped: 'Playback stopped. Tap play to continue.', chapters: 'Chapters', footer: 'Playback uses your device’s built-in voices. Headphones recommended.' },
  da: { language: 'Sprog', book: 'Bog', theme: 'Tema', listen: 'Lyt', read: 'Læs', chapter: 'Kapitel', speed: 'Hastighed', voice: 'Stemme', saved: 'Din placering gemmes automatisk.', playing: 'Afspiller · din placering gemmes automatisk', finished: 'Fortællingen er slut.', stopped: 'Afspilningen standsede. Tryk på afspil for at fortsætte.', chapters: 'Kapitler', footer: 'Afspilningen bruger enhedens indbyggede stemmer. Hovedtelefoner anbefales.' }
};
const $ = id => document.getElementById(id);

function save() {
  state.positions[`${state.book}-${state.language}`] = { chapter: state.chapter, paragraph: state.paragraph };
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ language: state.language, book: state.book, mode: state.mode, theme: state.theme, positions: state.positions, rate: state.rate, voices: state.voices, narrators: state.narrators, audioTimes: state.audioTimes }));
}

function restore() {
  try { Object.assign(state, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); } catch {}
}

function currentChapter() { return state.chapters[state.chapter]; }
function currentBook() { return (window.AUDIOBOOK_LIBRARY || []).find(book => book.id === state.book) || window.AUDIOBOOK_LIBRARY[0]; }
function studioVariant() {
  const variant = state.narrators?.[state.language];
  return variant && currentBook()?.studioAudio?.[variant] === true ? variant : '';
}
function studioMode() { return Boolean(studioVariant()); }
function audioKey() { return `${state.book}-${state.language}-${studioVariant() || 'device'}-${state.chapter}`; }

function updateView() {
  const chapter = currentChapter();
  if (!chapter) return;
  state.paragraph = Math.max(0, Math.min(state.paragraph, chapter.paragraphs.length - 1));
  $('chapterSelect').value = String(state.chapter);
  $('chapterTitle').textContent = chapter.title;
  $('actLabel').textContent = chapter.act;
  $('paragraphText').textContent = chapter.paragraphs[state.paragraph];
  $('readerAct').textContent = chapter.act;
  $('readerTitle').textContent = chapter.title;
  $('readerText').innerHTML = '';
  chapter.paragraphs.forEach((paragraph, index) => {
    const p = document.createElement('p');
    p.textContent = paragraph;
    p.dataset.paragraph = String(index);
    $('readerText').append(p);
  });
  if (state.mode === 'read' && state.paragraph > 0) {
    requestAnimationFrame(() => document.querySelector(`#readerText p[data-paragraph="${state.paragraph}"]`)?.scrollIntoView({ block: 'start' }));
  }
  const ratio = chapter.paragraphs.length > 1 ? state.paragraph / (chapter.paragraphs.length - 1) : 0;
  $('progress').value = Math.round(ratio * 1000);
  $('percentLabel').textContent = `${Math.round(overallProgress() * 100)}%`;
  document.querySelectorAll('#chapterList button').forEach((b, i) => b.classList.toggle('current', i === state.chapter));
  save();
}

function overallProgress() {
  const before = state.chapters.slice(0, state.chapter).reduce((n, c) => n + c.paragraphs.length, 0);
  const total = state.chapters.reduce((n, c) => n + c.paragraphs.length, 0) || 1;
  return (before + state.paragraph) / total;
}

function chosenVoice() {
  const voices = speechSynthesis.getVoices();
  const languagePattern = state.language === 'da' ? /^da[-_]/i : /^en[-_]/i;
  return voices.find(v => v.voiceURI === state.voices[state.language]) || voices.find(v => languagePattern.test(v.lang) && /natural|premium|enhanced/i.test(v.name)) || voices.find(v => languagePattern.test(v.lang)) || voices[0];
}

function stop() {
  speechSynthesis.cancel();
  $('chapterAudio').pause();
  state.playing = false;
  $('play').textContent = '▶';
  $('play').setAttribute('aria-label', 'Play');
  save();
}

function prepareStudioAudio() {
  const audio = $('chapterAudio');
  if (!studioMode()) { audio.removeAttribute('src'); return; }
  const expected = currentBook().audioPath[studioVariant()].replace('{NN}', String(state.chapter + 1).padStart(2, '0'));
  if (!audio.src.endsWith(expected)) {
    audio.src = expected;
    audio.load();
  }
}

function playStudioAudio() {
  const audio = $('chapterAudio');
  prepareStudioAudio();
  audio.playbackRate = state.rate;
  const resumeAt = Number(state.audioTimes[audioKey()] || 0);
  const start = () => {
    if (resumeAt > 0 && resumeAt < audio.duration - 2) audio.currentTime = resumeAt;
    audio.play().catch(error => { stop(); $('status').textContent = `Kunne ikke starte lydfilen (${error.name || 'ukendt fejl'}).`; });
  };
  if (audio.readyState >= 1) start(); else audio.onloadedmetadata = start;
  $('status').textContent = uiText[state.language].playing;
}

function speakCurrent() {
  const chapter = currentChapter();
  if (!chapter || !state.playing) return;
  if (studioMode()) { playStudioAudio(); return; }
  speechSynthesis.cancel();
  const text = chapter.paragraphs[state.paragraph];
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = chosenVoice();
  utterance.rate = state.rate;
  utterance.pitch = 1;
  utterance.onend = () => {
    if (!state.playing) return;
    if (state.paragraph + 1 < chapter.paragraphs.length) state.paragraph++;
    else if (state.chapter + 1 < state.chapters.length) { state.chapter++; state.paragraph = 0; }
    else { stop(); $('status').textContent = uiText[state.language].finished; return; }
    updateView();
    speakCurrent();
  };
  utterance.onerror = event => {
    if (event.error !== 'canceled' && event.error !== 'interrupted') {
      stop(); $('status').textContent = uiText[state.language].stopped;
    }
  };
  speechSynthesis.speak(utterance);
  $('status').textContent = uiText[state.language].playing;
}

function populateVoices() {
  const languagePattern = state.language === 'da' ? /^da[-_]/i : /^en[-_]/i;
  const voices = speechSynthesis.getVoices().filter(v => languagePattern.test(v.lang));
  const select = $('voiceSelect');
  const selected = state.voices[state.language];
  select.innerHTML = '';
  select.disabled = false;
  const book = currentBook();
  if (state.language === 'en') {
    if (book.studioAudio?.microsoftUk) select.add(new Option('Microsoft Sonia - British audiobook', 'studio:microsoftUk'));
    if (book.studioAudio?.googleUk) select.add(new Option('Google UK - British audiobook', 'studio:googleUk'));
  } else if (book.studioAudio?.da) {
    select.add(new Option('Christel Neural - indlæst lydbog', 'studio:da'));
  }
  voices.forEach(v => select.add(new Option(`${v.name} (${v.lang})`, v.voiceURI)));
  const narrator = state.narrators?.[state.language];
  if (narrator && book.studioAudio[narrator]) { select.value = `studio:${narrator}`; save(); return; }
  const preferred = voices.find(v => v.voiceURI === selected) || voices.find(v => /natural|premium|enhanced/i.test(v.name)) || voices[0];
  if (preferred) { state.voices[state.language] = preferred.voiceURI; select.value = preferred.voiceURI; }
  save();
}

function populateChapters() {
  $('chapterSelect').innerHTML = '';
  $('chapterList').innerHTML = '';
  state.chapters.forEach((chapter, i) => {
    $('chapterSelect').add(new Option(`${i + 1}. ${chapter.title}`, i));
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.textContent = chapter.title;
    button.onclick = () => { stop(); state.chapter = i; state.paragraph = 0; updateView(); };
    li.append(button); $('chapterList').append(li);
  });
}

function populateBooks() {
  const select = $('bookSelect');
  select.innerHTML = '';
  window.AUDIOBOOK_LIBRARY.forEach(book => select.add(new Option(book.title[state.language] || book.title.en, book.id)));
  if (!window.AUDIOBOOK_LIBRARY.some(book => book.id === state.book)) state.book = window.AUDIOBOOK_LIBRARY[0].id;
  select.value = state.book;
}

function applyPresentation() {
  document.body.dataset.theme = state.theme;
  if (currentBook()?.readOnly) state.mode = 'read';
  document.body.dataset.readonly = currentBook()?.readOnly ? 'true' : 'false';
  document.body.dataset.mode = state.mode;
  $('themeSelect').value = state.theme;
  $('listenMode').classList.toggle('active', state.mode === 'listen');
  $('readMode').classList.toggle('active', state.mode === 'read');
  if (state.mode === 'read') stop();
  save();
}

function applyLanguage() {
  const book = currentBook();
  if (book.readOnly) state.language = 'en';
  state.chapters = book.chapters[state.language] || book.chapters.en;
  const positionKey = `${state.book}-${state.language}`;
  const position = state.positions[positionKey] || state.positions[state.language] || { chapter: 0, paragraph: 0 };
  state.chapter = Math.max(0, Math.min(Number(position.chapter) || 0, state.chapters.length - 1));
  state.paragraph = Math.max(0, Number(position.paragraph) || 0);
  document.documentElement.lang = state.language;
  $('bookTitle').textContent = book.title[state.language] || book.title.en;
  $('bookSubtitle').textContent = book.subtitle[state.language] || book.subtitle.en;
  $('bookLabel').textContent = uiText[state.language].book;
  $('themeLabel').textContent = uiText[state.language].theme;
  $('listenMode').textContent = `🎧 ${uiText[state.language].listen}`;
  $('readMode').textContent = `📖 ${uiText[state.language].read}`;
  $('footerText').textContent = uiText[state.language].footer;
  $('languageSelect').value = state.language;
  $('languageLabel').textContent = uiText[state.language].language;
  $('chapterLabel').textContent = uiText[state.language].chapter;
  document.querySelector('label[for="rate"]').firstChild.textContent = `${uiText[state.language].speed} `;
  document.querySelector('label[for="voiceSelect"]').textContent = uiText[state.language].voice;
  document.querySelector('details summary').textContent = uiText[state.language].chapters;
  $('status').textContent = uiText[state.language].saved;
  populateBooks(); populateChapters(); populateVoices(); prepareStudioAudio(); applyPresentation(); updateView();
}

async function init() {
  restore();
  if (!Array.isArray(window.AUDIOBOOK_CHAPTERS)) {
    const response = await fetch('chapters.json');
    window.AUDIOBOOK_CHAPTERS = await response.json();
  }
  if (!Array.isArray(window.AUDIOBOOK_CHAPTERS_DA)) {
    const response = await fetch('chapters-da.json');
    window.AUDIOBOOK_CHAPTERS_DA = await response.json();
  }
  state.rate = Number(state.rate) || 1;

  $('rate').value = state.rate; $('rateValue').value = `${state.rate.toFixed(2)}×`;
  applyLanguage(); speechSynthesis.onvoiceschanged = populateVoices;

  $('play').onclick = () => { if (state.playing) stop(); else { state.playing = true; $('play').textContent = 'Ⅱ'; $('play').setAttribute('aria-label', 'Pause'); speakCurrent(); } };
  $('previous').onclick = () => { if (studioMode()) { const a=$('chapterAudio'); a.currentTime=Math.max(0,a.currentTime-15); state.audioTimes[audioKey()]=a.currentTime; save(); return; } stop(); if (state.paragraph > 0) state.paragraph--; else if (state.chapter > 0) { state.chapter--; state.paragraph = currentChapter().paragraphs.length - 1; } updateView(); };
  $('next').onclick = () => { if (studioMode()) { const a=$('chapterAudio'); a.currentTime=Math.min(a.duration||Infinity,a.currentTime+15); state.audioTimes[audioKey()]=a.currentTime; save(); return; } stop(); if (state.paragraph + 1 < currentChapter().paragraphs.length) state.paragraph++; else if (state.chapter + 1 < state.chapters.length) { state.chapter++; state.paragraph = 0; } updateView(); };
  $('chapterSelect').onchange = e => { stop(); state.chapter = Number(e.target.value); state.paragraph = 0; updateView(); };
  $('progress').oninput = e => { if (studioMode()) { const a=$('chapterAudio'); if(a.duration){a.currentTime=(Number(e.target.value)/1000)*a.duration; state.audioTimes[audioKey()]=a.currentTime; save();} return; } stop(); state.paragraph = Math.round((Number(e.target.value) / 1000) * (currentChapter().paragraphs.length - 1)); updateView(); };
  $('rate').oninput = e => { state.rate = Number(e.target.value); $('rateValue').value = `${state.rate.toFixed(2)}×`; save(); if (state.playing) speakCurrent(); };
  $('voiceSelect').onchange = e => {
    stop();
    if (e.target.value.startsWith('studio:')) state.narrators[state.language] = e.target.value.slice(7);
    else { state.narrators[state.language] = ''; state.voices[state.language] = e.target.value; }
    prepareStudioAudio(); save();
  };
  $('languageSelect').onchange = e => { stop(); save(); state.language = e.target.value; applyLanguage(); };
  $('bookSelect').onchange = e => { stop(); save(); state.book = e.target.value; applyLanguage(); };
  $('themeSelect').onchange = e => { state.theme = e.target.value; applyPresentation(); };
  $('listenMode').onclick = () => { state.mode = 'listen'; applyPresentation(); };
  $('readMode').onclick = () => { state.mode = 'read'; applyPresentation(); };

  let scrollSavePending = false;
  window.addEventListener('scroll', () => {
    if (state.mode !== 'read' || scrollSavePending) return;
    scrollSavePending = true;
    requestAnimationFrame(() => {
      const paragraphs = [...document.querySelectorAll('#readerText p')];
      let nearest = 0;
      let distance = Infinity;
      paragraphs.forEach((paragraph, index) => {
        const value = Math.abs(paragraph.getBoundingClientRect().top - 130);
        if (value < distance) { distance = value; nearest = index; }
      });
      state.paragraph = nearest;
      save();
      scrollSavePending = false;
    });
  }, { passive: true });

  $('chapterAudio').ontimeupdate = () => {
    if (!studioMode()) return;
    const audio = $('chapterAudio');
    state.audioTimes[audioKey()] = audio.currentTime;
    if (audio.duration) $('progress').value = Math.round((audio.currentTime / audio.duration) * 1000);
    save();
  };
  $('chapterAudio').onended = () => {
    state.audioTimes[audioKey()] = 0;
    if (state.chapter + 1 < state.chapters.length) { state.chapter++; state.paragraph = 0; prepareStudioAudio(); updateView(); if (state.playing) playStudioAudio(); }
    else { stop(); $('status').textContent = uiText[state.language].finished; }
  };

  if (location.protocol !== 'file:' && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

init().catch(() => { $('status').textContent = 'Could not load the audiobook chapters.'; });
