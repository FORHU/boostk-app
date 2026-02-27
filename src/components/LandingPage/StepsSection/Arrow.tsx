import React from "react";
import { motion } from "framer-motion";

export const Arrow = () => {
  return (
    <div className="absolute inset-0 hidden md:block z-0 pointer-events-none -top-10 -bottom-10 left-0 right-0">
      <svg
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 1000 600"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker
            id="arrowhead"
            markerHeight="4"
            markerUnits="strokeWidth"
            markerWidth="4"
            orient="auto"
            refX="0"
            refY="2"
          >
            <path d="M0,0 L4,2 L0,4 z" fill="#3B82F6" />
          </marker>
        </defs>

        {/* Solid blue arrow – no dashes, no animations */}
        <path
          d="M 100 550 L 250 400 L 350 480 L 600 220 L 700 300 L 950 50"
          fill="none"
          markerEnd="url(#arrowhead)"
          stroke="#3B82F6"
          strokeOpacity="0.8"          // Adjust opacity as needed
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};