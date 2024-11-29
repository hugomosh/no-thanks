import { test, expect } from "@playwright/test";

// tests/e2e/room.spec.ts
test.describe("Room Creation", () => {
  test("should create a room with creator as first player", async ({
    page,
  }) => {
    // Start from home page with player name input
    await page.goto("/");

    // Fill in creator's name
    await page.getByTestId("player-name").fill("Creator");

    // Click create room button
    await page.getByRole("button", { name: "Create Room" }).click();

    // Wait for navigation to complete
    await page.waitForURL(/\/room\/[a-z]{3}-[a-z]{3}-[a-z]{3}$/);

    // Verify creator is listed as player
    await expect(page.getByTestId("players-list")).toContainText("Creator");

    // Verify player count shows 1
    await expect(page.getByTestId("player-count")).toHaveText("Players: 1/7");
  });

  test("should create a new room with three 3-letter words", async ({
    page,
  }) => {
    // Start from home page
    await page.goto("/");
    await page.getByTestId("player-name").fill("Player 1");

    // Click create room button
    await page.getByRole("button", { name: "Create Room" }).click();

    // Check if we're redirected to a room page
    await page.waitForURL(/\/room\/[a-z]{3}-[a-z]{3}-[a-z]{3}$/);

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
    await page.getByTestId("player-name").fill("Player 1");
    await page.getByRole("button", { name: "Create Room" }).click();

    // Check if we're redirected to a room page
    await page.waitForURL(/\/room\/[a-z]{3}-[a-z]{3}-[a-z]{3}$/);
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
    await secondPlayer.waitForURL(/\/room\/[a-z]{3}-[a-z]{3}-[a-z]{3}$/);
    await expect(secondPlayer.url()).toBe(roomUrl);

    // Verify player count updated in both browsers
    await expect(page.getByTestId("player-count")).toHaveText("Players: 2/7");
    await expect(secondPlayer.getByTestId("player-count")).toHaveText(
      "Players: 2/7"
    );
  });

  test("should show error when creating room without player name", async ({
    page,
  }) => {
    await page.goto("/");

    // Try to create room without name
    await page.getByRole("button", { name: "Create Room" }).click();

    await expect(page.getByTestId("error-message")).toHaveText(
      "Please enter your name"
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

  test("should show error when room is full", async ({ browser, page }) => {
    try {
      // First player creates room
      await page.goto("/");
      await page.getByTestId("player-name").fill("Creator");
      await page.getByRole("button", { name: "Create Room" }).click();
      await page.waitForURL(/\/room\/[a-z]{3}-[a-z]{3}-[a-z]{3}$/);
      const roomCode = await page.getByTestId("room-code").textContent();

      // Add players 2-7
      for (let i = 2; i <= 7; i++) {
        // Create new context for each player
        const context = await browser.newContext();
        const playerPage = await context.newPage();

        await playerPage.goto("/join");
        await playerPage.getByTestId("room-input").fill(roomCode!);
        await playerPage.getByTestId("player-name").fill(`Player ${i}`);
        await playerPage.getByRole("button", { name: "Join" }).click();

        // Wait for both the original page and new player page to update
        await expect(page.getByTestId("player-count")).toHaveText(
          `Players: ${i}/7`,
          { timeout: 10000 }
        );
        await expect(playerPage.getByTestId("player-count")).toHaveText(
          `Players: ${i}/7`,
          { timeout: 10000 }
        );
      }

      await page.pause();

      // Try joining with 8th player
      const lastContext = await browser.newContext();
      const lastPage = await lastContext.newPage();

      await lastPage.goto("/join");
      await lastPage.getByTestId("room-input").fill(roomCode!);
      await lastPage.getByTestId("player-name").fill("Player 8");
      await lastPage.getByRole("button", { name: "Join" }).click();

      await expect(lastPage.getByTestId("error-message")).toHaveText(
        "Room is full (maximum 7 players)"
      );
    } finally {
      console.log("Fin.");
    }
  });
});
