import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSave, faUpload, faLink } from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
export default function AccountDetailPage() {
  const navigate = useNavigate();
const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [availableRoles, setAvailableRoles] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [form, setForm] = useState({
      phone: "",
      email: "",
      fullName: "",
      gender: "male",
      dateOfBirth: "",
      avatar: "",
      status: "active",
      role: "owner",
  });
  const { id } = useParams();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const { token } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (submitting) return;
  
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
  
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key !== 'avatar' && form[key] !== null && form[key] !== undefined) {
          formData.append(key, form[key]);
        }
      });

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      } else if (form.avatar && !form.avatar.startsWith("data:image")) {
        formData.append("avatar", form.avatar);
      }

      const response = await fetch(
        `http://localhost:9999/api/users/update-user/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        setError(
          data.errors?.[0]?.msg ||
          data.message ||
          "Update failed."
        );
        return;
      }

      setSuccess("Account updated successfully!");
      setTimeout(() => {
        setSuccess("");
        navigate(-1);
      }, 1500);
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
  
      const currentToken = token || localStorage.getItem("token") || sessionStorage.getItem("token");
  
      const response = await fetch(
        `http://localhost:9999/api/users/user/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        setError(data.message || "Failed to load user data.");
        return;
      }
      
      setForm({
        phone: data.user.phone ,
        email: data.user.email ,
        fullName: data.user.fullName ,
        gender: data.user.gender ,
        dateOfBirth: data.user.dateOfBirth ? new Date(data.user.dateOfBirth).toISOString().split('T')[0] : "",
        status: data.user.status ,
        avatar: data.user.avatar ,
        role: data.user.role.name ,
      });

      try {
        const roleRes = await fetch("http://localhost:9999/api/users/roles", {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
        const roleData = await roleRes.json();
        if (roleData.success) {
          setAvailableRoles(roleData.roles);
        }
      } catch (err) {
        console.error("Failed to load roles", err);
      }
    } catch {
      setError("Network error while loading data.");
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {getDetailAccount()},[])
  

  
  if (loadingPage) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* Toast Notifications */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md max-w-md">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md max-w-md">
          <p className="font-medium">Success</p>
          <p className="text-sm">{success}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
              Edit Account
            </h2>
            <p className="text-gray-500 text-sm mt-1">
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

      {/* Premium Avatar Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-32 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
        </div>
        
        <div className="px-6 sm:px-8 pb-8 relative flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
          <div className="relative group shrink-0 -mt-16">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white text-blue-600 flex items-center justify-center font-bold text-4xl overflow-hidden relative transition-transform duration-300 group-hover:scale-105 z-10">
              {form.avatar ? (
                <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="bg-gradient-to-br from-blue-50 to-blue-100 w-full h-full flex items-center justify-center">
                  {form.fullName ? form.fullName.charAt(0).toUpperCase() : "U"}
                </span>
              )}
              {/* Upload Overlay */}
              <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-[2px]">
                <FontAwesomeIcon icon={faUpload} className="text-white text-xl mb-1 translate-y-2 group-hover:translate-y-0 transition-transform duration-300" />
                <span className="text-white text-xs font-medium translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">Upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            {/* Small floating badge */}
            <label className="absolute bottom-1 right-1 w-9 h-9 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center text-white shadow-md cursor-pointer hover:bg-blue-700 transition-colors z-20">
               <FontAwesomeIcon icon={faUpload} className="text-xs" />
               <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          <div className="flex-1 w-full sm:pt-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{form.fullName || "User Account"}</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-100 mb-5 shadow-sm">
              {form.role}
            </span>
            
            <div className="max-w-md mx-auto sm:mx-0">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Or Paste Avatar Link</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-300 group-focus-within/input:text-blue-600 text-gray-400">
                  <FontAwesomeIcon icon={faLink} />
                </div>
                <input
                  type="url"
                  name="avatar"
                  value={form.avatar}
                  onChange={handleChange}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm text-gray-800 bg-gray-50 hover:bg-white transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Personal Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900">Personal Details</h3>
              <p className="text-sm text-gray-500 mt-1">Update the user's basic information</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-200/80 bg-gray-50/50 text-gray-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">Email Address <span className="text-gray-400 text-xs font-normal ml-1">(Read-only)</span></label>
                <input
                  type="email"
                  name="email"
                  value={form.email || ""}
                  readOnly
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-200/80 bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">Phone Number <span className="text-gray-400 text-xs font-normal ml-1">(Read-only)</span></label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone || ""}
                  readOnly
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-200/80 bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth || ""}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-200/80 bg-gray-50/50 text-gray-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">Gender</label>
                <div className="relative">
                  <select
                    name="gender"
                    value={form.gender || "male"}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-200/80 bg-gray-50/50 text-gray-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: System Access */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 h-full">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900">System Access</h3>
              <p className="text-sm text-gray-500 mt-1">Manage permissions</p>
            </div>
            
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">Role</label>
                <div className="relative">
                  <select
                    name="role"
                    value={form.role || "owner"}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 rounded-2xl border border-blue-100 bg-blue-50/30 text-blue-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none font-medium"
                  >
                    {availableRoles.length > 0 ? (
                      availableRoles.map((r) => (
                        <option key={r._id} value={r.name}>
                          {r.name.charAt(0).toUpperCase() + r.name.slice(1).replace("-", " ")}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="owner">Owner</option>
                        <option value="staff">Staff</option>
                        <option value="online-customer">Online Customer</option>
                      </>
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-blue-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">Account Status</label>
                <div className="relative">
                  <select
                    name="status"
                    value={form.status || "active"}
                    onChange={handleChange}
                    className={`w-full px-5 py-3.5 rounded-2xl border outline-none transition-all appearance-none font-medium ${
                      form.status === "blocked" 
                        ? "border-red-200 bg-red-50 text-red-900 focus:ring-red-500/10 focus:border-red-500" 
                        : "border-gray-200/80 bg-gray-50/50 text-gray-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="blocked">Blocked</option>
                  </select>
                  <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 ${form.status === "blocked" ? "text-red-500" : "text-gray-400"}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                
                {form.status === "blocked" && (
                  <p className="mt-3 text-sm text-red-500 flex items-center gap-1.5 font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    User is locked out of the system.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}