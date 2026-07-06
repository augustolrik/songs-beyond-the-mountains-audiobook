param([int]$StartAt = 1)
$ErrorActionPreference = 'Stop'
$ffmpeg = 'C:\Users\augu6220\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe'
$folder = Join-Path $PSScriptRoot 'audio\da'
$files = Get-ChildItem $folder -Filter 'chapter_*.mp3' | Where-Object { $_.Name -match '^chapter_\d{2}\.mp3$' } | Sort-Object Name
if ($files.Count -ne 18) { throw "Forventede 18 kapitler, fandt $($files.Count)." }

foreach ($file in $files) {
    $number = [int]([regex]::Match($file.Name, '\d{2}').Value)
    if ($number -lt $StartAt) { continue }
    $temp = Join-Path $folder ($file.BaseName + '.normalized.mp3')
    & $ffmpeg -y -v error -i $file.FullName `
        -af 'dynaudnorm=f=500:g=13:p=0.92:m=5,loudnorm=I=-16:LRA=6:TP=-1.5' `
        -ar 24000 -ac 1 -c:a libmp3lame -b:a 96k $temp
    if ($LASTEXITCODE -ne 0 -or !(Test-Path $temp) -or (Get-Item $temp).Length -lt 10000) {
        throw "Normalisering fejlede for $($file.Name)."
    }
    Move-Item -LiteralPath $temp -Destination $file.FullName -Force
    Write-Host "Normaliserede $($file.Name)"
}
