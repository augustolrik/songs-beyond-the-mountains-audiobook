$ErrorActionPreference = 'Stop'
$novelRoot = Split-Path $PSScriptRoot
$sources = @(
    @{ Path = Join-Path $novelRoot 'NOVEL\Act 1.md'; Act = 'Act I - The Envoy' },
    @{ Path = Join-Path $novelRoot 'NOVEL\Act 2.md'; Act = 'Act II - The Broken Accord' },
    @{ Path = Join-Path $novelRoot 'NOVEL\Future Acts\Act 3.md'; Act = 'Act III - Songs Beyond the Mountains' }
)

$chapters = [System.Collections.Generic.List[object]]::new()
foreach ($source in $sources) {
    $markdown = [IO.File]::ReadAllText($source.Path)
    $matches = [regex]::Matches($markdown, '(?ms)^## Chapter\s+([^\r\n]+)\r?\n(.*?)(?=^## Chapter|\z)')
    foreach ($match in $matches) {
        $title = ($match.Groups[1].Value -replace '^[^:]+:\s*', '').Trim()
        $paragraphs = [regex]::Split($match.Groups[2].Value.Trim(), '\r?\n\s*\r?\n') |
            ForEach-Object {
                ($_ -replace '^>\s*', '' -replace '\*\*', '' -replace '(?<!\*)\*(?!\*)', '').Trim()
            } |
            Where-Object { $_ -and $_ -notmatch '^#' }
        $chapters.Add([ordered]@{ act = $source.Act; title = $title; paragraphs = @($paragraphs) })
    }
}

if ($chapters.Count -ne 18) { throw "Expected 18 chapters, found $($chapters.Count)." }
$json = $chapters | ConvertTo-Json -Depth 5
[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'chapters.json'), $json, [Text.UTF8Encoding]::new($false))
$javascript = "window.AUDIOBOOK_CHAPTERS = $json;`n"
[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'chapters-data.js'), $javascript, [Text.UTF8Encoding]::new($false))

$danishSources = @(
    @{ Path = Join-Path $novelRoot 'NOVEL_DA\Akt 1.md'; Act = ('F' + [char]0x00F8 + 'rste akt - Sendebuddet') },
    @{ Path = Join-Path $novelRoot 'NOVEL_DA\Akt 2.md'; Act = 'Anden akt - Den brudte aftale' },
    @{ Path = Join-Path $novelRoot 'NOVEL_DA\Akt 3.md'; Act = 'Tredje akt - Sange hinsides bjergene' }
)
$danishChapters = [System.Collections.Generic.List[object]]::new()
$danishNovelParts = [System.Collections.Generic.List[string]]::new()
$danishNovelParts.Add("# Sange hinsides bjergene`r`n`r`n*En roman*`r`n")
foreach ($source in $danishSources) {
    $markdown = [IO.File]::ReadAllText($source.Path)
    $danishNovelParts.Add("`r`n---`r`n`r`n$markdown")
    $matches = [regex]::Matches($markdown, '(?ms)^## Kapitel\s+([^\r\n]+)\r?\n(.*?)(?=^## Kapitel|\z)')
    foreach ($match in $matches) {
        $title = ($match.Groups[1].Value -replace '^[^:]+:\s*', '').Trim()
        $paragraphs = [regex]::Split($match.Groups[2].Value.Trim(), '\r?\n\s*\r?\n') |
            ForEach-Object { ($_ -replace '^>\s*', '' -replace '\*\*', '' -replace '(?<!\*)\*(?!\*)', '').Trim() } |
            Where-Object { $_ -and $_ -notmatch '^#' }
        $danishChapters.Add([ordered]@{ act = $source.Act; title = $title; paragraphs = @($paragraphs) })
    }
}
if ($danishChapters.Count -ne 18) { throw "Expected 18 Danish chapters, found $($danishChapters.Count)." }
$danishJson = $danishChapters | ConvertTo-Json -Depth 5
[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'chapters-da.json'), $danishJson, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'chapters-data-da.js'), "window.AUDIOBOOK_CHAPTERS_DA = $danishJson;`n", [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $novelRoot 'NOVEL_DA\Komplet roman.md'), ($danishNovelParts -join ''), [Text.UTF8Encoding]::new($false))
Write-Host "Built $($chapters.Count) English and $($danishChapters.Count) Danish audiobook chapters."
