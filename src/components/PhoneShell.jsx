export default function PhoneShell({ children }) {
  return (
    <div className="min-h-[100dvh] w-full bg-base flex items-center justify-center sm:py-6">
      <div
        className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-base text-text
                   sm:h-[844px] sm:max-h-[92dvh] sm:w-[390px] sm:rounded-[2.5rem] sm:border sm:border-border sm:shadow-2xl"
      >
        {children}
      </div>
    </div>
  )
}
