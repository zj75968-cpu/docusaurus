[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$RepositoryPath,
  [string]$ConfigPath = (Join-Path (Join-Path $HOME '.cursor') 'publish-project-knowledge.json'),
  [string]$ResolverPath = (Join-Path $PSScriptRoot 'resolve-knowledge-base.ps1')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $ResolverPath -PathType Leaf)) {
  throw "Knowledge-base resolver is missing from the Skill installation."
}

$resolvedRepository = & $ResolverPath -RepositoryPath $RepositoryPath -ConfigPath $ConfigPath
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace(($resolvedRepository | Out-String))) {
  throw "Knowledge-base repository validation failed."
}
$resolvedRepository = (($resolvedRepository | Select-Object -First 1) -as [string]).Trim()

$configDirectory = Split-Path -Parent $ConfigPath
if ([string]::IsNullOrWhiteSpace($configDirectory)) {
  throw "Configuration path must have a parent directory."
}
New-Item -ItemType Directory -Force -Path $configDirectory | Out-Null

$config = [ordered]@{
  version = 1
  knowledgeBaseRepository = $resolvedRepository
}
$config | ConvertTo-Json | Set-Content -LiteralPath $ConfigPath -Encoding UTF8

Write-Output "Knowledge-base repository configured successfully."