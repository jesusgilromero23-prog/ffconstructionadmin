const KBV_URL = "https://kbvdigitalsolutions.com/";
const CUBE_SRC = "data:image/webp;base64,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";

export default function KbvSignature() {
  return (
    <footer className="kbv-signature" aria-label="Technology provider">
      <a
        className="kbv-signature__link"
        href={KBV_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Visit KBV Digital Solutions"
        title="Visit KBV Digital Solutions"
      >
        <span className="kbv-signature__cube-wrap" aria-hidden="true">
          <img className="kbv-signature__cube" src={CUBE_SRC} alt="" width="48" height="48" loading="lazy" decoding="async" />
        </span>
        <span className="kbv-signature__copy">
          <span className="kbv-signature__powered">POWERED BY</span>
          <span className="kbv-signature__brand">KBV DIGITAL SOLUTIONS</span>
          <sup className="kbv-signature__mark">™</sup>
        </span>
      </a>
      <style>{`
        .kbv-signature {
          width: 100%;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 76px;
          padding: 14px 18px;
          border-top: 1px solid rgba(148, 163, 184, 0.14);
          background: radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.08), transparent 48%), linear-gradient(180deg, #0d1220 0%, #090d18 100%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
        }
        .kbv-signature__link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          max-width: 100%;
          color: inherit;
          text-decoration: none;
          border-radius: 12px;
          outline: none;
          transition: filter 180ms ease, transform 180ms ease;
        }
        .kbv-signature__link:hover { filter: brightness(1.14); transform: translateY(-1px); }
        .kbv-signature__link:focus-visible { box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.5); }
        .kbv-signature__cube-wrap {
          position: relative;
          display: inline-flex;
          flex: 0 0 auto;
          width: 48px;
          height: 48px;
          align-items: center;
          justify-content: center;
        }
        .kbv-signature__cube-wrap::after {
          content: "";
          position: absolute;
          left: 16%;
          right: 16%;
          bottom: -1px;
          height: 8px;
          border-radius: 50%;
          background: linear-gradient(90deg, rgba(168, 85, 247, 0.42), rgba(14, 165, 233, 0.5));
          filter: blur(6px);
          opacity: 0.72;
        }
        .kbv-signature__cube {
          position: relative;
          z-index: 1;
          display: block;
          width: 48px;
          height: 48px;
          object-fit: contain;
          filter: drop-shadow(0 7px 8px rgba(14, 165, 233, 0.2));
          animation: kbv-signature-float 4s ease-in-out infinite;
          transform-origin: 50% 60%;
        }
        .kbv-signature__copy {
          display: inline-flex;
          align-items: baseline;
          justify-content: center;
          gap: 8px;
          min-width: 0;
          white-space: nowrap;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: clamp(10px, 1.2vw, 12px);
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: 0.14em;
        }
        .kbv-signature__powered { color: #aeb7c6; }
        .kbv-signature__brand { color: #e8b43f; text-shadow: 0 0 12px rgba(232, 180, 63, 0.12); }
        .kbv-signature__mark { margin-left: -6px; color: #d7a933; font-size: 7px; line-height: 1; vertical-align: super; }
        @keyframes kbv-signature-float {
          0%, 100% { transform: translateY(1px); }
          50% { transform: translateY(-4px); }
        }
        @media (max-width: 520px) {
          .kbv-signature { min-height: 68px; padding: 11px 12px; }
          .kbv-signature__link { gap: 8px; }
          .kbv-signature__cube-wrap, .kbv-signature__cube { width: 40px; height: 40px; }
          .kbv-signature__copy { gap: 5px; font-size: clamp(8px, 2.45vw, 10px); letter-spacing: 0.08em; }
          .kbv-signature__mark { margin-left: -3px; font-size: 6px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .kbv-signature__cube { animation: none; }
          .kbv-signature__link { transition: none; }
        }
      `}</style>
    </footer>
  );
}
