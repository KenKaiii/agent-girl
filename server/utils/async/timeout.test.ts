import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { TimeoutController, TimeoutError } from "./timeout";

describe("TimeoutController - Inactivity Timeout", () => {
  let controller: TimeoutController;
  let warningFired = false;
  let timeoutFired = false;

  beforeEach(() => {
    warningFired = false;
    timeoutFired = false;
  });

  afterEach(() => {
    controller?.cancel();
  });

  it("should NOT timeout with continuous activity (simulating active agent work)", async () => {
    // Use shorter timeouts for faster testing: 200ms warning, 400ms timeout
    controller = new TimeoutController({
      warningMs: 200,
      timeoutMs: 400,
      onWarning: () => { warningFired = true; },
      onTimeout: () => { timeoutFired = true; },
    });

    // Simulate 10 messages over 500ms total (each spaced 50ms apart)
    // Total elapsed time (500ms) > timeout (400ms), but should NOT timeout
    // because we're constantly resetting
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      controller.reset(); // Reset on each "message"

      // Should never timeout during active work
      expect(() => controller.checkTimeout()).not.toThrow();
    }

    // After all activity, neither warning nor timeout should have fired
    expect(warningFired).toBe(false);
    expect(timeoutFired).toBe(false);

    console.log("✅ Test 1 passed: Continuous activity does NOT timeout");
  });

  it("should fire warning after 60s of inactivity (scaled down)", async () => {
    // Use 100ms for faster testing (scaled from 60s)
    controller = new TimeoutController({
      warningMs: 100,
      timeoutMs: 200,
      onWarning: () => { warningFired = true; },
      onTimeout: () => { timeoutFired = true; },
    });

    // Wait for warning to fire
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(warningFired).toBe(true);
    expect(timeoutFired).toBe(false);

    console.log("✅ Test 2 passed: Warning fires after inactivity period");
  });

  it("should timeout after 120s of inactivity (scaled down)", async () => {
    // Use 200ms for faster testing (scaled from 120s)
    controller = new TimeoutController({
      warningMs: 100,
      timeoutMs: 200,
      onWarning: () => { warningFired = true; },
      onTimeout: () => { timeoutFired = true; },
    });

    // Wait for timeout to fire
    await new Promise(resolve => setTimeout(resolve, 250));

    expect(warningFired).toBe(true);
    expect(timeoutFired).toBe(true);

    // checkTimeout should throw
    expect(() => controller.checkTimeout()).toThrow(TimeoutError);

    console.log("✅ Test 3 passed: Timeout fires after inactivity period");
  });

  it("should reset warning and timeout when reset() is called", async () => {
    controller = new TimeoutController({
      warningMs: 100,
      timeoutMs: 200,
      onWarning: () => { warningFired = true; },
      onTimeout: () => { timeoutFired = true; },
    });

    // Wait 90ms (just before warning at 100ms)
    await new Promise(resolve => setTimeout(resolve, 90));

    // Reset the timer
    controller.reset();

    // Wait another 90ms (total 180ms, but only 90ms since reset)
    await new Promise(resolve => setTimeout(resolve, 90));

    // Warning should NOT have fired because we reset
    expect(warningFired).toBe(false);
    expect(timeoutFired).toBe(false);

    console.log("✅ Test 4 passed: Reset prevents warning/timeout from firing");
  });

  it("should handle real-world scenario: long-running agent with periodic activity", async () => {
    // Simulate realistic scenario: agent works for 3 minutes with activity every 30s
    // Use scaled down timers: 60s warning -> 60ms, 120s timeout -> 120ms
    // Activity every 30s -> 30ms
    controller = new TimeoutController({
      warningMs: 60,
      timeoutMs: 120,
      onWarning: () => { warningFired = true; },
      onTimeout: () => { timeoutFired = true; },
    });

    // Simulate agent working for "180 seconds" (180ms in test time)
    // with activity every "30 seconds" (30ms)
    const iterations = 6; // 6 * 30ms = 180ms total
    for (let i = 0; i < iterations; i++) {
      await new Promise(resolve => setTimeout(resolve, 30));
      controller.reset(); // Simulate message/activity

      // Should never timeout during work
      expect(() => controller.checkTimeout()).not.toThrow();
    }

    // After 180ms of total work (with activity every 30ms), should NOT timeout
    expect(warningFired).toBe(false);
    expect(timeoutFired).toBe(false);

    console.log("✅ Test 5 passed: Long-running work with periodic activity does NOT timeout");
  });

  it("should timeout if agent hangs mid-work", async () => {
    controller = new TimeoutController({
      warningMs: 60,
      timeoutMs: 120,
      onWarning: () => { warningFired = true; },
      onTimeout: () => { timeoutFired = true; },
    });

    // Do some work
    await new Promise(resolve => setTimeout(resolve, 20));
    controller.reset();

    await new Promise(resolve => setTimeout(resolve, 20));
    controller.reset();

    // Agent hangs here - no more resets
    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should have timed out
    expect(timeoutFired).toBe(true);
    expect(() => controller.checkTimeout()).toThrow(TimeoutError);

    console.log("✅ Test 6 passed: Timeout fires when agent hangs during work");
  });
});
