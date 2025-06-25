"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import NavigationLanguageSwitcher from "./NavigationLanguageSwitcher";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const { user, userData, logOut } = useAuth();

  const handleLogout = async () => {
    try {
      await logOut();
      // Use setTimeout to defer navigation until after render is complete
      setTimeout(() => {
        router.push("/");
      }, 0);
    } catch (error) {
      console.error("Logout error occurred:", error);
    }
  };

  // Helper function to determine if a navigation item is current
  const isCurrentPath = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // Helper function for navigation link classes
  const getNavLinkClasses = (href: string, isMobile = false) => {
    const isActive = isCurrentPath(href);

    if (isMobile) {
      return isActive
        ? "border-blue-500 bg-blue-50 text-blue-700 block border-l-4 py-2 pr-4 pl-3 text-base font-medium"
        : "border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 block border-l-4 py-2 pr-4 pl-3 text-base font-medium";
    }

    return isActive
      ? "border-blue-500 text-gray-900 inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium"
      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium";
  };

  return (
    <Disclosure as="nav" className="sticky top-0 z-50 border-b border-gray-100 shadow-sm bg-white/95 backdrop-blur-sm">
      <div className="max-w-6xl px-4 mx-auto">
        <div className="flex items-center justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="flex items-center justify-center w-8 h-8 transition-transform duration-200 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 group-hover:scale-110">
                  <span className="text-lg font-bold text-white">D</span>
                </div>
                <span className="text-xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                  Diktator
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/" className={getNavLinkClasses("/")}>
                {t("nav.home")}
              </Link>
              <Link href="/about/" className={getNavLinkClasses("/about")}>
                {t("nav.about")}
              </Link>

              {/* Authenticated user navigation links */}
              {user && (
                <>
                  <Link href="/wordsets/" className={getNavLinkClasses("/wordsets")}>
                    {t("nav.wordsets")}
                  </Link>

                  {/* Family Management - Only for parents */}
                  {userData?.role === "parent" && (
                    <Link href="/family/" className={getNavLinkClasses("/family")}>
                      {t("nav.family")}
                    </Link>
                  )}

                  {/* Results - Only for children */}
                  {userData?.role === "child" && (
                    <Link href="/results/" className={getNavLinkClasses("/results")}>
                      {t("nav.results")}
                    </Link>
                  )}
                </>
              )}

              {/* Sign In link for unauthenticated users */}
              {!user && (
                <Link href="/auth" className={getNavLinkClasses("/auth")}>
                  {t("auth.signin.title")}
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Right Side */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* Language Switcher */}
            <div className="flex items-center pr-4 mr-4 border-r border-gray-200">
              <NavigationLanguageSwitcher />
            </div>

            {/* User Menu */}
            {user && (
              <Menu as="div" className="relative">
                <div>
                  <MenuButton className="relative flex items-center max-w-xs text-sm bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">Open user menu</span>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                        <span className="text-sm font-medium text-white">
                          {(userData?.displayName || user.email)?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="hidden text-sm text-gray-700 md:block">
                        {userData?.displayName || user.email}
                      </span>
                    </div>
                  </MenuButton>
                </div>
                <MenuItems
                  transition
                  className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-200 data-[enter]:ease-out data-[leave]:duration-75 data-[leave]:ease-in"
                >
                  <MenuItem>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100"
                    >
                      <div className="flex items-center">
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
                      </div>
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100"
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
                  </MenuItem>
                </MenuItems>
              </Menu>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center -mr-2 sm:hidden">
            <DisclosureButton className="relative inline-flex items-center justify-center p-2 text-gray-400 bg-white rounded-md group hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="block h-6 w-6 group-data-[open]:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden h-6 w-6 group-data-[open]:block" />
            </DisclosureButton>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <DisclosurePanel className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          <DisclosureButton
            as={Link}
            href="/"
            className={getNavLinkClasses("/", true)}
          >
            {t("nav.home")}
          </DisclosureButton>
          <DisclosureButton
            as={Link}
            href="/about/"
            className={getNavLinkClasses("/about", true)}
          >
            {t("nav.about")}
          </DisclosureButton>

          {/* Authenticated user navigation links */}
          {user && (
            <>
              <DisclosureButton
                as={Link}
                href="/wordsets/"
                className={getNavLinkClasses("/wordsets", true)}
              >
                {t("nav.wordsets")}
              </DisclosureButton>

              {/* Family Management - Only for parents */}
              {userData?.role === "parent" && (
                <DisclosureButton
                  as={Link}
                  href="/family/"
                  className={getNavLinkClasses("/family", true)}
                >
                  {t("nav.family")}
                </DisclosureButton>
              )}

              {/* Results - Only for children */}
              {userData?.role === "child" && (
                <DisclosureButton
                  as={Link}
                  href="/results/"
                  className={getNavLinkClasses("/results", true)}
                >
                  {t("nav.results")}
                </DisclosureButton>
              )}
            </>
          )}

          {/* Sign In link for unauthenticated users */}
          {!user && (
            <DisclosureButton
              as={Link}
              href="/auth"
              className={getNavLinkClasses("/auth", true)}
            >
              {t("auth.signin.title")}
            </DisclosureButton>
          )}
        </div>

        {/* Mobile User Section */}
        {user && (
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                  <span className="text-sm font-medium text-white">
                    {(userData?.displayName || user.email)?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">
                  {userData?.displayName || user.email}
                </div>
                <div className="text-sm font-medium text-gray-500">
                  {user.email}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <DisclosureButton
                as={Link}
                href="/profile"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                {t("nav.profile")}
              </DisclosureButton>
              <DisclosureButton
                as="button"
                onClick={handleLogout}
                className="block w-full px-4 py-2 text-base font-medium text-left text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                {t("auth.logout")}
              </DisclosureButton>
            </div>
          </div>
        )}

        {/* Mobile Language Switcher */}
        <div className="pt-4 pb-3 border-t border-gray-200">
          <div className="px-4">
            <div className="mb-2 text-sm font-medium text-gray-500">
              Language / Språk
            </div>
            <NavigationLanguageSwitcher />
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
