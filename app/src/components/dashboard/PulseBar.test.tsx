import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PulseBar } from "./PulseBar";

describe("PulseBar", () => {
  it("renders label correctly", () => {
    render(<PulseBar label="Test Label" value={50} />);
    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  it("renders value text", () => {
    render(<PulseBar label="Trust" value={75} />);
    expect(screen.getByText("75")).toBeInTheDocument();
  });

  it("rounds decimal values", () => {
    render(<PulseBar label="Trust" value={75.7} />);
    expect(screen.getByText("76")).toBeInTheDocument();
  });

  it("renders bar with correct width for 50%", () => {
    const { container } = render(<PulseBar label="Test" value={50} />);
    const bar = container.querySelector("[style]");
    expect(bar).toHaveStyle({ width: "50%" });
  });

  it("renders bar with 0% width for value=0", () => {
    const { container } = render(<PulseBar label="Test" value={0} />);
    const bar = container.querySelector("[style]");
    expect(bar).toHaveStyle({ width: "0%" });
  });

  it("renders bar with 100% width for value=100", () => {
    const { container } = render(<PulseBar label="Test" value={100} />);
    const bar = container.querySelector("[style]");
    expect(bar).toHaveStyle({ width: "100%" });
  });

  it("clamps negative values to 0", () => {
    const { container } = render(<PulseBar label="Test" value={-50} />);
    const bar = container.querySelector("[style]");
    expect(bar).toHaveStyle({ width: "0%" });
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("clamps values > 100 to 100", () => {
    const { container } = render(<PulseBar label="Test" value={150} />);
    const bar = container.querySelector("[style]");
    expect(bar).toHaveStyle({ width: "100%" });
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("uses amber color by default", () => {
    const { container } = render(<PulseBar label="Test" value={50} />);
    const bar = container.querySelector("[style]");
    expect(bar).toHaveClass("bg-amber-500");
  });

  it("supports red color variant", () => {
    const { container } = render(<PulseBar label="Test" value={50} color="red" />);
    const bar = container.querySelector("[style]");
    expect(bar).toHaveClass("bg-red-500");
  });

  it("supports green color variant", () => {
    const { container } = render(<PulseBar label="Test" value={50} color="green" />);
    const bar = container.querySelector("[style]");
    expect(bar).toHaveClass("bg-green-500");
  });

  it("supports blue color variant", () => {
    const { container } = render(<PulseBar label="Test" value={50} color="blue" />);
    const bar = container.querySelector("[style]");
    expect(bar).toHaveClass("bg-blue-500");
  });
});
