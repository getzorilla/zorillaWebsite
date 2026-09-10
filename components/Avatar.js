// One person icon, one uploaded picture, one size prop. A profile without a
// picture still has to look like a profile.
export default function Avatar({ src, handle = '', size = 40 }) {
  if (src) {
    return (
      <img
        className="avatar-img"
        src={src}
        alt={handle ? `${handle}'s picture` : ''}
        width={size}
        height={size}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <span className="avatar-img avatar-blank" style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 24 24" width={size * 0.56} height={size * 0.56} fill="currentColor">
        <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 1.8c-3.6 0-8 1.8-8 4.5V21h16v-2.7c0-2.7-4.4-4.5-8-4.5Z" />
      </svg>
    </span>
  )
}
