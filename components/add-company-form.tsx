"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { InlineAlert } from "@/components/inline-alert";
import {
  normalizeSystemUrl,
  readLogoFileAsDataUrl,
  saveCustomSystem,
} from "@/lib/custom-systems";

const fieldClass =
  "w-full rounded-lg border border-line bg-primary-soft px-3.5 py-2.5 text-sm text-primary outline-none transition placeholder:text-muted focus:border-brand-600 focus:ring-[3px] focus:ring-brand-600/15";

export function AddCompanyForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [logoName, setLogoName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onLogoChange(file: File | undefined) {
    if (!file) {
      setLogoPreview(null);
      setLogoDataUrl("");
      setLogoName("");
      return;
    }

    try {
      const dataUrl = await readLogoFileAsDataUrl(file);
      setLogoPreview(dataUrl);
      setLogoDataUrl(dataUrl);
      setLogoName(file.name);
      setError(null);
    } catch (err) {
      setLogoPreview(null);
      setLogoDataUrl("");
      setLogoName("");
      setError(err instanceof Error ? err.message : "Invalid logo file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const trimmedUrl = url.trim();

    if (!trimmedName) {
      setError("System name is required.");
      return;
    }

    if (!trimmedDescription) {
      setError("Description is required.");
      return;
    }

    if (!trimmedUrl) {
      setError("System URL is required.");
      return;
    }

    if (!logoDataUrl) {
      setError("Please upload a logo for this system.");
      return;
    }

    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeSystemUrl(trimmedUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid system URL.");
      return;
    }

    setSubmitting(true);

    try {
      saveCustomSystem({
        name: trimmedName,
        description: trimmedDescription,
        url: normalizedUrl,
        logoDataUrl,
      });
      sessionStorage.setItem("zl-system-added", "1");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to save the system. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-line bg-surface-elevated p-6 shadow-sm"
    >
      {error && (
        <InlineAlert variant="error" title="Could not save system">
          {error}
        </InlineAlert>
      )}

      <div>
        <label htmlFor="system-name" className="mb-1.5 block text-sm font-medium text-primary">
          System name
        </label>
        <input
          id="system-name"
          name="systemName"
          type="text"
          required
          autoComplete="off"
          placeholder="e.g. Regional Medical Waste"
          className={fieldClass}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div>
        <label
          htmlFor="system-description"
          className="mb-1.5 block text-sm font-medium text-primary"
        >
          Description
        </label>
        <textarea
          id="system-description"
          name="systemDescription"
          required
          rows={4}
          placeholder="Short summary shown on the dashboard card"
          className={`${fieldClass} resize-y min-h-[6rem]`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="system-url" className="mb-1.5 block text-sm font-medium text-primary">
          System URL
        </label>
        <input
          id="system-url"
          name="systemUrl"
          type="url"
          required
          autoComplete="url"
          inputMode="url"
          placeholder="https://app.example.com"
          className={fieldClass}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
        <p className="mt-1.5 text-xs text-muted">
          Where users go when they open this system from the dashboard (opens in a new tab).
        </p>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-primary">Logo</span>
        <p className="mb-3 text-xs text-muted">
          PNG, JPEG, WebP, or SVG. Maximum size 2 MB.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-primary-soft/40">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoPreview}
                alt="Logo preview"
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <span className="px-2 text-center text-xs text-muted">Preview</span>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <input
              ref={fileInputRef}
              id="system-logo"
              name="systemLogo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary-soft/80"
              onChange={(event) => void onLogoChange(event.target.files?.[0])}
            />
            {logoName && (
              <p className="text-xs text-muted">
                Selected: <span className="font-medium text-primary">{logoName}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-lg bg-brand-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:cursor-wait disabled:opacity-70"
        >
          {submitting ? "Saving…" : "Add system to dashboard"}
        </button>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-primary-muted transition hover:text-primary"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
