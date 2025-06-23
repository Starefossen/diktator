"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import NavigationLanguageSwitcher from "./NavigationLanguageSwitcher";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const { user, userData, logOut } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setIsUserMenuOpen(false);
      await logOut();
      // Use setTimeout to defer navigation until after render is complete
      setTimeout(() => {
        router.push("/");
      }, 0);
    } catch (error) {
      console.error("Logout error occurred:", error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 shadow-sm bg-white/95 backdrop-blur-sm">
      <div className="max-w-6xl px-4 mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="flex items-center justify-center w-8 h-8 transition-transform duration-200 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 group-hover:scale-110">
              <span className="text-lg font-bold text-white">D</span>
            </div>
            <span className="text-xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
              Diktator
            </span>
          </Link>{" "}
          {/* Navigation Links and Language Switcher */}
          <div className="flex items-center space-x-1">
            {/* Public navigation links - always visible */}
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === "/"
                  ? "bg-blue-100 text-blue-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {t("nav.home")}
            </Link>
            <Link
              href="/about/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname.startsWith("/about")
                  ? "bg-blue-100 text-blue-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {t("nav.about")}
            </Link>

            {/* Authenticated user navigation links */}
            {user && (
              <>
                <Link
                  href="/wordsets/"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname.startsWith("/wordsets")
                      ? "bg-blue-100 text-blue-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {t("nav.wordsets")}
                </Link>

                {/* Family Management - Only for parents */}
                {userData?.role === "parent" && (
                  <Link
                    href="/family/"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      pathname.startsWith("/family")
                        ? "bg-blue-100 text-blue-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {t("nav.family")}
                  </Link>
                )}

                {/* Results - Only for children */}
                {userData?.role === "child" && (
                  <Link
                    href="/results/"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      pathname.startsWith("/results")
                        ? "bg-blue-100 text-blue-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {t("nav.results")}
                  </Link>
                )}
              </>
            )}

            {/* Sign In link for unauthenticated users */}
            {!user && (
              <Link
                href="/auth"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname.startsWith("/auth")
                    ? "bg-blue-100 text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {t("auth.signin.title")}
              </Link>
            )}

            {/* Language Switcher */}
            <div className="flex items-center pl-4 ml-4 border-l border-gray-200">
              <NavigationLanguageSwitcher />
            </div>

            {/* User Menu */}
            {user && (
              <div
                ref={userMenuRef}
                className="relative pl-4 ml-4 border-l border-gray-200"
              >
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center px-3 py-2 space-x-2 text-sm text-gray-600 transition-colors rounded-md hover:text-gray-900 hover:bg-gray-100"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                    <span className="text-xs font-medium text-white">
                      {(userData?.displayName || user.email)
                        ?.charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden md:block">
                    {userData?.displayName || user.email}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 z-50 w-48 mt-2 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        {t("nav.profile")}
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        {t("auth.logout")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
