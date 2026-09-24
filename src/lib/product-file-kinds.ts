// The files a product can carry in R2. Shared by the admin UI and the upload
// routes (no server imports here), so both check the same types and limits.
//
// - download: the paid file, served only to verified buyers.
// - preview:  an optional free sample anyone can open from the product page.

export type ProductFileKind = "download" | "preview";

export const PRODUCT_FILE_KINDS: Record<
  ProductFileKind,
  {
    label: string;
    maxBytes: number;
    // MIME type → file extension used for the object key.
    contentTypes: Record<string, string>;
    // Folder under products/<id>/ — keeps each kind's keys apart.
    folder: string;
  }
> = {
  download: {
    label: "Product file",
    maxBytes: 500 * 1024 * 1024,
    contentTypes: {
      "application/pdf": "pdf",
      "application/epub+zip": "epub",
      "application/zip": "zip",
      "application/x-zip-compressed": "zip",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
      "application/vnd.ms-excel": "xls",
      "application/vnd.ms-excel.sheet.macroEnabled.12": "xlsm",
      "text/csv": "csv",
    },
    folder: "files",
  },
  preview: {
    label: "Preview file",
    maxBytes: 50 * 1024 * 1024,
    contentTypes: {
      "application/pdf": "pdf",
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
    },
    folder: "previews",
  },
};

export function isProductFileKind(value: unknown): value is ProductFileKind {
  return value === "download" || value === "preview";
}

export function productFileKeyPrefix(productId: string, kind: ProductFileKind) {
  return `products/${productId}/${PRODUCT_FILE_KINDS[kind].folder}/`;
}

/** Some OSes report no MIME type for .zip/.xlsx/.epub — fall back to the extension. */
export function contentTypeFor(kind: ProductFileKind, file: { name: string; type: string }) {
  const types = PRODUCT_FILE_KINDS[kind].contentTypes;
  if (file.type && types[file.type]) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return Object.entries(types).find(([, ext]) => ext === extension)?.[0] ?? file.type;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export type StoredProductFile = { key: string; name: string; size: number; uploadedAt: string };

/** The product columns for one kind of file, ready for a DB update (null clears them). */
export function productFileColumns(kind: ProductFileKind, file: StoredProductFile | null) {
  return kind === "download"
    ? {
        digitalFileKey: file?.key ?? null,
        digitalFileName: file?.name ?? null,
        digitalFileSize: file?.size ?? null,
        digitalFileUploadedAt: file?.uploadedAt ?? null,
      }
    : {
        previewFileKey: file?.key ?? null,
        previewFileName: file?.name ?? null,
        previewFileSize: file?.size ?? null,
        previewFileUploadedAt: file?.uploadedAt ?? null,
      };
}

export function productFileKey(
  product: { digitalFileKey: string | null; previewFileKey: string | null },
  kind: ProductFileKind
) {
  return kind === "download" ? product.digitalFileKey : product.previewFileKey;
}
