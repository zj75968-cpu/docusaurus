---
title: LiteLLM 动手实验：启动、调用并验证故障
description: 用可复制配置启动本地 LiteLLM Proxy，完成模型查询、聊天请求、鉴权失败、错误模型和不可达上游验证。
slug: litellm-hands-on-lab
category: guides
sidebar_position: 22
tags:
  - LiteLLM
  - AI Gateway
  - 实验
  - 故障排查
---

本文是 LiteLLM 三阶段学习路径的第 3 阶段。建议先阅读[入门导读](./litellm-project-guide.md)和[架构深读](./litellm-architecture-deep-dive.md)。

你将启动一个只监听本机的 LiteLLM Proxy，并验证一条完整请求链。实验不需要数据库或 Dashboard，重点是看清配置、鉴权、逻辑模型和上游错误之间的边界。

> **成本与密钥提醒**
>
> 正常聊天请求会调用真实 OpenAI 模型，可能产生少量费用。示例中的 `sk-replace-with-real-key` 是占位符，不可直接使用，也不要把真实密钥写入 `config.yaml`、Shell 历史或 Git。

## 完成标准

完成后，你应能观察到：

- `/v1/models` 返回逻辑模型 `lab-chat` 和 `lab-unreachable`。
- `lab-chat` 返回 OpenAI 兼容的聊天响应。
- 错误 master key 在 Proxy 鉴权阶段被拒绝。
- 不存在的逻辑模型返回非 2xx 错误。
- `lab-unreachable` 因无法连接上游而失败。

## 1. 前置条件

准备以下环境：

- Python 3.10 或更高版本
- 可用的 OpenAI API Key
- Bash（macOS/Linux/Git Bash）或 PowerShell
- `curl`；PowerShell 也可以使用 `Invoke-RestMethod`

确认 Python：

```bash
python --version
```

**预期结果：** 输出 `Python 3.10.x` 或更高版本。如果系统只有 `python3`，后续命令中的 `python` 改为 `python3`。

## 2. 创建隔离环境

新建实验目录并创建虚拟环境：

```bash
mkdir litellm-lab
cd litellm-lab
python -m venv .venv
```

激活环境。

**Bash：**

```bash
source .venv/bin/activate
```

**PowerShell：**

```powershell
.\.venv\Scripts\Activate.ps1
```

如果 PowerShell 阻止本地脚本，可只为当前进程放宽策略后重试：

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

安装带 Proxy 依赖的 LiteLLM：

```bash
python -m pip install --upgrade pip
python -m pip install "litellm[proxy]"
```

检查 CLI：

```bash
litellm --help
```

**预期结果：** 帮助中出现 `--config`、`--port` 等选项。若提示找不到命令，确认虚拟环境已激活，并运行 `python -m pip show litellm`。

## 3. 创建可复制配置

在 `litellm-lab` 目录创建 `config.yaml`：

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

这份配置有两个逻辑模型：

- `lab-chat` 使用环境变量中的真实 OpenAI Key。
- `lab-unreachable` 指向本机未监听的端口，用于稳定制造连接失败，不会请求真实模型。

`master_key` 是客户端访问当前 Proxy 的密钥，与上游 `OPENAI_API_KEY` 不是同一个概念。

## 4. 设置环境变量

只在当前终端设置变量。

**Bash：**

```bash
export OPENAI_API_KEY="sk-replace-with-real-key"
export LITELLM_MASTER_KEY="sk-local-lab-key"
```

**PowerShell：**

```powershell
$env:OPENAI_API_KEY = "sk-replace-with-real-key"
$env:LITELLM_MASTER_KEY = "sk-local-lab-key"
```

把 `sk-replace-with-real-key` 替换成真实上游 Key。`sk-local-lab-key` 只用于本机实验，也不要在共享环境中沿用。

确认变量是否存在时，不要打印完整值。

**Bash：**

```bash
test -n "$OPENAI_API_KEY" && echo "OPENAI_API_KEY is set"
test -n "$LITELLM_MASTER_KEY" && echo "LITELLM_MASTER_KEY is set"
```

**PowerShell：**

```powershell
if ($env:OPENAI_API_KEY) { "OPENAI_API_KEY is set" }
if ($env:LITELLM_MASTER_KEY) { "LITELLM_MASTER_KEY is set" }
```

**预期结果：** 只显示两个变量已设置，不出现密钥内容。

## 5. 启动 Proxy

运行：

```bash
litellm --config ./config.yaml --host 127.0.0.1 --port 4000
```

保持这个终端运行，再打开第二个终端执行后续请求。第二个终端不需要激活虚拟环境，但需要 `curl`。

**预期结果：** 日志显示服务监听 `http://127.0.0.1:4000`，且没有 YAML 解析或缺少环境变量错误。

如果 4000 端口被占用，改成其他端口，并同步修改下文 URL。

## 6. 验证模型列表

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

**预期结果：** JSON 的 `data` 数组中至少出现：

```json
{
  "id": "lab-chat",
  "object": "model"
}
```

以及 `lab-unreachable`。模型能被列出只证明配置已加载，不证明上游可调用。

## 7. 发送正常聊天请求

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

**预期结果：** HTTP 200，并返回 OpenAI 兼容结构。重点检查：

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

模型可能带少量标点；结构和可读内容比逐字一致更重要。响应通常还包含 `model` 与 `usage` 字段。

## 8. 故障验证一：错误 master key

发送相同请求，但使用错误的调用方 Key：

```bash
curl --include --silent --show-error \
  http://127.0.0.1:4000/v1/models \
  -H "Authorization: Bearer sk-wrong-key"
```

**预期结果：** 返回 401、403 或当前版本定义的其他非 2xx 鉴权状态，并包含认证相关错误。Proxy 日志中不应出现对 OpenAI 的模型调用。

这证明失败发生在**请求处理层**，还没有进入 Router 和 Provider Adapter。

## 9. 故障验证二：错误逻辑模型名

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

**预期结果：** 返回 400、404 或当前版本定义的其他非 2xx 状态；错误信息指出找不到模型或可用 Deployment。

这证明客户端只能请求配置中暴露的逻辑模型，错误名称不会被静默转发到任意上游。

## 10. 故障验证三：不可达上游

请求配置中的故障模型：

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

**预期结果：** 等待数秒后返回非 2xx 网关错误。Proxy 日志应显示连接失败，并可能显示 1 次重试；不能只看到鉴权错误或“模型不存在”。

这证明请求已经通过鉴权和模型匹配，在**调用上游**时失败。不同 LiteLLM 版本可能把网络异常映射为不同 HTTP 状态，因此应验证错误阶段和日志，而不是只断言一个状态码。

## 11. 可选故障：错误上游 API Key

要区分“网络不可达”和“上游拒绝鉴权”，可临时在 `config.yaml` 增加：

```yaml
- model_name: lab-bad-provider-key
  litellm_params:
    model: openai/gpt-4o-mini
    api_key: sk-intentionally-invalid
```

重启 Proxy 后请求 `lab-bad-provider-key`。预期结果是上游返回认证失败，Proxy 再把它转换为统一错误。验证完成后删除这段硬编码占位 Key；生产配置始终引用环境变量或密钥管理服务。

## 12. 用日志定位失败层次

| 现象                    | 失败层次      | 首先检查                        |
| ----------------------- | ------------- | ------------------------------- |
| Proxy 无法启动          | 配置/进程     | YAML 缩进、环境变量、端口占用   |
| `/v1/models` 返回 401   | Proxy 鉴权    | Bearer Key 与 `master_key`      |
| 模型列表没有 `lab-chat` | 配置加载      | `model_list` 与 `model_name`    |
| 请求提示模型不存在      | Router 匹配   | 请求 `model` 是否等于逻辑模型名 |
| 连接被拒绝或超时        | 上游网络      | `api_base`、DNS、代理、防火墙   |
| 上游返回 401            | Provider 鉴权 | 上游 API Key、账号和模型权限    |
| HTTP 200 但应用解析失败 | 响应契约      | `choices`、流式设置与客户端版本 |

排查时先确定失败发生在哪一层，再修改对应配置。不要同时更换模型名、Key 和网络地址，否则会失去因果关系。

## 13. 清理实验

在运行 Proxy 的终端按 `Ctrl+C` 停止服务。

清除当前终端中的变量。

**Bash：**

```bash
unset OPENAI_API_KEY
unset LITELLM_MASTER_KEY
cd ..
rm -rf litellm-lab
```

**PowerShell：**

```powershell
Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:LITELLM_MASTER_KEY -ErrorAction SilentlyContinue
Set-Location ..
Remove-Item -Recurse -Force .\litellm-lab
```

删除目录前确认终端当前确实位于它的父目录。若想保留配置复习，至少删除虚拟环境，并确认文件中没有真实密钥。

## 实验复盘

你刚刚验证了同一条请求链的三个边界：

```text
错误 master key
  → 在 Proxy 鉴权阶段失败

错误逻辑模型名
  → 在 Router 匹配阶段失败

不可达上游
  → 在 Provider 调用阶段失败
```

下一步可以为同一个逻辑模型增加第二个真实 Deployment，再观察 Retry、Deployment 切换和 Fallback。扩展前先回到[架构深读](./litellm-architecture-deep-dive.md)，明确三种恢复动作的区别。
