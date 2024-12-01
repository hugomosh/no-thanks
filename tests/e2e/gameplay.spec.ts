// tests/e2e/gameplay.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Game Play", () => {
  test("should allow player to take card or pass on their turn", async ({
    browser,
    page: creatorPage,
  }) => {
    // Setup game with 2 players
    await creatorPage.goto("/");
    await creatorPage.getByTestId("player-name").fill("Creator");
    await creatorPage.getByRole("button", { name: "Create Room" }).click();
    await creatorPage.waitForURL(/\/room\/[a-z]{3}-[a-z]{3}-[a-z]{3}$/);
    const roomCode = await creatorPage.getByTestId("room-code").textContent();

    // Second player joins
    const player2Page = await browser.newPage();
    await player2Page.goto("/join");
    await player2Page.getByTestId("room-input").fill(roomCode!);
    await player2Page.getByTestId("player-name").fill("Player 2");
    await player2Page.getByRole("button", { name: "Join" }).click();

    // Wait for player to join
    await expect(creatorPage.getByTestId("player-count")).toHaveText(
      "Players: 2/7",
      {
        timeout: 10000,
      }
    );

    // Start game
    await creatorPage.getByRole("button", { name: "Start Game" }).click();

    // Wait for both pages to show a card number
    await creatorPage.waitForFunction(() => {
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

    // Verify both players see the same card
    const card1 = await creatorPage.getByTestId("current-card").textContent();
    const card2 = await player2Page.getByTestId("current-card").textContent();
    expect(card1).toBe(card2);

    // Store the current card number
    const currentCard = card1!.match(/\d+/)![0]; // Extract just the number

    // Determine active and waiting players
    const isCreatorFirst = await creatorPage
      .getByTestId("current-turn")
      .textContent()
      .then((text) => text === "Your turn");

    const activePage = isCreatorFirst ? creatorPage : player2Page;
    const waitingPage = isCreatorFirst ? player2Page : creatorPage;
    const activePlayerName = isCreatorFirst ? "Creator" : "Player 2";
    const waitinglayerName = !isCreatorFirst ? "Creator" : "Player 2";

    // Verify turn indicators
    await expect(activePage.getByTestId("current-turn")).toHaveText(
      "Your turn"
    );
    await expect(waitingPage.getByTestId("current-turn")).toHaveText(
      `${activePlayerName}'s turn`
    );

    // Verify action buttons visibility
    await expect(
      activePage.getByRole("button", { name: "Take Card" })
    ).toBeVisible();
    await expect(
      activePage.getByRole("button", { name: "Pass" })
    ).toBeVisible();
    await expect(
      waitingPage.getByRole("button", { name: "Take Card" })
    ).not.toBeVisible();
    await expect(
      waitingPage.getByRole("button", { name: "Pass" })
    ).not.toBeVisible();

    // Active player passes
    await activePage.getByRole("button", { name: "Pass" }).click();

    // Verify token was spent
    await expect(activePage.getByTestId("player-tokens")).toContainText("10");

    // Verify token appears on card
    await expect(activePage.getByTestId("card-tokens")).toContainText("1");

    // Verify it's second player's turn
    await expect(waitingPage.getByTestId("current-turn")).toHaveText(
      "Your turn"
    );
    await expect(activePage.getByTestId("current-turn")).toHaveText(
      `${waitinglayerName}'s turn`
    );

    // Waiting player takes the card
    await waitingPage.getByRole("button", { name: "Take Card" }).click();

    // Verify waiting player got card and tokens
    await expect(waitingPage.getByTestId("player-cards")).toContainText(
      currentCard!
    );
    await expect(waitingPage.getByTestId("player-tokens")).toContainText("12"); // 11 initial + 1 from card
  });

  test("should allow player to take card or pass on their turn old ", async ({
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

    // After starting game, first find out who's turn it is
    const currentTurnText = await page
      .getByTestId("current-turn")
      .textContent();
    if (currentTurnText === "Your turn") {
      // Creator is first
      await expect(page.getByTestId("current-turn")).toHaveText("Your turn");
      await expect(player2Page.getByTestId("current-turn")).toHaveText(
        "Creator's turn"
      );
    } else {
      // Player 2 is first
      await expect(page.getByTestId("current-turn")).toHaveText(
        "Player 2's turn"
      );
      await expect(player2Page.getByTestId("current-turn")).toHaveText(
        "Your turn"
      );
    }

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
