# Phone Audiobook Player

Homepage: https://augustolrik.github.io/songs-beyond-the-mountains-audiobook/

This player uses the phone or browser's built-in English voices. It remembers the current chapter, paragraph, speed, and selected voice in local storage.

The complete novel is included in both English and Danish. Use the **Language / Sprog** menu in the player. Each language keeps its own listening position, and the Danish edition automatically prioritizes an installed `da-DK` voice.

The homepage also links to two reading-only files with no audio playback:

- D&D Campaign Guide
- The Wolves of Langston choose-your-own-adventure mystery

## Offline on this computer — recommended

Double-click `Open Audiobook Offline.bat`. It opens directly from the downloaded folder and requires no server, network port, or firewall access. Keep the complete `AUDIOBOOK` folder together. Playback position and settings are saved by the browser.

For the best Danish sound on Windows, select a Danish natural voice in the **Stemme** menu if one is installed. The exact available voices come from the operating system and browser.

## Bedre dansk fortællerstemme

Double-click `Generate Better Danish Audio.bat` while online. It uses the same Microsoft neural TTS setup as the Multi 4 podcast: `da-DK-ChristelNeural` at `-12%` speed. The script creates one MP3 per chapter and activates studio playback automatically. The player then remembers the exact time in every Danish chapter; Back and Next skip 15 seconds.

The included Danish MP3 files are dynamically normalized and loudness-matched across all chapters to prevent occasional quiet passages. The processing target is approximately -16 LUFS with limited speech dynamics and a -1.5 dB true-peak ceiling.

## Listen on a phone

1. Double-click `Start Audiobook Server.bat` on the computer.
2. Connect the phone to the same Wi-Fi.
3. The launcher shows the computer's IPv4 address. Open `http://THAT-ADDRESS:8765` in the phone browser.
4. Choose a natural or enhanced English voice when the phone offers one.
5. The player saves the current chapter, paragraph, speed, and voice automatically.

Keep the server window open while listening. The computer may ask whether Python can use the private network the first time.

## Run manually

From the `AUDIOBOOK` folder:

```powershell
python -m http.server 8080
```

Open `http://localhost:8080` on the same computer.

On iPhone/iPad, Safari may pause browser speech when the screen locks. Android Chrome behavior depends on the installed voice and power settings. The saved position remains available when reopening the player. For listening away from the computer, publish this folder on any HTTPS static host; it is already structured as an installable offline web app.
