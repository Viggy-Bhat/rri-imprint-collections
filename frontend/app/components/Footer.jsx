"use client";

export function Footer({ settings }) {
  return (
    <footer className="w-full mt-auto border-t border-red-800/30" role="contentinfo">
      <div className="w-full pl-3 sm:pl-4 lg:pl-6 pr-0 pt-8 pb-6 sm:pt-10 sm:pb-8">
        <div className="flex justify-end">
          <div className="inline-flex items-center gap-2 sm:gap-3 text-red-900 text-right">
            <div className="leading-tight font-serif">
              <p className="text-base sm:text-lg tracking-tight">LIBRARY</p>
              <p className="text-sm sm:text-base tracking-tight">RAMAN RESEARCH INSTITUTE</p>
            </div>

            <div
              className="h-10 w-10 sm:h-12 sm:w-12 bg-center bg-no-repeat bg-contain shrink-0"
              style={{ backgroundImage: "url('/assets/library-emblem.png'), url('/assets/library-emblem.svg')" }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
