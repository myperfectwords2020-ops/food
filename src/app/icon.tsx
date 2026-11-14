import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Greencart favicon (replaces default Lovable /favicon.ico). */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d6b3c",
        color: "#ffffff",
        fontSize: 20,
        fontWeight: 700,
        borderRadius: 8,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      G
    </div>,
    { ...size },
  );
}
