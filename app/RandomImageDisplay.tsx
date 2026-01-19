"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface RandomImageDisplayProps {
  images: string[];
}

export default function RandomImageDisplay({ images }: RandomImageDisplayProps) {
  const [currentImage, setCurrentImage] = useState<string>("");

  // Pick a random image
  const pickRandomImage = () => {
    const randomImage = images[Math.floor(Math.random() * images.length)];
    setCurrentImage(`/scraps/${randomImage}`);
  };

  // Pick initial random image on mount
  useEffect(() => {
    pickRandomImage();
  }, []);

  // Listen for 'r' key press
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "r" || event.key === "R") {
        pickRandomImage();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [images]);

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
