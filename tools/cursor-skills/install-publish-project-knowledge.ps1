[CmdletBinding()]
param(
  [string]$RepositoryPath,
  [string]$CursorHome = (Join-Path $HOME '.cursor')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$skillName = 'publish-project-knowledge'
$managedMarker = '<!-- managed-by: zj75968-cpu/docusaurus publish-project-knowledge -->'
$sourceSkill = Join-Path $PSScriptRoot $skillName
$sourceSkillFile = Join-Path $sourceSkill 'SKILL.md'
$sourceResolver = Join-Path $sourceSkill 'scripts\resolve-knowledge-base.ps1'

if (
  -not (Test-Path -LiteralPath $sourceSkillFile -PathType Leaf) -or
  -not (Test-Path -LiteralPath $sourceResolver -PathType Leaf)
) {
  throw "Global Skill source is incomplete. Pull the latest fork/main and try again."
}

if ([string]::IsNullOrWhiteSpace($RepositoryPath)) {
  $RepositoryPath = & git -C $PSScriptRoot rev-parse --show-toplevel 2>$null
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace(($RepositoryPath | Out-String))) {
    throw "Unable to locate the knowledge-base repository. Pass -RepositoryPath explicitly."
  }
  $RepositoryPath = (($RepositoryPath | Select-Object -First 1) -as [string]).Trim()
}

$validatedRepository = & $sourceResolver -RepositoryPath $RepositoryPath
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace(($validatedRepository | Out-String))) {
  throw "Knowledge-base repository validation failed before installation."
}
$RepositoryPath = (($validatedRepository | Select-Object -First 1) -as [string]).Trim()

$skillsDirectory = Join-Path $CursorHome 'skills'
$destinationSkill = Join-Path $skillsDirectory $skillName
$destinationSkillFile = Join-Path $destinationSkill 'SKILL.md'
$configPath = Join-Path $CursorHome 'publish-project-knowledge.json'

if (Test-Path -LiteralPath $destinationSkill) {
  if (-not (Test-Path -LiteralPath $destinationSkillFile -PathType Leaf)) {
    throw "The global Skill destination already exists and is not managed by this installer. Remove or rename it manually after review."
  }

  $installedSkill = Get-Content -LiteralPath $destinationSkillFile -Raw
  if ($installedSkill -notmatch [regex]::Escape($managedMarker)) {
    throw "A different global Skill named publish-project-knowledge already exists. It was not overwritten."
  }

  Remove-Item -LiteralPath $destinationSkill -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $skillsDirectory | Out-Null
Copy-Item -LiteralPath $sourceSkill -Destination $destinationSkill -Recurse

$configureScript = Join-Path $destinationSkill 'scripts\configure-knowledge-base.ps1'
if (-not (Test-Path -LiteralPath $configureScript -PathType Leaf)) {
  throw "Installed global Skill is missing its configuration script."
}

& $configureScript -RepositoryPath $RepositoryPath -ConfigPath $configPath
if ($LASTEXITCODE -ne 0) {
  throw "Global Skill installation failed while configuring the repository."
}

Write-Output "Global Skill installed successfully. Reload Cursor to discover /publish-project-knowledge."