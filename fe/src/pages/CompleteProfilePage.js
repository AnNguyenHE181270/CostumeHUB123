import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCheck,
  faUserPen,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../components/ui/Button";
import ErrorMessage from "../components/ui/ErrorMessage";
import { ROUTES } from "../routes/routePaths";

export default function CompleteProfilePage() {
  const [form, setForm] = useState({ gender: "", phone: "", dateOfBirth: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user } = location.state || {};
  const { email } = useParams();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    try {
      const response = await fetch(
        `http://localhost:9999/api/users/complete-profile/${decodeURIComponent(email)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Update failed.");
        return;
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      localStorage.setItem("token", token); // Save token after success
      navigate(ROUTES.HOME);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "w-full bg-ghost-fog border border-sterling-gray rounded-cards px-4 py-3 text-[14px] text-midnight-ink outline-none transition-all duration-200 focus:border-midnight-ink focus:bg-canvas-white placeholder:text-midnight-ink/40";

  return (
    <div className="min-h-screen bg-ghost-fog flex items-center justify-center p-6">
      <div className="w-full max-w-[460px]">
        <div className="bg-canvas-white border border-sterling-gray rounded-cards p-10">
          <div className="mx-auto w-12 h-12 rounded-largeFeatures bg-ghost-fog flex items-center justify-center mb-6">
            <FontAwesomeIcon
              icon={faUserPen}
              className="text-action-blue text-lg"
            />
          </div>
          <div className="text-center mb-8">
            <h2
              className="text-abyssal-black font-medium mb-2"
              style={{
                fontSize: "32px",
                lineHeight: 1.1,
                letterSpacing: "-0.32px",
              }}
            >
              Complete Profile
            </h2>
            <p
              className="text-midnight-ink/60"
              style={{
                fontSize: "14px",
                lineHeight: 1.49,
                letterSpacing: "-0.056px",
              }}
            >
              Your Google account needs some additional information.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-midnight-ink/50">
                  Gender
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className={`${inputBase} cursor-pointer}`}
                >
                  <option value="">Select Gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-midnight-ink/50">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  className={inputBase}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-midnight-ink/50">
                Phone Number <span className="text-warning-orange">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className={inputBase}
                placeholder="0912 345 678"
              />
            </div>
            {error && <ErrorMessage message={error} />}
            <Button
              type="submit"
              icon={faArrowRight}
              label="Update & Continue"
              loading={loading}
              className="bg-action-blue text-canvas-white hover:bg-blue-700 rounded-buttons w-full"
            />
          </form>
        </div>
        <p
          className="text-center mt-6 text-midnight-ink/40"
          style={{
            fontSize: "12px",
            lineHeight: 1.49,
            letterSpacing: "-0.056px",
          }}
        >
          Your information is secured and only used for contact when necessary.
        </p>
      </div>
    </div>
  );
}
