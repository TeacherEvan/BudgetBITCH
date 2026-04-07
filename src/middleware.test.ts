import { NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";
import middleware, { config } from "../middleware";

describe("middleware", () => {
  it("passes application requests through with NextResponse.next", () => {
    const nextSpy = vi.spyOn(NextResponse, "next");

    const response = middleware({} as never);

    expect(nextSpy).toHaveBeenCalledTimes(1);
    expect(response).toBe(nextSpy.mock.results[0]?.value);
  });

  it("keeps the matcher focused on app routes instead of static assets", () => {
    expect(config.matcher).toEqual(["/((?!_next|.*\\..*).*)", "/"]);
  });
});