"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import styles from "./SettingsPage.module.css";
import { FaRegUser } from "react-icons/fa";
import { IoDiamondOutline } from "react-icons/io5";
import { IoSettingsOutline } from "react-icons/io5";
import { IconType } from "react-icons";
import { FaPencilAlt } from "react-icons/fa";
import Link from "next/link";

// Helper type for message state
type MessageState = { type: "" | "success" | "error"; text: string };
const initialMessage: MessageState = { type: "", text: "" };

// Safely get initials
const getInitials = (user: any): string => {
  if (!user) return "U";
  const first = user.firstName?.charAt(0) || "";
  const last = user.lastName?.charAt(0) || "";
  const initials = (first + last).toUpperCase();
  return initials || "U";
};

// Safe display name
const getDisplayName = (user: any): string => {
  if (!user) return "";
  if (user.firstName || user.lastName)
    return `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return user.email?.split("@")[0] || "User";
};

// =================================================================
// 1. SIDEBAR COMPONENT
// =================================================================
interface SidebarProps {
  user: any;
  activeTab: string;
  setActiveTab: (tab: "account" | "subscription" | "settings") => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, setActiveTab, onLogout }) => {
  const SidebarItem = (label: string, key: "account" | "subscription" | "settings", Icon: IconType) => (
    <button
      type="button"
      onClick={() => setActiveTab(key)}
      className={`${styles.sidebarItem} ${activeTab === key ? styles.active : ""}`}
    >
      <Icon size={18} style={{ marginRight: "18px", marginTop: "-4px" }} />
      {label}
    </button>
  );

  return (
    <div className={styles.sidebar}>
      <div className={styles.brand}>
        <span style={{ fontSize: "1.25rem", fontWeight: "700", color: "#fff", fontFamily: 'Georgia, serif' }}>FileMint</span>
      </div>
      <div className={styles.profileAvatar}>{getInitials(user)}</div>
      <div className={styles.displayName}>{getDisplayName(user)}</div>

      {SidebarItem("Account", "account", FaRegUser)}
      {SidebarItem("Subscription", "subscription", IoDiamondOutline)}
      {SidebarItem("Settings", "settings", IoSettingsOutline)}

      <button onClick={onLogout} className={styles.logoutButton}>
        Log Out
      </button>
    </div>
  );
};

// =================================================================
// 2. MESSAGE COMPONENT
// =================================================================
const MessageDisplay: React.FC<{ message: MessageState }> = ({ message }) => {
  if (!message.text) return null;
  return (
    <div className={`${styles.messageBox} ${message.type === "success" ? styles.messageSuccess : styles.messageError}`}>
      {message.text}
    </div>
  );
};

// =================================================================
// 3. ACCOUNT TAB
// =================================================================
const AccountDetailsForm: React.FC<{ user: any; token: string | null }> = ({ user, token }) => {
  const [accountForm, setAccountForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  });
  const [isAccountLoading, setIsAccountLoading] = useState(false);
  const [accountMessage, setAccountMessage] = useState<MessageState>(initialMessage);

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccountForm({ ...accountForm, [e.target.name]: e.target.value });
  };

  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAccountLoading(true);
    setAccountMessage(initialMessage);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(accountForm),
      });
      const data = await response.json();
      if (response.ok) {
        setAccountMessage({ type: "success", text: "Account updated successfully!" });
      } else {
        setAccountMessage({ type: "error", text: data.error || "Failed to update account" });
      }
    } catch (error) {
      setAccountMessage({ type: "error", text: "An error occurred" });
    } finally {
      setIsAccountLoading(false);
    }
  };

  return (
    <form onSubmit={handleAccountUpdate} className={styles.formContainer}>
      <MessageDisplay message={accountMessage} />
      <div>
        <div style={{ fontWeight: 600, marginTop: "1rem" }}>Email</div>
        <div style={{ margin: "4px 0" }}>{user.email}</div>
      </div>

      <div className={styles.formSection}>
        <label className={styles.label} htmlFor="firstName">First Name</label>
        <input
          type="text"
          name="firstName"
          id="firstName"
          value={accountForm.firstName}
          onChange={handleAccountChange}
          placeholder="First Name"
          className={styles.inputField}
          required
        />
        <label className={styles.label} htmlFor="lastName">Last Name</label>
        <input
          type="text"
          name="lastName"
          id="lastName"
          value={accountForm.lastName}
          onChange={handleAccountChange}
          placeholder="Last Name"
          className={styles.inputField}
          required
        />
        <button type="submit" disabled={isAccountLoading} className={styles.submitButton}>
          {isAccountLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
};

const PasswordChangeForm: React.FC<{ token: string | null }> = ({ token }) => {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    repeatPassword: "",
  });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<MessageState>(initialMessage);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    repeat: false,
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const toggleShowPassword = (key: keyof typeof showPassword) => {
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPasswordLoading(true);
    setPasswordMessage(initialMessage);

    if (passwordForm.newPassword !== passwordForm.repeatPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match" });
      setIsPasswordLoading(false);
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "Password must be at least 8 characters" });
      setIsPasswordLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setPasswordMessage({ type: "success", text: "Password updated successfully!" });
        setPasswordForm({ currentPassword: "", newPassword: "", repeatPassword: "" });
      } else {
        setPasswordMessage({ type: "error", text: data.error || "Failed to update password" });
      }
    } catch (error) {
      setPasswordMessage({ type: "error", text: "An error occurred" });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const passwordFields = [
    { name: "currentPassword", label: "Current Password", key: "current" },
    { name: "newPassword", label: "New Password", key: "new" },
    { name: "repeatPassword", label: "Repeat Password", key: "repeat" },
  ] as const;

  return (
    <form onSubmit={handlePasswordUpdate}>
      <div className={styles.subheading}>Change Password</div>
      <MessageDisplay message={passwordMessage} />
      <div className={styles.formSection}>
        {passwordFields.map((field) => (
          <div key={field.name} className={styles.passwordInputWrapper}>
            <label className="sr-only" htmlFor={field.name}>{field.label}</label>
            <input
              type={showPassword[field.key] ? "text" : "password"}
              name={field.name}
              id={field.name}
              value={passwordForm[field.name]}
              onChange={handlePasswordChange}
              placeholder={field.label}
              className={styles.inputField}
              required
            />
            <button
              type="button"
              className={styles.showPasswordButton}
              onClick={() => toggleShowPassword(field.key)}
              aria-label={showPassword[field.key] ? "Hide password" : "Show password"}
            >
              {showPassword[field.key] ? "🙈" : "👁️"}
            </button>
          </div>
        ))}
        <button type="submit" disabled={isPasswordLoading} className={styles.submitButton}>
          {isPasswordLoading ? "Updating..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
};

const AccountSettingsTab: React.FC<{ user: any; token: string | null }> = ({ user, token }) => {
  return (
    <>
      <div className={styles.heading}>Account</div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className={styles.profileAvatar} style={{ width: 60, height: 60, fontSize: 16, backgroundColor: "#1e2b50", color: "#fff" }}>
          {getInitials(user)}
        </div>
        <button
          type="button"
          className={styles.clickableText}
          onClick={() => alert("Profile photo uploading requires cloud storage integration which is not yet configured.")}
        >
          <FaPencilAlt size={12} /> Update photo
        </button>
      </div>
      <AccountDetailsForm user={user} token={token} />
      <PasswordChangeForm token={token} />
    </>
  );
};

// =================================================================
// 4. SUBSCRIPTION TAB
// =================================================================
const SubscriptionTab: React.FC = () => {
  const router = useRouter();
  const handleUpgrade = () => {
    router.push('/pricing'); // Redirect to pricing page
  };

  const features = [
    "Full access to all tools in FileMint",
    "Unlimited storage for all your files",
    "Work on Web, Mobile and Desktop",
    "OCR, Digital Signatures, PDF Translation",
    "No Ads & Priority Support",
  ];

  return (
    <>
      <div className={styles.heading}>Subscription</div>

      <div style={{
        background: "linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "2rem",
        border: "1px solid #c7d2fe"
      }}>
        <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "0.25rem" }}>Current Plan</div>
        <div style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e2b50", marginBottom: "0.5rem" }}>Basic (Free)</div>
        <div style={{ fontSize: "0.9rem", color: "#4b5563" }}>Limited access to tools</div>
      </div>

      <div style={{
        background: "linear-gradient(135deg, #1e2b50 0%, #323d68 100%)",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        color: "#fff"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <IoDiamondOutline size={20} />
          <span style={{ fontSize: "1.125rem", fontWeight: "600" }}>Premium Plan</span>
        </div>
        <div style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "0.5rem" }}>₹299<span style={{ fontSize: "0.9rem", fontWeight: "400" }}>/month</span></div>
        <button
          onClick={handleUpgrade}
          style={{
            width: "100%",
            padding: "0.75rem",
            background: "#fbbf24",
            border: "none",
            borderRadius: "8px",
            color: "#1f2937",
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "0.95rem",
            marginTop: "0.5rem"
          }}>Upgrade Now</button>
      </div>

      <div style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1rem", color: "#374151" }}>What you get:</div>
      {features.map((item, i) => (
        <div key={i} className={styles.featureItem}>
          <span className={styles.featureCheck}>✓</span> {item}
        </div>
      ))}
    </>
  );
};

// =================================================================
// 5. SETTINGS TAB
// =================================================================
interface SettingsTabProps {
  token: string | null;
  logout: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ token, logout }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleToggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    // Simulate saving preference
    setTimeout(() => alert(notificationsEnabled ? "Notifications disabled" : "Notifications enabled"), 100);
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert("Account deleted successfully.");
        logout();
        router.push("/signup");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete account");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className={styles.heading}>Preferences</div>

      {/* Email Notifications */}
      <div className={styles.preferenceItem}>
        <div>
          <div className={styles.preferenceTitle}>Email Notifications</div>
          <div className={styles.preferenceText}>Receive promotional emails</div>
        </div>
        <div
          onClick={handleToggleNotifications}
          className={`${styles.toggleSwitch} ${notificationsEnabled ? styles.active : ""}`}
        >
          <div className={styles.toggleKnob}></div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className={styles.dangerZone}>
        <div className={styles.dangerTitle}>Danger Zone</div>
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          className={styles.dangerButton}
        >
          {isDeleting ? "Deleting..." : "Delete Account"}
        </button>
      </div>
    </>
  );
};

// =================================================================
// 6. MAIN PAGE COMPONENT
// =================================================================
const SettingsPage: React.FC = () => {
  const { user, logout, token, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"account" | "subscription" | "settings">("account");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case "account":
        return <AccountSettingsTab user={user} token={token} />;
      case "subscription":
        return <SubscriptionTab />;
      case "settings":
        return <SettingsTab token={token} logout={logout} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={logout}
      />
      <main className={styles.mainContent}>{renderActiveTab()}</main>
    </div>
  );
};

export default SettingsPage;