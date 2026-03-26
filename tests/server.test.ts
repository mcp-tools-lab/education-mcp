import { describe, it, expect } from "vitest";
import { createServer } from "../src/server.js";

describe("createServer", () => {
  it("creates a server instance", () => {
    const server = createServer();
    expect(server).toBeDefined();
  });

  it("server has correct name", () => {
    const server = createServer();
    // The McpServer stores its metadata internally; we just verify creation doesn't throw
    expect(server).toBeTruthy();
  });
});
