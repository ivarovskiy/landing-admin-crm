"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";

export function InspectorRichText({
  value,
  onChange,
  placeholder,
  minRows = 2,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minRows?: number;
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Track the last HTML we emitted so we don't re-apply our own changes
  const selfEmitted = useRef<string>(value || "");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: value || "",
    onUpdate({ editor }) {
      const html = editor.getHTML();
      selfEmitted.current = html;
      onChangeRef.current(html);
    },
  });

  // Sync external value changes (e.g. Reset) without stomping on self-triggered updates
  useEffect(() => {
    if (!editor) return;
    const incoming = value || "";
    if (incoming !== selfEmitted.current) {
      selfEmitted.current = incoming;
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <div
      className="w-full rounded-md border border-border/70 bg-muted/80 px-3 py-2 text-[13px] leading-snug text-foreground focus-within:border-primary/70 focus-within:ring-1 focus-within:ring-ring/70 transition-colors"
      style={{ minHeight: `${minRows * 1.6 + 1}em` }}
    >
      <style>{`
        .inspector-rich-text .tiptap { outline: none; }
        .inspector-rich-text .tiptap p { margin: 0; }
        .inspector-rich-text .tiptap p + p { margin-top: 0.25em; }
        .inspector-rich-text .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: rgba(0,0,0,0.35);
          pointer-events: none;
          float: left;
          height: 0;
        }
      `}</style>
      <EditorContent editor={editor} className="inspector-rich-text" />
    </div>
  );
}
