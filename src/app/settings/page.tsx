"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
// ✅ Import the new CSS Module
import styles from "./SettingsPage.module.css";
import { FaRegUser } from "react-icons/fa";
import { IoDiamondOutline } from "react-icons/io5";
import { IoSettingsOutline } from "react-icons/io5";
import { Icon } from "next/dist/lib/metadata/types/metadata-types";
import { IconType } from "react-icons";
import { FaPencilAlt } from "react-icons/fa";
// ✅ Helper type for message state
type MessageState = { type: "" | "success" | "error"; text: string };
const initialMessage: MessageState = { type: "", text: "" };

// ✅ Safely get initials (prevents crash for OAuth users)
const getInitials = (user: any) : string => {
  if (!user) return "U";
  const first = user.firstName?.charAt(0) || "";
  const last = user.lastName?.charAt(0) || "";
  const initials = (first + last).toUpperCase();
  return initials || "U";
};

// ✅ Safe display name
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
  user: any; // Replace 'any' with your User type
  activeTab: string;
  setActiveTab: (tab: "account" | "subscription" | "settings") => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, setActiveTab, onLogout }) => {
  const SidebarItem = (label: string, key: "account" | "subscription" | "settings",Icon:IconType,) => (
    <button
      type="button"
      onClick={() => setActiveTab(key)}
      // ✅ Conditionally apply 'active' class
      className={`${styles.sidebarItem} ${activeTab === key ? styles.active : ""}`}
    >  <Icon size={18} style={{ marginRight: "18px" ,marginTop:"-4px"}} />
      {label}
    </button>
  );

  return (
    <div className={styles.sidebar} style={{fontFamily: 'Georgia, "Times New Roman", serif',}}>
      {/* <div className={styles.brand} >FileMint</div> */}
      <img src="/Group-14.svg" alt="Logo" className={styles.brand} style={{height:"26px", marginLeft:"-20px"}}/>
      <div className={styles.profileAvatar}>{getInitials(user)}</div>
      {/* <div className={styles.displayName}>{getDisplayName(user)}</div> */}

      {SidebarItem("Account", "account",FaRegUser )}
      {SidebarItem("Subscription", "subscription",IoDiamondOutline )}
      {SidebarItem("Settings", "settings",IoSettingsOutline )}

      <button onClick={onLogout} className={styles.logoutButton}>
        Log Out
      </button>
    </div>
  );
};

// =================================================================
// 2. MESSAGE COMPONENT (Helper)
// =================================================================
const MessageDisplay: React.FC<{ message: MessageState }> = ({ message }) => {
  if (!message.text) return null;
  return (
    <div
      className={`${styles.messageBox} ${
        message.type === "success" ? styles.messageSuccess : styles.messageError
      }`}
    >
      {message.text}
    </div>
  );
};

// =================================================================
// 3. ACCOUNT TAB (Split into sub-forms)
// =================================================================

// 3a. Account Details Form
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
        <label className={styles.label} htmlFor="firstName">
          First Name
        </label>
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
        
        <label className={styles.label} htmlFor="lastName">
          Last Name
        </label>
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

// 3b. Password Change Form
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
            <label className="sr-only" htmlFor={field.name}> {/* Screen-reader only label */}
              {field.label}
            </label>
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

// 3c. Account Tab Container
const AccountSettingsTab: React.FC<{ user: any; token: string | null }> = ({ user, token }) => {
  return (
    <>
      <div className={styles.heading}>Account</div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "2rem" ,marginLeft:"-50px"}}>
        <div className={styles.profileAvatar} style={{ width: 60, height: 60, fontSize: 20, marginRight: '1rem' }}>
          {getInitials(user)}
        </div>
        {/* ✅ A11y: This should be a button if it does something (e.g., open modal) */}
        <button type="button" className={styles.clickableText} style={{ textDecoration: 'none' , color:"black"}}>
          <FaPencilAlt /> Update profile
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
  const features = [
    "Full access to all tools in FileMint",
    "Unlimited storage for all your files",
    "Work on Web, Mobile and Desktop",
    "Convert scanned PDF to Word with OCR, Sign with digital signatures, audio to PDF, PDF language Converter, API Generator, Bulk PDF Merge",
    "No Ads.",
  ];

  return (
    <>
      <div className={styles.heading}>Subscriptions</div>
      <div className={styles.upgradeLink} style={{color:"black"}}>Upgrade to Premium<IoDiamondOutline/> </div>
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
const SettingsTab: React.FC = () => {
  return (
    < >
      <div className={styles.heading} style={{fontFamily: 'Georgia, "Times New Roman", serif'}} >Preferences</div>

      <div className={styles.preferenceItem} style={{fontFamily: 'Georgia, "Times New Roman", serif',marginBottom:"20px"}} >
        <div className={styles.preferenceTitle}>Language</div>
        <div className={styles.preferenceText}>English</div>
        <button type="button" className={styles.clickableText} style={{textDecoration:"none"}}>
          Change
        </button>
      </div>

      <div className={styles.preferenceItem}>
        <div className={styles.preferenceTitle}>Email Notifications</div>
        <div className={styles.preferenceText}>
          No longer wish to receive promotional emails from us? You can do so here.
        </div>
        <button type="button" className={styles.dangerText}>
          Disable Emails
        </button>
      </div>

      <div className={styles.preferenceItem}>
        <div className={styles.preferenceTitle}>Manage Account</div>
        <button type="button" className={styles.dangerText}>
          Delete Account
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

  // Auth redirection
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Loading spinner
  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        Loading...
      </div>
    );
  }

  // Null render until redirect effect fires
  if (!user) {
    return null;
  }

  // Helper to render the correct tab
  const renderActiveTab = () => {
    switch (activeTab) {
      case "account":
        return <AccountSettingsTab user={user} token={token} />;
      case "subscription":
        return <SubscriptionTab />;
      case "settings":
        return <SettingsTab />;
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