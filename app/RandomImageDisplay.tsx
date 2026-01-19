"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface RandomImageDisplayProps {
  images: string[];
}

export default function RandomImageDisplay({ images }: RandomImageDisplayProps) {
  const [currentImage, setCurrentImage] = useState<string>("");

  // Pick a random image
  const pickRandomImage = useCallback(() => {
    const randomImage = images[Math.floor(Math.random() * images.length)];
    setCurrentImage(`/scraps/${randomImage}`);
  }, [images]);

  // Pick initial random image on mount
  useEffect(() => {
    pickRandomImage();
  }, [pickRandomImage]);

  // Listen for 'r' key press
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "r" || event.key === "R") {
        pickRandomImage();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [pickRandomImage]);

  if (!currentImage) return null;

  return (
    <div className="relative w-96 h-96">
      <Image
        src={currentImage}
        alt="Random scrap"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
}
