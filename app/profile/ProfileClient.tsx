"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { useToast } from "@/lib/toast-context";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
  createdAt: string;
};

type ProfileData = {
  profile: Profile;
};

export default function ProfileClient() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [firstNameValue, setFirstNameValue] = useState("");
  const [lastNameValue, setLastNameValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const pageTitleClass = getTypographyClassName("h2");
  const pageSubtitleClass = getTypographyClassName("subtitle-sm");
  const sectionTitleClass = getTypographyClassName("h3");
  const labelClass = `${getTypographyClassName("body-sm")} text-text-secondary`;
  const bodyClass = getTypographyClassName("body-md");
  const bodySmClass = getTypographyClassName("body-sm");
  const logoutButtonClasses =
    `${getTypographyClassName("button-md")} px-4 py-2 border border-red-600/20 dark:border-red-400/20 text-red-700 dark:text-red-300 rounded-md hover:bg-red-600/10 dark:hover:bg-red-400/10 disabled:opacity-50 disabled:cursor-not-allowed transition`;

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch profile");
      }
      
      const profileData: ProfileData = await res.json();
      setData(profileData);
      setFirstNameValue(profileData.profile.firstName || "");
      setLastNameValue(profileData.profile.lastName || "");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    // Show toast when arriving from the magic link email
    if (searchParams.get("from") === "magic-email") {
      showToast("Logged in via magic link", "success");
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete("from");
      router.replace(url.pathname + (url.search ? url.search : ""), { scroll: false });
    }
  }, [searchParams, router, showToast]);

  const handleSaveName = async () => {
    if (!data) return;

    try {
      setSaving(true);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          firstName: firstNameValue || null,
          lastName: lastNameValue || null,
          name: firstNameValue && lastNameValue ? `${firstNameValue} ${lastNameValue}` : null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      await fetchProfile();
      setEditingName(false);
      showToast("Profile updated successfully", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Failed to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className={`${bodyClass} opacity-70`}>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-600/10 dark:bg-red-400/10 border border-red-600/20 dark:border-red-400/20 rounded-lg p-4">
          <p className={`${bodySmClass} font-semibold text-red-700 dark:text-red-300`}>Error</p>
          <p className={`${bodySmClass} text-red-600 dark:text-red-400`}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container min-h-screen max-w-6xl space-y-8 py-6">
      {/* Profile Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className={`${pageTitleClass} text-text-primary`}>My Profile</h1>
          <p className={`${pageSubtitleClass} text-text-secondary`}>
            Manage your account settings
          </p>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`${logoutButtonClasses} w-full lg:w-auto`}
        >
          {isLoggingOut ? "Logging out..." : "Log out"}
        </button>
      </div>

      {/* Profile Information Card */}
      <div className="bg-white dark:bg-black rounded-lg border border-black/10 dark:border-white/15 p-6 space-y-4">
        <h2 className={`${sectionTitleClass} text-text-primary mb-2`}>Profile Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block mb-1 ${labelClass}`}>Email</label>
            <div className={bodyClass}>{data.profile.email}</div>
          </div>

          <div>
            <label className={`block mb-1 ${labelClass}`}>First Name</label>
            {editingName ? (
              <input
                type="text"
                value={firstNameValue}
                onChange={(e) => setFirstNameValue(e.target.value)}
                className="w-full px-3 py-2 border border-black/10 dark:border-white/15 rounded-md bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                placeholder="Enter your first name"
                disabled={saving}
              />
            ) : (
              <div className={bodyClass}>
                {data.profile.firstName || <span className="opacity-50 italic">Not set</span>}
              </div>
            )}
          </div>

          <div>
            <label className={`block mb-1 ${labelClass}`}>Last Name</label>
            {editingName ? (
              <input
                type="text"
                value={lastNameValue}
                onChange={(e) => setLastNameValue(e.target.value)}
                className="w-full px-3 py-2 border border-black/10 dark:border-white/15 rounded-md bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                placeholder="Enter your last name"
                disabled={saving}
              />
            ) : (
              <div className={bodyClass}>
                {data.profile.lastName || <span className="opacity-50 italic">Not set</span>}
              </div>
            )}
          </div>

          {editingName && (
            <div className="md:col-span-2 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setEditingName(false);
                  setFirstNameValue(data.profile.firstName || "");
                  setLastNameValue(data.profile.lastName || "");
                }}
                disabled={saving}
                className={`${getTypographyClassName("button-md")} px-4 py-2 border border-black/10 dark:border-white/15 rounded-md hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveName}
                disabled={saving}
                className={`${getTypographyClassName("button-md")} px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:opacity-90 disabled:opacity-50 transition`}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {!editingName && (
            <div className="md:col-span-2">
              <button
                onClick={() => setEditingName(true)}
                className={`${getTypographyClassName("button-md")} px-4 py-2 border border-black/10 dark:border-white/15 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition`}
              >
                Edit Name
              </button>
            </div>
          )}

          <div>
            <label className={`block mb-1 ${labelClass}`}>Account Type</label>
            <div className={bodyClass}>
              {data.profile.isAdmin ? (
                <span className={`px-2 py-1 inline-flex ${bodySmClass} leading-5 font-semibold rounded-full bg-green-600/10 dark:bg-green-400/10 text-green-700 dark:text-green-300`}>
                  Admin
                </span>
              ) : (
                <span className={`px-2 py-1 inline-flex ${bodySmClass} leading-5 font-semibold rounded-full bg-black/10 dark:bg-white/10`}>
                  User
                </span>
              )}
            </div>
          </div>

          <div>
            <label className={`block mb-1 ${labelClass}`}>Member Since</label>
            <div className={bodyClass}>
              {new Date(data.profile.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
