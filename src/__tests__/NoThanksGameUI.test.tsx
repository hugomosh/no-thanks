import { vi } from "vitest";

const mockSupabase = {
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  })),
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    execute: vi.fn(),
  })),
};

// Mock modules
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => mockSupabase,
}));

vi.mock("@testing-library/user-event", () => ({
  default: {
    click: vi.fn(),
    type: vi.fn(),
  },
}));

// Now import everything else
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import NoThanksGameUI from "../components/NoThanksGameUI";

// Test data
const mockGameStates = {
  waiting: {
    id: "123",
    code: "ABC123",
    status: "waiting",
    current_card: null,
    tokens_on_card: 0,
    deck: [],
    removed_cards: [],
    current_player_index: 0,
  },
  playing: {
    id: "123",
    code: "ABC123",
    status: "playing",
    current_card: 5,
    tokens_on_card: 2,
    deck: [6, 7, 8],
    removed_cards: [10, 11],
    current_player_index: 0,
  },
  ended: {
    id: "123",
    code: "ABC123",
    status: "ended",
    current_card: null,
    tokens_on_card: 0,
    deck: [],
    removed_cards: [10, 11],
    current_player_index: 0,
  },
};

const mockPlayers = {
  standard: [
    {
      id: "p1",
      name: "Player 1",
      tokens: 11,
      cards: [],
      is_active: true,
      is_ready: true,
      room_id: "123",
      created_at: new Date().toISOString(),
    },
    {
      id: "p2",
      name: "Player 2",
      tokens: 11,
      cards: [],
      is_active: false,
      is_ready: true,
      room_id: "123",
      created_at: new Date().toISOString(),
    },
  ],
  withCards: [
    {
      id: "p1",
      name: "Player 1",
      tokens: 8,
      cards: [3, 4, 5],
      is_active: true,
      is_ready: true,
      room_id: "123",
      created_at: new Date().toISOString(),
    },
  ],
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("NoThanksGameUI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("playerId", "p1");
  });

  it("renders loading state initially", () => {
    renderWithRouter(<NoThanksGameUI />);
    expect(screen.getByText("Loading game...")).toBeInTheDocument();
  });

  it("shows game board after loading", async () => {
    renderWithRouter(<NoThanksGameUI />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument(); // Current card
      expect(screen.getByText("2")).toBeInTheDocument(); // Tokens on card
    });
  });

  it("shows player names", async () => {
    renderWithRouter(<NoThanksGameUI />);

    await waitFor(() => {
      expect(screen.getByText("Player 1 (You)")).toBeInTheDocument();
      expect(screen.getByText("Player 2")).toBeInTheDocument();
    });
  });

  it("disables actions for non-active player", async () => {
    localStorage.setItem("playerId", "p2");
    renderWithRouter(<NoThanksGameUI />);

    await waitFor(() => {
      const takeButton = screen.getByText("Take Card");
      const placeButton = screen.getByText("Place Token");
      expect(takeButton).toBeDisabled();
      expect(placeButton).toBeDisabled();
    });
  });

  describe("Game States", () => {
    it("shows waiting state correctly", async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockGameStates.waiting,
        error: null,
      });
      mockSupabase.from().select().eq().execute.mockResolvedValueOnce({
        data: mockPlayers.standard,
        error: null,
      });

      renderWithRouter(<NoThanksGameUI />);

      await waitFor(() => {
        expect(screen.getByText("Start Game")).toBeInTheDocument();
        expect(screen.getByText("Need at least 3 players to start")).toBeInTheDocument();
      });
    });

    it("shows playing state with current card and tokens", async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockGameStates.playing,
        error: null,
      });
      mockSupabase.from().select().eq().execute.mockResolvedValueOnce({
        data: mockPlayers.standard,
        error: null,
      });

      renderWithRouter(<NoThanksGameUI />);

      await waitFor(() => {
        expect(screen.getByText("5")).toBeInTheDocument(); // Current card
        expect(screen.getByText("2")).toBeInTheDocument(); // Tokens on card
      });
    });

    it("shows game over state with scores", async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockGameStates.ended,
        error: null,
      });
      mockSupabase.from().select().eq().execute.mockResolvedValueOnce({
        data: mockPlayers.withCards,
        error: null,
      });

      renderWithRouter(<NoThanksGameUI />);

      await waitFor(() => {
        expect(screen.getByText("Game Over!")).toBeInTheDocument();
        expect(screen.getByText("Play Again")).toBeInTheDocument();
        expect(screen.getByText("Back to Lobby")).toBeInTheDocument();
      });
    });
  });

  describe("Player Interactions", () => {
    it("enables actions only for active player", async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockGameStates.playing,
        error: null,
      });
      mockSupabase.from().select().eq().execute.mockResolvedValueOnce({
        data: mockPlayers.standard,
        error: null,
      });

      renderWithRouter(<NoThanksGameUI />);

      await waitFor(() => {
        const takeButton = screen.getByText("Take Card");
        const placeButton = screen.getByText("Place Token");
        expect(takeButton).not.toBeDisabled();
        expect(placeButton).not.toBeDisabled();

        // Switch to non-active player
        localStorage.setItem("playerId", "p2");
        expect(takeButton).toBeDisabled();
        expect(placeButton).toBeDisabled();
      });
    });

    it("shows player cards correctly", async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockGameStates.playing,
        error: null,
      });
      mockSupabase.from().select().eq().execute.mockResolvedValueOnce({
        data: mockPlayers.withCards,
        error: null,
      });

      renderWithRouter(<NoThanksGameUI />);

      await waitFor(() => {
        // Check if all cards are displayed
        expect(screen.getByText("3")).toBeInTheDocument();
        expect(screen.getByText("4")).toBeInTheDocument();
        expect(screen.getByText("5")).toBeInTheDocument();
      });
    });

    it("handles taking a card", async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockGameStates.playing,
        error: null,
      });
      mockSupabase.from().select().eq().execute.mockResolvedValueOnce({
        data: mockPlayers.standard,
        error: null,
      });

      renderWithRouter(<NoThanksGameUI />);

      await waitFor(async () => {
        const takeButton = screen.getByText("Take Card");
        await userEvent.click(takeButton);
        expect(mockSupabase.from().update).toHaveBeenCalled();
      });
    });

    it("handles placing a token", async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockGameStates.playing,
        error: null,
      });
      mockSupabase.from().select().eq().execute.mockResolvedValueOnce({
        data: mockPlayers.standard,
        error: null,
      });

      renderWithRouter(<NoThanksGameUI />);

      await waitFor(async () => {
        const placeButton = screen.getByText("Place Token");
        await userEvent.click(placeButton);
        expect(mockSupabase.from().update).toHaveBeenCalled();
      });
    });
  });

  describe("Error Handling", () => {
    it("shows error message when game load fails", async () => {
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockRejectedValueOnce(new Error("Failed to load game"));

      renderWithRouter(<NoThanksGameUI />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load game/i)).toBeInTheDocument();
      });
    });

    it("shows error when action fails", async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockGameStates.playing,
        error: null,
      });
      mockSupabase.from().select().eq().execute.mockResolvedValueOnce({
        data: mockPlayers.standard,
        error: null,
      });
      mockSupabase.from().update().eq.mockRejectedValueOnce(new Error("Action failed"));

      renderWithRouter(<NoThanksGameUI />);

      await waitFor(async () => {
        const takeButton = screen.getByText("Take Card");
        await userEvent.click(takeButton);
        expect(screen.getByText(/Action failed/i)).toBeInTheDocument();
      });
    });
  });

  describe("Room Management", () => {
    it("displays room code", async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockGameStates.playing,
        error: null,
      });
      mockSupabase.from().select().eq().execute.mockResolvedValueOnce({
        data: mockPlayers.standard,
        error: null,
      });

      renderWithRouter(<NoThanksGameUI />);

      await waitFor(() => {
        expect(screen.getByText(/ABC123/)).toBeInTheDocument();
      });
    });

    it("updates when players join/leave", async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockGameStates.waiting,
        error: null,
      });
      mockSupabase.from().select().eq().execute.mockResolvedValueOnce({
        data: mockPlayers.standard,
        error: null,
      });

      renderWithRouter(<NoThanksGameUI />);

      // Simulate new player joining via subscription
      const channelCallback = mockSupabase.channel().on.mock.calls[0][2];
      channelCallback({
        new: { ...mockPlayers.standard[0], id: "p3", name: "Player 3" },
      });

      await waitFor(() => {
        expect(screen.getByText("Player 3")).toBeInTheDocument();
      });
    });
  });
});
