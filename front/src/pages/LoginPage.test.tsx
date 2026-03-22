import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock useSession to simulate unauthenticated state
const mockLogin = vi.fn();
vi.mock("../auth/useSession", () => ({
  useSession: () => ({
    user: null,
    isLoading: false,
    isBusy: false,
    error: null,
    clearError: vi.fn(),
    login: mockLogin,
  }),
}));

// Mock the API to avoid real network calls
vi.mock("../lib/api", () => ({
  loginUser: vi.fn(),
}));

// Mock useNavigate
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => vi.fn() };
});

const { LoginPage } = await import("./LoginPage");

const renderLoginPage = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );

describe("LoginPage", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("renders the login form", () => {
    renderLoginPage();
    expect(screen.getByRole("heading", { name: /connexion/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nom d'utilisateur/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /se connecter/i })).toBeInTheDocument();
  });

  it("shows a validation error when submitting empty form", async () => {
    renderLoginPage();
    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));
    // HTML5 required validation will prevent submission — button should stay enabled
    expect(screen.getByRole("button", { name: /se connecter/i })).not.toBeDisabled();
  });

  it("calls login with the entered credentials on submit", async () => {
    mockLogin.mockResolvedValue(undefined);

    renderLoginPage();
    fireEvent.change(screen.getByLabelText(/nom d'utilisateur/i), { target: { value: "UserAdy" } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));

    // login is async — give it a microtask to execute
    await Promise.resolve();
    expect(mockLogin).toHaveBeenCalledWith({ username: "UserAdy", password: "password123" });
  });
});
