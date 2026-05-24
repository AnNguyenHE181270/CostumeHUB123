import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "../pages/RegisterPage";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const mockedNavigate = jest.fn();

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
        expect(screen.getByRole("heading", { name: /Create Account/i })).toBeInTheDocument();

        expect(screen.getByText("Full Name")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("John Doe")).toBeInTheDocument();

        expect(screen.getByText("Phone Number")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("e.g., +1 234 567 890")).toBeInTheDocument();

        expect(screen.getByText("Email")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("name@example.com")).toBeInTheDocument();

        expect(screen.getByText("Gender")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Select Gender")).toBeInTheDocument();

        expect(screen.getByText("Date of Birth")).toBeInTheDocument();
        expect(document.querySelector('input[name="dateOfBirth"]')).toBeInTheDocument();

        expect(screen.getByText("Password")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("8+ characters")).toBeInTheDocument();

        expect(screen.getByText("Confirm Password")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Confirm Password")).toBeInTheDocument();

        expect(screen.getByRole("checkbox")).toBeInTheDocument();

        expect(screen.getByRole("button", { name: /create account/i, })).toBeInTheDocument();

        expect(screen.getByRole("button", { name: "Login", })).toBeInTheDocument();
    });

    // 2. Nhập FullName không đủ độ dài
    test("FullName is not long enough", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({
                errors: [{ msg: "Full name must be between 2 and 50 characters" }]
            })
        });
        render(<RegisterPage />);
        fireEvent.change(screen.getByPlaceholderText("John Doe"), { target: { value: "A" } })
        fireEvent.change(screen.getByPlaceholderText("name@example.com"), { target: { value: "abc@gmail.com" } })
        fireEvent.change(screen.getByPlaceholderText("e.g., +1 234 567 890"), { target: { value: "1234567890" } })
        fireEvent.change(screen.getByPlaceholderText("8+ characters"), { target: { value: "12345678" } })
        fireEvent.change(screen.getByPlaceholderText("Confirm Password"), { target: { value: "12345678" } })
        fireEvent.click(screen.getByRole("checkbox"))
        fireEvent.click(screen.getByRole("button", { name: "Create Account" }))
        screen.debug();
        expect(await screen.findByText("Full name must be between 2 and 50 characters")).toBeInTheDocument();
    });

    // 3. FullName empty
    test("FullName empty", async () => {
        render(<RegisterPage />)
        fireEvent.change(screen.getByPlaceholderText("name@example.com"), { target: { value: "abc@gmail.com" } })
        fireEvent.change(screen.getByPlaceholderText("e.g., +1 234 567 890"), { target: { value: "12345678" } })
        fireEvent.change(screen.getByPlaceholderText("8+ characters"), { target: { value: "123456" } })
        fireEvent.change(screen.getByPlaceholderText("Confirm Password"), { target: { value: "123456" } })
        fireEvent.click(screen.getByRole("checkbox"))
        fireEvent.click(screen.getByRole("button", { name: "Create Account" }));
        expect(screen.getByPlaceholderText("John Doe")).toBeRequired()
        expect(screen.getByPlaceholderText("John Doe")).toBeInvalid()
    })

    // 4. Phone invalid format
    test("Phone invalid format", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({
                errors: [{ msg: "Invalid phone number" }]
            })
        });
        render(<RegisterPage />);
        fireEvent.change(screen.getByPlaceholderText("John Doe"), { target: { value: "nguyen van A" } })
        fireEvent.change(screen.getByPlaceholderText("name@example.com"), { target: { value: "abc@gmail.com" } })
        fireEvent.change(screen.getByPlaceholderText("e.g., +1 234 567 890"), { target: { value: "abc4562" } })
        fireEvent.change(screen.getByPlaceholderText("8+ characters"), { target: { value: "123456" } })
        fireEvent.change(screen.getByPlaceholderText("Confirm Password"), { target: { value: "123456" } })
        fireEvent.click(screen.getByRole("checkbox"))
        fireEvent.click(screen.getByRole("button", { name: "Create Account" }))
        expect(await screen.findByText("Invalid phone number")).toBeInTheDocument();
    });

    // 5. Format Phone (10 so)
    test("Phone less than 10 digits", async () => {
        render(<RegisterPage />);
        fireEvent.change(screen.getByPlaceholderText("John Doe"), { target: { value: "nguyen van A" } })
        fireEvent.change(screen.getByPlaceholderText("name@example.com"), { target: { value: "abc@gmail.com" } })
        fireEvent.change(screen.getByPlaceholderText("e.g., +1 234 567 890"), { target: { value: "5612" } })
        fireEvent.change(screen.getByPlaceholderText("8+ characters"), { target: { value: "123456" } })
        fireEvent.change(screen.getByPlaceholderText("Confirm Password"), { target: { value: "123456" } })
        fireEvent.click(screen.getByRole("checkbox"))
        fireEvent.click(screen.getByRole("button", { name: "Create Account" }))
        expect(await screen.findByText("Phone number must be at least 10 characters long.")).toBeInTheDocument();
    });

    // 6. Email chứa ký tự đặc biệt
    test("Email contains invalid special characters", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({
                errors: [{ msg: "Invalid email format" }]
            })
        });

        render(<RegisterPage />);
        fireEvent.change(screen.getByPlaceholderText("John Doe"), { target: { value: "Nguyen Van A" } });
        fireEvent.change(screen.getByPlaceholderText("name@example.com"), { target: { value: "abc@@gmail.com" } });
        fireEvent.change(screen.getByPlaceholderText("8+ characters"), { target: { value: "123456" } })
        fireEvent.change(screen.getByPlaceholderText("Confirm Password"), { target: { value: "123456" } })
        fireEvent.click(screen.getByRole("checkbox"))
        fireEvent.click(screen.getByRole("button", { name: "Create Account" }));
        expect(await screen.findByText("Invalid email format")).toBeInTheDocument();

    });

    // 7. Email thiếu đuôi @
    test("Email missing @ symbol", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({
                errors: [{ msg: "Invalid email format" }]
            })
        });
        render(<RegisterPage />);
        fireEvent.change(screen.getByPlaceholderText("John Doe"), { target: { value: "Nguyen Van A" } });
        fireEvent.change(screen.getByPlaceholderText("name@example.com"), { target: { value: "abcgmail.com" } });
        fireEvent.change(screen.getByPlaceholderText("8+ characters"), { target: { value: "123456" } })
        fireEvent.change(screen.getByPlaceholderText("Confirm Password"), { target: { value: "123456" } })
        fireEvent.click(screen.getByRole("checkbox"))
        fireEvent.click(screen.getByRole("button", { name: "Create Account" }));
        expect(await screen.findByText("Invalid email format")).toBeInTheDocument();
    });

    // 8. Nhập dob
    test("Input date of birth", () => {
        render(<RegisterPage />);
        const dobInput = document.querySelector('input[name="dateOfBirth"]');
        fireEvent.change(dobInput, { target: { value: "2004-01-15" } });
        expect(dobInput.value).toBe("2004-01-15");

    });


    // 9. Nhập Password không đủ độ dài
    test("Password is too short", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({
                errors: [{ msg: "Password must be at least 6 characters" }]
            })
        });
        render(<RegisterPage />);
        fireEvent.change(screen.getByPlaceholderText("John Doe"), { target: { value: "Nguyen Van A" } });
        fireEvent.change(screen.getByPlaceholderText("name@example.com"), { target: { value: "abc@gmail.com" } });
        fireEvent.change(screen.getByPlaceholderText("8+ characters"), { target: { value: "12345" } });
        fireEvent.change(screen.getByPlaceholderText("Confirm Password"), { target: { value: "12345" } });
        fireEvent.click(screen.getByRole("checkbox"))
        fireEvent.click(screen.getByRole("button", { name: "Create Account" }));
        expect(await screen.findByText("Password must be at least 6 characters")).toBeInTheDocument();
    });

    // 10. Confirm Password
    test("Password is too short", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({
                errors: [{ msg: "Password must be at least 6 characters" }]
            })
        });
        render(<RegisterPage />);
        fireEvent.change(screen.getByPlaceholderText("John Doe"), { target: { value: "Nguyen Van A" } });
        fireEvent.change(screen.getByPlaceholderText("name@example.com"), { target: { value: "abc@gmail.com" } });
        fireEvent.change(screen.getByPlaceholderText("8+ characters"), { target: { value: "12345" } });
        fireEvent.change(screen.getByPlaceholderText("Confirm Password"), { target: { value: "12345" } });
        fireEvent.click(screen.getByRole("checkbox"))
        fireEvent.click(screen.getByRole("button", { name: "Create Account" }));
        expect(await screen.findByText("Password must be at least 6 characters")).toBeInTheDocument();
    });

    // 11. Password mismatch
    test("Confirm password does not match", async () => {
        render(<RegisterPage />);
        fireEvent.change(screen.getByPlaceholderText("John Doe"), { target: { value: "Nguyen Van A" } });
        fireEvent.change(screen.getByPlaceholderText("name@example.com"), { target: { value: "abc@gmail.com" } });
        await userEvent.type(screen.getByPlaceholderText("8+ characters"), "12345678");
        await userEvent.type(screen.getByPlaceholderText("Confirm Password"), "99999999");
        fireEvent.click(screen.getByRole("checkbox"))
        fireEvent.click(screen.getByRole("button", { name: /create account/i }));
        expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    });

    // 12.  Tick acceptTerms
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

    // 13. Navigate Login
    test("Navigate Login", async () => {
        render(<RegisterPage />);
        const loginButton = screen.getByRole('button', { name: /login/i });
        expect(loginButton).toBeInTheDocument();
        await userEvent.click(loginButton);
        expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    // 14. Network error
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

    // 15. Navigate Verify OTP sau đăng ký thành công

    test("Register success navigates to Verify OTP", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({}),
        });

        render(<RegisterPage />);

        await userEvent.type(screen.getByPlaceholderText("John Doe"), "Nguyen Van A");
        await userEvent.type(screen.getByPlaceholderText("name@example.com"), "abc@gmail.com");
        await userEvent.type(screen.getByPlaceholderText("8+ characters"), "12345678");
        await userEvent.type(screen.getByPlaceholderText("Confirm Password"), "12345678");

        const checkbox = screen.getByRole("checkbox");
        await userEvent.click(checkbox);

        await userEvent.click(
            screen.getByRole("button", { name: /create account/i })
        );

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(
                `/verify-otp/${encodeURIComponent("abc@gmail.com")}`,
                { state: { fromRegister: true } }
            );
        });
    });

    // 3.  Toggle show password
    test("Toggle password", async () => {
        render(<RegisterPage />);

        const passwordInput = screen.getByPlaceholderText("8+ characters");
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
});