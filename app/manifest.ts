import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finanzas",
    short_name: "Finanzas",
    description: "Control de gastos, deudas e inversiones",
    start_url: "/",
    display: "standalone",
    background_color: "#0e1013",
    theme_color: "#0e1013",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
