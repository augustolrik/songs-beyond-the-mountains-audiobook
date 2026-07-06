$ErrorActionPreference = 'Stop'
$root = Join-Path $PSScriptRoot 'audio\en'
$ffmpeg = 'C:\Users\augu6220\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe'
$filter = 'dynaudnorm=f=500:g=13:p=0.92:m=5,loudnorm=I=-16:LRA=6:TP=-1.5'

$files = Get-ChildItem $root -Recurse -File -Filter 'chapter_*.mp3'
if ($files.Count -ne 36) { throw "Expected 36 English chapters, found $($files.Count)." }

foreach ($file in $files) {
    $temp = Join-Path $file.DirectoryName ($file.BaseName + '.normalized.mp3')
    & $ffmpeg -y -v error -i $file.FullName -af $filter -ar 24000 -ac 1 -c:a libmp3lame -b:a 64k $temp
    if ($LASTEXITCODE -ne 0) { throw "Normalization failed: $($file.FullName)" }
    Move-Item -Force $temp $file.FullName
    Write-Host "Normalized $($file.Directory.Name)/$($file.Name)"
}
