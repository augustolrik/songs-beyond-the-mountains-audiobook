"""Generate the Danish audiobook with the same neural TTS setup as Multi 4."""
from __future__ import annotations

import asyncio
import json
import re
import shutil
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "chapters-da.json"
OUTPUT = ROOT / "audio" / "da"
VOICE = "da-DK-ChristelNeural"
RATE = "-12%"
FFMPEG = Path(r"C:\Users\augu6220\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe")
MAX_CHARS = 2400


def text_blocks(chapter: dict, number: int) -> list[str]:
    paragraphs = [f"Kapitel {number}. {chapter['title']}."] + list(chapter["paragraphs"])
    blocks: list[str] = []
    current = ""
    for paragraph in paragraphs:
        paragraph = re.sub(r"[*_]+", "", paragraph).strip()
        candidate = f"{current}\n\n{paragraph}".strip()
        if current and len(candidate) > MAX_CHARS:
            blocks.append(current)
            current = paragraph
        else:
            current = candidate
    if current:
        blocks.append(current)
    return blocks


async def generate_one(chapter: dict, number: int) -> None:
    target = OUTPUT / f"chapter_{number:02d}.mp3"
    temp = OUTPUT / f"_chapter_{number:02d}_parts"
    if temp.exists():
        shutil.rmtree(temp)
    temp.mkdir(parents=True)
    clips: list[Path] = []
    for index, text in enumerate(text_blocks(chapter, number), 1):
        clip = temp / f"part_{index:03d}.mp3"
        await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(clip))
        clips.append(clip)
    concat = temp / "concat.txt"
    concat.write_text("".join(f"file '{clip.as_posix()}'\n" for clip in clips), encoding="utf-8")
    subprocess.run([str(FFMPEG), "-y", "-f", "concat", "-safe", "0", "-i", str(concat),
                    "-c:a", "libmp3lame", "-b:a", "96k", str(target)], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    shutil.rmtree(temp)
    print(f"{number:02d}/18  {target.name} ({len(clips)} dele)", flush=True)


async def main() -> None:
    chapters = json.loads(SOURCE.read_text(encoding="utf-8"))
    if len(chapters) != 18:
        raise SystemExit(f"Forventede 18 kapitler, fandt {len(chapters)}.")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    jobs = [generate_one(chapter, number) for number, chapter in enumerate(chapters, 1)]
    for start in range(0, len(jobs), 4):
        await asyncio.gather(*jobs[start:start + 4])
    (OUTPUT / "ready.js").write_text("window.DANISH_STUDIO_AUDIO = true;\n", encoding="utf-8")


if __name__ == "__main__":
    asyncio.run(main())
