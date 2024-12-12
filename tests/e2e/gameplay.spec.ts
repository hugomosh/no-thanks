import { test, expect } from "@playwright/test";
import { setupTwoPlayerGame } from "./fixtures/gameSetup";

test.describe("Game Play", () => {
  test("should allow player to take card or pass on their turn", async ({
    browser,
    page,
  }) => {
    const {
      activePlayer,
      waitingPlayer,
      activePlayerName,
      waitingPlayerName,
      currentCard,
    } = await setupTwoPlayerGame(browser, page);

    // Verify turn indicators
    await expect(activePlayer.getByTestId("current-turn")).toHaveText(
      "Your turn"
    );
    await expect(waitingPlayer.getByTestId("current-turn")).toHaveText(
      `${activePlayerName}'s turn`
    );

    // Verify action buttons visibility
    await expect(
      activePlayer.getByRole("button", { name: "Take Card" })
    ).toBeVisible();
    await expect(
      activePlayer.getByRole("button", { name: "Pass" })
    ).toBeVisible();
    await expect(
      waitingPlayer.getByRole("button", { name: "Take Card" })
    ).not.toBeVisible();
    await expect(
      waitingPlayer.getByRole("button", { name: "Pass" })
    ).not.toBeVisible();

    // Active player passes
    await activePlayer.getByRole("button", { name: "Pass" }).click();
    await expect(activePlayer.getByTestId("player-tokens-count")).toHaveText(
      "10"
    );
    await expect(activePlayer.getByTestId("card-tokens")).toContainText("1");

    // Verify turn changed
    await expect(waitingPlayer.getByTestId("current-turn")).toHaveText(
      "Your turn"
    );
    await expect(activePlayer.getByTestId("current-turn")).toHaveText(
      `${waitingPlayerName}'s turn`
    );

    // Waiting player takes the card
    await waitingPlayer.getByRole("button", { name: "Take Card" }).click();
    await expect(waitingPlayer.getByTestId("player-cards")).toContainText(
      currentCard
    );
    await expect(waitingPlayer.getByTestId("player-tokens-count")).toHaveText(
      "12"
    );
  });

  test("should not allow passing without tokens", async ({ browser, page }) => {
    const { activePlayer, waitingPlayer } = await setupTwoPlayerGame(
      browser,
      page
    );

    for (let i = 0; i < 11; i++) {
      await activePlayer.getByRole("button", { name: "Pass" }).click();

      // Verify token was spent
      await expect(activePlayer.getByTestId("player-tokens-count")).toHaveText(
        String(10 - i)
      );

      // Wait for turn to change
      await expect(waitingPlayer.getByTestId("current-turn")).toHaveText(
        "Your turn"
      );

      await waitingPlayer.getByRole("button", { name: "Pass" }).click();

      // Verify token was spent
      await expect(waitingPlayer.getByTestId("player-tokens-count")).toHaveText(
        String(10 - i)
      );
    }

    // Now the original active player should have 0 tokens
    await expect(activePlayer.getByTestId("player-tokens-count")).toHaveText(
      "0"
    );
    await expect(
      activePlayer.getByRole("button", { name: "Pass" })
    ).toBeDisabled();
  });

  test("should accumulate tokens on card when multiple players pass", async ({
    browser,
    page,
  }) => {
    const { activePlayer, waitingPlayer, currentCard } =
      await setupTwoPlayerGame(browser, page);

    // First player passes
    await activePlayer.getByRole("button", { name: "Pass" }).click();
    await expect(activePlayer.getByTestId("player-tokens-count")).toHaveText(
      "10"
    );
    await expect(activePlayer.getByTestId("card-tokens")).toContainText("1");

    // Wait for turn to change
    await expect(waitingPlayer.getByTestId("current-turn")).toHaveText(
      "Your turn"
    );

    // Second player passes
    await waitingPlayer.getByRole("button", { name: "Pass" }).click();
    await expect(waitingPlayer.getByTestId("player-tokens-count")).toHaveText(
      "10"
    );
    await expect(waitingPlayer.getByTestId("card-tokens")).toContainText("2");

    // Wait for turn to change back
    await expect(activePlayer.getByTestId("current-turn")).toHaveText(
      "Your turn"
    );

    // First player takes card with accumulated tokens
    await activePlayer.getByRole("button", { name: "Take Card" }).click();
    await expect(activePlayer.getByTestId("player-tokens-count")).toHaveText(
      "12"
    ); // 10 + 2 from card
    await expect(activePlayer.getByTestId("player-cards")).toContainText(
      currentCard
    );
  });

  test("should show new card after current card is taken", async ({
    browser,
    page,
  }) => {
    const { activePlayer, waitingPlayer, currentCard } =
      await setupTwoPlayerGame(browser, page);

    // Take first card
    await activePlayer.getByRole("button", { name: "Take Card" }).click();
    await expect(activePlayer.getByTestId("player-cards")).toContainText(
      currentCard
    );

    // Verify new card appears
    const newCard = await activePlayer
      .getByTestId("current-card")
      .textContent();
    expect(newCard).not.toBe(currentCard);

    // Verify both players see the same new card
    await expect(waitingPlayer.getByTestId("current-card")).toHaveText(
      newCard!
    );

    // Verify no tokens on new card
    await expect(activePlayer.getByTestId("card-tokens")).toContainText("0");
  });

  test("should end game when all cards are taken", async ({
    browser,
    page,
  }) => {
    const { activePlayer, waitingPlayer } = await setupTwoPlayerGame(
      browser,
      page
    );

    let previousCard = "";
    // Take cards until game ends (24 cards in deck)
    for (let i = 0; i < 24; i++) {
      await expect(activePlayer.getByTestId("current-card")).toBeVisible();

      const currentCard = await activePlayer
        .getByTestId("current-card")
        .textContent();
      if (previousCard) {
        expect(currentCard).not.toBe(previousCard);
      }
      previousCard = currentCard!;

      await activePlayer.getByRole("button", { name: "Take Card" }).click();

      // Wait for new card to be different (except on last card)
      if (i < 23) {
        await activePlayer.waitForFunction((oldCard) => {
          const cardText = document.querySelector(
            '[data-testid="current-card"]'
          )?.textContent;
          return cardText && cardText !== oldCard;
        }, currentCard);
      }
    }

    // Verify game ended
    await expect(activePlayer.getByTestId("game-status")).toHaveText(
      "Game Over!"
    );
    await expect(waitingPlayer.getByTestId("game-status")).toHaveText(
      "Game Over!"
    );

    // Verify final scores are shown
    await expect(activePlayer.getByTestId("final-scores")).toBeVisible();
    await expect(waitingPlayer.getByTestId("final-scores")).toBeVisible();
  });

  test("should allow starting a new game after game ends", async ({
    browser,
    page,
  }) => {
    const { activePlayer, waitingPlayer } = await setupTwoPlayerGame(
      browser,
      page
    );

    // Play 24 cards (the deck size)
    for (let i = 0; i < 24; i++) {
      // Take the current card
      await activePlayer.getByRole("button", { name: "Take Card" }).click();

      // For all except last card, wait for next card
      if (i < 23) {
        await activePlayer.waitForFunction(() => {
          const cardText = document.querySelector(
            '[data-testid="current-card"]'
          )?.textContent;
          return cardText && cardText.match(/\d+/);
        });
      }
    }

    // Wait for game over
    await expect(activePlayer.getByTestId("game-status")).toHaveText(
      "Game Over!git"
    );

    // Start new game
    await page.getByRole("button", { name: "Play Again" }).click();

    // Verify game restarted
    await expect(activePlayer.getByTestId("game-status")).toHaveText(
      "Game started"
    );

    // Verify both players see new game state
    for (const player of [activePlayer, waitingPlayer]) {
      // Should have initial tokens
      await expect(player.getByTestId("player-tokens-count")).toHaveText("11");

      // Should have no cards
      // await expect(player.getByTestId("player-cards")).toHaveText("");

      // Should see current card
      await expect(player.getByTestId("current-card")).toBeVisible();
    }
  });
});
