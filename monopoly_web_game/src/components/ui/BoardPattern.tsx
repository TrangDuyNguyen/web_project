const TILES = ['#E53935', '#FFD700', '#1B5E20', '#1565C0', '#6A1B9A', '#EF6C00'];

export function BoardPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.07]">
      <div className="absolute -top-8 -left-8 grid grid-cols-6 gap-2 rotate-12">
        {Array.from({ length: 36 }).map((_, i) => (
          <div
            key={`tl-${i}`}
            className="w-10 h-10 rounded-md"
            style={{ backgroundColor: TILES[i % TILES.length] }}
          />
        ))}
      </div>
      <div className="absolute -bottom-8 -right-8 grid grid-cols-6 gap-2 -rotate-12">
        {Array.from({ length: 36 }).map((_, i) => (
          <div
            key={`br-${i}`}
            className="w-10 h-10 rounded-md"
            style={{ backgroundColor: TILES[(i + 2) % TILES.length] }}
          />
        ))}
      </div>
    </div>
  );
}
