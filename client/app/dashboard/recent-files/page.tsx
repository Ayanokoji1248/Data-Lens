import { FileList } from "@/components/dashboard/FileList";
import { getUploadedFiles } from "@/lib/server-files";

export default async function RecentFilesPage() {
  const { files, error } = await getUploadedFiles();

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c6f5b]">
        Recent Files
      </p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em] text-[#171717]">
        Latest activity.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[#62584e]">
        Recent uploads and analysis state across your workspace.
      </p>

      <FileList
        files={files}
        emptyTitle="No recent files."
        emptyDescription="Upload activity will appear here after your first CSV is processed."
        errorMessage={error}
      />
    </section>
  );
}
