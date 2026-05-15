import { FileList } from "@/components/dashboard/FileList";
import { getUploadedFiles } from "@/lib/server-files";

export default async function MySheetsPage() {
  const { files, error } = await getUploadedFiles();

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c6f5b]">My Sheets</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em] text-[#171717]">
        Uploaded workbooks.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[#62584e]">
        Keep track of uploaded files, processing state, and the analysis context available to AI.
      </p>

      <FileList
        files={files}
        emptyTitle="No sheets yet."
        emptyDescription="Uploaded CSV files will appear here with their processing state and AI context."
        errorMessage={error}
        getFileHref={(file) => `/dashboard/my-sheets/${file.id}`}
      />
    </section>
  );
}
