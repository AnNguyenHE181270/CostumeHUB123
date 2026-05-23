import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../pages/LoginPage";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
global.fetch = jest.fn();
jest.mock("../context/AuthContext");
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: jest.fn()
})
);

jest.mock("../layouts/AuthLayout", () => ({ children }) =>
    <div>{children}</div>
);

describe("Login Page", () => {
    const mockLogin = jest.fn();
    const mockNavigate = jest.fn();
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({
            login: mockLogin
        });
        useNavigate.mockReturnValue(mockNavigate);
    });

    // 1. Render Login UI
    test("Render login form", () => {
        render(<LoginPage />);
        expect(screen.getByText("Login")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("name@example.com")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("8+ characters")).toBeInTheDocument();
    });

    // 2. Nhập email
    test("Input email", async () => {
        render(
            <LoginPage />
        );
        const input = screen.getByPlaceholderText("name@example.com");
        await userEvent.type(input, "mai@gmail.com");
        expect(input.value).toBe("mai@gmail.com");
    });

    // 3. Nhập email
    test("Input password", async () => {
        render(<LoginPage />);
        const input = screen.getByPlaceholderText("8+ characters");
        await userEvent.type(input, "12345678");
        expect(input.value).toBe("12345678"
        );
    });

    // 4.  Toggle show password
    test("Toggle password", async () => {
        render(<LoginPage />);
        const password = screen.getByPlaceholderText("8+ characters");
        expect(password.type).toBe("password");
        const icon = screen.getByTestId("right-icon");
        await userEvent.click(icon);
        expect(password.type).toBe("text");

    });

    // 5. Login API success
    test("Login success", async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ token: "jwt123" })
        });
        render(
            <LoginPage />
        );
        await userEvent.type(screen.getByPlaceholderText("name@example.com"), "mai@gmail.com");
        await userEvent.type(screen.getByPlaceholderText("8+ characters"), "12345678");

        fireEvent.submit(screen.getByRole(
            "button",
            { name: /login/i }
        ));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith("jwt123");
            expect(mockNavigate).toHaveBeenCalledWith("/");
        });
    });

    // 6. Login API fail
    test("Login fail API", async () => {
        fetch.mockResolvedValue({
            ok: false,
            json: async () => ({ message: "Invalid password" })
        });
        render(<LoginPage />);
        fireEvent.submit(screen.getByRole(
            "button",
            { name: /login/i }
        ));
        expect(await screen.findByText("Invalid password")).toBeInTheDocument();
    });

    // 7. Network error
    test("Network error", async () => {
        fetch.mockRejectedValue(new Error());
        render(<LoginPage />);
        fireEvent.submit(
            screen.getByRole(
                "button",
                { name: /login/i }
            ));
        expect(await screen.findByText("Network error. Please try again.")).toBeInTheDocument();
    });

    // 8. Navigate register
    test("Navigate register", async () => {
        render(<LoginPage />);
        await userEvent.click(screen.getByText("Register"));
        expect(mockNavigate).toHaveBeenCalled();
    });

});