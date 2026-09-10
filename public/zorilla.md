# zorilla, for agents

zorilla runs automations on one person's own machine. An automation is a JSON file:
steps, and wires between them. This file lists every step, what it takes, and the rules
the engine enforces. It is generated from the running catalogue.

Steps: 51. Integrations: 17. Generated 2026-09-10.

For anything this file does not cover, read https://zorilla.io/docs.

## The file

```json
{
  "name": "eth price to discord",
  "folder": "Examples",
  "active": false,
  "nodes": [
    {
      "id": "clock",
      "type": "core.schedule",
      "params": {
        "mode": "every",
        "every": 10,
        "unit": "minutes"
      },
      "position": {
        "x": 60,
        "y": 200
      }
    },
    {
      "id": "price",
      "type": "coingecko.price",
      "params": {
        "ids": "ethereum",
        "currency": "usd"
      },
      "position": {
        "x": 330,
        "y": 200
      }
    },
    {
      "id": "post",
      "type": "discord.post",
      "params": {
        "credential": "signals_webhook",
        "content": "ETH ${{ $json.ethereum.usd }}"
      },
      "position": {
        "x": 600,
        "y": 200
      }
    }
  ],
  "edges": [
    {
      "from": "clock",
      "fromPort": "main",
      "to": "price",
      "toPort": "main"
    },
    {
      "from": "price",
      "fromPort": "main",
      "to": "post",
      "toPort": "main"
    }
  ]
}
```

`name` is required. `folder` and `active` are optional: `folder` groups it in the
workspace, `active` decides whether its trigger runs on its own. An imported
automation always arrives with `active` false whatever the file says.

## Rules

- Every step takes a list of items and returns a list of items. An item is `{ "json": { ... } }`, and may also carry `binary` for files.
- A step returning nothing passes its input through. A step returning `[]` passes nothing on, and every step after it is skipped.
- A step that receives no items does not run at all; the log marks it skipped.
- Cycles are refused before a run starts. There is no loop step.
- Exactly one step should have category `trigger`. Without one, nothing starts.
- `{{ ... }}` in any parameter is JavaScript over `$json` (this item), `$items`, `$index`, `$now`, `$creds`.
- A parameter that is only an expression keeps its type: `{{ $json.n * 2 }}` stays a number. A parameter with text around it, or with more than one expression in it, becomes a string.
- A step receives only the keys named on it. `$creds` holds nothing else.
- Amounts from chain steps are integers, handed on as strings. Do not put them through a float.
- Every step may set `retries` (0-5), `retryWait` (milliseconds) and `onError`: `stop`, `continue`, or `errorOutput`. With `errorOutput` the step grows a second port named `error` carrying `{ error, step, at }`.
- Steps that read a list keep asking for pages until they have `limit` items, and say in the log whether more were left.
- Steps whose category is `trigger` and which poll (marked below) fire on their own timer and pass on only what they have not seen before.

## Shapes there is no step for

Two things people ask for often and the engine cannot express. Reach for
`code.js` and say so, rather than looking for a step that is not there.

- **Many items into one.** Nothing collapses a list. `transform.set` runs per item and the `logic.*` steps only drop items. A digest — one email built from twenty stories — has to go through `code.js`.
- **A time of day.** `core.schedule` in `every` mode has no clock: it fires every N minutes, hours or days counted from when it was switched on. `at` belongs to `once` mode, which runs one time and stops. "Every morning at 9" is not expressible.

## Keys

A step names a key; it never carries the value. The person installing it binds that name
to their own saved key. Use plain names like `my_slack`, `signals_webhook`.

## Steps

### action

- **`gmail.send`** (action) — From your Gmail, with an app password. Check Spam and All Mail for the first one.
  - `credential`, credential, a saved gmail key — Gmail key
  - `to`, text — To
  - `subject`, text — Subject
  - `html`, textarea — Message
- **`net.http`** (action) — Calls a URL, passes the response on.
  - `method`, select, default "GET", one of: GET, POST, PUT, PATCH, DELETE — Method. GET reads, POST sends. The rest are for services that ask for them.
  - `url`, text — URL. The whole address, including https://. Expressions work: .../users/{{ $json.id }}.
  - `credential`, credential — Use a saved key. Adds what the service needs to authenticate. No header to write.
  - `headers`, keyvalue — Extra headers. Anything the service asks for beyond the key, like Accept or a version header.
  - `sendBody`, boolean, default false — Send a body. Off for a GET. On when you are sending something with the request.
  - `bodyType`, select, default "json", one of: json, text, form — Body format. Json for most APIs, form for old ones that want name=value pairs.
  - `body`, textarea — Body. What to send. Expressions work here too.
  - `timeout`, number, default 30 — Timeout (seconds). How long to wait before giving up on a service that is not answering.
  - `failOnError`, boolean, default true — Stop on an error status. On, a 404 or a 500 fails the step. Off, the answer carries on with ok: false so a later step can decide.

### Airtable

Records in a base. Contacts: api.airtable.com.

- **`airtable.create`** (action) — Add an Airtable record
  - `credential`, credential, a saved airtable key — Airtable key
  - `baseId`, text — Base id
  - `table`, text — Table
  - `fields`, keyvalue — Fields
- **`airtable.list`** (action) — One item per record.
  - `credential`, credential, a saved airtable key — Airtable key
  - `baseId`, text — Base id
  - `table`, text — Table
  - `limit`, number, default 100 — How many at most. zorilla keeps asking for more pages until it has this many, and says in the log whether any were left behind.
- **`airtable.newRecord`** (trigger, polls) — Fires when a record is added. One item per record.
  - `credential`, credential, a saved airtable key — Airtable key
  - `baseId`, text — Base id
  - `table`, text — Table
  - `every`, number, default 5 — Check every
  - `unit`, select, default "minutes", one of: minutes, hours, days — Unit

### Claude

Anthropic's models. Contacts: api.anthropic.com.

- **`anthropic.ask`** (action) — Ask Claude
  - `credential`, credential, a saved anthropic key — Claude key
  - `prompt`, textarea — Prompt. Put {{ $json.field }} in here to feed it whatever the previous step produced.
  - `model`, text, default "claude-sonnet-5" — Model. claude-opus-5, claude-sonnet-5, claude-haiku-4-5-20251001, claude-fable-5-1
  - `system`, textarea — Instructions. Optional. How it should behave.
  - `maxTokens`, number, default 1024 — Longest reply

### CoinGecko

Coin prices. Needs no key. Contacts: api.coingecko.com.

- **`coingecko.price`** (action) — Current price of one or more coins.
  - `ids`, text, default "ethereum" — Coins. CoinGecko ids, comma separated. ethereum, bitcoin, solana.
  - `currency`, text, default "usd" — In

### DeepSeek

DeepSeek's models. Contacts: api.deepseek.com.

- **`deepseek.ask`** (action) — Ask DeepSeek
  - `credential`, credential, a saved deepseek key — DeepSeek key
  - `prompt`, textarea — Prompt. Put {{ $json.field }} in here to feed it whatever the previous step produced.
  - `model`, text, default "deepseek-chat" — Model. deepseek-chat, deepseek-reasoner

### Discord

Post through a channel webhook. Contacts: a web address you provide (Webhook URL).

- **`discord.post`** (action) — Post to Discord
  - `credential`, credential, a saved discord key — Discord key
  - `content`, textarea — Message
  - `username`, text — Show as. Optional. Overrides the webhook's name.

### Etherscan

Transaction history, which a node cannot give you. Contacts: api.etherscan.io.

- **`etherscan.transactions`** (web3) — One item per transaction, newest first.
  - `credential`, credential, a saved etherscan key — Etherscan key
  - `address`, text — Wallet address
  - `chainId`, select, default "1", one of: 1, 11155111 — Network
  - `limit`, number, default 100 — How many at most. zorilla keeps asking for more pages until it has this many, and says in the log whether any were left behind.

### Gemini

Google's models. Contacts: generativelanguage.googleapis.com.

- **`gemini.ask`** (action) — Ask Gemini
  - `credential`, credential, a saved gemini key — Gemini key
  - `prompt`, textarea — Prompt. Put {{ $json.field }} in here to feed it whatever the previous step produced.
  - `model`, text, default "gemini-2.0-flash" — Model. gemini-2.0-flash, gemini-1.5-pro

### Hacker News

Stories about anything you name. Needs no key. Contacts: hn.algolia.com.

- **`hackernews.newStory`** (trigger, polls) — Fires when a story about your subject appears. Says nothing about the ones it has already mentioned.
  - `query`, text, default "ethereum" — About. What the story should be about. Robinhood Chain, base, stablecoins.
  - `minPoints`, number, default 0 — At least this many points
  - `every`, number, default 5 — Check every
  - `unit`, select, default "minutes", one of: minutes, hours, days — Unit
- **`hackernews.search`** (action) — Newest stories matching a word or phrase. One item per story.
  - `query`, text, default "ethereum" — About. What the story should be about. Robinhood Chain, base, stablecoins.
  - `tags`, select, default "story", one of: story, front_page, show_hn, ask_hn — Kind
  - `minPoints`, number, default 0 — At least this many points
  - `limit`, number, default 20 — How many

### logic

- **`logic.changed`** (logic) — Passes an item on only when this value is different from last time. Without it, a check every ten minutes tells you the same thing every ten minutes.
  - `value`, text — Watch this. The value being compared with last time. A true or false expression works, and so does a plain number.
  - `direction`, select, default "becomesTrue", one of: becomesTrue, becomesFalse, changes — Pass it on when
  - `key`, text — Track separately by. Optional. {{ $json.address }} tracks each wallet on its own.
- **`logic.filter`** (logic) — Keeps the items that match.
  - `value`, text — Value. Tested on every item. The ones that fail are dropped, not sent down another path.
  - `operation`, select, default "isNotEmpty", one of: equals, notEquals, contains, notContains, greater, less, isEmpty, isNotEmpty, isTrue — Condition
  - `compare`, text — Compared with
- **`logic.if`** (logic) — Two paths: true and false.
  - ports: true, false
  - `value`, text — Value. The thing being tested, usually a field from the step before.
  - `operation`, select, default "equals", one of: equals, notEquals, contains, notContains, greater, less, isEmpty, isNotEmpty, isTrue — Condition
  - `compare`, text — Compared with. What to test it against. Numbers compare as numbers.
- **`logic.moved`** (logic) — Passes on when a number has moved far enough since the last time it said so. 5 percent, or 100 of whatever the number counts.
  - `value`, text — Watch this. A number. Anything else and the step will say so rather than guess.
  - `amount`, number, default 5 — Moved by at least. How far it has to move before this says anything.
  - `unit`, select, default "percent", one of: percent, absolute — Measured in
  - `direction`, select, default "either", one of: either, up, down — Which way
  - `key`, text — Track separately by. Optional. {{ $json.symbol }} follows each coin on its own.
- **`logic.once`** (logic) — Passes something on once and never again. Keyed on whatever makes two things the same, like a transaction hash.
  - `key`, text — Same thing means. Optional. {{ $json.transactionHash }} = once per transaction, not once ever.

### Notion

Databases and pages. Contacts: api.notion.com.

- **`notion.createPage`** (action) — Add a Notion page
  - `credential`, credential, a saved notion key — Notion key
  - `databaseId`, text — Database id
  - `properties`, code, default "{\n  \"Name\": { \"title\": [{ \"text\": { \"content\": \"Hello\" } }] }\n}" — Properties. Notion's own property shape. Copy one from their docs and edit it.
- **`notion.newRow`** (trigger, polls) — Fires when a row is added to a database. One item per row.
  - `credential`, credential, a saved notion key — Notion key
  - `databaseId`, text — Database id
  - `every`, number, default 5 — Check every
  - `unit`, select, default "minutes", one of: minutes, hours, days — Unit
- **`notion.query`** (action) — One item per row.
  - `credential`, credential, a saved notion key — Notion key
  - `databaseId`, text — Database id
  - `limit`, number, default 100 — How many at most. zorilla keeps asking for more pages until it has this many, and says in the log whether any were left behind.

### ChatGPT

OpenAI's models. Contacts: api.openai.com.

- **`openai.ask`** (action) — Ask ChatGPT
  - `credential`, credential, a saved openai key — ChatGPT key
  - `prompt`, textarea — Prompt. Put {{ $json.field }} in here to feed it whatever the previous step produced.
  - `model`, text, default "gpt-4o-mini" — Model. gpt-4o, gpt-4o-mini, o3-mini
  - `maxTokens`, number, default 1024 — Longest reply

### output

- **`file.save`** (output) — Writes a file the run is carrying into your zorilla files folder.
  - `which`, text, default "file" — Which file. The name it travels under. Downloads arrive as "file".
  - `name`, text — Save it as. Leave blank to keep its own name.
- **`flow.stop`** (output) — Switches the automation off from inside, once it has done what it was for. A one-shot alert that should not fire twice ends here.
  - `reason`, text — Why. Written into the run log, so next week you know why it stopped.
- **`output.log`** (output) — Writes a line to the run log.
  - `message`, text, default "{{ $json }}" — Message. Written into the run log. Leave it as {{ $json }} to see everything the last step sent.

### Resend

Email built for automations. Contacts: api.resend.com.

- **`resend.send`** (action) — Sends one email per item, with any files the item is carrying. Check Spam and All Mail for the first one.
  - `credential`, credential, a saved resend key — Resend key
  - `to`, text — To
  - `subject`, text — Subject
  - `html`, textarea — Message
  - `from`, text — From. Leave blank to use the sender saved with the key.

### Slack

Post into a channel. Contacts: slack.com.

- **`slack.post`** (action) — Posts one message per item.
  - `credential`, credential, a saved slack key — Slack key
  - `channel`, text — Channel
  - `text`, textarea — Message

### Stripe

Payments data. Contacts: api.stripe.com.

- **`stripe.charges`** (action) — One item per payment.
  - `credential`, credential, a saved stripe key — Stripe key
  - `limit`, number, default 100 — How many at most. zorilla keeps asking for more pages until it has this many, and says in the log whether any were left behind.
- **`stripe.customers`** (action) — One item per customer.
  - `credential`, credential, a saved stripe key — Stripe key
  - `limit`, number, default 100 — How many at most. zorilla keeps asking for more pages until it has this many, and says in the log whether any were left behind.
- **`stripe.newCharge`** (trigger, polls) — Fires when a payment goes through. One item per payment.
  - `credential`, credential, a saved stripe key — Stripe key
  - `every`, number, default 5 — Check every
  - `unit`, select, default "minutes", one of: minutes, hours, days — Unit

### Supabase

Read and write rows in your database. Contacts: a web address you provide (Project URL).

- **`supabase.insert`** (action) — Add a row (Supabase)
  - `credential`, credential, a saved supabase key — Supabase key
  - `table`, text — Table
  - `row`, keyvalue — Fields
- **`supabase.select`** (action) — One item per row.
  - `credential`, credential, a saved supabase key — Supabase key
  - `table`, text — Table
  - `columns`, text, default "*" — Columns
  - `limit`, number, default 100 — How many at most. zorilla keeps asking for more pages until it has this many, and says in the log whether any were left behind.

### Telegram

Send messages from a bot, and hear back. Contacts: api.telegram.org.

- **`telegram.messages`** (trigger, polls) — Fires when somebody messages your bot. One item per message.
  - `credential`, credential, a saved telegram key — Telegram key
  - `every`, number, default 5 — Check every
  - `unit`, select, default "minutes", one of: minutes, hours, days — Unit
- **`telegram.send`** (action) — Send a Telegram message
  - `credential`, credential, a saved telegram key — Telegram key
  - `text`, textarea — Message
  - `chatId`, text — Chat id. Leave blank to use the one saved with the key.

### transform

- **`code.js`** (transform) — Your own JavaScript over the items, in a process of its own.
  - `code`, code, default "return items.map(item => ({ json: { ...item.json } }))" — Code. Gets items, $creds, log. Return [{ json }], or nothing to pass through.
  - `credential`, credential — Key it may use. Optional. Only the key you pick here is handed across.
  - `timeout`, number, default 15 — Stop it after (seconds)
- **`file.fromText`** (transform) — Turns text into a file, so a spreadsheet or report can be attached to an email.
  - `text`, textarea — Contents. Expressions work, so a step before this can build the rows.
  - `name`, text, default "report.csv" — File name. Ending in .csv makes it a spreadsheet when it lands in somebody's email.
  - `as`, text, default "file" — Carry it as
- **`file.read`** (transform) — Picks up a file from your zorilla files folder so a later step can send it.
  - `name`, text — File name. A file in your zorilla files folder. Nowhere else on the machine.
  - `as`, text, default "file" — Carry it as. The name it travels under, so a later step can say which file it means.
  - `asText`, boolean, default false — Also read it as text. Puts the contents in the item as well, for a csv you want to read rather than send.
- **`transform.set`** (transform) — Adds or replaces fields on every item.
  - `fields`, keyvalue — Fields. A bare expression keeps its type: {{ $json.n * 2 }} stays a number.
  - `keepOnly`, boolean, default false — Drop the other fields

### trigger

- **`core.manual`** (trigger) — Runs when you press run.
- **`core.schedule`** (trigger) — Runs on a repeat, or once at a set time.
  - `mode`, select, default "every", one of: every, once — When
  - `every`, number, default 15 — Run every
  - `unit`, select, default "minutes", one of: minutes, hours, days — Unit
  - `at`, datetime — Date and time. Runs once when this time passes, then never again. A time already gone runs at the next start.
- **`core.webhook`** (trigger) — Runs when something calls a URL on this machine.
  - `path`, text, default "my-hook" — Path. The address ends /hook/<path>. Local only until you put a tunnel in front of it.
  - `secret`, text — Secret. Optional, and worth setting the moment this is reachable from the internet. The caller has to send it as ?secret=… or an X-Zorilla-Secret header.
  - `method`, select, default "POST", one of: GET, POST, PUT, DELETE — Method

### Twilio

Text messages. Contacts: api.twilio.com.

- **`twilio.sendSms`** (action) — Sends one text message per item.
  - `credential`, credential, a saved twilio key — Twilio key
  - `to`, text — To. Include the country code. Trial accounts can only text verified numbers.
  - `body`, textarea — Message

### web3

- **`web3.balance`** (web3) — How much ETH a wallet holds.
  - `chain`, select, default "ethereum", one of: ethereum, sepolia — Network
  - `address`, text — Wallet or ENS name
  - `rpc`, credential, a saved evmRpc key — RPC endpoint. Optional. Public endpoints rate limit.
- **`web3.ens`** (web3) — Name to address, or back.
  - `direction`, select, default "resolve", one of: resolve, reverse — Direction
  - `value`, text — Name or address
  - `rpc`, credential, a saved evmRpc key — RPC endpoint. Optional. Public endpoints rate limit.
- **`web3.erc20Balance`** (web3) — How much of one token a wallet holds.
  - `chain`, select, default "ethereum", one of: ethereum, sepolia — Network
  - `token`, text — Token contract
  - `address`, text — Wallet or ENS name
  - `rpc`, credential, a saved evmRpc key — RPC endpoint. Optional. Public endpoints rate limit.
- **`web3.gas`** (web3) — What a transaction costs to send right now.
  - `chain`, select, default "ethereum", one of: ethereum, sepolia — Network
  - `rpc`, credential, a saved evmRpc key — RPC endpoint. Optional. Public endpoints rate limit.
- **`web3.logs`** (web3) — Recent events from a contract. One item each.
  - `chain`, select, default "ethereum", one of: ethereum, sepolia — Network
  - `address`, text — Contract address
  - `event`, text — Event
  - `match`, keyvalue — Only where. An indexed argument and the value to match. to = your wallet gives you only transfers that landed there. Without this a busy token returns every transfer on the network.
  - `blocks`, number, default 1000 — Recent blocks. Public endpoints cap this. A few thousand is the ceiling.
  - `rpc`, credential, a saved evmRpc key — RPC endpoint. Optional. Public endpoints rate limit.
- **`web3.prepare`** (web3) — What a transaction would do and cost. Sends nothing.
  - `chain`, select, default "ethereum", one of: ethereum, sepolia — Network
  - `from`, text — Send from
  - `to`, text — Send to
  - `value`, text, default "0" — ETH to send
  - `signature`, text — Contract function. Leave blank to send plain ETH.
  - `args`, list — Values
  - `reason`, text — What it is for. Shown before anyone approves it.
  - `rpc`, credential, a saved evmRpc key — RPC endpoint. Optional. Public endpoints rate limit.
- **`web3.read`** (web3) — Asks a contract a question. Costs nothing.
  - `chain`, select, default "ethereum", one of: ethereum, sepolia — Network
  - `address`, text — Contract address
  - `signature`, text — Function
  - `args`, list — Values. In the order the function takes them.
  - `rpc`, credential, a saved evmRpc key — RPC endpoint. Optional. Public endpoints rate limit.

### X

Post to X, and search what is being said. Contacts: api.x.com.

- **`x.post`** (action) — Posts one message per item. 280 characters.
  - `credential`, credential, a saved x key — X key
  - `text`, textarea — Message
- **`x.search`** (action) — Recent posts matching a search. One item per post.
  - `credential`, credential, a saved x key — X key
  - `query`, text — Search for
  - `limit`, number, default 25 — How many at most. zorilla keeps asking for more pages until it has this many.

## Keys you can save

- `airtable` — Airtable: token
- `anthropic` — Claude: apiKey
- `apiHeader` — API key in a header: name, value
- `bearer` — Bearer token: token
- `deepseek` — DeepSeek: apiKey
- `discord` — Discord: webhookUrl
- `etherscan` — Etherscan: apiKey
- `evmRpc` — Ethereum RPC: url
- `gemini` — Gemini: apiKey
- `generic` — Anything else
- `github` — GitHub: token
- `gmail` — Gmail: user, appPassword
- `notion` — Notion: token
- `openai` — ChatGPT: apiKey
- `resend` — Resend: apiKey, from (optional)
- `slack` — Slack: botToken
- `stripe` — Stripe: secretKey
- `supabase` — Supabase: url, serviceKey
- `telegram` — Telegram: botToken, chatId (optional)
- `twilio` — Twilio: accountSid, authToken, fromNumber
- `x` — X: accessToken

## Working examples

### demo02: contract numbers by email

Reads a number straight off a contract every morning and emails it to you. This one reads how much USDC exists; change the address and the function line to read anything else. Needs a Resend key named resend_key.

```json
{
  "nodes": [
    {
      "id": "clock",
      "type": "core.schedule",
      "params": {
        "mode": "every",
        "every": 1,
        "unit": "days"
      },
      "position": {
        "x": 40,
        "y": 170
      }
    },
    {
      "id": "read",
      "type": "web3.read",
      "params": {
        "chain": "ethereum",
        "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "signature": "function totalSupply() view returns (uint256)",
        "args": [],
        "rpc": ""
      },
      "position": {
        "x": 300,
        "y": 170
      }
    },
    {
      "id": "mail",
      "type": "resend.send",
      "params": {
        "credential": "resend_key",
        "to": "you@example.com",
        "subject": "USDC supply today",
        "html": "<p>{{ $json.result }}</p>",
        "from": ""
      },
      "position": {
        "x": 560,
        "y": 170
      }
    }
  ],
  "edges": [
    {
      "from": "clock",
      "fromPort": "main",
      "to": "read",
      "toPort": "main"
    },
    {
      "from": "read",
      "fromPort": "main",
      "to": "mail",
      "toPort": "main"
    }
  ]
}
```

### demo03: daily digest email

One mail a day. Needs a saved Gmail key named gmail_key — an app password, not your account password.

```json
{
  "nodes": [
    {
      "id": "clock",
      "type": "core.schedule",
      "params": {
        "mode": "every",
        "every": 1,
        "unit": "days"
      },
      "position": {
        "x": 40,
        "y": 170
      }
    },
    {
      "id": "price",
      "type": "coingecko.price",
      "params": {
        "ids": "ethereum,bitcoin",
        "currency": "usd"
      },
      "position": {
        "x": 300,
        "y": 170
      }
    },
    {
      "id": "gas",
      "type": "web3.gas",
      "params": {
        "chain": "ethereum"
      },
      "position": {
        "x": 300,
        "y": 320
      }
    },
    {
      "id": "mail",
      "type": "gmail.send",
      "params": {
        "credential": "gmail_key",
        "to": "you@example.com",
        "subject": "morning digest",
        "html": "ETH {{ $json.ethereum.usd }} · BTC {{ $json.bitcoin.usd }}"
      },
      "position": {
        "x": 820,
        "y": 170
      }
    }
  ],
  "edges": [
    {
      "from": "clock",
      "fromPort": "main",
      "to": "price",
      "toPort": "main"
    },
    {
      "from": "clock",
      "fromPort": "main",
      "to": "gas",
      "toPort": "main"
    },
    {
      "from": "price",
      "fromPort": "main",
      "to": "mail",
      "toPort": "main"
    }
  ]
}
```

### demo04: eth price to discord

Every 10 minutes. The channel is whichever one you made the webhook in, so a webhook made in #signals posts to #signals. Needs a key named discord_key.

```json
{
  "nodes": [
    {
      "id": "clock",
      "type": "core.schedule",
      "params": {
        "mode": "every",
        "every": 10,
        "unit": "minutes"
      },
      "position": {
        "x": 40,
        "y": 170
      }
    },
    {
      "id": "price",
      "type": "coingecko.price",
      "params": {
        "ids": "ethereum",
        "currency": "usd"
      },
      "position": {
        "x": 300,
        "y": 170
      }
    },
    {
      "id": "post",
      "type": "discord.post",
      "params": {
        "credential": "discord_key",
        "content": "ETH ${{ $json.ethereum.usd }}",
        "username": "zorilla"
      },
      "position": {
        "x": 560,
        "y": 170
      }
    }
  ],
  "edges": [
    {
      "from": "clock",
      "fromPort": "main",
      "to": "price",
      "toPort": "main"
    },
    {
      "from": "price",
      "fromPort": "main",
      "to": "post",
      "toPort": "main"
    }
  ]
}
```

### demo05: eth price watch

The one to press run on first. It reads the ETH price and writes it in the run log every time, and only says something separate when the price has moved 5% since it last mentioned it. Needs no keys.

```json
{
  "nodes": [
    {
      "id": "clock",
      "type": "core.schedule",
      "params": {
        "mode": "every",
        "every": 10,
        "unit": "minutes"
      },
      "position": {
        "x": 40,
        "y": 170
      }
    },
    {
      "id": "price",
      "type": "coingecko.price",
      "params": {
        "ids": "ethereum",
        "currency": "usd"
      },
      "position": {
        "x": 300,
        "y": 170
      }
    },
    {
      "id": "now",
      "type": "output.log",
      "params": {
        "message": "ETH is ${{ $json.ethereum.usd }}"
      },
      "position": {
        "x": 560,
        "y": 170
      }
    },
    {
      "id": "moved",
      "type": "logic.moved",
      "params": {
        "value": "{{ $json.ethereum.usd }}",
        "amount": 5,
        "unit": "percent",
        "direction": "either",
        "key": ""
      },
      "position": {
        "x": 560,
        "y": 320
      }
    },
    {
      "id": "shout",
      "type": "output.log",
      "params": {
        "message": "that is a {{ Math.round($json.moved.percent) }}% move, {{ $json.moved.direction }} from {{ $json.moved.from }}"
      },
      "position": {
        "x": 1080,
        "y": 170
      }
    }
  ],
  "edges": [
    {
      "from": "clock",
      "fromPort": "main",
      "to": "price",
      "toPort": "main"
    },
    {
      "from": "price",
      "fromPort": "main",
      "to": "now",
      "toPort": "main"
    },
    {
      "from": "price",
      "fromPort": "main",
      "to": "moved",
      "toPort": "main"
    },
    {
      "from": "moved",
      "fromPort": "main",
      "to": "shout",
      "toPort": "main"
    }
  ]
}
```

### demo06: hourly price email

Every hour by email. Resend only delivers from a domain you have verified with them. Needs a key named resend_key.

```json
{
  "nodes": [
    {
      "id": "clock",
      "type": "core.schedule",
      "params": {
        "mode": "every",
        "every": 1,
        "unit": "hours"
      },
      "position": {
        "x": 40,
        "y": 170
      }
    },
    {
      "id": "price",
      "type": "coingecko.price",
      "params": {
        "ids": "ethereum,bitcoin",
        "currency": "usd"
      },
      "position": {
        "x": 300,
        "y": 170
      }
    },
    {
      "id": "mail",
      "type": "resend.send",
      "params": {
        "credential": "resend_key",
        "to": "you@example.com",
        "subject": "ETH {{ $json.ethereum.usd }}",
        "html": "<p>ETH {{ $json.ethereum.usd }}<br>BTC {{ $json.bitcoin.usd }}</p>",
        "from": ""
      },
      "position": {
        "x": 560,
        "y": 170
      }
    }
  ],
  "edges": [
    {
      "from": "clock",
      "fromPort": "main",
      "to": "price",
      "toPort": "main"
    },
    {
      "from": "price",
      "fromPort": "main",
      "to": "mail",
      "toPort": "main"
    }
  ]
}
```

### demo01: news to x

Every 30 minutes it looks for new Hacker News stories about a subject you choose, has Claude draft a post about each one, and puts it on X. Change what it watches for in the About field on the search step — Robinhood Chain, stablecoins, whatever you follow. Needs a Claude key named claude_key and an X key named x_key with write permission. The news itself needs no key.

```json
{
  "nodes": [
    {
      "id": "clock",
      "type": "core.schedule",
      "params": {
        "mode": "every",
        "every": 30,
        "unit": "minutes"
      },
      "position": {
        "x": 40,
        "y": 170
      }
    },
    {
      "id": "news",
      "type": "hackernews.search",
      "params": {
        "query": "Robinhood Chain",
        "tags": "story",
        "minPoints": 0,
        "limit": 20
      },
      "position": {
        "x": 310,
        "y": 170
      }
    },
    {
      "id": "fresh",
      "type": "logic.once",
      "params": {
        "key": "{{ $json.id }}"
      },
      "position": {
        "x": 580,
        "y": 170
      }
    },
    {
      "id": "draft",
      "type": "anthropic.ask",
      "params": {
        "credential": "claude_key",
        "prompt": "Write one post for X about this story. Under 240 characters, no hashtags, no emoji, say what happened and why it matters.\n\n{{ $json.title }}\n{{ $json.url }}",
        "model": "claude-sonnet-5",
        "system": "You write for a technical audience that dislikes hype.",
        "maxTokens": 300
      },
      "position": {
        "x": 850,
        "y": 170
      }
    },
    {
      "id": "post",
      "type": "x.post",
      "params": {
        "credential": "x_key",
        "text": "{{ $json.text }}"
      },
      "position": {
        "x": 1120,
        "y": 170
      }
    }
  ],
  "edges": [
    {
      "from": "clock",
      "fromPort": "main",
      "to": "news",
      "toPort": "main"
    },
    {
      "from": "news",
      "fromPort": "main",
      "to": "fresh",
      "toPort": "main"
    },
    {
      "from": "fresh",
      "fromPort": "main",
      "to": "draft",
      "toPort": "main"
    },
    {
      "from": "draft",
      "fromPort": "main",
      "to": "post",
      "toPort": "main"
    }
  ]
}
```

### demo07: payment to slack and notion

Watches for new Stripe payments and puts each one in two places at once. Fires once per payment, even though it checks every five minutes. Needs keys named stripe_key, slack_key and notion_key, and your Notion database id.

```json
{
  "nodes": [
    {
      "id": "paid",
      "type": "stripe.newCharge",
      "params": {
        "credential": "stripe_key",
        "every": 5,
        "unit": "minutes"
      },
      "position": {
        "x": 40,
        "y": 170
      }
    },
    {
      "id": "slack",
      "type": "slack.post",
      "params": {
        "credential": "slack_key",
        "channel": "#sales",
        "text": "${{ ($json.amount / 100).toFixed(2) }} from {{ $json.billing_details.email }}"
      },
      "position": {
        "x": 300,
        "y": 170
      }
    },
    {
      "id": "notion",
      "type": "notion.createPage",
      "params": {
        "credential": "notion_key",
        "databaseId": "put-your-database-id-here",
        "properties": "{\"Name\":{\"title\":[{\"text\":{\"content\":\"{{ $json.id }}\"}}]}}"
      },
      "position": {
        "x": 300,
        "y": 320
      }
    }
  ],
  "edges": [
    {
      "from": "paid",
      "fromPort": "main",
      "to": "slack",
      "toPort": "main"
    },
    {
      "from": "paid",
      "fromPort": "main",
      "to": "notion",
      "toPort": "main"
    }
  ]
}
```

### demo08: prepare a transaction

Works out exactly what a transaction would do and what it would cost, on the Sepolia test network. Put your own address in "send from". It signs nothing and sends nothing.

```json
{
  "nodes": [
    {
      "id": "start",
      "type": "core.manual",
      "params": {},
      "position": {
        "x": 40,
        "y": 170
      }
    },
    {
      "id": "prep",
      "type": "web3.prepare",
      "params": {
        "chain": "sepolia",
        "to": "vitalik.eth",
        "value": "0.001",
        "from": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
      },
      "position": {
        "x": 300,
        "y": 170
      }
    },
    {
      "id": "say",
      "type": "output.log",
      "params": {
        "message": "would cost {{ $json.estimatedFeeEth }} ETH in fees; signed: {{ $json.signed }}"
      },
      "position": {
        "x": 560,
        "y": 170
      }
    }
  ],
  "edges": [
    {
      "from": "start",
      "fromPort": "main",
      "to": "prep",
      "toPort": "main"
    },
    {
      "from": "prep",
      "fromPort": "main",
      "to": "say",
      "toPort": "main"
    }
  ]
}
```

### demo09: price move to discord

Announces a price move to a Discord channel, and only when it actually moves. Checks every 10 minutes but stays quiet until ETH is 5% away from where it last told you. Needs a Discord webhook saved as announcements.

```json
{
  "nodes": [
    {
      "id": "clock",
      "type": "core.schedule",
      "params": {
        "mode": "every",
        "every": 10,
        "unit": "minutes"
      },
      "position": {
        "x": 40,
        "y": 170
      }
    },
    {
      "id": "price",
      "type": "coingecko.price",
      "params": {
        "ids": "ethereum",
        "currency": "usd"
      },
      "position": {
        "x": 300,
        "y": 170
      }
    },
    {
      "id": "moved",
      "type": "logic.moved",
      "params": {
        "value": "{{ $json.ethereum.usd }}",
        "amount": 5,
        "unit": "percent",
        "direction": "either",
        "key": ""
      },
      "position": {
        "x": 560,
        "y": 170
      }
    },
    {
      "id": "say",
      "type": "discord.post",
      "params": {
        "credential": "announcements",
        "content": "@everyone ETH is {{ $json.moved.direction }} {{ Math.round($json.moved.percent) }}% to ${{ $json.moved.to }}",
        "username": "zorilla"
      },
      "position": {
        "x": 820,
        "y": 170
      }
    }
  ],
  "edges": [
    {
      "from": "clock",
      "fromPort": "main",
      "to": "price",
      "toPort": "main"
    },
    {
      "from": "price",
      "fromPort": "main",
      "to": "moved",
      "toPort": "main"
    },
    {
      "from": "moved",
      "fromPort": "main",
      "to": "say",
      "toPort": "main"
    }
  ]
}
```

### demo10: usdc landing in a wallet

Watches USDC landing in one wallet. It points at Circle's treasury so pressing run shows you something straight away: put your own address in "only where" instead. The endpoint does the filtering, so this stays cheap, and the same transaction is never reported twice.

```json
{
  "nodes": [
    {
      "id": "clock",
      "type": "core.schedule",
      "params": {
        "mode": "every",
        "every": 5,
        "unit": "minutes"
      },
      "position": {
        "x": 40,
        "y": 170
      }
    },
    {
      "id": "events",
      "type": "web3.logs",
      "params": {
        "chain": "ethereum",
        "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "event": "event Transfer(address indexed from, address indexed to, uint256 value)",
        "match": [
          {
            "name": "to",
            "value": "0x55FE002aefF02F77364de339a1292923A15844B8"
          }
        ],
        "blocks": 300,
        "rpc": ""
      },
      "position": {
        "x": 300,
        "y": 170
      }
    },
    {
      "id": "once",
      "type": "logic.once",
      "params": {
        "key": "{{ $json.transactionHash }}"
      },
      "position": {
        "x": 560,
        "y": 170
      }
    },
    {
      "id": "say",
      "type": "output.log",
      "params": {
        "message": "large transfer in {{ $json.transactionHash }}"
      },
      "position": {
        "x": 820,
        "y": 170
      }
    }
  ],
  "edges": [
    {
      "from": "clock",
      "fromPort": "main",
      "to": "events",
      "toPort": "main"
    },
    {
      "from": "once",
      "fromPort": "main",
      "to": "say",
      "toPort": "main"
    },
    {
      "from": "events",
      "fromPort": "main",
      "to": "once",
      "toPort": "main"
    }
  ]
}
```

### demo11: usdc landing to telegram

Messages you on Telegram the moment USDC arrives in a wallet. Put your own address in "only where" on the events step. Never tells you about the same transaction twice. Needs a Telegram key named telegram_key.

```json
{
  "nodes": [
    {
      "id": "clock",
      "type": "core.schedule",
      "params": {
        "mode": "every",
        "every": 5,
        "unit": "minutes"
      },
      "position": {
        "x": 40,
        "y": 170
      }
    },
    {
      "id": "events",
      "type": "web3.logs",
      "params": {
        "chain": "ethereum",
        "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "event": "event Transfer(address indexed from, address indexed to, uint256 value)",
        "match": [
          {
            "name": "to",
            "value": "0x28C6c06298d514Db089934071355E5743bf21d60"
          }
        ],
        "blocks": 300,
        "rpc": ""
      },
      "position": {
        "x": 300,
        "y": 170
      }
    },
    {
      "id": "fresh",
      "type": "logic.once",
      "params": {
        "key": "{{ $json.transactionHash }}"
      },
      "position": {
        "x": 560,
        "y": 170
      }
    },
    {
      "id": "tell",
      "type": "telegram.send",
      "params": {
        "credential": "telegram_key",
        "text": "USDC in: {{ $json.args.value }} raw units, tx {{ $json.transactionHash }}",
        "chatId": ""
      },
      "position": {
        "x": 820,
        "y": 170
      }
    }
  ],
  "edges": [
    {
      "from": "clock",
      "fromPort": "main",
      "to": "events",
      "toPort": "main"
    },
    {
      "from": "events",
      "fromPort": "main",
      "to": "fresh",
      "toPort": "main"
    },
    {
      "from": "fresh",
      "fromPort": "main",
      "to": "tell",
      "toPort": "main"
    }
  ]
}
```

### demo12: wallet balance watch

Reads a balance on Ethereum mainnet and only carries on when it drops below a threshold. Reads only; it cannot move funds.

```json
{
  "nodes": [
    {
      "id": "clock",
      "type": "core.schedule",
      "params": {
        "mode": "every",
        "every": 1,
        "unit": "hours"
      },
      "position": {
        "x": 40,
        "y": 170
      }
    },
    {
      "id": "bal",
      "type": "web3.balance",
      "params": {
        "chain": "ethereum",
        "address": "vitalik.eth"
      },
      "position": {
        "x": 300,
        "y": 170
      }
    },
    {
      "id": "low",
      "type": "logic.if",
      "params": {
        "value": "{{ Number($json.eth) }}",
        "operation": "less",
        "compare": "100"
      },
      "position": {
        "x": 560,
        "y": 170
      }
    },
    {
      "id": "note",
      "type": "output.log",
      "params": {
        "message": "Balance is {{ $json.eth }} ETH — below the line"
      },
      "position": {
        "x": 820,
        "y": 170
      }
    }
  ],
  "edges": [
    {
      "from": "clock",
      "fromPort": "main",
      "to": "bal",
      "toPort": "main"
    },
    {
      "from": "bal",
      "fromPort": "main",
      "to": "low",
      "toPort": "main"
    },
    {
      "from": "low",
      "fromPort": "true",
      "to": "note",
      "toPort": "main"
    }
  ]
}
```

### demo13: webhook to slack

Anything that sends a message to this automation's address gets posted to Slack. Press run to try it before wiring anything up: it stands in a line of its own. Needs a Slack key named slack_key.

```json
{
  "nodes": [
    {
      "id": "hook",
      "type": "core.webhook",
      "params": {
        "path": "alert",
        "method": "POST"
      },
      "position": {
        "x": 40,
        "y": 170
      }
    },
    {
      "id": "shape",
      "type": "transform.set",
      "params": {
        "fields": [
          {
            "name": "text",
            "value": "{{ $json.body.message ?? 'a test run, with nothing sent in' }}"
          }
        ],
        "keepOnly": true
      },
      "position": {
        "x": 300,
        "y": 170
      }
    },
    {
      "id": "slack",
      "type": "slack.post",
      "params": {
        "credential": "slack_key",
        "channel": "#alerts",
        "text": "{{ $json.text }}"
      },
      "position": {
        "x": 560,
        "y": 170
      }
    }
  ],
  "edges": [
    {
      "from": "hook",
      "fromPort": "main",
      "to": "shape",
      "toPort": "main"
    },
    {
      "from": "shape",
      "fromPort": "main",
      "to": "slack",
      "toPort": "main"
    }
  ]
}
```

## What it cannot do

- Sign or send a transaction. `web3.prepare` simulates and reports the fee; a person signs.
- Loop or repeat a step. Lists page themselves; nothing else repeats.
- Receive a webhook from the internet without a tunnel, which the app opens on request.
- Cron expressions, or a schedule pinned to a time of day.
