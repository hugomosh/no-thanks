import { test, expect } from "@playwright/test";

// tests/e2e/room.spec.ts
test.describe("Room Creation", () => {
  test("should create a new room with three 3-letter words", async ({
    page,
  }) => {
    // Start from home page
    await page.goto("/");

    // Click create room button
    await page.getByRole("button", { name: "Create Room" }).click();

    // Check if we're redirected to a room page
    await  page.waitForURL(/\/room\/[a-z]{3}-[a-z]{3}-[a-z]{3}$/);

    // Verify room code format
    const roomCode = await page.getByTestId("room-code").textContent();
    expect(roomCode).toMatch(/^[a-z]{3}-[a-z]{3}-[a-z]{3}$/);

    // Verify waiting for players message
    await expect(page.getByTestId("waiting-message")).toHaveText(
      "Waiting for players to join..."
    );

    // Verify initial player count
    await expect(page.getByTestId("player-count")).toHaveText("Players: 1/7");
  });

  test("should allow joining an existing room", async ({ page, browser }) => {
    // Create a room first
    await page.goto("/");
    await page.getByRole("button", { name: "Create Room" }).click();
    const roomUrl = page.url();
    const roomCode = await page.getByTestId("room-code").textContent();

    // Open new browser context for second player
    const secondPlayer = await browser.newPage();
    await secondPlayer.goto("/join");

    // Join room
    await secondPlayer.getByTestId("room-input").fill(roomCode!);
    await secondPlayer.getByTestId("player-name").fill("Player 2");
    await secondPlayer.getByRole("button", { name: "Join" }).click();

    // Verify redirect to room
    await expect(secondPlayer.url()).toBe(roomUrl);

    // Verify player count updated in both browsers
    await expect(page.getByTestId("player-count")).toHaveText("Players: 2/7");
    await expect(secondPlayer.getByTestId("player-count")).toHaveText(
      "Players: 2/7"
    );
  });

  test("should show error when joining non-existent room", async ({ page }) => {
    await page.goto("/join");
    await page.getByTestId("room-input").fill("cat-dog-bat");
    await page.getByTestId("player-name").fill("Player 1");
    await page.getByRole("button", { name: "Join" }).click();

    await expect(page.getByTestId("error-message")).toHaveText(
      "Room not found"
    );
  });

  test("should show error when room is full", async ({ page }) => {
    // Create room and simulate 7 players
    await page.goto("/");
    await page.getByRole("button", { name: "Create Room" }).click();

    // Simulate adding 6 more players (total 7)
    await page.evaluate(() => {
      window.mockJoinRoom(["P2", "P3", "P4", "P5", "P6", "P7"]);
    });

    // Try joining with 8th player
    await page.goto("/join");
    const roomCode = await page.getByTestId("room-code").textContent();
    await page.getByTestId("room-input").fill(roomCode!);
    await page.getByTestId("player-name").fill("Player 8");
    await page.getByRole("button", { name: "Join" }).click();

    await expect(page.getByTestId("error-message")).toHaveText(
      "Room is full (maximum 7 players)"
    );
  });
});
