import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../pages/LoginPage";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
global.fetch = jest.fn();

const mockNavigate = jest.fn();
const mockLogin = jest.fn();

jest.mock("../context/AuthContext");
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));
jest.mock("../components/layout/AuthLayout", () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>,
}));
describe("Login Page", () => {
    const mockLogin = jest.fn();
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({
            login: mockLogin,
            isProfileComplete: true,
        });
    });

    // 1. Render Login UI
    test("Render login form", () => {
        render(<LoginPage />);
        expect(screen.getByRole('heading', { level: 2, name: /sign in/i })).toBeInTheDocument();
        // expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText("name@example.com")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();
        expect(screen.getByRole("checkbox")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /create an account/i })).toBeInTheDocument();

        expect(screen.getByText(/forgot.*password/i)).toBeInTheDocument();
        expect(screen.getByText(/create an account/i)).toBeInTheDocument();

    });

    // 2. Email chứa ký tự đặc biệt
    test("Email contains invalid special characters", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({
                errors: [{ msg: "Invalid email format" }]
            })
        });

        render(<LoginPage />);
        fireEvent.change(screen.getByPlaceholderText("name@example.com"), { target: { value: "abc@@gmail.com" } });
        fireEvent.change(screen.getByPlaceholderText("Enter your password"), { target: { value: "123456" } })
        fireEvent.click(screen.getByRole("checkbox"))
        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
        expect(await screen.findByText("Invalid email format")).toBeInTheDocument();

    });

    // 3. Email thiếu đuôi @
    test("Email missing @ symbol", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({
                errors: [{ msg: "Invalid email format" }]
            })
        });
        render(<LoginPage />);
        fireEvent.change(screen.getByPlaceholderText("name@example.com"), { target: { value: "abcgmail.com" } });
        fireEvent.change(screen.getByPlaceholderText("Enter your password"), { target: { value: "123456" } })
        fireEvent.click(screen.getByRole("checkbox"))
        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
        expect(await screen.findByText("Invalid email format")).toBeInTheDocument();
    });

    // 4.  Toggle show password
    test("Toggle password", async () => {
        render(<LoginPage />);

        const passwordInput = screen.getByPlaceholderText("Enter your password");
        expect(passwordInput.type).toBe("password");

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

    // 5. Empty Fields
    test('Empty Fields', async () => {
        render(<LoginPage />);

        const emailInput = screen.getByPlaceholderText('name@example.com');
        const passwordInput = screen.getByPlaceholderText('Enter your password');
        const loginButton = screen.getByRole('button', { name: /^sign in$/i });

        // 2. Kiểm tra xem các ô input này có cấu hình thuộc tính 'required' không
        expect(emailInput).toBeRequired();
        expect(passwordInput).toBeRequired();

        // 3. Mô phỏng hành vi bấm nút Login luôn khi form trống
        await userEvent.click(loginButton);

        expect(emailInput.validity.valueMissing).toBe(true);
        expect(passwordInput.validity.valueMissing).toBe(true);

        expect(emailInput.checkValidity()).toBe(false);
        expect(passwordInput.checkValidity()).toBe(false);
    });

    // 6. Login success
    test("Login success", async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                token: "jwt_token_123",
            }),
        });
        render(<LoginPage />);
        await userEvent.type(
            screen.getByPlaceholderText("name@example.com"),
            "mai@gmail.com"
        );

        await userEvent.type(
            screen.getByPlaceholderText("Enter your password"),
            "12345678"
        );

        fireEvent.submit(
            screen.getByRole("button", {
                name: /sign in/i,
            })
        );

        await waitFor(() => {
            expect(fetch).toHaveBeenCalled();

            expect(mockLogin)
                .toHaveBeenCalledWith(
                    "jwt_token_123",
                    expect.anything()
                );

            expect(mockNavigate)
                .toHaveBeenCalledWith("/");
        });
    });

    // 7. Password <6 ký tự
    test("Password is too short", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({
                errors: [{ msg: "Password must be at least 6 characters" }]
            })
        });
        render(<LoginPage />);
        fireEvent.change(screen.getByPlaceholderText("name@example.com"), { target: { value: "abc@gmail.com" } });
        fireEvent.change(screen.getByPlaceholderText("Enter your password"), { target: { value: "12345" } });
        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
        expect(await screen.findByText("Password must be at least 6 characters")).toBeInTheDocument();
    });

    // 8. Incorrect password
    test("Incorrect password", async () => {
        fetch.mockResolvedValue({
            ok: false,
            json: async () => ({ message: "Invalid password." })
        });
        render(<LoginPage />);

        fireEvent.change(screen.getByPlaceholderText("name@example.com"), { target: { value: "abc@gmail.com" } });
        fireEvent.change(screen.getByPlaceholderText("Enter your password"), { target: { value: "12345" } });
        fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));
        expect(await screen.findByText("Invalid password.")).toBeInTheDocument();
    });

    // 9. Network error
    test("Network error", async () => {
        fetch.mockRejectedValue(new Error());
        render(<LoginPage />);
        fireEvent.submit(
            screen.getByRole(
                "button",
                { name: /sign in/i }
            ));
        expect(await screen.findByText("Network error. Please try again.")).toBeInTheDocument();
    });

    // 10. Navigate register
    test("Navigate register", async () => {
        render(<LoginPage />);
        const loginButton = screen.getByRole('button', { name: /create an account/i });
        expect(loginButton).toBeInTheDocument();
        await userEvent.click(loginButton);
        expect(mockNavigate).toHaveBeenCalledWith("/register");
    });

    // 11. Navigate Forget password
    test("Navigate Forget password", async () => {
        render(<LoginPage />);
        const forgetPasswordLink = screen.getByRole('link', { name: /forgot.*password/i })
        expect(forgetPasswordLink).toBeInTheDocument();
        expect(forgetPasswordLink).toHaveAttribute('href', '/forgot-password');
    });

    // 12. Login with account blocked


});