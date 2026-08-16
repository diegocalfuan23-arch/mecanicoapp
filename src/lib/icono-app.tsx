import { ImageResponse } from "next/og";

const FONDO = "#100c0a";
const ACENTO = "#fb9f44";

export function iconoApp(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: FONDO,
          borderRadius: size * 0.18,
        }}
      >
        <span
          style={{
            fontSize: size * 0.55,
            fontWeight: 700,
            color: ACENTO,
          }}
        >
          M
        </span>
      </div>
    ),
    { width: size, height: size }
  );
}
