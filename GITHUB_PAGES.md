# GitHub Pages deployment

The `AUDIOBOOK` folder is a complete static site. Publish its contents at the root of a GitHub Pages repository.

## Current behavior

- English and Danish editions.
- Danish Christel Neural MP3 chapters.
- Listen and read modes.
- Light, dark, and Cody themes.
- Progress, theme, language, mode, book, and speed stored in `localStorage` on each browser/device.
- No account or server-side user data.

## Add another book

1. Add its chapter data script and audio folder.
2. Load the chapter script before `library-data.js` in `index.html`.
3. Add one metadata object to `window.AUDIOBOOK_LIBRARY` in `library-data.js`.
4. Increment the `?v=` asset number and service-worker cache name.

## Publish

Create a repository, copy the contents of this folder to its root, push, and enable Pages from the default branch in repository settings. Publishing is intentionally not automated by this project.
