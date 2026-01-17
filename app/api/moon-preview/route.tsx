import { ImageResponse } from "next/og";

export const runtime = "edge";

// Moon phase calculation (same as in HTML)
const SYNODIC_MONTH = 29.530588;
const REFERENCE_NEW_MOON = Date.UTC(2024, 0, 11, 11, 57, 0);

function getMoonData(now: number) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysSinceNew = (now - REFERENCE_NEW_MOON) / msPerDay;
  const phase = ((daysSinceNew % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const illumination = 0.5 * (1 - Math.cos((2 * Math.PI * phase) / SYNODIC_MONTH));
  const percent = illumination * 100;
  const waxing = phase < SYNODIC_MONTH / 2;
  return { phase, percent, waxing };
}

function getMoonEmoji(phase: number): string {
  const f = phase / SYNODIC_MONTH;
  if (f < 0.0625) return "🌑";
  if (f < 0.1875) return "🌒";
  if (f < 0.3125) return "🌓";
  if (f < 0.4375) return "🌔";
  if (f < 0.5625) return "🌕";
  if (f < 0.6875) return "🌖";
  if (f < 0.8125) return "🌗";
  if (f < 0.9375) return "🌘";
  return "🌑";
}

export async function GET() {
  try {
    const now = Date.now();
    const { phase, percent, waxing } = getMoonData(now);
    const moonEmoji = getMoonEmoji(phase);

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0b0f1a",
            color: "#ffffff",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              fontSize: "200px",
              marginBottom: "40px",
            }}
          >
            {moonEmoji}
          </div>
          <div
            style={{
              fontSize: "80px",
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            {percent.toFixed(3)}%
          </div>
          <div
            style={{
              fontSize: "40px",
              opacity: 0.8,
              marginTop: "20px",
            }}
          >
            {waxing ? "Waxing" : "Waning"}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("Error generating moon preview:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
