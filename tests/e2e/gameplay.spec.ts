// tests/e2e/gameplay.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Game Play", () => {
  test("should allow player to take card or pass on their turn", async ({
    browser,
    page,
  }) => {
    // Setup game with 2 players
    await page.goto("/");
    await page.getByTestId("player-name").fill("Creator");
    await page.getByRole("button", { name: "Create Room" }).click();
    await page.waitForURL(/\/room\/[a-z]{3}-[a-z]{3}-[a-z]{3}$/);
    const roomCode = await page.getByTestId("room-code").textContent();

    // Second player joins
    const player2Page = await browser.newPage();
    await player2Page.goto("/join");
    await player2Page.getByTestId("room-input").fill(roomCode!);
    await player2Page.getByTestId("player-name").fill("Player 2");
    await player2Page.getByRole("button", { name: "Join" }).click();

    // Wait for player to join
    await expect(page.getByTestId("player-count")).toHaveText("Players: 2/7", {
      timeout: 10000,
    });

    // Start game
    await page.getByRole("button", { name: "Start Game" }).click();

    // Wait for both pages to show a card number
    await page.waitForFunction(() => {
      const cardText = document.querySelector(
        '[data-testid="current-card"]'
      )?.textContent;
      return cardText && cardText.match(/\d+/);
    });
    await player2Page.waitForFunction(() => {
      const cardText = document.querySelector(
        '[data-testid="current-card"]'
      )?.textContent;
      return cardText && cardText.match(/\d+/);
    });

    // Now get the card numbers and compare
    const card1 = await page.getByTestId("current-card").textContent();
    const card2 = await player2Page.getByTestId("current-card").textContent();
    expect(card1).toBe(card2);

    // Verify it's first player's turn
    await expect(page.getByTestId("current-turn")).toHaveText("Your turn");
    await expect(player2Page.getByTestId("current-turn")).toHaveText(
      "Creator's turn"
    );

    // First player should see take/pass options
    await expect(page.getByRole("button", { name: "Take Card" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pass" })).toBeVisible();

    // Second player shouldn't see options
    await expect(
      player2Page.getByRole("button", { name: "Take Card" })
    ).not.toBeVisible();
    await expect(
      player2Page.getByRole("button", { name: "Pass" })
    ).not.toBeVisible();

    // First player passes
    await page.getByRole("button", { name: "Pass" }).click();

    // Verify token was spent
    await expect(page.getByTestId("player-tokens")).toContainText("10");

    // Verify token appears on card
    await expect(page.getByTestId("card-tokens")).toContainText("1");

    // Verify it's second player's turn
    await expect(player2Page.getByTestId("current-turn")).toHaveText(
      "Your turn"
    );
    await expect(page.getByTestId("current-turn")).toHaveText(
      "Player 2's turn"
    );

    // Second player takes the card
    await player2Page.getByRole("button", { name: "Take Card" }).click();

    // Verify second player got card and tokens
    await expect(player2Page.getByTestId("player-cards")).toContainText(
      currentCard!
    );
    await expect(player2Page.getByTestId("player-tokens")).toContainText("12"); // 11 initial + 1 from card
  });
});
