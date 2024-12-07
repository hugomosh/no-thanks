// tests/e2e/fixtures/gameSetup.ts
import { Browser, Page, expect } from "@playwright/test";

export type GamePlayers = {
  creator: Page;
  player2: Page;
  activePlayer: Page;
  waitingPlayer: Page;
  activePlayerName: string;
  waitingPlayerName: string;
  currentCard: string;
};

export async function setupTwoPlayerGame(
  browser: Browser,
  creatorPage: Page
): Promise<GamePlayers> {
  // Setup game with 2 players
  await creatorPage.goto("/");
  await creatorPage.getByTestId("player-name").fill("Creator");
  await creatorPage.getByRole("button", { name: "Create Room" }).click();
  await creatorPage.waitForURL(/\/room\/[a-z]{3}-[a-z]{3}-[a-z]{3}$/);
  const roomCode = await creatorPage.getByTestId("room-code").textContent();

  // Second player joins
  const player2Page = await browser.newPage();
  await player2Page.goto("./join");
  await player2Page.getByTestId("room-input").fill(roomCode!);
  await player2Page.getByTestId("player-name").fill("Player 2");
  await player2Page.getByRole("button", { name: "Join" }).click();

  // Wait for player to join
  await expect(creatorPage.getByTestId("player-count")).toHaveText(
    "Players: 2/7",
    {
      timeout: 25000,
    }
  );

  // Start game
  await creatorPage.getByRole("button", { name: "Start Game" }).click();

  // Wait for game state
  await waitForGameStart(creatorPage, player2Page);

  // Determine active and waiting players
  const isCreatorFirst = await creatorPage
    .getByTestId("current-turn")
    .textContent()
    .then((text) => text === "Your turn");

  const activePlayer = isCreatorFirst ? creatorPage : player2Page;
  const waitingPlayer = isCreatorFirst ? player2Page : creatorPage;
  const activePlayerName = isCreatorFirst ? "Creator" : "Player 2";
  const waitingPlayerName = !isCreatorFirst ? "Creator" : "Player 2";
  const currentCard = await getCurrentCard(creatorPage);

  return {
    creator: creatorPage,
    player2: player2Page,
    activePlayer,
    waitingPlayer,
    activePlayerName,
    waitingPlayerName,
    currentCard,
  };
}

async function waitForGameStart(page1: Page, page2: Page) {
  // Wait for both pages to show a card number
  await page1.waitForFunction(() => {
    const cardText = document.querySelector(
      '[data-testid="current-card"]'
    )?.textContent;
    return cardText && cardText.match(/\d+/);
  });
  await page2.waitForFunction(() => {
    const cardText = document.querySelector(
      '[data-testid="current-card"]'
    )?.textContent;
    return cardText && cardText.match(/\d+/);
  });

  // Verify both players see the same card
  const card1 = await page1.getByTestId("current-card").textContent();
  const card2 = await page2.getByTestId("current-card").textContent();
  expect(card1).toBe(card2);
}

async function getCurrentCard(page: Page): Promise<string> {
  const cardText = await page.getByTestId("current-card").textContent();
  return cardText!.match(/\d+/)![0];
}
