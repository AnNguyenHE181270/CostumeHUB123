import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import VerifyOtpPage from "../pages/VerifyOtpPage";

const mockNavigate = jest.fn();

// Giả lập thư viện react-router-dom
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
    useParams: () => ({ email: "test@gmail.com" }),
    useLocation: () => ({
        state: { fromRegister: true }
    })
}));

// Giả lập Layout bọc ứng dụng để tránh lỗi không render được Context/Theme
jest.mock("../layouts/AuthLayout", () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>,
}));

// Giả lập cấu hình Routes
jest.mock("../routes/routePaths", () => ({
    ROUTES: {
        LOGIN: "/login",
        REGISTER: "/register"
    }
}));

describe("Verify OTP Page", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn();
    });

    test("Submit OTP successfully and navigate", async () => {
        // Giả lập API gọi thành công
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: "Email verified successfully." }),
        });

        render(<VerifyOtpPage />);

        // Xác minh có đủ 6 ô nhập OTP
        const inputs = screen.getAllByRole("textbox");
        expect(inputs).toHaveLength(6);

        // Giả lập điền OTP "123456"
        const otpCode = "123456";
        for (let i = 0; i < otpCode.length; i++) {
            fireEvent.change(inputs[i], { target: { value: otpCode[i] } });
        }

        // Bấm nút Confirm gửi form
        fireEvent.submit(screen.getByRole("button", { name: /confirm/i }));

        // Chờ và kiểm tra API đã được gọi đúng tham số
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(mockNavigate).toHaveBeenCalledWith("/login");
        });
    });
});