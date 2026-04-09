import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { mountChirpierChart } from "./client";

const SOURCE = "chirpier-embed";
const VERSION = "1.0";

function createContainer() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  return container;
}

function setIframeWindow(iframe: HTMLIFrameElement) {
  const postMessage = jest.fn();
  Object.defineProperty(iframe, "contentWindow", {
    configurable: true,
    value: { postMessage },
  });
  return postMessage;
}

function emitIframeMessage(iframe: HTMLIFrameElement, type: string, payload: object, origin = new URL(iframe.src).origin) {
  const url = new URL(iframe.src);
  const embedId = url.searchParams.get("embedId");

  window.dispatchEvent(
    new MessageEvent("message", {
      origin,
      data: {
        source: SOURCE,
        version: VERSION,
        embedId,
        type,
        payload,
      },
    }),
  );
}

describe("mountChirpierChart", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("mounts an iframe with public url params", () => {
    const container = createContainer();

    const instance = mountChirpierChart(container, {
      eventId: "event-1",
      shareToken: "share-1",
      state: {
        range: "1d",
        aggregate: "average",
        variant: "bar",
        compare: true,
        header: false,
        view: "tracker",
        tracker: { condition: "lte", threshold: 8 },
      },
    });

    const url = new URL(instance.iframe.src);
    expect(url.pathname).toBe("/events/event-1");
    expect(url.searchParams.get("share")).toBe("share-1");
    expect(url.searchParams.get("aggregate")).toBe("average");
    expect(url.searchParams.get("variant")).toBe("bar");
    expect(url.searchParams.get("range")).toBe("1d");
    expect(url.searchParams.get("compare")).toBe("true");
    expect(url.searchParams.get("header")).toBe("false");
    expect(url.searchParams.get("view")).toBe("tracker");
    expect(url.searchParams.get("trackerCondition")).toBe("lte");
    expect(url.searchParams.get("trackerThreshold")).toBe("8");
    expect(url.searchParams.get("chart")).toBeNull();
  });

  it("defaults the iframe host to www.chirpier.co", () => {
    const container = createContainer();

    const instance = mountChirpierChart(container, {
      eventId: "event-default-host",
    });

    const url = new URL(instance.iframe.src);
    expect(url.origin).toBe("https://www.chirpier.co");
  });

  it("uses the explicit baseUrl when provided", () => {
    const container = createContainer();

    const instance = mountChirpierChart(container, {
      eventId: "event-custom-host",
      baseUrl: "https://staging.chirpier.co/",
    });

    const url = new URL(instance.iframe.src);
    expect(url.origin).toBe("https://staging.chirpier.co");
  });

  it("serializes canonical event page filters", () => {
    const container = createContainer();

    const instance = mountChirpierChart(container, {
      eventId: "event-2",
      state: {
        range: "1w",
        aggregate: "average",
        variant: "bar",
        view: "tracker",
        tracker: { condition: "lte", threshold: 12.5 },
      },
    });

    const url = new URL(instance.iframe.src);
    expect(url.searchParams.get("range")).toBe("1w");
    expect(url.searchParams.get("aggregate")).toBe("average");
    expect(url.searchParams.get("variant")).toBe("bar");
    expect(url.searchParams.get("view")).toBe("tracker");
    expect(url.searchParams.get("trackerCondition")).toBe("lte");
    expect(url.searchParams.get("trackerThreshold")).toBe("12.5");
    expect(url.searchParams.get("chart")).toBeNull();
  });

  it("omits canonical default params", () => {
    const container = createContainer();

    const instance = mountChirpierChart(container, {
      eventId: "event-3",
      state: {
        compare: false,
        view: "all",
        variant: "line",
        aggregate: "sum",
        tracker: { condition: "gt", threshold: 0 },
      },
    });

    const url = new URL(instance.iframe.src);
    expect(url.searchParams.get("header")).toBeNull();
    expect(url.searchParams.get("compare")).toBeNull();
    expect(url.searchParams.get("aggregate")).toBeNull();
    expect(url.searchParams.get("variant")).toBeNull();
    expect(url.searchParams.get("view")).toBeNull();
    expect(url.searchParams.get("trackerCondition")).toBeNull();
    expect(url.searchParams.get("trackerThreshold")).toBeNull();
  });

  it("updates iframe height on resize messages", () => {
    const container = createContainer();
    const onResize = jest.fn();

    const instance = mountChirpierChart(container, {
      eventId: "event-1",
      onResize,
    });

    setIframeWindow(instance.iframe);
    emitIframeMessage(instance.iframe, "resize", { height: 512 });

    expect(instance.iframe.height).toBe("512");
    expect(onResize).toHaveBeenCalledWith({ height: 512 });
  });

  it("reports iframe errors", () => {
    const container = createContainer();
    const onError = jest.fn();

    const instance = mountChirpierChart(container, {
      eventId: "event-1",
      onError,
    });

    setIframeWindow(instance.iframe);
    emitIframeMessage(instance.iframe, "error", {
      code: "UNAUTHORIZED",
      message: "No access",
      retryable: false,
    });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: "UNAUTHORIZED", message: "No access" }),
    );
  });

  it("supports update helpers and destroy cleanup", () => {
    const container = createContainer();
    const instance = mountChirpierChart(container, {
      eventId: "event-1",
    });

    const postMessage = setIframeWindow(instance.iframe);
    const initialUrl = new URL(instance.iframe.src);

    instance.updateState({ range: "1w", compare: true, view: "summary" });
    instance.updateTheme("dark");
    instance.destroy();

    const updatedUrl = new URL(instance.iframe.src);
    expect(updatedUrl.searchParams.get("range")).toBe("1w");
    expect(updatedUrl.searchParams.get("compare")).toBe("true");
    expect(updatedUrl.searchParams.get("view")).toBe("summary");
    expect(updatedUrl.toString()).not.toBe(initialUrl.toString());
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "updateTheme", payload: { theme: "dark" } }),
      new URL(instance.iframe.src).origin,
    );
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "destroy" }),
      new URL(instance.iframe.src).origin,
    );
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("updates the iframe host when baseUrl changes", () => {
    const container = createContainer();
    const instance = mountChirpierChart(container, {
      eventId: "event-1",
    });

    instance.update({ baseUrl: "https://staging.chirpier.co/" });

    const updatedUrl = new URL(instance.iframe.src);
    expect(updatedUrl.origin).toBe("https://staging.chirpier.co");
  });

  it("applies theme on initial iframe load", () => {
    const container = createContainer();
    const instance = mountChirpierChart(container, {
      eventId: "event-1",
      theme: "dark",
    });

    const postMessage = setIframeWindow(instance.iframe);
    instance.iframe.dispatchEvent(new Event("load"));

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "updateTheme", payload: { theme: "dark" } }),
      new URL(instance.iframe.src).origin,
    );
  });
});
