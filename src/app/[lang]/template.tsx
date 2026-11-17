const BANDS = ["#ffc83d", "#ff8a3d", "#f06ba8", "#63d6c1", "#7b62c4"];

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[90] flex flex-col">
        {BANDS.map((color, index) => (
          <div
            key={color}
            className="flex-1 border-b-[3px] border-ink last:border-b-0"
            style={{
              backgroundColor: color,
              animation: `channel-wipe 420ms cubic-bezier(.7,0,.25,1) ${index * 35}ms both`,
            }}
          />
        ))}
      </div>
      <div style={{ animation: "channel-in 380ms ease-out 120ms both" }}>{children}</div>
    </>
  );
}
