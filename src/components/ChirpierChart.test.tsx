import React from "react";
import { act, render } from "@testing-library/react";
import { ChirpierChart } from "./ChirpierChart";
import { mountChirpierChart } from "../embed/client";

jest.mock("../embed/client", () => ({
  mountChirpierChart: jest.fn(),
}));

describe("ChirpierChart", () => {
  it("mounts the public embed client and destroys it on unmount", () => {
    const update = jest.fn();
    const destroy = jest.fn();
    const iframe = document.createElement("iframe");
    (mountChirpierChart as jest.Mock).mockReturnValue({ iframe, update, destroy });

    const { unmount } = render(
      <ChirpierChart
        eventId="event-1"
        shareToken="share-1"
        autoResize={false}
        height={320}
        state={{ view: "timeseries" }}
      />,
    );

    expect(mountChirpierChart).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      expect.objectContaining({ eventId: "event-1", state: { view: "timeseries" } }),
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: "event-1", state: { view: "timeseries" }, resizeMode: "fixed", height: 320 }),
    );
    expect(iframe.height).toBe("320");
    expect(iframe.style.height).toBe("320px");

    unmount();
    expect(destroy).toHaveBeenCalled();
  });

  it("applies style and filter updates through the client instance", () => {
    const update = jest.fn();
    const destroy = jest.fn();
    const iframe = document.createElement("iframe");
    (mountChirpierChart as jest.Mock).mockReturnValue({ iframe, update, destroy });

    render(
      <ChirpierChart
        eventId="event-2"
        shareToken="share-2"
        state={{ range: "1m", compare: true, view: "timeseries", variant: "bar" }}
        theme="dark"
        className="chart-frame"
        minHeight={280}
        style={{ backgroundColor: "white" }}
      />,
    );

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: "event-2",
        shareToken: "share-2",
        state: { range: "1m", compare: true, view: "timeseries", variant: "bar" },
        theme: "dark",
        resizeMode: "auto",
      }),
    );
    expect(iframe.className).toBe("chart-frame");
    expect(iframe.style.minHeight).toBe("280px");
    expect(iframe.style.backgroundColor).toBe("white");
  });

  it("supports wrapper sizing", () => {
    const update = jest.fn();
    const destroy = jest.fn();
    const iframe = document.createElement("iframe");
    (mountChirpierChart as jest.Mock).mockReturnValue({ iframe, update, destroy });

    const { getByTestId } = render(
      <div data-testid="host">
        <ChirpierChart eventId="event-3" width={640} aspectRatio="16 / 9" />
      </div>,
    );

    const wrapper = getByTestId("host").firstElementChild as HTMLDivElement;
    expect(wrapper.style.width).toBe("640px");
    expect(wrapper.style.aspectRatio).toBe("16 / 9");
  });

  it("maps top-level aliases into state", () => {
    const update = jest.fn();
    const destroy = jest.fn();
    const iframe = document.createElement("iframe");
    (mountChirpierChart as jest.Mock).mockReturnValue({ iframe, update, destroy });

    render(
      <ChirpierChart
        eventId="event-4"
        range="1d"
        compare
        header={false}
        view="timeseries"
        variant="line"
      />,
    );

    expect(mountChirpierChart).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      expect.objectContaining({
        state: {
          range: "1d",
          compare: true,
          header: false,
          view: "timeseries",
          variant: "line",
        },
      }),
    );
  });

  it("renders loading and error fallbacks through lifecycle events", () => {
    const update = jest.fn();
    const destroy = jest.fn();
    const iframe = document.createElement("iframe");
    let onRendered: ((event: { eventId: string; height: number }) => void) | undefined;
    let onError: ((error: Error) => void) | undefined;

    (mountChirpierChart as jest.Mock).mockImplementation((_container, options) => {
      onRendered = options.onRendered as typeof onRendered;
      onError = options.onError as typeof onError;
      return { iframe, update, destroy };
    });

    const { getByText, queryByText } = render(
      <ChirpierChart
        eventId="event-5"
        loadingFallback={<div>Loading chart</div>}
        errorFallback={(error) => <div>{error.message}</div>}
      />,
    );

    expect(getByText("Loading chart")).toBeTruthy();

    act(() => {
      onRendered?.({ eventId: "event-5", height: 320 });
    });
    expect(queryByText("Loading chart")).toBeNull();

    act(() => {
      onError?.(new Error("Chart failed"));
    });
    expect(getByText("Chart failed")).toBeTruthy();
  });

  it("passes visibility updates through the embed client", () => {
    const update = jest.fn();
    const destroy = jest.fn();
    const iframe = document.createElement("iframe");
    (mountChirpierChart as jest.Mock).mockReturnValue({ iframe, update, destroy });

    const { rerender } = render(
      <ChirpierChart eventId="event-6" shareToken="share-6" inView={false} />,
    );

    expect(mountChirpierChart).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      expect.objectContaining({ eventId: "event-6", shareToken: "share-6", inView: false }),
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: "event-6", shareToken: "share-6", inView: false }),
    );

    rerender(<ChirpierChart eventId="event-6" shareToken="share-6" inView />);

    expect(update).toHaveBeenLastCalledWith(
      expect.objectContaining({ eventId: "event-6", shareToken: "share-6", inView: true }),
    );
  });
});
