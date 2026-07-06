param(
    [ValidateSet("resume", "new")]
    [string]$Mode = "resume",
    [int]$RetryMinutes = 10
)

$ErrorActionPreference = "Continue"

function Show-Status {
    param([string]$Text)
    $time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$time] $Text"
}

function Stop-WithMessage {
    param([string]$Text)
    Write-Host ""
    Write-Host $Text
    Write-Host ""
    Read-Host "Press Enter to close"
    exit 1
}

try {
    $codexCommand = Get-Command codex -ErrorAction SilentlyContinue

    if (-not $codexCommand) {
        Stop-WithMessage @"
Codex was not found.

Open a fresh PowerShell window and run:
codex --version

If that works there, restart Windows so the updated PATH is available everywhere.
"@
    }

    Write-Host ""
    $ProjectPath = Read-Host "Paste the full project folder path"
    $ProjectPath = $ProjectPath.Trim().Trim('"')

    if (-not (Test-Path -LiteralPath $ProjectPath -PathType Container)) {
        Stop-WithMessage "The project folder does not exist: $ProjectPath"
    }

    $ProjectPath = (Resolve-Path -LiteralPath $ProjectPath).Path
    Set-Location -LiteralPath $ProjectPath

    if ($Mode -eq "new") {
        Write-Host ""
        $Task = Read-Host "Paste the complete task for Codex"
        if ([string]::IsNullOrWhiteSpace($Task)) {
            Stop-WithMessage "No task was entered."
        }
    }
    else {
        $Task = @"
Continue the original task from the saved session. Inspect the existing files and previous context first. Resume from the last completed point. Do not redo completed work. Work independently until the original task is complete, then run relevant checks and verify the result.
"@
    }

    $isGitRepo = $false
    if (Get-Command git -ErrorAction SilentlyContinue) {
        $gitResult = & git -C $ProjectPath rev-parse --is-inside-work-tree 2>$null
        if ($LASTEXITCODE -eq 0 -and "$gitResult".Trim() -eq "true") {
            $isGitRepo = $true
        }
    }

    $logPath = Join-Path $ProjectPath "codex_auto_resume.log"

    Write-Host ""
    Show-Status "Project: $ProjectPath"
    Show-Status "Log file: $logPath"
    Show-Status "Retry interval: $RetryMinutes minutes"
    if (-not $isGitRepo) {
        Show-Status "This folder is not a Git repository. The safe Codex override will be used."
    }
    Write-Host "Press Ctrl+C to stop."
    Write-Host ""

    $attempt = 0

    while ($true) {
        $attempt++
        Show-Status "Starting attempt $attempt"

        $codexArgs = @(
            "exec",
            "--cd", $ProjectPath,
            "--sandbox", "workspace-write"
        )

        if (-not $isGitRepo) {
            $codexArgs += "--skip-git-repo-check"
        }

        if ($Mode -eq "resume") {
            $codexArgs += @(
                "resume",
                "--last",
                $Task
            )
        }
        else {
            $codexArgs += $Task
        }

        try {
            $output = & $codexCommand.Source @codexArgs 2>&1 |
                Tee-Object -FilePath $logPath -Append

            $exitCode = $LASTEXITCODE
            $outputText = ($output | Out-String)
        }
        catch {
            $exitCode = 1
            $outputText = ($_ | Out-String)
            $outputText | Tee-Object -FilePath $logPath -Append | Write-Host
        }

        if ($exitCode -eq 0) {
            Show-Status "Codex finished successfully."
            break
        }

        $rateLimited = $outputText -match "(?i)(rate.?limit|usage.?limit|limit.?reached|5.?hour|five.?hour|quota|try again.*(later|at|in)|reset.*(at|in))"
        $noSession = $outputText -match "(?i)(no.*session|no.*conversation|session.*not found|no saved)"
        $authProblem = $outputText -match "(?i)(not logged in|authentication required|unauthorized|please log in|login required)"
        $badCommand = $outputText -match "(?i)(unexpected argument|unknown argument|unrecognized option|invalid value)"

        if ($noSession) {
            Stop-WithMessage @"
Codex could not find a saved session for this folder.

Open this project in a terminal and run:
codex resume

Choose the correct session once. After that, run this automatic resume script again.
"@
        }

        if ($authProblem) {
            Stop-WithMessage @"
Codex needs you to sign in.

Open PowerShell and run:
codex login

Then run this script again.
"@
        }

        if ($badCommand) {
            Stop-WithMessage @"
Your installed Codex version rejected a command option.

Update Codex, then run:
codex --version

The complete error is saved here:
$logPath
"@
        }

        if ($rateLimited) {
            Show-Status "The Codex usage limit was detected."
            Show-Status "The saved task will be resumed automatically."
        }
        else {
            Show-Status "Codex exited with code $exitCode."
            Show-Status "The full error is visible above and saved in the log."
        }

        Show-Status "Retrying in $RetryMinutes minutes."
        Start-Sleep -Seconds ($RetryMinutes * 60)

        # A new task becomes a resumable saved task after its first attempt.
        $Mode = "resume"
    }
}
catch {
    Write-Host ""
    Write-Host "The launcher encountered an unexpected error:"
    Write-Host $_
}
finally {
    Write-Host ""
    Read-Host "Press Enter to close"
}
