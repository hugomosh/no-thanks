import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";
import GameLobby from "../components/GameLobby";

describe("GameLobby Component", () => {
  // Helper function to render component
  const renderGameLobby = () => {
    return render(
      <BrowserRouter>
        <GameLobby />
      </BrowserRouter>
    );
  };

  describe("Initial Render", () => {
    it("should render the title", () => {
      renderGameLobby();
      expect(screen.getByText("No Thanks!")).toBeInTheDocument();
    });

    it("should render the player name input", () => {
      renderGameLobby();
      expect(
        screen.getByPlaceholderText("Enter your name")
      ).toBeInTheDocument();
    });

    it("should initially show create room button", () => {
      renderGameLobby();
      expect(screen.getByText("Create New Room")).toBeInTheDocument();
    });

    it('should show the "Or" divider', () => {
      renderGameLobby();
      expect(screen.getByText("Or")).toBeInTheDocument();
    });
  });

  describe("Input Handling", () => {
    it("should update player name when typed", () => {
      renderGameLobby();
      const nameInput = screen.getByPlaceholderText("Enter your name");
      fireEvent.change(nameInput, { target: { value: "John" } });
      expect(nameInput).toHaveValue("John");
    });

    it("should show room code input when switching to join mode", () => {
      renderGameLobby();
      fireEvent.click(screen.getByText("Join Existing Room"));
      expect(
        screen.getByPlaceholderText("Enter room code")
      ).toBeInTheDocument();
    });

    it("should update room code when typed", () => {
      renderGameLobby();
      fireEvent.click(screen.getByText("Join Existing Room"));
      const codeInput = screen.getByPlaceholderText("Enter room code");
      fireEvent.change(codeInput, { target: { value: "ABC123" } });
      expect(codeInput).toHaveValue("ABC123");
    });
  });

  describe("Mode Switching", () => {
    it("should switch from create to join mode", () => {
      renderGameLobby();
      fireEvent.click(screen.getByText("Join Existing Room"));
      expect(screen.getByText("Join")).toBeInTheDocument();
      expect(screen.getByText("Create New Room Instead")).toBeInTheDocument();
    });

    it("should switch from join to create mode", () => {
      renderGameLobby();
      // First switch to join mode
      fireEvent.click(screen.getByText("Join Existing Room"));
      // Then switch back to create mode
      fireEvent.click(screen.getByText("Create New Room Instead"));
      expect(screen.getByText("Create New Room")).toBeInTheDocument();
    });
  });

  describe("Validation & Error Handling", () => {
    it("should show error when creating room without name", async () => {
      renderGameLobby();
      fireEvent.click(screen.getByText("Create New Room"));
      await waitFor(() => {
        expect(
          screen.getByText("Please enter your name first")
        ).toBeInTheDocument();
      });
    });

    it("should show error when joining room without name", async () => {
      renderGameLobby();
      fireEvent.click(screen.getByText("Join Existing Room"));
      fireEvent.click(screen.getByText("Join"));
      await waitFor(() => {
        expect(
          screen.getByText("Please enter your name first")
        ).toBeInTheDocument();
      });
    });

    it("should show error when joining room without room code", async () => {
      renderGameLobby();
      fireEvent.click(screen.getByText("Join Existing Room"));
      // Fill in name but not room code
      fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
        target: { value: "John" },
      });
      fireEvent.click(screen.getByText("Join"));
      await waitFor(() => {
        expect(
          screen.getByText("Please enter a room code")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Room Creation", () => {
    it("should attempt to create room with valid name", async () => {
      renderGameLobby();
      // Arrange
      const playerName = "John";

      // Act
      fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
        target: { value: playerName },
      });
      fireEvent.click(screen.getByText("Create New Room"));

      // Assert
      // Add your assertions based on what should happen when createRoom is called
      // For example, if you have a loading state:
      // expect(screen.getByText('Creating room...')).toBeInTheDocument();
    });
  });

  describe("Room Joining", () => {
    it("should attempt to join room with valid name and code", async () => {
      renderGameLobby();
      // Arrange
      const playerName = "John";
      const roomCode = "ABC123";

      // Act
      fireEvent.click(screen.getByText("Join Existing Room"));
      fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
        target: { value: playerName },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter room code"), {
        target: { value: roomCode },
      });
      fireEvent.click(screen.getByText("Join"));

      // Assert
      // Add your assertions based on what should happen when joinRoom is called
      // For example, if you have a loading state:
      // expect(screen.getByText('Joining room...')).toBeInTheDocument();
    });
  });
});
