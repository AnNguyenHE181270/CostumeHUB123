import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "../pages/RegisterPage";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
global.fetch = jest.fn();
jest.mock("../context/AuthContext");
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: jest.fn()
}));
jest.mock("../layouts/AuthLayout", () => ({ children }) =>
    <div>{children}</div>
);

describe("Register Page", () => {
    const mockNavigate = jest.fn();
    beforeEach(() => {
        jest.clearAllMocks();
        useNavigate.mockReturnValue(mockNavigate);
        useAuth.mockReturnValue({ login: jest.fn(), isProfileComplete: true });
    });

    // 1. Render form
    test("Render register form", () => {
        render(<RegisterPage />);
        expect(screen.getByText("Create Account")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("John Doe")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("name@example.com")).toBeInTheDocument();
    });

    // 2. Nhập FullName
    test("Input fullname", async () => {
        render(<RegisterPage />);
        const input = screen.getByPlaceholderText("John Doe");
        await userEvent.type(input, "Nguyen Thi Mai");
        expect(input.value).toBe("Nguyen Thi Mai");
    });

    // 3. Nhập Email
    // 4. Nhập Password
    // 5. Nhập Confirm Password
    // 6. Password mismatch
    test("Password mismatch", async () => {
        render(<RegisterPage />);
        await userEvent.type(
            screen.getByPlaceholderText("8+ characters"),
            "12345678"
        );
        await userEvent.type(
            screen.getByPlaceholderText("Confirm Password"),
            "99999999"
        );
        fireEvent.submit(screen.getByRole(
            "button",
            { name: /create account/i }
        ));
        expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    });


    // 7. Nhập Confirm Password

    // 8.  Tick acceptTerms
    test("Terms unchecked", async () => {
        render(<RegisterPage />);
        fireEvent.submit(
            screen.getByRole(
                "button",
                { name: /create account/i }
            )
        );
        expect(await screen.findByText("You must agree to the terms to continue.")).toBeInTheDocument();
    });

    // 9. Register success
    test("Register success", async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ message: "success" })
        });
        render(<RegisterPage />);
        await userEvent.type(
            screen.getByPlaceholderText("John Doe"),
            "Mai"
        );
        await userEvent.type(
            screen.getByPlaceholderText("name@example.com"),
            "mai@gmail.com"
        );
        const passwords = screen.getAllByPlaceholderText(/password/i);
        await userEvent.type(passwords[0], "12345678");
        await userEvent.type(passwords[1], "12345678");
        const checkbox = screen.getByRole("checkbox");
        await userEvent.click(checkbox);

        fireEvent.submit(screen.getByRole("button", {
            name: /create account/i
        }
        ));
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(
                "/verify-otp/mai%40gmail.com", {
                state: { fromRegister: true }
            });
        });
    });

    // 10. Register fail
    test("Register API fail", async () => {
        fetch.mockResolvedValue({
            ok: false,
            json: async () => ({
                message: "Email exists"
            })
        });
        render(<RegisterPage />);
        const checkbox = screen.getByRole("checkbox");
        await userEvent.click(checkbox);
        fireEvent.submit(screen.getByRole(
            "button",
            { name: /create account/i }
        ));
        expect(await screen.findByText("Email exists")).toBeInTheDocument();
    });

    // 11. Network error
    test("Network error", async () => {
        fetch.mockRejectedValue(new Error());

        render(<RegisterPage />);
        const checkbox = screen.getByRole("checkbox");

        await userEvent.click(checkbox);
        fireEvent.submit(
            screen.getByRole(
                "button",
                { name: /create account/i }
            ));
        expect(await screen.findByText("Network error. Please try again.")).toBeInTheDocument();
    });

    // 12. Toggle show password
    test("Navigate Login", async () => {
        render(<RegisterPage />);
        await userEvent.click(
            screen.getByText("Login"));
        expect(mockNavigate).toHaveBeenCalled();
    });

    // 13. Toggle confirm password
    // 14. Navigate Login page
    // 15. Navigate Verify OTP sau đăng ký thành công


});