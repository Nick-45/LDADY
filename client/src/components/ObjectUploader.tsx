import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient"; // make sure your supabase client is correctly exported

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  bucket: string; // Supabase bucket name
  path?: string; // optional path prefix in bucket
  onComplete?: (uploadedFiles: { name: string; path: string }[]) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB
  bucket,
  path = "",
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: ["image/*"], // only images
      },
      autoProceed: false,
    }).on("complete", async (result: UploadResult) => {
      const uploadedFiles: { name: string; path: string }[] = [];

      for (const file of result.successful) {
        try {
          const filePath = `${path}${file.name}`;
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file.data, { upsert: true });

          if (error) throw error;

          uploadedFiles.push({ name: file.name, path: data.path });
        } catch (err) {
          console.error("Supabase upload error:", err);
        }
      }

      if (uploadedFiles.length > 0) {
        onComplete?.(uploadedFiles);
      }

      setShowModal(false);
    })
  );

  return (
    <div>
      <Button
        type="button"
        onClick={() => setShowModal(true)}
        className={buttonClassName}
        data-testid="upload-button"
      >
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
      />
    </div>
  );
}
