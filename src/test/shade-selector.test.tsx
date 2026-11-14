import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ShadeSelector } from "@/components/product/shade-selector";

describe("ShadeSelector", () => {
  it("announces the selected shade when a swatch is chosen", () => {
    render(
      <ShadeSelector
        productName="Velvet Matte Lipstick"
        shades={[
          { name: "Nude Rose", hex: "#c47a72" },
          { name: "Berry Crush", hex: "#8b2e4a" },
        ]}
      />,
    );

    expect(screen.getByText("Nude Rose")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Berry Crush" }));
    expect(screen.getByText("Berry Crush")).toBeInTheDocument();
  });
});
