import {
  InspectorField,
  InspectorInput,
  InspectorSelect,
} from "@/components/inspector";

export type LogoSource =
  | { kind: "asset"; name?: string }
  | { kind: "url"; src?: string; alt?: string };

export function normalizeLogo(v: any): LogoSource | undefined {
  if (!v || typeof v !== "object") return undefined;
  if (v.kind === "asset") return { kind: "asset", name: String(v.name ?? "") };
  if (v.kind === "url") return { kind: "url", src: String(v.src ?? ""), alt: String(v.alt ?? "") };
  if (typeof v.name === "string") return { kind: "asset", name: v.name };
  if (typeof v.src === "string") return { kind: "url", src: v.src, alt: String(v.alt ?? "") };
  return undefined;
}

export function LogoField({
  value,
  onChange,
  assetPlaceholder = "logo-name",
  urlPlaceholder = "https://...",
  altPlaceholder = "Logo",
}: {
  value: LogoSource | undefined;
  onChange: (next: LogoSource) => void;
  assetPlaceholder?: string;
  urlPlaceholder?: string;
  altPlaceholder?: string;
}) {
  const kind = value?.kind ?? "asset";

  return (
    <div className="space-y-1.5">
      <InspectorSelect
        value={kind}
        onChange={(v) => {
          const k = v as "asset" | "url";
          onChange(k === "asset" ? { kind: "asset", name: "" } : { kind: "url", src: "", alt: "" });
        }}
        options={[
          { value: "asset", label: "Asset name" },
          { value: "url", label: "URL" },
        ]}
      />

      {kind === "asset" ? (
        <InspectorInput
          value={(value as any)?.name ?? ""}
          onChange={(v) => onChange({ kind: "asset", name: v })}
          placeholder={assetPlaceholder}
        />
      ) : (
        <>
          <InspectorInput
            value={(value as any)?.src ?? ""}
            onChange={(v) => onChange({ kind: "url", src: v, alt: (value as any)?.alt ?? "" })}
            placeholder={urlPlaceholder}
          />
          <InspectorInput
            value={(value as any)?.alt ?? ""}
            onChange={(v) => onChange({ kind: "url", src: (value as any)?.src ?? "", alt: v })}
            placeholder={altPlaceholder}
          />
        </>
      )}
    </div>
  );
}
