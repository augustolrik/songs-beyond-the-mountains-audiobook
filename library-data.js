window.AUDIOBOOK_LIBRARY = [
  {
    id: 'songs-beyond-mountains',
    title: { en: 'Songs Beyond the Mountains', da: 'Sange hinsides bjergene' },
    subtitle: {
      en: 'A goblin envoy, a hidden valley, and a song no one can own.',
      da: 'Et goblinsendebud, en skjult dal og en sang, ingen kan eje.'
    },
    chapters: { en: window.AUDIOBOOK_CHAPTERS, da: window.AUDIOBOOK_CHAPTERS_DA },
    studioAudio: {
      da: window.DANISH_STUDIO_AUDIO === true,
      microsoftUk: window.ENGLISH_STUDIO_AUDIO?.microsoftUk === true,
      googleUk: window.ENGLISH_STUDIO_AUDIO?.googleUk === true
    },
    audioPath: {
      da: 'audio/da/chapter_{NN}.mp3',
      microsoftUk: 'audio/en/microsoft-uk/chapter_{NN}.mp3',
      googleUk: 'audio/en/google-uk/chapter_{NN}.mp3'
    }
  }
];
