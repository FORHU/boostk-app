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
          <marker
            id="arrowhead-static"
            markerHeight="4"
            markerUnits="strokeWidth"
            markerWidth="4"
            orient="auto"
            refX="0"
            refY="2"
          >
            <path d="M0,0 L4,2 L0,4 z" fill="#3B82F6" fillOpacity="0.3" />
          </marker>
        </defs>

        {/* Static faint path - jagged lines */}
        <path
          d="M 100 550 
             L 250 400 
             L 350 480 
             L 600 220 
             L 700 300 
             L 950 50"
          fill="none"
          markerEnd="url(#arrowhead-static)"
          stroke="#3B82F6"
          strokeDasharray="12 12"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.15"
          strokeWidth="8"
        />

        {/* Animated active path - jagged lines */}
        <motion.path
          d="M 100 550 
             L 250 400 
             L 350 480 
             L 600 220 
             L 700 300 
             L 950 50"
          fill="none"
          markerEnd="url(#arrowhead)"
          stroke="#3B82F6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="8"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{
            duration: 2.5,
            ease: "easeInOut",
            delay: 0.5,
            repeat: Infinity,
            repeatType: "loop",
            repeatDelay: 1
          }}
        />
      </svg>
    </div>
  );
};