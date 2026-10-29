import React from 'react';

/** Sample .GUI layer on top of the overlay (stand-in for the '.me bubble'; not codex-me code). */
export const SampleGuiLayer = () => (
  <div style={{ position: 'absolute', left: 64, top: 64, padding: '18px 28px', borderRadius: 999, border: '2px solid rgba(255,255,255,0.7)', color: '#fff', font: '700 40px/1 sans-serif', background: 'rgba(0,0,0,0.25)' }}>
    .me <span style={{ fontWeight: 400, opacity: 0.7, fontSize: 24 }}>sample layer</span>
  </div>
);

