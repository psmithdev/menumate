import React, { useRef, useState } from "react";

export type PhotoUploadProps = {
  onImageSelected: (file: File) => void;
};

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  onImageSelected,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      setPreviewUrl(null);
      return;
    }
    // Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB.");
      setPreviewUrl(null);
      return;
    }
    setError(null);
    setPreviewUrl(URL.createObjectURL(file));
    onImageSelected(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <button
        type="button"
        className="px-6 py-3 bg-orange-500 text-white rounded-lg shadow hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
        onClick={handleButtonClick}
      >
        Upload or Take Photo
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {previewUrl && (
        <div className="mt-4">
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-xs max-h-64 rounded shadow border"
          />
        </div>
      )}
    </div>
  );
};
