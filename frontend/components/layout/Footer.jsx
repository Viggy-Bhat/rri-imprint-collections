export function Footer({ settings }) {
  return (
    <footer className="w-full mt-24 sm:mt-14 border-t border-red-800/30">
     <div className="min-h-24 w-full pr-4 pt-2 pb-6 flex justify-end items-end">
        <div className="inline-flex items-end gap-2 sm:gap-3 text-red-900 text-right ">
          
          <div className="leading-tight font-serif">
            <p className="text-sm sm:text-base tracking-tight">Library</p>
            <p className="text-xs sm:text-sm tracking-tight">Raman Research Institute</p>
          </div>

          <div
            className="h-10 w-10 sm:h-12 sm:w-12 bg-center bg-no-repeat bg-contain shrink-0"
            style={{ backgroundImage: "url('/assets/background/RRI-Logo-Colour.png')" }}
            aria-hidden="true"
          />

        </div>
      </div>
    </footer>
  );
}