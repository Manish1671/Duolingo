export function Owl({ size = 88, variant = "default" }: { size?: number; variant?: "default" | "super" }) {
  if (variant === "super") {
    return (
      <span className="duo-owl inline-block" aria-hidden>
        <svg width={size} height={size} viewBox="0 0 140 140" fill="none">
          <g className="duo-owl-body">
            <path d="M18 86 C8 70 18 42 40 48" stroke="#FF4B4B" strokeWidth="10" strokeLinecap="round" />
            <path d="M22 92 C10 78 16 52 42 56" stroke="#FF9600" strokeWidth="10" strokeLinecap="round" />
            <path d="M26 98 C14 86 20 62 46 64" stroke="#FFC800" strokeWidth="10" strokeLinecap="round" />
            <path d="M122 86 C132 70 122 42 100 48" stroke="#1CB0F6" strokeWidth="10" strokeLinecap="round" />
            <path d="M118 92 C130 78 124 52 98 56" stroke="#CE82FF" strokeWidth="10" strokeLinecap="round" />
            <path d="M114 98 C126 86 120 62 94 64" stroke="#58CC02" strokeWidth="10" strokeLinecap="round" />
            <ellipse cx="38" cy="112" rx="13" ry="9" fill="#5842C4" />
            <ellipse cx="102" cy="112" rx="13" ry="9" fill="#5842C4" />
            <circle cx="70" cy="74" r="42" fill="#7B61FF" />
            <ellipse cx="70" cy="88" rx="24" ry="18" fill="#C4B5FF" />
            <g className="duo-owl-eyes">
              <circle cx="52" cy="68" r="16" fill="#fff" />
              <circle cx="88" cy="68" r="16" fill="#fff" />
              <g className="duo-owl-pupils">
                <circle cx="52" cy="70" r="8" fill="#4B4B4B" />
                <circle cx="88" cy="70" r="8" fill="#4B4B4B" />
                <circle cx="55" cy="67" r="2.6" fill="#fff" />
                <circle cx="91" cy="67" r="2.6" fill="#fff" />
              </g>
            </g>
            <path d="M60 88 L70 104 L80 88 Z" fill="#FFC200" />
            <path d="M38 58 Q24 28 50 36" stroke="#FF9600" strokeWidth="8" fill="none" strokeLinecap="round" />
            <path d="M102 58 Q116 28 90 36" stroke="#FF9600" strokeWidth="8" fill="none" strokeLinecap="round" />
            <path d="M42 62 H98" stroke="#2B1655" strokeWidth="7" strokeLinecap="round" />
            <circle cx="42" cy="62" r="7" fill="#1CB0F6" />
            <circle cx="98" cy="62" r="7" fill="#1CB0F6" />
          </g>
        </svg>
      </span>
    );
  }

  return (
    <span className="duo-owl inline-block" aria-hidden>
      <svg width={size} height={size} viewBox="0 0 140 140" fill="none">
        <g className="duo-owl-body">
          <ellipse cx="38" cy="108" rx="14" ry="10" fill="#58A700" />
          <ellipse cx="102" cy="108" rx="14" ry="10" fill="#58A700" />
          <circle cx="70" cy="72" r="46" fill="#58CC02" />
          <ellipse cx="70" cy="86" rx="28" ry="22" fill="#89E219" />
          <g className="duo-owl-eyes">
            <circle cx="50" cy="64" r="20" fill="#FFFFFF" />
            <circle cx="90" cy="64" r="20" fill="#FFFFFF" />
            <g className="duo-owl-pupils">
              <circle cx="50" cy="66" r="10" fill="#4B4B4B" />
              <circle cx="90" cy="66" r="10" fill="#4B4B4B" />
              <circle cx="54" cy="62" r="3.2" fill="#FFFFFF" />
              <circle cx="94" cy="62" r="3.2" fill="#FFFFFF" />
            </g>
          </g>
          <path d="M58 88 L70 108 L82 88 Z" fill="#FFC200" />
          <path d="M60 88 L70 98 L80 88 Z" fill="#F49000" />
          <path d="M32 54 Q18 22 44 30" stroke="#58CC02" strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M108 54 Q122 22 96 30" stroke="#58CC02" strokeWidth="10" fill="none" strokeLinecap="round" />
          <circle cx="70" cy="48" r="5" fill="#43C000" />
        </g>
      </svg>
    </span>
  );
}
