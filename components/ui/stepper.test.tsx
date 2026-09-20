import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Stepper } from "./stepper";

describe("Stepper", () => {
  it("allows clicking minus when value is 1 by default (min=0)", () => {
    const onDecrement = vi.fn();
    const onIncrement = vi.fn();

    render(
      <Stepper
        value={1}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        label="2.75 Kuruvi"
      />,
    );

    const minusButton = screen.getByRole("button", { name: /decrease quantity/i });
    expect(minusButton).not.toBeDisabled();

    fireEvent.click(minusButton);
    expect(onDecrement).toHaveBeenCalledTimes(1);
  });

  it("disables minus when value reaches min (value <= min)", () => {
    const onDecrement = vi.fn();
    const onIncrement = vi.fn();

    render(
      <Stepper
        value={0}
        min={0}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        label="2.75 Kuruvi"
      />,
    );

    const minusButton = screen.getByRole("button", { name: /decrease quantity/i });
    expect(minusButton).toBeDisabled();

    fireEvent.click(minusButton);
    expect(onDecrement).not.toHaveBeenCalled();
  });

  it("disables minus at value 1 when min is explicitly set to 1", () => {
    const onDecrement = vi.fn();
    const onIncrement = vi.fn();

    render(
      <Stepper
        value={1}
        min={1}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        label="Pre-add selector"
      />,
    );

    const minusButton = screen.getByRole("button", { name: /decrease quantity/i });
    expect(minusButton).toBeDisabled();

    fireEvent.click(minusButton);
    expect(onDecrement).not.toHaveBeenCalled();
  });

  it("allows clicking plus to increment", () => {
    const onDecrement = vi.fn();
    const onIncrement = vi.fn();

    render(
      <Stepper
        value={1}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        label="2.75 Kuruvi"
      />,
    );

    const plusButton = screen.getByRole("button", { name: /increase quantity/i });
    expect(plusButton).not.toBeDisabled();

    fireEvent.click(plusButton);
    expect(onIncrement).toHaveBeenCalledTimes(1);
  });
});
