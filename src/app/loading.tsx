import React from 'react';

export default function GlobalLoadingPlaceholder() {
  return (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center p-8 space-y-4">
      {/* Restrained loading indicator in Deep Teal */}
      <div className="relative w-10 h-10">
        <div className="w-10 h-10 rounded-full border-2 border-[#E5E7EB] border-t-[#0F766E] animate-spin" />
      </div>

      <div className="text-center space-y-1">
        <p className="text-[14px] font-semibold text-[#1F2937]">Loading...</p>
        <p className="text-[12px] text-[#1F2937]/60">Fetching verified operational records</p>
      </div>

      {/* Accessible screen reader announcement */}
      <span className="sr-only" role="status">
        Loading content, please wait...
      </span>
    </div>
  );
}
