---
title: 'LiteLLM Hands-on Lab: Start, Call, and Verify Failures'
description: Start a local LiteLLM Proxy with copy-ready configuration, then verify model discovery, chat, invalid authentication, unknown models, and an unreachable upstream.
slug: litellm-hands-on-lab
category: guides
sidebar_position: 22
tags:
  - LiteLLM
  - AI Gateway
  - Lab
  - Troubleshooting
---

This is Stage 3 of the LiteLLM learning path. Read the [beginner guide](./litellm-project-guide.md) and [architecture deep dive](./litellm-architecture-deep-dive.md) first if you want the concepts before the commands.

You will start a LiteLLM Proxy that listens only on your computer and verify one complete request path. The lab deliberately omits a database and Dashboard so that configuration, authentication, logical models, and upstream failures remain easy to distinguish.

> **Cost and credential warning**
>
> The successful chat request calls a real OpenAI model and may incur a small charge. `sk-replace-with-real-key` is a placeholder. It will not work as-is. Never put a real key in `config.yaml`, shell history, or Git.

## Completion criteria

At the end, you should observe that:

- `/v1/models` returns `lab-chat` and `lab-unreachable`.
- `lab-chat` returns an OpenAI-compatible chat response.
- An invalid master key is rejected during Proxy authentication.
- An unknown logical model returns a non-2xx error.
- `lab-unreachable` fails because its upstream cannot be reached.

## 1. Prerequisites

Prepare:

- Python 3.10 or later
- A working OpenAI API key
- Bash (macOS, Linux, or Git Bash) or PowerShell
- `curl`; PowerShell can also use `Invoke-RestMethod`

Check Python:

```bash
python --version
```

**Expected result:** `Python 3.10.x` or later. If your system only provides `python3`, replace `python` with `python3` in later commands.

## 2. Create an isolated environment

Create the lab directory and virtual environment:

```bash
mkdir litellm-lab
cd litellm-lab
python -m venv .venv
```

Activate it.

**Bash:**

```bash
source .venv/bin/activate
```

**PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks local scripts, relax the policy for this process only and retry:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Install LiteLLM with Proxy dependencies:

```bash
python -m pip install --upgrade pip
python -m pip install "litellm[proxy]"
```

Check the CLI:

```bash
litellm --help
```

**Expected result:** the help output includes options such as `--config` and `--port`. If the command is not found, confirm that the virtual environment is active and run `python -m pip show litellm`.

## 3. Create copy-ready configuration

Create `config.yaml` inside `litellm-lab`:

```yaml
model_list:
  - model_name: lab-chat
    litellm_params:
      model: openai/gpt-4o-mini
      api_key: os.environ/OPENAI_API_KEY

  - model_name: lab-unreachable
    litellm_params:
      model: openai/gpt-4o-mini
      api_base: http://127.0.0.1:9/v1
      api_key: not-a-real-key
      timeout: 3

router_settings:
  num_retries: 1
  timeout: 20

litellm_settings:
  drop_params: true

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

This configuration exposes two logical models:

- `lab-chat` reads a real OpenAI key from the environment.
- `lab-unreachable` points to a local port with no listener, producing a stable connection failure without calling a real model.

The `master_key` authenticates clients to this Proxy. It is not the same as the upstream `OPENAI_API_KEY`.

## 4. Set environment variables

Set variables only in the current terminal.

**Bash:**

```bash
export OPENAI_API_KEY="sk-replace-with-real-key"
export LITELLM_MASTER_KEY="sk-local-lab-key"
```

**PowerShell:**

```powershell
$env:OPENAI_API_KEY = "sk-replace-with-real-key"
$env:LITELLM_MASTER_KEY = "sk-local-lab-key"
```

Replace `sk-replace-with-real-key` with your upstream key. `sk-local-lab-key` is only for this local lab and should not be reused in a shared environment.

Verify that the variables exist without printing their values.

**Bash:**

```bash
test -n "$OPENAI_API_KEY" && echo "OPENAI_API_KEY is set"
test -n "$LITELLM_MASTER_KEY" && echo "LITELLM_MASTER_KEY is set"
```

**PowerShell:**

```powershell
if ($env:OPENAI_API_KEY) { "OPENAI_API_KEY is set" }
if ($env:LITELLM_MASTER_KEY) { "LITELLM_MASTER_KEY is set" }
```

**Expected result:** only the two confirmation messages appear; no key material is printed.

## 5. Start the Proxy

Run:

```bash
litellm --config ./config.yaml --host 127.0.0.1 --port 4000
```

Leave this terminal running and open a second terminal for the requests. The second terminal does not need the virtual environment, but it needs `curl`.

**Expected result:** logs show a service listening on `http://127.0.0.1:4000`, with no YAML parsing or missing-variable error.

If port 4000 is occupied, choose another port and update the URLs below.

## 6. Verify model discovery

### Bash / curl

```bash
curl --silent --show-error \
  http://127.0.0.1:4000/v1/models \
  -H "Authorization: Bearer sk-local-lab-key" \
  | python -m json.tool
```

### PowerShell

```powershell
$headers = @{ Authorization = "Bearer sk-local-lab-key" }
$request = @{
  Uri = "http://127.0.0.1:4000/v1/models"
  Headers = $headers
}
Invoke-RestMethod @request | ConvertTo-Json -Depth 8
```

**Expected result:** the JSON `data` array includes at least:

```json
{
  "id": "lab-chat",
  "object": "model"
}
```

It should also include `lab-unreachable`. Discovery proves the configuration was loaded; it does not prove an upstream call succeeds.

## 7. Send a successful chat request

### Bash / curl

```bash
curl --silent --show-error \
  http://127.0.0.1:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-local-lab-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "lab-chat",
    "messages": [
      {"role": "user", "content": "Reply with exactly: LiteLLM works"}
    ],
    "temperature": 0
  }' \
  | python -m json.tool
```

### PowerShell

```powershell
$headers = @{
  Authorization = "Bearer sk-local-lab-key"
  "Content-Type" = "application/json"
}
$body = @{
  model = "lab-chat"
  messages = @(
    @{ role = "user"; content = "Reply with exactly: LiteLLM works" }
  )
  temperature = 0
} | ConvertTo-Json -Depth 8
$request = @{
  Method = "Post"
  Uri = "http://127.0.0.1:4000/v1/chat/completions"
  Headers = $headers
  Body = $body
}
Invoke-RestMethod @request | ConvertTo-Json -Depth 8
```

**Expected result:** HTTP 200 with an OpenAI-compatible structure. Check for:

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "LiteLLM works"
      }
    }
  ]
}
```

The model may add punctuation. The response shape and readable answer matter more than an exact byte-for-byte match. The response normally also includes `model` and `usage` fields.

## 8. Failure check one: invalid master key

Send a request with the wrong client key:

```bash
curl --include --silent --show-error \
  http://127.0.0.1:4000/v1/models \
  -H "Authorization: Bearer sk-wrong-key"
```

**Expected result:** a 401, 403, or another non-2xx authentication status defined by the installed version, with an authentication error. The Proxy log should not show an OpenAI model call.

The failure occurred in the **request processing layer**, before the Router and Provider Adapter.

## 9. Failure check two: unknown logical model

```bash
curl --include --silent --show-error \
  http://127.0.0.1:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-local-lab-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "model-does-not-exist",
    "messages": [{"role": "user", "content": "hello"}]
  }'
```

**Expected result:** a 400, 404, or another non-2xx status defined by the installed version. The error explains that the model or an available Deployment cannot be found.

This proves that clients can only request exposed logical models; an unknown name is not silently forwarded to an arbitrary upstream.

## 10. Failure check three: unreachable upstream

Request the failure model from the configuration:

```bash
curl --include --silent --show-error \
  http://127.0.0.1:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-local-lab-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "lab-unreachable",
    "messages": [{"role": "user", "content": "hello"}]
  }'
```

**Expected result:** after a few seconds, the Proxy returns a non-2xx gateway error. Logs should show a connection failure and may show one retry. You should not see only an authentication or unknown-model error.

This request passed authentication and model matching, then failed while **calling the upstream**. LiteLLM releases may map network exceptions to different HTTP statuses, so verify the failure stage and logs instead of asserting one exact status code.

## 11. Optional failure: invalid upstream API key

To distinguish an unreachable network from provider authentication failure, temporarily add this item under `model_list`:

```yaml
- model_name: lab-bad-provider-key
  litellm_params:
    model: openai/gpt-4o-mini
    api_key: sk-intentionally-invalid
```

Restart the Proxy and request `lab-bad-provider-key`. The provider should reject the credential and the Proxy should convert that rejection to a unified error. Remove this hard-coded placeholder after the check. Production configuration should always reference environment variables or a secret manager.

## 12. Use logs to identify the failing layer

| Symptom | Failure layer | Check first |
| --- | --- | --- |
| Proxy cannot start | Configuration/process | YAML indentation, environment variables, port conflict |
| `/v1/models` returns 401 | Proxy authentication | Bearer key and `master_key` |
| `lab-chat` is missing | Configuration loading | `model_list` and `model_name` |
| Request reports unknown model | Router matching | Request `model` equals the logical model name |
| Connection refused or timeout | Upstream network | `api_base`, DNS, proxy, and firewall |
| Upstream returns 401 | Provider authentication | Provider API key, account, and model access |
| HTTP 200 but client parsing fails | Response contract | `choices`, streaming option, and client version |

Identify the layer before changing configuration. Do not change the model name, key, and network address at the same time, or you lose the causal signal.

## 13. Clean up

Press `Ctrl+C` in the Proxy terminal.

Remove the variables from the current terminal.

**Bash:**

```bash
unset OPENAI_API_KEY
unset LITELLM_MASTER_KEY
cd ..
rm -rf litellm-lab
```

**PowerShell:**

```powershell
Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:LITELLM_MASTER_KEY -ErrorAction SilentlyContinue
Set-Location ..
Remove-Item -Recurse -Force .\litellm-lab
```

Before deleting the directory, verify that the terminal is in its parent directory. If you keep the configuration for study, at least delete the virtual environment and confirm no real credential appears in any file.

## Lab review

You verified three boundaries in one request path:

```text
Invalid master key
  → fails during Proxy authentication

Unknown logical model
  → fails during Router matching

Unreachable upstream
  → fails during the Provider call
```

A useful next experiment is adding a second real Deployment behind one logical model, then observing Retry, Deployment switching, and Fallback. Review the distinctions in the [architecture deep dive](./litellm-architecture-deep-dive.md) before expanding the configuration.
