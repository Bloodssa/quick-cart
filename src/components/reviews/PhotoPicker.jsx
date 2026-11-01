import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { compressImage } from "../../lib/compressImage";

export const MAX_PHOTOS = 5;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

function Thumb({ src, onRemove, disabled }) {
    return (
        <li className="relative size-20 overflow-hidden rounded-md border border-gray-300">
            {src && <img src={src} alt="" className="h-full w-full object-cover" />}
            <button
                type="button"
                onClick={onRemove}
                disabled={disabled}
                aria-label="Remove photo"
                className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
            >
                <X size={14} aria-hidden="true" />
            </button>
        </li>
    );
}

function NewThumb({ file, onRemove, disabled }) {
    const [url, setUrl] = useState("");

    useEffect(() => {
        const reader = new FileReader();
        reader.onload = () => setUrl(reader.result);
        reader.readAsDataURL(file);
        return () => reader.abort(); // stop if the thumbnail is removed before it finishes loading
    }, [file]);

    return <Thumb src={url} onRemove={onRemove} disabled={disabled} />;
}

export default function PhotoPicker({ kept, files, onRemoveKept, onAddFiles, onRemoveFile, disabled }) {
    const inputRef = useRef(null);
    const [error, setError] = useState("");
    const count = kept.length + files.length;

    async function handlePick(e) {
        const picked = Array.from(e.target.files ?? []);
        e.target.value = ""; // allow picking the same file again
        setError("");

        const valid = picked.filter((f) => ALLOWED.includes(f.type));
        if (valid.length < picked.length) setError("Only JPG, PNG or WebP photos are allowed.");

        const room = MAX_PHOTOS - count;
        if (valid.length > room) setError(`You can attach up to ${MAX_PHOTOS} photos.`);

        const compressed = await Promise.all(valid.slice(0, Math.max(room, 0)).map((f) => compressImage(f)));
        if (compressed.length > 0) onAddFiles(compressed);
    }

    return (
        <div>
            <p className="text-sm font-medium text-heading">
                Photos <span className="font-normal text-gray-500">(optional, up to {MAX_PHOTOS})</span>
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
                {kept.map((img) => (
                    <Thumb key={`k-${img.id}`} src={img.imageUrl} onRemove={() => onRemoveKept(img.id)} disabled={disabled} />
                ))}
                {files.map((file, i) => (
                    <NewThumb key={`n-${file.name}-${file.lastModified}-${i}`} file={file} onRemove={() => onRemoveFile(i)} disabled={disabled} />
                ))}
                {count < MAX_PHOTOS && (
                    <li>
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => inputRef.current?.click()}
                            className="flex size-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-gray-400 text-xs text-gray-600 hover:border-accent-100 hover:text-accent-100 disabled:opacity-50"
                        >
                            <ImagePlus size={20} aria-hidden="true" />
                            Add
                        </button>
                    </li>
                )}
            </ul>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={handlePick} />
            {error && <p role="alert" className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}