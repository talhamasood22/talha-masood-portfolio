import { ImageResponse } from "next/og";
import { personalInfo } from "@/data/portfolio";

export const alt = `${personalInfo.name}, ${personalInfo.title.toLowerCase()} in ${personalInfo.location}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0A1015",
          padding: "68px 80px",
          color: "#E8F0F6",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 22,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#7FB2D1",
          }}
        >
          <div style={{ width: 56, height: 3, backgroundColor: "#2F4150" }} />
          <div style={{ display: "flex" }}>{personalInfo.location}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1,
            }}
          >
            {personalInfo.name}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 40,
              fontWeight: 600,
              color: "#7FB2D1",
              letterSpacing: "-0.01em",
            }}
          >
            {personalInfo.title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              lineHeight: 1.4,
              color: "#B3C4D1",
              maxWidth: 880,
            }}
          >
            {personalInfo.headline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 56,
            borderTop: "1px solid #22303A",
            paddingTop: 26,
            fontSize: 22,
            color: "#B3C4D1",
          }}
        >
          {personalInfo.metrics.map((metric) => (
            <div
              key={metric.id}
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              <div style={{ display: "flex", color: "#7FB2D1", fontWeight: 700 }}>
                {metric.value}
              </div>
              <div style={{ display: "flex" }}>{metric.label}</div>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              alignItems: "flex-end",
              color: "#8698A7",
            }}
          >
            {personalInfo.email}
          </div>
        </div>
      </div>
    ),
    size
  );
}
