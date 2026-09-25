import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ExtensionModal({ isOpen, onClose }) {
  const [downloaded, setDownloaded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleDownloadAndInstall = () => {
    // 1. Trigger zip download
    const link = document.createElement("a");
    link.href = "/shelflife-extension.zip";
    link.download = "shelflife-extension.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloaded(true);
  };

  const handleCopyChromeUrl = () => {
    navigator.clipboard.writeText("chrome://extensions");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

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
          background: "rgba(0, 0, 0, 0.65)",
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
            maxWidth: "520px",
            background: "linear-gradient(155deg, rgba(20,25,35,0.9), rgba(10,12,20,0.95))",
            backdropFilter: "blur(40px) saturate(200%)",
            WebkitBackdropFilter: "blur(40px) saturate(200%)",
            borderRadius: "32px",
            padding: "36px",
            boxShadow: "0 30px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 1px rgba(0, 214, 255, 0.3)",
            color: "white",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glowing orb effects */}
          <div
            style={{
              position: "absolute",
              top: "-50px",
              right: "-50px",
              width: "200px",
              height: "200px",
              background: "radial-gradient(circle, rgba(124, 58, 237, 0.35) 0%, transparent 70%)",
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
              background: "radial-gradient(circle, rgba(0, 214, 255, 0.25) 0%, transparent 70%)",
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

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <span style={{ fontSize: "28px" }}>🧩</span>
            <h2 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "26px",
              fontWeight: 800,
              letterSpacing: "-0.5px",
              margin: 0,
              background: "linear-gradient(to right, #ffffff, #00D6FF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Add ShelfLife to Chrome
            </h2>
          </div>

          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "14px",
            color: "rgba(255,255,255,0.65)",
            lineHeight: 1.5,
            margin: "0 0 24px 0",
          }}>
            Tap below to automatically download the Chrome extension package and load it into your browser.
          </p>

          {/* Step Guide */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
            {[
              { num: "1️⃣", title: "Tap 'Add to Chrome'", sub: "Automatically downloads shelflife-extension.zip" },
              { num: "2️⃣", title: "Unzip the Package", sub: "Extract the downloaded folder" },
              { num: "3️⃣", title: "Open chrome://extensions", sub: "Enable 'Developer mode' toggle (top right)" },
              { num: "4️⃣", title: "Click 'Load unpacked'", sub: "Select the unzipped extension folder" },
            ].map((step, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "14px", background: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "20px" }}>{step.num}</span>
                <div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", fontWeight: 600, color: "#fff" }}>{step.title}</div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{step.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {downloaded && (
            <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "#34d399", padding: "12px 16px", borderRadius: "14px", marginBottom: "20px", fontSize: "13px", fontWeight: 600, textAlign: "center" }}>
              ✓ Extension package downloaded! Open <strong>chrome://extensions</strong> and click <strong>Load unpacked</strong>.
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={handleDownloadAndInstall}
              style={{
                width: "100%",
                padding: "16px 24px",
                borderRadius: "16px",
                border: "none",
                background: "linear-gradient(135deg, #00D6FF, #0077ff)",
                color: "white",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: "16px",
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(0,214,255,0.35)",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,214,255,0.45)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,214,255,0.35)";
              }}
            >
              <span>⚡</span>
              <span>{downloaded ? "Re-download Extension Package (.zip)" : "Tap to Add to Chrome Automatically"}</span>
            </button>

            <button
              onClick={handleCopyChromeUrl}
              style={{
                width: "100%",
                padding: "12px 20px",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                color: copiedLink ? "#38bdf8" : "rgba(255,255,255,0.8)",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {copiedLink ? "✓ Copied 'chrome://extensions' link!" : "📋 Copy 'chrome://extensions' path to clipboard"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
