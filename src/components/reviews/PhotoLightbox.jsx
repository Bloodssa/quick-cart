import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function PhotoLightbox({ images, index, onIndexChange, onClose }) {
    const ref = useRef(null);

    useEffect(() => {
        if (!ref.current.open) ref.current.showModal();
    }, []);

    const go = (step) => onIndexChange((index + step + images.length) % images.length);
    const btn = "absolute rounded-full bg-black/60 p-2 text-white hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-white";

    return (
        <dialog
            ref={ref}
            aria-label="Review photo"
            onClose={onClose}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            onKeyDown={(e) => {
                if (e.key === "ArrowLeft") go(-1);
                if (e.key === "ArrowRight") go(1);
            }}
            className="m-auto w-[calc(100%-1rem)] max-w-3xl overflow-hidden rounded-md bg-black p-0 backdrop:bg-black/70"
        >
            <div className="relative flex items-center justify-center">
                <img src={images[index].imageUrl} alt={`Review photo ${index + 1} of ${images.length}`} className="max-h-[85vh] w-full object-contain" />
                <button type="button" onClick={onClose} aria-label="Close" className={`${btn} right-3 top-3`}><X size={20} /></button>
                {images.length > 1 && (
                    <>
                        <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className={`${btn} left-3 top-1/2 -translate-y-1/2`}><ChevronLeft size={22} /></button>
                        <button type="button" onClick={() => go(1)} aria-label="Next photo" className={`${btn} right-3 top-1/2 -translate-y-1/2`}><ChevronRight size={22} /></button>
                    </>
                )}
            </div>
        </dialog>
    );
}