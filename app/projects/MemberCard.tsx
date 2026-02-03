"use client";

import { useState } from "react";
import Typography from "@/components/ui/Typography";

type Member = {
  email: string;
  title: string | null;
  created_at: string | Date;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
};

type Props = {
  member: Member;
};

function getInitials(member: Member): string {
  if (member.first_name && member.last_name) {
    return `${member.first_name[0]}${member.last_name[0]}`.toUpperCase();
  }
  if (member.name) {
    const parts = member.name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return member.name.substring(0, 2).toUpperCase();
  }
  return member.email.substring(0, 2).toUpperCase();
}

function getDisplayName(member: Member): string {
  if (member.first_name && member.last_name) {
    return `${member.first_name} ${member.last_name}`;
  }
  if (member.name) {
    return member.name;
  }
  return member.email;
}

export default function MemberCard({ member }: Props) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-3 p-3 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/5 dark:hover:bg-white/5 transition text-left"
      >
        {/* Avatar with initials */}
        <div className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-sm font-medium">
          {getInitials(member)}
        </div>
        {/* Name and title */}
        <div className="min-w-0">
          <Typography as="div" scale="body-sm" className="font-medium truncate">
            {getDisplayName(member)}
          </Typography>
          {member.title && (
            <Typography as="div" scale="body-xs" className="opacity-60 truncate">
              {member.title}
            </Typography>
          )}
        </div>
      </button>

      {/* Member Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70"
            onClick={() => setShowModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
              <Typography as="h3" scale="h4">
                Member Details
              </Typography>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              {/* Avatar and name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-xl font-medium">
                  {getInitials(member)}
                </div>
                <div>
                  <Typography as="div" scale="h4" className="font-semibold">
                    {getDisplayName(member)}
                  </Typography>
                  {member.title && (
                    <Typography as="div" scale="body-sm" className="opacity-70">
                      {member.title}
                    </Typography>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 pt-2 border-t border-black/10 dark:border-white/10">
                <div>
                  <Typography as="div" scale="body-xs" className="opacity-50 uppercase tracking-wide mb-1">
                    Email
                  </Typography>
                  <Typography as="div" scale="body-sm">
                    <a 
                      href={`mailto:${member.email}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {member.email}
                    </a>
                  </Typography>
                </div>

                {member.first_name && (
                  <div>
                    <Typography as="div" scale="body-xs" className="opacity-50 uppercase tracking-wide mb-1">
                      First Name
                    </Typography>
                    <Typography as="div" scale="body-sm">
                      {member.first_name}
                    </Typography>
                  </div>
                )}

                {member.last_name && (
                  <div>
                    <Typography as="div" scale="body-xs" className="opacity-50 uppercase tracking-wide mb-1">
                      Last Name
                    </Typography>
                    <Typography as="div" scale="body-sm">
                      {member.last_name}
                    </Typography>
                  </div>
                )}

                <div>
                  <Typography as="div" scale="body-xs" className="opacity-50 uppercase tracking-wide mb-1">
                    Added to Project
                  </Typography>
                  <Typography as="div" scale="body-sm">
                    {new Date(member.created_at).toLocaleDateString()}
                  </Typography>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-4 border-t border-black/10 dark:border-white/10">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
