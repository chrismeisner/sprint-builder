import { ImageResponse } from "next/og";

// Simple but accurate moon phase calculation.
// Reference new moon: Jan 6, 2000 at 18:14 UTC (J2000 epoch).
const KNOWN_NEW_MOON_MS = new Date("2000-01-06T18:14:00Z").getTime();
const LUNAR_CYCLE_MS = 29.530588853 * 24 * 60 * 60 * 1000;

function getMoonData(date: Date) {
  const elapsed = date.getTime() - KNOWN_NEW_MOON_MS;
  const cyclePosition =
    ((elapsed % LUNAR_CYCLE_MS) + LUNAR_CYCLE_MS) % LUNAR_CYCLE_MS;
  const phaseAngle = (cyclePosition / LUNAR_CYCLE_MS) * 360;
  const illumination =
    ((1 - Math.cos((phaseAngle * Math.PI) / 180)) / 2) * 100;
  const waxing = phaseAngle < 180;

  let phaseLabel: string;
  if (illumination > 99.9) phaseLabel = "Full Moon";
  else if (illumination < 0.1) phaseLabel = "New Moon";
  else phaseLabel = waxing ? "Waxing" : "Waning";

  return { illumination, phaseAngle, phaseLabel };
}

// Builds an SVG path for the illuminated portion of the moon.
// Uses two arc segments: the limb (visible edge) + the terminator (shadow boundary).
// No mask element needed — works in all SVG renderers.
function getMoonPath(phaseAngle: number): string {
  const angle = ((phaseAngle % 360) + 360) % 360;
  // rx shrinks from 48 (new/full) to 0 (quarter) as the terminator flattens
  const rx = (Math.abs(Math.cos((angle * Math.PI) / 180)) * 48).toFixed(3);

  if (angle <= 180) {
    // Waxing: right side is lit
    // Limb = right semicircle (CW); terminator direction toggles at first quarter
    const sweep = angle <= 90 ? 0 : 1;
    return `M 50,2 A 48,48,0,1,1,50,98 A ${rx},48,0,0,${sweep},50,2 Z`;
  } else {
    // Waning: left side is lit
    // Limb = left semicircle (CCW); terminator direction toggles at third quarter
    const sweep = angle <= 270 ? 0 : 1;
    return `M 50,2 A 48,48,0,1,0,50,98 A ${rx},48,0,0,${sweep},50,2 Z`;
  }
}

export async function GET() {
  const { illumination, phaseAngle, phaseLabel } = getMoonData(new Date());
  const moonPath = getMoonPath(phaseAngle);
  const percentText = illumination.toFixed(1) + "%";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Moon SVG using path-based rendering (no mask needed) */}
        <svg viewBox="0 0 100 100" width="240" height="240">
          {/* Dark moon base */}
          <circle cx="50" cy="50" r="48" fill="#1c1c1c" />
          {/* Illuminated portion */}
          <path d={moonPath} fill="#e5e5e5" />
          {/* Subtle crater marks */}
          <circle cx="35" cy="35" r="8" fill="rgba(0,0,0,0.07)" />
          <circle cx="60" cy="55" r="6" fill="rgba(0,0,0,0.07)" />
          <circle cx="45" cy="65" r="5" fill="rgba(0,0,0,0.07)" />
          <circle cx="65" cy="35" r="4" fill="rgba(0,0,0,0.07)" />
        </svg>

        {/* Text content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginLeft: "80px",
          }}
        >
          {/* Illumination percentage — main focal point */}
          <div
            style={{
              fontSize: "100px",
              fontWeight: "700",
              color: "#f5f5f5",
              lineHeight: 1,
              letterSpacing: "-3px",
            }}
          >
            {percentText}
          </div>

          {/* Phase label */}
          <div
            style={{
              fontSize: "30px",
              color: "#a3a3a3",
              fontWeight: "400",
              marginTop: "16px",
            }}
          >
            {phaseLabel}
          </div>

          {/* App name */}
          <div
            style={{
              fontSize: "18px",
              color: "#525252",
              fontWeight: "400",
              marginTop: "8px",
            }}
          >
            Moon Illumination
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
