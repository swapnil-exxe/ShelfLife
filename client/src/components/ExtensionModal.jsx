import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ExtensionModal({ isOpen, onClose }) {
  const [btnText, setBtnText] = useState("Add to Chrome");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(12px)",
          padding: "20px",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "500px",
            background: "linear-gradient(155deg, rgba(20,25,35,0.7), rgba(10,12,20,0.85))",
            backdropFilter: "blur(40px) saturate(200%)",
            WebkitBackdropFilter: "blur(40px) saturate(200%)",
            borderRadius: "32px",
            padding: "40px",
            boxShadow: "0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 1px rgba(0, 214, 255, 0.3)",
            color: "white",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glowing orb background effect */}
          <div
            style={{
              position: "absolute",
              top: "-50px",
              right: "-50px",
              width: "200px",
              height: "200px",
              background: "radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, transparent 70%)",
              filter: "blur(40px)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-50px",
              left: "-50px",
              width: "200px",
              height: "200px",
              background: "radial-gradient(circle, rgba(0, 214, 255, 0.2) 0%, transparent 70%)",
              filter: "blur(40px)",
              pointerEvents: "none",
            }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              zIndex: 10,
            }}
          >
            ✕
          </button>

          <h2 style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "28px",
            fontWeight: 800,
            letterSpacing: "-0.5px",
            margin: "0 0 12px 0",
            background: "linear-gradient(to right, #ffffff, #a5b4fc)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            ShelfLife Extension
          </h2>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "15px",
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.5,
            margin: "0 0 32px 0",
          }}>
            Save any website instantly to your ShelfLife dashboard with our Chrome extension.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
            {[
              { num: 1, text: "Add to Chrome (Load unpacked /extension folder)" },
              { num: 2, text: "Pin the extension to your toolbar" },
              { num: 3, text: "Browse to any website" },
              { num: 4, text: "Click the ShelfLife icon to save" },
              { num: 5, text: "Website automatically appears here!" }
            ].map((step) => (
              <div key={step.num} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "rgba(0,214,255,0.15)",
                  border: "1px solid rgba(0,214,255,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#00D6FF"
                }}>
                  {step.num}
                </div>
                <span style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "15px",
                  color: "rgba(255,255,255,0.85)"
                }}>
                  {step.text}
                </span>
              </div>
            ))}
          </div>

          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px dashed rgba(255,255,255,0.2)",
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            color: "rgba(255,255,255,0.6)",
            fontFamily: "'Inter', sans-serif",
            fontSize: "14px",
          }}>
            <span>📌</span> Pin ShelfLife for one-click saves
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => {
                setBtnText("See step 1 above! 👆");
                setTimeout(() => setBtnText("Add to Chrome"), 3000);
              }}
              style={{
                flex: 1,
                padding: "14px 24px",
                borderRadius: "16px",
                border: "none",
                background: "linear-gradient(135deg, #00D6FF, #0077ff)",
                color: "white",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: "15px",
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(0,214,255,0.3)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,214,255,0.4)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,214,255,0.3)";
              }}
            >
              {btnText}
            </button>
            <button
              style={{
                padding: "14px 24px",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                color: "white",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: "15px",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            >
              Learn More
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
