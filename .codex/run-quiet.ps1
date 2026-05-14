param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string] $Executable,

    [Parameter(Position = 1, ValueFromRemainingArguments = $true)]
    [string[]] $Arguments,

    [string] $LogDirectory = ".logs",

    [int] $TailLines = 120
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $LogDirectory)) {
    New-Item -ItemType Directory -Path $LogDirectory | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$command = @($Executable) + @($Arguments)
$commandText = $command -join " "
$safeName = $commandText -replace "[^\w.-]+", "_"
if ($safeName.Length -gt 80) {
    $safeName = $safeName.Substring(0, 80)
}

$logPath = Join-Path $LogDirectory "$timestamp-$safeName.log"

"Command: $commandText" | Set-Content -LiteralPath $logPath
"Started: $(Get-Date -Format o)" | Add-Content -LiteralPath $logPath
"" | Add-Content -LiteralPath $logPath

$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"
try {
    & $Executable @Arguments *>> $logPath
} finally {
    $ErrorActionPreference = $previousErrorActionPreference
}
$exitCode = if ($null -eq $LASTEXITCODE) { 0 } else { $LASTEXITCODE }

"" | Add-Content -LiteralPath $logPath
"Finished: $(Get-Date -Format o)" | Add-Content -LiteralPath $logPath
"ExitCode: $exitCode" | Add-Content -LiteralPath $logPath

if ($exitCode -eq 0) {
    Write-Host "PASS: $commandText"
    Write-Host "Log: $logPath"
    exit 0
}

Write-Host "FAIL($exitCode): $commandText"
Write-Host "Log: $logPath"
Write-Host "---- tail $TailLines ----"
Get-Content -LiteralPath $logPath -Tail $TailLines
exit $exitCode
