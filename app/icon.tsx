import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

async function loadLogoDataUri() {
  const logoPath = path.join(process.cwd(), "public/zl.png");
  const logoBuffer = await readFile(logoPath);
  return `data:image/png;base64,${logoBuffer.toString("base64")}`;
}

export default async function Icon() {
  const logoSrc = await loadLogoDataUri();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#172554",
          borderRadius: 6,
        }}
      >
        {/* ImageResponse requires native img */}
        <img src={logoSrc} alt="" width={26} height={26} />
      </div>
    ),
    size
  );
}
