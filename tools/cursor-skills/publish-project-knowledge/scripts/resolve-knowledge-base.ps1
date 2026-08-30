[CmdletBinding()]
param(
  [string]$RepositoryPath,
  [string]$ConfigPath = (Join-Path (Join-Path $HOME '.cursor') 'publish-project-knowledge.json')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-ConfiguredRepositoryPath {
  param(
    [string]$ExplicitPath,
    [string]$LocalConfigPath
  )

  if (-not [string]::IsNullOrWhiteSpace($ExplicitPath)) {
    return $ExplicitPath
  }

  if (-not [string]::IsNullOrWhiteSpace($env:KNOWLEDGE_BASE_REPOSITORY)) {
    return $env:KNOWLEDGE_BASE_REPOSITORY
  }

  if (-not (Test-Path -LiteralPath $LocalConfigPath -PathType Leaf)) {
    throw "Knowledge-base repository is not configured. Re-run the global Skill installer from the knowledge-base repository."
  }

  try {
    $config = Get-Content -LiteralPath $LocalConfigPath -Raw | ConvertFrom-Json
  }
  catch {
    throw "Knowledge-base configuration is invalid. Re-run the global Skill installer."
  }

  if (
    -not ($config.PSObject.Properties.Name -contains 'knowledgeBaseRepository') -or
    [string]::IsNullOrWhiteSpace([string]$config.knowledgeBaseRepository)
  ) {
    throw "Knowledge-base configuration has no repository path. Re-run the global Skill installer."
  }

  return [string]$config.knowledgeBaseRepository
}

function Resolve-ExistingDirectory {
  param([string]$CandidatePath)

  if (-not (Test-Path -LiteralPath $CandidatePath -PathType Container)) {
    throw "Configured knowledge-base repository does not exist. Re-run the global Skill installer after cloning or moving the repository."
  }

  return (Resolve-Path -LiteralPath $CandidatePath).Path
}

function Invoke-GitValue {
  param(
    [string]$WorkingDirectory,
    [string[]]$Arguments,
    [string]$FailureMessage
  )

  $value = & git -C $WorkingDirectory @Arguments 2>$null
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace(($value | Out-String))) {
    throw $FailureMessage
  }

  return (($value | Select-Object -First 1) -as [string]).Trim()
}

Get-Command git -ErrorAction Stop | Out-Null

$candidate = Get-ConfiguredRepositoryPath -ExplicitPath $RepositoryPath -LocalConfigPath $ConfigPath
$resolvedCandidate = Resolve-ExistingDirectory -CandidatePath $candidate
$repositoryRoot = Invoke-GitValue -WorkingDirectory $resolvedCandidate -Arguments @('rev-parse', '--show-toplevel') -FailureMessage 'Configured knowledge-base path is not a Git repository.'
$resolvedRoot = Resolve-ExistingDirectory -CandidatePath $repositoryRoot

if ($resolvedCandidate -ne $resolvedRoot) {
  throw "Configured knowledge-base path must be the Git repository root."
}

$repositorySkill = Join-Path $resolvedRoot '.cursor\skills\publish-knowledge-base\SKILL.md'
if (-not (Test-Path -LiteralPath $repositorySkill -PathType Leaf)) {
  throw "Configured repository does not contain the publish-knowledge-base Skill. Pull the latest fork/main and try again."
}

$forkPushUrl = Invoke-GitValue -WorkingDirectory $resolvedRoot -Arguments @('remote', 'get-url', '--push', 'fork') -FailureMessage 'Configured repository has no usable fork push remote.'
$allowedForkUrls = @(
  'https://github.com/zj75968-cpu/docusaurus.git',
  'https://github.com/zj75968-cpu/docusaurus',
  'git@github.com:zj75968-cpu/docusaurus.git',
  'git@github.com:zj75968-cpu/docusaurus'
)
if ($forkPushUrl -notin $allowedForkUrls) {
  throw "Configured repository fork remote does not point to zj75968-cpu/docusaurus."
}

Write-Output $resolvedRoot