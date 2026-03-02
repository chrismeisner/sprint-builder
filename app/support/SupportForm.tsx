"use client";

import { useState } from "react";

const TOPICS = [
  "General question",
  "Sprint or project question",
  "Billing or payment",
  "Technical issue",
  "Other",
];

type Status = "idle" | "submitting" | "success" | "error";

export default function SupportForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-950 p-8 text-center space-y-3">
        <div className="text-3xl">✅</div>
        <p className="text-lg font-semibold">Message sent</p>
        <p className="text-sm text-text-secondary">
          We&apos;ll get back to you at <strong>{email}</strong> within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="support-name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="support-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm placeholder:opacity-40 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="support-email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="support-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm placeholder:opacity-40 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="support-subject" className="block text-sm font-medium">
          Topic
        </label>
        <select
          id="support-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition"
        >
          {TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="support-message" className="block text-sm font-medium">
          Message
        </label>
        <textarea
          id="support-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what you need help with..."
          className="w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm placeholder:opacity-40 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition resize-none"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex items-center justify-center rounded-md bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
      >
        {status === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
