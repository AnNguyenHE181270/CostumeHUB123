import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSave } from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
export default function AccountDetailPage() {

const [loadingPage, setLoadingPage] = useState(true);
const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("")
  const [form, setForm] = useState({
      phone: "",
      fullName: "",
      gender: "male",
      age: "",
      avatar: "",
      status: "",
      role: "owner",
  });
  const { id } = useParams();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
      const {token} = useAuth();

const handleSubmit = async (e) => {
  e.preventDefault();

  if (submitting) return;

  try {
    setSubmitting(true);
    setError("");

    const response = await fetch(
      `http://localhost:9999/api/users/update-user/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(
        data.errors?.[0]?.msg ||
        data.message ||
        "Update failed."
      );
    }
  } catch {
    setError("Network error. Please try again.");
  } finally {
    setSubmitting(false);
  }
};

const getDetailAccount = async () => {
  try {
    setLoadingPage(true);
    setError("");

    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    const response = await fetch(
      `http://localhost:9999/api/users/user/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(data.message);
      return;
    }

    setForm({
      phone: data.user.phone ,
      fullName: data.user.fullName ,
      gender: data.user.gender ,
      age: data.user.age ,
      status: data.user.status ,
      avatar: data.user.avatar  ,
      role: data.user.role.name ,
    });
  } catch {
    setError("Network error. Please try again.");
  } finally {
    setLoadingPage(false);
  }
};

  useEffect(() => {getDetailAccount()},[])
  

  
  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="w-10 h-10 rounded-xl border border-border hover:bg-surface flex items-center justify-center text-text-secondary transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
              Edit Account
            </h2>
            <p className="text-text-muted text-sm mt-1">
              Update user information and system permissions
            </p>
          </div>
        </div>
        <div>
          <Button
            
            icon={faSave}
            label="Save Changes"
            variant="primary"
            type="submit"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

          <div className="md:col-span-2 flex items-center gap-5 pb-6 border-b border-border mb-2">
            <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-2xl shrink-0 overflow-hidden">
              N
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Nguyen Van A</h3>
              <p className="text-sm text-text-muted">owner</p>
            </div>
          </div>


          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm text-text-primary bg-white"
            />
          </div>


          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm text-text-primary bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm text-text-primary bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Age</label>
            <input
              type="number"
              name="age"
              value={form.age}
              onChange={handleChange}
              min="1"
              className="w-full px-4 py-2.5 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm text-text-primary bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Gender</label>
            <select
              name="gender"
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white text-text-primary"
              value={form.gender}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Role</label>
            <select
              name="role"
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white text-text-primary"
              value={form.role}
            >
              <option value="owner">Owner</option>
              <option value="staff">Staff</option>
              <option value="online-customer">Online Customer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white text-text-primary"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-secondary mb-2">Avatar URL</label>
            <input
              type="url"
              name="avatar"
              value={form.avatar}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm text-text-primary bg-white"
            />
          </div>

        </div>
      </div>
    </form>
  );
}