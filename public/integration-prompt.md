Write a zorilla integration for **[THE SERVICE]**.

zorilla is a local automation tool. An integration is a single JSON file
describing a service: the fields its key needs, how a request authenticates,
and what each of its steps sends. It contains no code, and zorilla refuses any
file that breaks the rules below.

Reply with the JSON and nothing else.

## The shape

```json
{
  "id": "short_lowercase_id",
  "label": "The Service",
  "description": "One line, lowercase, saying what it is.",
  "docs": "https://the-service.com/docs/api-keys",
  "category": "action",
  "credential": {
    "description": "Where somebody finds this key, in one sentence.",
    "fields": [
      { "key": "apiKey", "label": "API key", "secret": true, "required": true, "placeholder": "sk_…" }
    ],
    "auth": { "headers": { "Authorization": "Bearer {{ apiKey }}" } },
    "test": { "method": "GET", "url": "https://api.the-service.com/v1/me" },
    "identity": { "as": "user.name" }
  },
  "actions": [
    {
      "key": "send",
      "label": "Send a message",
      "description": "One line saying what one run of this does.",
      "params": [
        { "key": "to", "label": "To", "type": "text", "placeholder": "someone@example.com" },
        { "key": "body", "label": "Message", "type": "textarea" }
      ],
      "request": {
        "method": "POST",
        "url": "https://api.the-service.com/v1/messages",
        "json": { "to": "{{ to }}", "body": "{{ body }}" }
      },
      "errorPath": "error.message"
    }
  ]
}
```

## Rules zorilla enforces

- Two substitutions exist and no others. `{{ fieldKey }}` is a value from the
  step. `{{ key.fieldName }}` is a field of the saved key. Neither can reach
  anything else.
- The site an action contacts has to be written out in full, or be a whole
  address the person filled in themselves (`"url": "{{ key.webhookUrl }}"`). An
  address assembled at run time is refused, because nobody could tell what it
  reaches before installing it.
- A key travelling in the query string is allowed but called out on screen.
  Prefer a header.
- `id` is lower case letters, numbers and underscores. Every action `key` is
  unique within the file.
- Field types: text, textarea, number, boolean, select, code, keyvalue, list,
  datetime. A select needs `options: [{ "value": "a", "label": "A" }]`.

## Optional pieces, when the service calls for them

- `"itemsPath": "data"` — where the list is in the answer, so one call becomes
  one item per row. `"$"` means the answer is itself the list.
- `"output": { "id": "data.id", "text": "data.text" }` — reshape what a step
  hands on. `"$"` as a value means the whole answer.
- `"errorPath": "error.message"` and `"okPath": "ok"` — where the service puts
  the reason it refused, and where it puts `false` while still answering 200.
- `"fallbacks": { "from": "{{ key.from }}" }` — a blank field falls back to
  something saved with the key.
- `"pagination"` — keep asking until the step has what it was told to bring
  back:
  ```json
  "pagination": {
    "size": 100,
    "sizeInto": { "query": "limit" },
    "next": { "lastItem": "id" },
    "more": "has_more",
    "into": { "query": "starting_after" }
  }
  ```
  `next` is one of `{ "cursor": "path.in.answer" }`, `{ "lastItem": "id" }`,
  `{ "count": true }` for an offset, or `{ "page": true }` for page numbers.
- `"trigger": { "dedupeBy": "id" }` — turns an action into a step that waits.
  zorilla asks on a timer and passes on only what it has not seen. Needs
  `itemsPath`. Name these actions like "New Stripe payment".
- `"attachments": { "into": "attachments", "filenameKey": "filename", "contentKey": "content" }`
  — sends whatever files the item is carrying, base64.
- `"icon": "data:image/png;base64,…"` — a small picture for the file, png,
  jpeg or webp only.

## Write it like this

- Everything lowercase except proper nouns and the service's own field names.
- Labels are what a person would call the thing, not what the API calls it:
  "Message", not "body_text".
- Descriptions are one line. Say what it does, not what it is.
- Add a `test` request that costs nothing, so a wrong paste is caught at once.
  Point `identity` at whatever that answer says about who the key belongs to,
  so zorilla can show "as @yourbot" next to the saved key.
- Two or three actions is plenty. The ones people will actually use.
