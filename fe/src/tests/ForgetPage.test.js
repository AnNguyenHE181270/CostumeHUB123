import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import { useNavigate } from "react-router-dom";

global.fetch = jest.fn();

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: jest.fn(),
}));

jest.mock("../layouts/AuthLayout", () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>,
}));

describe("Forgot Password Page", () => {

    const mockNavigate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useNavigate.mockReturnValue(mockNavigate);
    });

    // 1. Render UI
    test("Render forgot password page", () => {
        render(<ForgotPasswordPage />);
        expect(screen.getByText("Forgot Password")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("name@example.com")).toBeInTheDocument();
    });

    // 2. Input email
    test("Input email", async () => {
        render(<ForgotPasswordPage />);
        const input = screen.getByPlaceholderText("name@example.com");
        await userEvent.type(input, "mai@gmail.com");
        expect(input.value).toBe("mai@gmail.com");
    });

    // 3. Forgot password success
    test("Forgot password success", async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ message: "OTP sent" }),
        });
        render(<ForgotPasswordPage />);
        await userEvent.type(
            screen.getByPlaceholderText("name@example.com"),
            "mai@gmail.com"
        );
        fireEvent.submit(
            screen.getByRole("button", {
                name: /send request/i
            })
        );
        await waitFor(() => {
            expect(screen.getByText("Please check your email: mai@gmail.com")).toBeInTheDocument();
        });
    });

    // 4. API fail
    test("Forgot password API fail", async () => {
        fetch.mockResolvedValue({
            ok: false,
            json: async () => ({ message: "Email not found" }),
        });
        render(<ForgotPasswordPage />);
        await userEvent.type(
            screen.getByPlaceholderText("name@example.com"),
            "wrong@gmail.com"
        );
        fireEvent.submit(screen.getByRole("button", { name: /send request/i }));
        expect(await screen.findByText("Email not found")).toBeInTheDocument();
    });

    // 5. Network error
    test("Network error", async () => {
        fetch.mockRejectedValue(new Error());
        render(<ForgotPasswordPage />);
        await userEvent.type(
            screen.getByPlaceholderText("name@example.com"),
            "mai@gmail.com"
        );
        fireEvent.submit(
            screen.getByRole("button", {
                name: /send request/i
            })
        );
        expect(await screen.findByText("Network error. Please try again.")).toBeInTheDocument();
    });

    // 6. Navigate Back Login
    test("Navigate back login", async () => {
        render(<ForgotPasswordPage />);
        await userEvent.click(screen.getByText("Back to Login"));
        expect(mockNavigate).toHaveBeenCalled();
    });
});