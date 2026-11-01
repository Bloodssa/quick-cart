// Shrinks a photo to at most 1600px as JPEG before upload (phone photos are often 5-10 MB)
export async function compressImage(file, { maxSize = 1600, quality = 0.85 } = {}) {
    try {
        const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
        const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);

        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff"; // transparent PNGs would turn black as JPEG
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
        if (!blob || blob.size >= file.size) return file;
        return new File([blob], `${file.name.replace(/\.\w+$/, "")}.jpg`, { type: "image/jpeg" });
    } catch {
        return file; // if the browser can't decode it, send it as it is and let the server judge
    }
}