import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, onTestFinished, vi } from "vite-plus/test";
import App from "../../App";

vi.hoisted(() => {
  // Leaflet checks for this browser API before it enables its SVG renderer.
  Object.defineProperty(SVGSVGElement.prototype, "createSVGRect", {
    configurable: true,
    value: () => ({}),
  });
});

describe("field editor", () => {
  it("draws a field, places a pole, generates plants, and keeps the draft during navigation", async () => {
    const width = vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(640);
    const height = vi.spyOn(Element.prototype, "clientHeight", "get").mockReturnValue(480);
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    onTestFinished(() => {
      width.mockRestore();
      height.mockRestore();
      scroll.mockRestore();
    });
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Open field editor" }));
    const map = await screen.findByRole("region", { name: "Field map canvas" });
    expect(within(map).getByRole("link", { name: "OpenStreetMap contributors" })).toBeTruthy();

    await user.type(screen.getByLabelText("Latitude, longitude"), "46.67, 11.16");
    await user.click(screen.getByRole("button", { name: "Go to coordinates" }));
    await user.click(screen.getByRole("button", { name: "Boundary" }));
    map.focus();
    fireEvent.keyDown(map, { key: " ", code: "Space" });
    expect(map.classList.contains("field-map-space")).toBe(true);
    fireEvent.click(map, { clientX: 10, clientY: 10 });
    expect(within(map).queryByRole("button", { name: "Boundary corner 1" })).toBeNull();
    fireEvent.keyUp(map, { key: " ", code: "Space" });

    for (const [clientX, clientY] of [
      [20, 20],
      [70, 20],
      [70, 70],
      [20, 70],
    ]) {
      fireEvent.click(map, { clientX, clientY });
    }
    await user.click(screen.getByRole("button", { name: "Close boundary" }));
    await user.click(screen.getByRole("button", { name: "Pole" }));
    fireEvent.click(map, { clientX: 44, clientY: 44 });
    const pole = within(map).getByRole("button", { name: "Pole 1", pressed: true });
    const guide = () => map.querySelector('path[stroke="#8b28b5"]');
    fireEvent.mouseDown(pole, { clientX: 44, clientY: 44, which: 1 });
    fireEvent.mouseMove(map, { clientX: 23, clientY: 46 });
    expect(guide()).toBeTruthy();
    fireEvent.keyDown(map, { key: "Control" });
    expect(guide()).toBeNull();
    fireEvent.keyUp(map, { key: "Control" });
    expect(guide()).toBeTruthy();
    fireEvent.mouseUp(map, { clientX: 23, clientY: 46 });
    expect(guide()).toBeNull();

    await user.click(screen.getByRole("button", { name: "Generate grid" }));
    expect(screen.getByRole("status").textContent).toBe("Added 9 plants.");
    expect(within(map).getAllByRole("button", { name: /^Plant \d+$/ })).toHaveLength(9);
    await user.click(screen.getByRole("button", { name: "Generate grid" }));
    expect(screen.getByRole("status").textContent).toBe("This grid has no new points to add.");

    await user.click(screen.getByRole("button", { name: "Add field" }));
    expect(within(map).queryByRole("button", { name: "Pole 1" })).toBeNull();
    await user.selectOptions(screen.getByLabelText("Draft field"), "first-field");
    expect(within(map).getByRole("button", { name: "Pole 1" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Back to overview" }));
    await user.click(screen.getByRole("button", { name: "Open field editor" }));
    expect(await screen.findByRole("button", { name: "Pole 1" })).toBeTruthy();
  });
});
