"""Generate British English audiobook editions with Microsoft and Google TTS."""
from __future__ import annotations

import argparse
import asyncio
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

import edge_tts

TOOLS = Path(r"C:\Git\.tools\python_packages")
if str(TOOLS) not in sys.path:
    sys.path.insert(0, str(TOOLS))
from gtts import gTTS

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "chapters.json"
OUTPUT = ROOT / "audio" / "en"
MICROSOFT_VOICE = "en-GB-SoniaNeural"
MICROSOFT_RATE = "-5%"
MICROSOFT_PITCH = "+3Hz"
MICROSOFT_VOLUME = "+2%"
FFMPEG = Path(r"C:\Users\augu6220\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe")
MAX_CHARS = 2400


def blocks(chapter: dict, number: int) -> list[str]:
    paragraphs = [f"Chapter {number}. {chapter['title']}."] + list(chapter["paragraphs"])
    result: list[str] = []
    current = ""
    for paragraph in paragraphs:
        paragraph = re.sub(r"[*_]+", "", paragraph).strip()
        candidate = f"{current}\n\n{paragraph}".strip()
        if current and len(candidate) > MAX_CHARS:
            result.append(current)
            current = paragraph
        else:
            current = candidate
    if current:
        result.append(current)
    return result


def concatenate(clips: list[Path], target: Path, temp: Path) -> None:
    listing = temp / "concat.txt"
    listing.write_text("".join(f"file '{clip.as_posix()}'\n" for clip in clips), encoding="utf-8")
    subprocess.run([str(FFMPEG), "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(listing),
                    "-c:a", "libmp3lame", "-b:a", "64k", str(target)], check=True)


async def microsoft_chapter(chapter: dict, number: int, force: bool = False) -> None:
    folder = OUTPUT / "microsoft-uk"
    target = folder / f"chapter_{number:02d}.mp3"
    folder.mkdir(parents=True, exist_ok=True)
    if target.exists() and target.stat().st_size > 500_000 and not force:
        print(f"Microsoft {number:02d}/18 (exists)", flush=True)
        return
    temp = folder / f"_parts_{number:02d}"
    if temp.exists(): shutil.rmtree(temp)
    temp.mkdir()
    clips: list[Path] = []
    for index, text in enumerate(blocks(chapter, number), 1):
        clip = temp / f"part_{index:03d}.mp3"
        await edge_tts.Communicate(
            text,
            MICROSOFT_VOICE,
            rate=MICROSOFT_RATE,
            pitch=MICROSOFT_PITCH,
            volume=MICROSOFT_VOLUME,
        ).save(str(clip))
        clips.append(clip)
    concatenate(clips, target, temp)
    shutil.rmtree(temp)
    print(f"Microsoft {number:02d}/18", flush=True)


def google_chapter(chapter: dict, number: int, force: bool = False) -> None:
    folder = OUTPUT / "google-uk"
    target = folder / f"chapter_{number:02d}.mp3"
    folder.mkdir(parents=True, exist_ok=True)
    if target.exists() and target.stat().st_size > 500_000 and not force:
        print(f"Google {number:02d}/18 (exists)", flush=True)
        return
    temp = folder / f"_parts_{number:02d}"
    if temp.exists(): shutil.rmtree(temp)
    temp.mkdir()
    clips = []
    for index, text in enumerate(blocks(chapter, number), 1):
        clip = temp / f"part_{index:03d}.mp3"
        gTTS(text=text, lang="en", tld="co.uk", slow=False).save(str(clip))
        clips.append(clip)
    concatenate(clips, target, temp)
    shutil.rmtree(temp)
    print(f"Google {number:02d}/18", flush=True)


async def main(provider: str, force: bool = False) -> None:
    chapters = json.loads(SOURCE.read_text(encoding="utf-8"))
    if len(chapters) != 18: raise SystemExit("Expected 18 chapters.")
    jobs = []
    for number, chapter in enumerate(chapters, 1):
        if provider in {"microsoft", "all"}:
            jobs.append(microsoft_chapter(chapter, number, force=force))
        if provider in {"google", "all"}:
            jobs.append(asyncio.to_thread(google_chapter, chapter, number, force))
    for start in range(0, len(jobs), 4):
        await asyncio.gather(*jobs[start:start + 4])
    ready = OUTPUT / "ready.js"
    google_ready = "true" if provider in {"google", "all"} else "false"
    ready.write_text(
        f"window.ENGLISH_STUDIO_AUDIO = {{ microsoftUk: true, googleUk: {google_ready} }};\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--provider", choices=["microsoft", "google", "all"], default="all")
    parser.add_argument("--force", action="store_true", help="Regenerate audio even when chapter files exist.")
    args = parser.parse_args()
    asyncio.run(main(args.provider, force=args.force))

