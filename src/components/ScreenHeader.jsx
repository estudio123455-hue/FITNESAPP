export default function ScreenHeader({ title, subtitle, action }) {
  return (
    <header
      className="flex shrink-0 items-start justify-between gap-3 px-5 pb-4"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 20px)' }}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}
