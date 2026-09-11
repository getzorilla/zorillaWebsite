// A real robots.txt, served as text/plain. Without this the path 404s with an
// HTML body, which crawlers tolerate but should not have to.
export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    host: 'https://www.zorilla.io',
  }
}
