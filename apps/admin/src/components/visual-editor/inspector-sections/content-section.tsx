"use client";

import type { EditableElement } from "../types";
import {
  InspectorSection,
  InspectorField,
  InspectorInput,
  InspectorTextarea,
  InspectorSelect,
} from "@/components/inspector";
import { Type } from "lucide-react";

export function ContentSection({
  element,
  onChange,
}: {
  element: EditableElement;
  onChange: (el: EditableElement) => void;
}) {
  switch (element.type) {
    case "text":
      return (
        <InspectorSection title="Content" icon={<Type className="h-3 w-3" />}>
          <InspectorField label="Text" stacked>
            <InspectorTextarea
              value={element.content.text ?? ""}
              onChange={(v) =>
                onChange({ ...element, content: { ...element.content, text: v } })
              }
              placeholder="Enter text..."
              rows={3}
            />
          </InspectorField>
        </InspectorSection>
      );

    case "image":
      return (
        <InspectorSection title="Content" icon={<Type className="h-3 w-3" />}>
          <InspectorField label="Source" stacked>
            <InspectorInput
              value={element.content.src ?? ""}
              onChange={(v) =>
                onChange({ ...element, content: { ...element.content, src: v } })
              }
              placeholder="https://... or asset name"
            />
          </InspectorField>
          <InspectorField label="Alt">
            <InspectorInput
              value={element.content.alt ?? ""}
              onChange={(v) =>
                onChange({ ...element, content: { ...element.content, alt: v } })
              }
              placeholder="Alt text"
            />
          </InspectorField>
          {element.content.href !== undefined && (
            <InspectorField label="Link">
              <InspectorInput
                value={element.content.href ?? ""}
                onChange={(v) =>
                  onChange({ ...element, content: { ...element.content, href: v } })
                }
                placeholder="https://..."
              />
            </InspectorField>
          )}
        </InspectorSection>
      );

    case "button":
      return (
        <InspectorSection title="Content" icon={<Type className="h-3 w-3" />}>
          <InspectorField label="Label">
            <InspectorInput
              value={element.content.label ?? ""}
              onChange={(v) =>
                onChange({ ...element, content: { ...element.content, label: v } })
              }
              placeholder="Button text"
            />
          </InspectorField>
          <InspectorField label="Href">
            <InspectorInput
              value={element.content.href ?? ""}
              onChange={(v) =>
                onChange({ ...element, content: { ...element.content, href: v } })
              }
              placeholder="#section or URL"
            />
          </InspectorField>
        </InspectorSection>
      );

    case "logo":
      return (
        <InspectorSection title="Content" icon={<Type className="h-3 w-3" />}>
          <InspectorField label="Kind">
            <InspectorSelect
              value={element.content.kind ?? "asset"}
              onChange={(v) =>
                onChange({
                  ...element,
                  content: {
                    ...element.content,
                    kind: v as "asset" | "url",
                  },
                })
              }
              options={[
                { value: "asset", label: "Asset name" },
                { value: "url", label: "URL" },
              ]}
            />
          </InspectorField>
          {(element.content.kind ?? "asset") === "asset" ? (
            <InspectorField label="Name">
              <InspectorInput
                value={element.content.name ?? ""}
                onChange={(v) =>
                  onChange({ ...element, content: { ...element.content, name: v } })
                }
                placeholder="logo-name"
              />
            </InspectorField>
          ) : (
            <>
              <InspectorField label="URL" stacked>
                <InspectorInput
                  value={element.content.src ?? ""}
                  onChange={(v) =>
                    onChange({ ...element, content: { ...element.content, src: v } })
                  }
                  placeholder="https://..."
                />
              </InspectorField>
              <InspectorField label="Alt">
                <InspectorInput
                  value={element.content.alt ?? ""}
                  onChange={(v) =>
                    onChange({ ...element, content: { ...element.content, alt: v } })
                  }
                  placeholder="Logo alt"
                />
              </InspectorField>
            </>
          )}
        </InspectorSection>
      );
  }
}
