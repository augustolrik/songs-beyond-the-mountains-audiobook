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
  },
  {
    id: 'songs-beyond-mountains-dnd-guide',
    title: { en: 'D&D Campaign Guide (no audio)', da: 'D&D Campaign Guide (no audio)' },
    subtitle: {
      en: 'Plot hooks, motives, factions, locations, echo-iron, and campaign endings.',
      da: 'Plot hooks, motives, factions, locations, echo-iron, and campaign endings.'
    },
    chapters: { en: window.DND_CAMPAIGN_GUIDE_CHAPTERS },
    studioAudio: {},
    audioPath: {},
    readOnly: true
  },
  {
    id: 'wolves-langston-cyoa',
    title: { en: 'The Wolves of Langston - Choose Your Own Adventure (no audio)', da: 'The Wolves of Langston - Choose Your Own Adventure (no audio)' },
    subtitle: {
      en: 'A branching mystery adventure with multiple non-random endings.',
      da: 'A branching mystery adventure with multiple non-random endings.'
    },
    chapters: { en: window.WOLVES_LANGSTON_CYOA_CHAPTERS },
    studioAudio: {},
    audioPath: {},
    readOnly: true
  }
];
