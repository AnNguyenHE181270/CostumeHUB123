import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import { useNavigate, useParams } from "react-router-dom";
import ResetPasswordPage from "../pages/ResetPasswordPage";

global.fetch = jest.fn();

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: jest.fn(),
    useParams: jest.fn(),
}));

jest.mock("../components/layout/AuthLayout", () => ({
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
        expect(screen.getByText("Email Address")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("name@example.com")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Send Reset Link/i, })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Back to Login", })).toBeInTheDocument();
    });

    // 2. Email chứa ký tự đặc biệt
    test("Email contains invalid special characters", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({
                errors: [{ msg: "Invalid email" }]
            })
        });

        render(<ForgotPasswordPage />);
        fireEvent.change(screen.getByPlaceholderText("name@example.com"), { target: { value: "abc@@gmail.com" } });
        fireEvent.click(screen.getByRole("button", { name: /Send Reset Link/i }));

        expect(await screen.findByText("Invalid email")).toBeInTheDocument();

    });

    // 3. Email thiếu đuôi @
    test("Email missing @ symbol", async () => {
        // 1. Mock dữ liệu trả về từ backend khi fetch được gọi
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({
                errors: [{ msg: "Invalid email format" }]
            })
        });

        render(<ForgotPasswordPage />);

        fireEvent.change(screen.getByPlaceholderText("name@example.com"), { target: { value: "abcgmail.com" } });

        const submitButton = screen.getByRole("button", { name: /Send Reset Link/i });
        expect(submitButton).toBeInTheDocument();

        fireEvent.click(submitButton);

        expect(await screen.findByText("Invalid email format")).toBeInTheDocument();
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
                name: /Send Reset Link/i
            })
        );
        await waitFor(() => {
            expect(screen.getByText("Please check your email: mai@gmail.com")).toBeInTheDocument();
        });
    });

    // 4. API fail
    test("Forgot password fail Email not exit", async () => {
        fetch.mockResolvedValue({
            ok: false,
            json: async () => ({ message: "Email not found" }),
        });
        render(<ForgotPasswordPage />);
        await userEvent.type(
            screen.getByPlaceholderText("name@example.com"),
            "wrong@gmail.com"
        );
        fireEvent.click(screen.getByRole("button", { name: /Send Reset Link/i }));
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
                name: /Send Reset Link/i
            })
        );
        expect(await screen.findByText("Network error. Please try again.")).toBeInTheDocument();
    });

    // 6. Navigate Back Login
    test("Navigate back login", async () => {
        render(<ForgotPasswordPage />);
        await userEvent.click(screen.getByRole("button", { name: "Back to Login", }));
        expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

});

describe("Reset Password Page", () => {
    const mockNavigate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useNavigate.mockReturnValue(mockNavigate);
        useParams.mockReturnValue({ token: "valid_reset_token_123" });
    });

    // 1. Render UI - Reset Password page
    test("Render reset password page", () => {
        render(<ResetPasswordPage />);
        expect(screen.getByText("Reset Password")).toBeInTheDocument();
        expect(screen.getByText("Account Security")).toBeInTheDocument();
        expect(screen.getByText("New Password")).toBeInTheDocument();
        expect(screen.getByText("Confirm New Password")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("6+ characters")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Confirm Password")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /update password/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /back to login/i })).toBeInTheDocument();
    });

    // 2. Password too short (less than 8 characters)
    test("Password too short", async () => {
        fetch.mockResolvedValue({
            ok: false,
            json: async () => ({
                message: "Password must be at least 8 characters"
            })
        });

        render(<ResetPasswordPage />);

        await userEvent.type(screen.getByPlaceholderText("6+ characters"), "12345");
        await userEvent.type(screen.getByPlaceholderText("Confirm Password"), "12345");
        await userEvent.click(screen.getByRole("button", { name: /update password/i }));
        expect(await screen.findByText("Password must be at least 8 characters")).toBeInTheDocument();
    });

    // 3. Missing password field
    test("Missing password field", async () => {
        render(<ResetPasswordPage />);

        const passwordInput = screen.getByPlaceholderText("6+ characters");
        const confirmPasswordInput = screen.getByPlaceholderText("Confirm Password");

        // Both inputs are required
        expect(passwordInput).toBeRequired();
        expect(confirmPasswordInput).toBeRequired();

        // Try to submit without filling in
        await userEvent.click(screen.getByRole("button", { name: /update password/i }));

        // expect(passwordInput.validity.valueMissing).toBe(true);
        // expect(confirmPasswordInput.validity.valueMissing).toBe(true);
        expect(passwordInput).toBeRequired()
        expect(passwordInput).toBeInvalid()
        expect(confirmPasswordInput).toBeRequired()
        expect(confirmPasswordInput).toBeInvalid()
    });

    // 4. Password and ConfirmPassword mismatch
    test("Password and confirm password do not match", async () => {
        render(<ResetPasswordPage />);
        await userEvent.type(screen.getByPlaceholderText("6+ characters"), "NewPassword123");
        await userEvent.type(screen.getByPlaceholderText("Confirm Password"), "DifferentPassword123");
        await userEvent.click(screen.getByRole("button", { name: /update password/i }));
        expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    });

    // 5. Reset password success
    test("Reset password success", async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ message: "Password reset successful." })
        });

        render(<ResetPasswordPage />);
        await userEvent.type(
            screen.getByPlaceholderText("6+ characters"),
            "NewPassword123"
        );
        await userEvent.type(
            screen.getByPlaceholderText("Confirm Password"),
            "NewPassword123"
        );
        await userEvent.click(screen.getByRole("button", { name: /update password/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/login");
        });
    });

    // 6. Invalid or expired token
    test("Invalid or expired token", async () => {
        fetch.mockResolvedValue({
            ok: false,
            json: async () => ({ message: "Invalid or expired token." })
        });

        render(<ResetPasswordPage />);
        await userEvent.type(screen.getByPlaceholderText("6+ characters"), "NewPassword123");
        await userEvent.type(screen.getByPlaceholderText("Confirm Password"), "NewPassword123");
        await userEvent.click(screen.getByRole("button", { name: /update password/i })); expect(await screen.findByText("Invalid or expired token.")).toBeInTheDocument();
    });

    // 7. Network error
    test("Network error", async () => {
        fetch.mockRejectedValue(new Error("Network error"));
        render(<ResetPasswordPage />);
        await userEvent.type(screen.getByPlaceholderText("6+ characters"), "NewPassword123");
        await userEvent.type(screen.getByPlaceholderText("Confirm Password"), "NewPassword123");
        await userEvent.click(screen.getByRole("button", { name: /update password/i }));
        expect(await screen.findByText("Network error. Please try again.")).toBeInTheDocument();
    });

    // 8. Toggle password visibility
    test("Toggle password visibility", async () => {
        render(<ResetPasswordPage />);

        const passwordInput = screen.getByPlaceholderText("6+ characters");
        const confirmPasswordInput = screen.getByPlaceholderText("Confirm Password");

        expect(passwordInput.type).toBe("password");
        expect(confirmPasswordInput.type).toBe("password");

        const iconContainer = passwordInput.parentElement.querySelector('button')
            || passwordInput.parentElement.querySelector('svg');

        expect(iconContainer).toBeTruthy();

        // Click lần 1: Hiện mật khẩu
        await userEvent.click(iconContainer);
        expect(passwordInput.type).toBe("text");

        // Click lần 2: Ẩn mật khẩu lại
        await userEvent.click(iconContainer);
        expect(passwordInput.type).toBe("password");
    });

    // 9. Navigate back to login
    test("Navigate back to login", async () => {
        render(<ResetPasswordPage />);

        await userEvent.click(screen.getByRole("button", { name: /back to login/i }));

        expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
});