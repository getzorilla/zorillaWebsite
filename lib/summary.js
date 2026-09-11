// What a step will do with the settings it has, in a phrase.
//
// This mirrors summaryOf in zorillaApp/public/app.js. The two cannot share a
// file: that one is a browser module served out of the app's own public/, and
// this one runs while the site renders. They are paired on purpose, so a change
// to one belongs in the other. The fallback is the step's own description, so a
// type missing here reads as prose rather than as `web3.logs`.

const plain = (value) => String(value ?? '')
  .replace(/\{\{\s*|\s*\}\}/g, '')
  .replace(/\$json\./g, '')
  .trim()

const short = (address) => {
  const text = plain(address)
  return /^0x[0-9a-fA-F]{40}$/.test(text) ? `${text.slice(0, 6)}…${text.slice(-4)}` : text
}

const plural = (word, count) => (Number(count) === 1 ? word.replace(/s$/, '') : word)

const OPERATIONS = {
  equals: 'is', notEquals: 'is not',
  contains: 'contains', notContains: 'does not contain',
  greater: 'is over', less: 'is under',
  isEmpty: 'is empty', isNotEmpty: 'is not empty', isTrue: 'is true',
}

function condition(params) {
  const left = plain(params.value)
  const how = OPERATIONS[params.operation] ?? params.operation
  if (!left) return ''
  return ['isEmpty', 'isNotEmpty', 'isTrue'].includes(params.operation)
    ? `${left} ${how}`
    : `${left} ${how} ${plain(params.compare)}`.trim()
}

const SUMMARY = {
  'core.manual': () => 'When you press run',
  'core.schedule': (p) => (p.mode === 'once'
    ? (p.at ? `Once, at ${String(p.at).replace('T', ' ')}` : 'Once, at a time you pick')
    : `Every ${p.every ?? 1} ${plural(p.unit ?? 'minutes', p.every ?? 1)}`),
  'core.webhook': (p) => (p.path ? `When something posts to /hook/${p.path}` : 'When something posts to an address of yours'),
  'logic.if': (p) => condition(p),
  'logic.filter': (p) => (condition(p) ? `Keeps the ones where ${condition(p)}` : ''),
  'logic.once': (p) => (p.key ? `Once per ${plain(p.key)}, ever` : 'The first time only'),
  'logic.changed': (p) => (p.value ? `Only when ${plain(p.value)} changes` : ''),
  'logic.moved': (p) => (p.value
    ? `Only when ${plain(p.value)} moves by ${p.amount ?? 0}${p.unit === 'percent' ? '%' : ''}`
    : ''),
  'flow.stop': () => 'Switches this automation off',
  'output.log': (p) => plain(p.message),
  'code.js': () => 'JavaScript you wrote',
  'transform.set': (p) => {
    const names = (p.fields ?? []).map((f) => f.name).filter(Boolean)
    return names.length ? `Sets ${names.join(', ')}` : ''
  },
  'net.http': (p) => {
    const url = plain(p.url)
    let where = url
    try { where = new URL(url).host } catch { /* templated, so show it as written */ }
    return where ? `${p.method ?? 'GET'} ${where}` : ''
  },
  'web3.balance': (p) => (p.address ? `${short(p.address)} on ${p.chain ?? 'ethereum'}` : ''),
  'web3.erc20Balance': (p) => [short(p.token), p.address ? `Held by ${short(p.address)}` : '']
    .filter(Boolean).join(' '),
  'web3.read': (p) => {
    const fn = /function\s+([a-zA-Z0-9_]+)/.exec(String(p.signature ?? ''))
    return [fn?.[1], p.address ? `on ${short(p.address)}` : ''].filter(Boolean).join(' ')
  },
  'web3.logs': (p) => {
    const name = /event\s+([a-zA-Z0-9_]+)/.exec(String(p.event ?? ''))
    const where = (p.match ?? []).map((m) => `${m.name} = ${short(m.value)}`).join(', ')
    return [
      [name?.[1], p.address ? `on ${short(p.address)}` : ''].filter(Boolean).join(' '),
      where ? `where ${where}` : '',
    ].filter(Boolean).join(', ')
  },
  'web3.gas': (p) => `Gas on ${p.chain ?? 'ethereum'}`,
  'web3.ens': (p) => plain(p.value),
  'telegram.send': (p) => (plain(p.chatId) ? `To ${plain(p.chatId)}` : ''),
  'discord.post': (p) => plain(p.credential),
  'x.search': (p) => (p.query ? `Posts matching ${plain(p.query)}` : 'Recent posts'),
  'x.post': () => 'Posts it to X',
  'web3.prepare': (p) => [
    p.value && p.value !== '0' ? `${plain(p.value)} ETH` : '',
    p.to ? `to ${short(p.to)}` : '',
  ].filter(Boolean).join(' ') || 'Works out what it would cost, sends nothing',
  'coingecko.price': (p) => [plain(p.ids), p.currency ? `in ${plain(p.currency)}` : ''].filter(Boolean).join(' '),
  'slack.post': (p) => plain(p.channel),
  'anthropic.ask': (p) => plain(p.model),
  'openai.ask': (p) => plain(p.model),
  'gemini.ask': (p) => plain(p.model),
  'deepseek.ask': (p) => plain(p.model),
}

export function summaryOf(node, def) {
  if (!def) return node.type
  let text = ''
  try { text = SUMMARY[node.type]?.(node.params ?? {}) ?? '' } catch { text = '' }
  return text || def.description || def.type
}
