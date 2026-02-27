"use client";

import Link from "@/app/sandboxes/miles-proto-1/_components/link";
import { useRouter } from "next/navigation";
import { p } from "@/app/sandboxes/miles-proto-1/_lib/nav";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

function ScanDeviceContent() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFailed, setCameraFailed] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch {
      setCameraFailed(true);
    }
  }, []);

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      startCamera();
    } else {
      setCameraFailed(true);
    }

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera]);

  function handleSimulateScan() {
    setCode("A3X9K2");
  }

  function handleSubmit() {
    if (code.length >= 6) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      router.push(p("/billing"));
    }
  }

  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">

        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900">
            Register Miles
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600">
            Enter the code on the back of Miles to link it to your account. You can also scan the QR code to fill it in automatically.
          </p>
        </div>

        {/* Camera / QR scanner area */}
        <div
          className="relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-neutral-900"
          onClick={cameraFailed ? handleSimulateScan : undefined}
        >
          {/* Live camera feed */}
          {!cameraFailed && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {/* Corner brackets */}
          <div className="absolute inset-8 z-10">
            <div className="absolute left-0 top-0 size-8 rounded-tl-sm border-l-2 border-t-2 border-white" />
            <div className="absolute right-0 top-0 size-8 rounded-tr-sm border-r-2 border-t-2 border-white" />
            <div className="absolute bottom-0 left-0 size-8 rounded-bl-sm border-b-2 border-l-2 border-white" />
            <div className="absolute bottom-0 right-0 size-8 rounded-br-sm border-b-2 border-r-2 border-white" />
          </div>

          {/* Fallback / hint overlay */}
          {!cameraActive && (
            <div className="relative z-10 flex flex-col items-center gap-4">
              <svg
                className="size-12 text-white opacity-50"
                aria-hidden="true"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Z" />
              </svg>
              <span className="text-sm font-medium leading-none text-white opacity-70">
                {cameraFailed
                  ? "Tap to simulate a scan"
                  : "Starting camera…"}
              </span>
            </div>
          )}

          {/* Subtle hint when camera is live */}
          {cameraActive && (
            <button
              type="button"
              onClick={handleSimulateScan}
              className="absolute inset-x-0 bottom-4 z-10 mx-auto w-max rounded-full bg-black/50 px-4 py-2 text-xs font-medium text-white/80 backdrop-blur-sm"
            >
              Tap to simulate scan
            </button>
          )}
        </div>

        {/* Code input */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="device-code"
            className="text-sm font-medium leading-none text-neutral-900"
          >
            Device code
          </label>
          <input
            id="device-code"
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) =>
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
            }
            placeholder="e.g. A3X9K2"
            className="h-14 rounded-md border border-neutral-300 bg-white px-4 text-center text-2xl font-semibold leading-snug tracking-widest text-neutral-900 placeholder:text-base placeholder:font-normal placeholder:tracking-normal placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal leading-normal tabular-nums text-neutral-500">
              {code.length}/6 characters
            </span>
            <span className="text-xs font-normal leading-normal text-neutral-400">
              Found on the back of your device
            </span>
          </div>
        </div>

        {/* CTAs — inline, not sticky */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={code.length < 6}
            className={`flex h-12 w-full items-center justify-center rounded-md px-6 text-base font-medium leading-none motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
              code.length >= 6
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "cursor-not-allowed border border-neutral-200 bg-neutral-50 text-neutral-400"
            }`}
          >
            Continue
          </button>
          <Link
            href="/billing"
            className="flex h-10 w-full items-center justify-center text-sm font-medium leading-none text-neutral-400 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-600"
          >
            I&rsquo;ll do this later
          </Link>
        </div>

      </div>
    </main>
  );
}

export default function ScanDevicePage() {
  return (
    <Suspense>
      <ScanDeviceContent />
    </Suspense>
  );
}
