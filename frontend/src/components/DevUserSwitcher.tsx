"use client";

import { useState, useEffect } from "react";
import {
  isMockMode,
  MOCK_USERS,
  getMockUserId,
  setMockUserId,
  MockUserId,
} from "@/lib/oidc";
import { HeroUserIcon, HeroUsersIcon } from "@/components/Icons";

interface DevUserSwitcherProps {
  className?: string;
}

export function DevUserSwitcher({ className = "" }: DevUserSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<MockUserId | null>(null);

  useEffect(() => {
    if (isMockMode) {
      setCurrentUserId(getMockUserId());
    }
  }, []);

  if (!isMockMode || currentUserId === null) {
    return null;
  }

  const currentUser = MOCK_USERS[currentUserId];
  const isParent = currentUser.role === "parent";

  const handleUserSwitch = (userId: MockUserId) => {
    setMockUserId(userId);
    setCurrentUserId(userId);
    setIsOpen(false);
    window.location.reload();
  };

  return (
    <div className={`fixed bottom-4 left-4 z-50 ${className}`}>
      <div className="relative">
        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl bg-white shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-3 py-2 bg-gray-100 border-b border-gray-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Dev Mode: Switch User
              </span>
            </div>
            <div className="py-1">
              {Object.entries(MOCK_USERS).map(([id, user]) => {
                const isSelected = id === currentUserId;
                const userIsParent = user.role === "parent";

                return (
                  <button
                    key={id}
                    onClick={() => handleUserSwitch(id as MockUserId)}
                    className={`w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50" : ""
                      }`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${userIsParent
                          ? "bg-purple-100 text-purple-600"
                          : "bg-green-100 text-green-600"
                        }`}
                    >
                      {userIsParent ? (
                        <HeroUsersIcon className="w-4 h-4" />
                      ) : (
                        <HeroUserIcon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {user.role}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border-2 transition-all ${isParent
              ? "bg-purple-100 border-purple-300 hover:bg-purple-200"
              : "bg-green-100 border-green-300 hover:bg-green-200"
            }`}
          aria-label={`Switch user, currently ${currentUser.name}`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${isParent
                ? "bg-purple-200 text-purple-700"
                : "bg-green-200 text-green-700"
              }`}
          >
            {isParent ? (
              <HeroUsersIcon className="w-3.5 h-3.5" />
            ) : (
              <HeroUserIcon className="w-3.5 h-3.5" />
            )}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {currentUser.name.split(" ")[0]}
          </span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${isParent
                ? "bg-purple-200 text-purple-700"
                : "bg-green-200 text-green-700"
              }`}
          >
            DEV
          </span>
        </button>
      </div>
    </div>
  );
}
