import { useCallback, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

const imageUploadEndpoint =
  import.meta.env.VITE_IMAGE_UPLOAD_URL ?? "https://zzirit.kr/api/v1/images";

export default function ImageUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setSelectedFile(file);
    setError(null);
    setUploadedUrl(null);
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      handleFiles(event.dataTransfer.files);
    },
    [handleFiles]
  );

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      handleFiles(event.target.files);
    },
    [handleFiles]
  );

  const onUpload = useCallback(async () => {
    if (!selectedFile) {
      setError("업로드할 이미지를 선택해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch(imageUploadEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `업로드 실패 (status ${response.status})`);
      }

      const result = await response.json();
      setUploadedUrl(result.url ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.";
      setError(message);
      setUploadedUrl(null);
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile]);

  const onBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <main className="landing">
      <section className="landing__section landing__section--glass uploader">
        <header className="landing__section-header">
          <div>
            <p className="landing__eyebrow">이미지 업로드</p>
            <h2>드래그 앤 드롭 혹은 파일 선택</h2>
          </div>
          <p className="landing__section-copy">
            파일을 드래그하거나 선택해서 업로드하면 공개 URL(`https://zzirit.kr/img/슬러그`)을 받습니다.
            업로드 완료 후 바로 이미지 미리보기를 확인하세요.
          </p>
        </header>

        <div
          className={`uploader__dropzone ${isDragging ? "uploader__dropzone--active" : ""}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="uploader__file-input"
            onChange={onFileChange}
          />
          <div className="uploader__prompt">
            <div className="uploader__icon" aria-hidden>
              ⇪
            </div>
            <p className="uploader__title">파일을 이 영역에 드래그하세요</p>
            <p className="uploader__subtitle">또는 아래 버튼으로 파일을 선택할 수 있습니다.</p>
            <div className="uploader__actions">
              <button className="button button--secondary" type="button" onClick={onBrowseClick}>
                파일 선택
              </button>
              <button
                className="button button--primary"
                type="button"
                onClick={onUpload}
                disabled={isUploading}
              >
                {isUploading ? "업로드 중..." : "업로드"}
              </button>
            </div>
            {selectedFile && (
              <p className="uploader__selected">
                선택된 파일: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </p>
            )}
          </div>
        </div>

        {error && <div className="uploader__alert uploader__alert--error">{error}</div>}

        {uploadedUrl && (
          <div className="uploader__result">
            <div className="uploader__alert uploader__alert--success">
              업로드 완료! 이미지 URL: <a href={uploadedUrl} target="_blank" rel="noreferrer">{uploadedUrl}</a>
            </div>
            <div className="uploader__preview">
              <img src={uploadedUrl} alt="업로드된 미리보기" />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
