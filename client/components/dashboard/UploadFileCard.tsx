"use client";

import { ChangeEvent, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

import { uploadRequest } from "@/lib/api";

type UploadResponse = {
  message: string;
  file: {
    name: string;
    contentType: string | null;
    size: number;
    status: string;
  };
  userId: number;
};

export function UploadFileCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const selectedFileName = selectedFile?.name ?? "";

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] ?? null);
    setStatusMessage("");
    setError("");
  }

  async function sendSelectedFile() {
    if (!selectedFile) {
      openFilePicker();
      return;
    }

    setError("");
    setStatusMessage("");
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const payload = await uploadRequest<UploadResponse>("/api/files/upload", formData);
      setStatusMessage(`${payload.file.name} is ${payload.file.status}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-dashed border-[#bfb5a8] bg-[#faf7f1]/90 px-5 py-12 text-center">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        className="sr-only"
        onChange={handleFileChange}
      />

      <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg border border-[#ded7cc] bg-[#fffdf8] text-[#57534e]">
        <UploadCloud className="h-6 w-6" strokeWidth={1.8} />
      </div>
      <p className="mt-4 text-sm font-semibold text-[#292524]">Drag and drop your spreadsheet</p>
      <p className="mt-1 text-sm text-[#78716c]">or choose a file from your computer</p>

      {selectedFileName ? (
        <p className="mx-auto mt-4 max-w-sm truncate rounded-lg border border-[#ded7cc] bg-[#fffdf8] px-3 py-2 text-sm font-medium text-[#57534e]">
          {selectedFileName}
        </p>
      ) : null}

      <button
        type="button"
        onClick={selectedFile ? sendSelectedFile : openFilePicker}
        disabled={isUploading}
        className="mt-5 h-10 rounded-lg bg-[#1f2937] px-4 text-sm font-semibold text-[#fbfaf7] hover:bg-[#111827] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isUploading ? "Sending..." : selectedFile ? "Send file" : "Choose file"}
      </button>

      {statusMessage ? (
        <p className="mt-4 text-sm font-medium text-[#346538]">{statusMessage}</p>
      ) : null}

      {error ? <p className="mt-4 text-sm font-medium text-[#9f2f2d]">{error}</p> : null}
    </div>
  );
}
