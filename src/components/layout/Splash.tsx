/** Shown while the session is restored, or a deep-linked screen's code loads. */
export function Splash() {
  return (
    <div role="status" className="grid min-h-dvh place-items-center" aria-busy="true" aria-label="Loading">
      <img src="/pluto.svg" alt="" className="size-12 animate-pulse motion-reduce:animate-none" />
    </div>
  )
}
