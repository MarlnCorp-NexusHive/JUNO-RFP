import React from "react";
import { publicUrl } from "../../../utils/publicUrl.js";

/**
 * Local Microsoft Fluent Emoji 3D assets (vendored under /public/hub-emoji).
 * Soft float + hover tilt for a product-grade 3D feel.
 */
const HUB_3D = {
  find: { src: publicUrl("hub-emoji/find.png"), fallback: "🔍" },
  respond: { src: publicUrl("hub-emoji/respond.png"), fallback: "✍️" },
  manage: { src: publicUrl("hub-emoji/manage.png"), fallback: "📋" },
  account: { src: publicUrl("hub-emoji/account.png"), fallback: "👤" },
};

export function HubIcon({ id, className = "h-8 w-8" }) {
  const asset = HUB_3D[id];
  if (!asset) return null;
  return (
    <img
      src={asset.src}
      alt=""
      draggable={false}
      className={`${className} select-none object-contain`}
      loading="eager"
      decoding="async"
    />
  );
}

/** 3D Fluent emoji with continuous float and hover tilt. */
export function HubIconBadge({ id, size = "md" }) {
  const box = size === "lg" ? "h-14 w-14" : "h-12 w-12";
  const icon = size === "lg" ? "h-10 w-10" : "h-9 w-9";
  const asset = HUB_3D[id] || HUB_3D.find;

  return (
    <span
      className={`hub-emoji-3d relative inline-flex ${box} items-center justify-center`}
      aria-hidden="true"
    >
      <span className="hub-emoji-3d__orb absolute inset-0 rounded-[14px]" />
      <span className="hub-emoji-3d__float relative z-[1] inline-flex items-center justify-center">
        <img
          src={asset.src}
          alt=""
          draggable={false}
          className={`${icon} select-none object-contain`}
          loading="eager"
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const fallback = e.currentTarget.nextElementSibling;
            if (fallback) fallback.hidden = false;
          }}
        />
        <span
          className={`${icon} hidden items-center justify-center text-[1.75rem] leading-none`}
          hidden
        >
          {asset.fallback}
        </span>
      </span>

      <style>{`
        .hub-emoji-3d {
          perspective: 520px;
          transform-style: preserve-3d;
        }
        .hub-emoji-3d__orb {
          background:
            radial-gradient(120% 90% at 28% 18%, rgba(255,255,255,0.98), rgba(236,241,247,0.65) 48%, rgba(197,208,222,0.4) 100%);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.95),
            inset 0 -8px 16px rgba(61,79,102,0.08),
            0 0 0 1px rgba(61,79,102,0.08);
          transition: box-shadow 280ms ease;
        }
        :is(.dark) .hub-emoji-3d__orb {
          background:
            radial-gradient(120% 90% at 28% 18%, rgba(100,116,139,0.45), rgba(15,23,42,0.92) 72%);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 0 0 1px rgba(197,208,222,0.12);
        }
        .hub-emoji-3d__float {
          transform-origin: 50% 75%;
          transform: translateY(0) rotateX(0deg) rotateY(0deg) scale(1);
          transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1), filter 320ms ease;
          filter: drop-shadow(0 8px 12px rgba(15, 23, 42, 0.18));
        }
        .group:hover .hub-emoji-3d__float {
          animation: hubEmojiHover 1.1s ease-in-out infinite;
          filter: drop-shadow(0 16px 18px rgba(15, 23, 42, 0.28));
        }
        .group:hover .hub-emoji-3d__orb {
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,1),
            inset 0 -10px 20px rgba(61,79,102,0.1),
            0 12px 24px rgba(61,79,102,0.14),
            0 0 0 1px rgba(61,79,102,0.1);
        }
        @keyframes hubEmojiHover {
          0%, 100% { transform: translateY(-3px) rotateX(10deg) rotateY(-12deg) scale(1.06); }
          50% { transform: translateY(-6px) rotateX(14deg) rotateY(-8deg) scale(1.09); }
        }
        @media (prefers-reduced-motion: reduce) {
          .group:hover .hub-emoji-3d__float {
            animation: none;
            transform: translateY(-2px) scale(1.04);
          }
        }
      `}</style>
    </span>
  );
}

export default HubIcon;
