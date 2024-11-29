// tests/e2e/testUtils.ts
import { Page } from "@playwright/test";

export async function injectMocks(page: Page) {
  await page.addInitScript(() => {
    window.mockJoinRoom = async (playerNames: string[]) => {
      // Get the current room code from the page
      const roomCode = document.querySelector(
        '[data-testid="room-code"]'
      )?.textContent;
      if (!roomCode) return;

      // Call the join_room function for each player name
      for (const name of playerNames) {
        await window.supabase.rpc("join_room", {
          p_room_code: roomCode,
          p_player_name: name,
        });
      }
    };
  });
}
