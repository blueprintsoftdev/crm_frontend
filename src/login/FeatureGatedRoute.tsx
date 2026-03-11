// src/login/FeatureGatedRoute.tsx
// Wraps a route element and renders a "Feature Locked" page when the feature
// flag is disabled. Applies only to ADMIN routes — SUPER_ADMIN always bypasses
// (they have dedicated routes under /super-admin-dashboard which skip this guard).

import React from "react";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import { ClipLoader } from "react-spinners";
import { useFeatureFlags, type Feature } from "../context/FeatureFlagContext";

interface Props {
  feature: Feature;
  children: React.ReactNode;
}

export default function FeatureGatedRoute({ feature, children }: Props) {
  const { isEnabled, loading } = useFeatureFlags();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <ClipLoader color="#343e32" size={28} />
      </div>
    );
  }

  if (!isEnabled(feature)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[28rem] gap-4 px-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 border border-red-100">
          <LockClosedIcon className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-semibold text-gray-900">Feature Unavailable</h2>
          <p className="mt-2 text-sm text-gray-500">
            This feature has been disabled by the Super Admin. Access is blocked.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
