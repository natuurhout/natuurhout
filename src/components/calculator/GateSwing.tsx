/*
 * Top view of a gate for the "Draairichting" question: the street at the
 * bottom, the gate closed between its two posts and, dashed, open into the
 * garden. Gates always open inwards: that is how the hinges and the latch
 * are fitted. A single gate hangs on the right or the left post, seen from
 * the street; a double gate hangs on both.
 */

const WOOD = "#B07A45";
const WOOD_DARK = "#6B4423";
const POST = "#C8975F";
const IRON = "#3A3D40";
const GARDEN = "#EEF1E4";
const STREET = "#DCD7CE";
const ARROW = "#2F4A35";

const W = 340;
const H = 260;
const Y = 186; // gate line
const LEFT = 52;
const RIGHT = W - 52;

function Post({ x }: { x: number }) {
  return (
    <g>
      <circle cx={x} cy={Y} r={15} fill={POST} stroke={WOOD_DARK} strokeWidth={2.5} />
      <circle cx={x} cy={Y} r={8} fill="none" stroke={WOOD_DARK} strokeOpacity={0.45} strokeWidth={1.2} />
      <circle cx={x} cy={Y} r={2.2} fill={WOOD_DARK} />
    </g>
  );
}

/** One leaf hinged at `hinge`, closed towards `to`, opening `angle` degrees into the garden. */
function Leaf({ hinge, to, angle, id }: { hinge: number; to: number; angle: number; id: string }) {
  const dir = Math.sign(to - hinge);
  const length = Math.abs(to - hinge) - 18;
  const start = hinge + dir * 15;
  const rad = (angle * Math.PI) / 180;
  const openX = hinge + dir * (15 + length * Math.cos(rad));
  const openY = Y - length * Math.sin(rad);
  const tip = start + dir * length;
  return (
    <g>
      {/* open, dashed */}
      <line x1={start} y1={Y} x2={openX} y2={openY} stroke={WOOD} strokeOpacity={0.55} strokeWidth={9} strokeDasharray="7 5" strokeLinecap="round" />
      {/* closed */}
      <line x1={start} y1={Y} x2={tip} y2={Y} stroke={WOOD} strokeWidth={9} strokeLinecap="round" />
      <line x1={start} y1={Y} x2={tip} y2={Y} stroke={WOOD_DARK} strokeOpacity={0.35} strokeWidth={9} strokeDasharray="2 9" />
      {/* hinge */}
      <rect x={Math.min(start, start + dir * 14) - 1} y={Y - 7} width={16} height={4} rx={1.5} fill={IRON} />
      <rect x={Math.min(start, start + dir * 14) - 1} y={Y + 3} width={16} height={4} rx={1.5} fill={IRON} />
      {/* swing */}
      <path
        d={`M ${tip - dir * 6} ${Y - 14} Q ${tip - dir * 2} ${Y - length * 0.62} ${openX + dir * 14} ${openY + 10}`}
        fill="none"
        stroke={ARROW}
        strokeWidth={2.2}
        markerEnd={`url(#${id}-arrow)`}
      />
    </g>
  );
}

export default function GateSwing({ type }: { type: "rechts" | "links" | "dubbel" }) {
  const id = `swing-${type}`;
  const mid = W / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={label(type)}>
      <defs>
        <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill={ARROW} />
        </marker>
      </defs>
      <rect width={W} height={H} fill={GARDEN} />
      <text x={W / 2} y={30} textAnchor="middle" fontSize={11} letterSpacing={2.5} fill={ARROW} fillOpacity={0.7} fontWeight={600}>
        TUIN
      </text>
      <rect y={H - 46} width={W} height={46} fill={STREET} />
      <line x1={0} x2={W} y1={H - 30} y2={H - 30} stroke="#fff" strokeOpacity={0.7} strokeDasharray="12 10" />
      <text x={W / 2} y={H - 13} textAnchor="middle" fontSize={12} letterSpacing={3} fill="#4A4540" fontWeight={700}>
        STRAAT
      </text>

      {type === "dubbel" ? (
        <>
          <Leaf hinge={LEFT} to={mid} angle={62} id={id} />
          <Leaf hinge={RIGHT} to={mid} angle={62} id={id} />
          <rect x={mid - 5} y={Y - 6} width={10} height={12} rx={2} fill={IRON} />
        </>
      ) : (
        <>
          <Leaf hinge={type === "rechts" ? RIGHT : LEFT} to={type === "rechts" ? LEFT : RIGHT} angle={40} id={id} />
          {/* latch on the other post */}
          <rect x={(type === "rechts" ? LEFT + 15 : RIGHT - 25)} y={Y - 5} width={10} height={10} rx={2} fill={IRON} />
        </>
      )}
      <Post x={LEFT} />
      <Post x={RIGHT} />
    </svg>
  );
}

function label(type: "rechts" | "links" | "dubbel"): string {
  if (type === "dubbel") return "Bovenaanzicht: dubbele poort, beide vleugels draaien naar binnen open";
  return `Bovenaanzicht: scharnieren ${type} gezien vanaf de straat, de poort draait naar binnen open`;
}
