export function CornerAnchors() {
  return (
    <>
      {/* Top Left Corner */}
      <span className="absolute -top-1 -left-1 font-mono text-[9px] text-[#555] pointer-events-none select-none z-10">
        +
      </span>
      {/* Top Right Corner */}
      <span className="absolute -top-1 -right-1 font-mono text-[9px] text-[#555] pointer-events-none select-none z-10">
        +
      </span>
      {/* Bottom Left Corner */}
      <span className="absolute -bottom-1 -left-1 font-mono text-[9px] text-[#555] pointer-events-none select-none z-10">
        +
      </span>
      {/* Bottom Right Corner */}
      <span className="absolute -bottom-1 -right-1 font-mono text-[9px] text-[#555] pointer-events-none select-none z-10">
        +
      </span>
    </>
  );
}

export default CornerAnchors;
