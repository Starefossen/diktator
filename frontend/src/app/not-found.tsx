"use client";

import Link from "next/link";
import { HomeIcon } from "@heroicons/react/24/outline";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-nordic-sky text-white font-medium rounded-lg hover:bg-nordic-sky/90 transition-colors duration-200"
        >
          <HomeIcon className="h-5 w-5 mr-2" />
          Go Home
        </Link>
      </div>
    </div>
  );
}
