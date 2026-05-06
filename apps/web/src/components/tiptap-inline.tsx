"use client";

import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Underline } from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { useEffect, useCallback, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

// ── helpers ───────────────────────────────────────────────────────────────────

function toHtml(value: string, multiline: boolean): string {
  if (!value) return "<p></p>";
  if (value.trimStart().startsWith("<")) return value;
  if (!multiline) return `<p>${value}</p>`;
  return value
    .split("\n\n")
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function cycleCase(text: string): string {
  const up = text.toUpperCase();
  const lo = text.toLowerCase();
  const title = text.replace(/\b\w/g, (c) => c.toUpperCase());
  if (text === up) return lo;
  if (text === lo) return title;
  return up;
}

// ── floating toolbar ──────────────────────────────────────────────────────────

type ToolbarState = {
  rect: DOMRect;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  link: boolean;
} | null;

function FloatingToolbar({
  state,
  onBold,
  onItalic,
  onUnderline,
  onLink,
  onCase,
}: {
  state: ToolbarState;
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onLink: () => void;
  onCase: () => void;
}) {
  if (!state) return null;

  const top = state.rect.top + window.scrollY - 44;
  const left = state.rect.left + window.scrollX + state.rect.width / 2;

  const btn = (
    label: string,
    active: boolean,
    handler: () => void,
    extraStyle?: CSSProperties,
  ) => (
    <button
      key={label}
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        handler();
      }}
      style={{
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 4,
        border: "none",
        background: active ? "rgba(99,102,241,0.35)" : "transparent",
        color: active ? "#a5b4fc" : "rgba(255,255,255,0.82)",
        cursor: "pointer",
        fontSize: 12,
        padding: 0,
        ...extraStyle,
      }}
    >
      {label}
    </button>
  );

  const sep = (
    <div
      style={{
        width: 1,
        height: 18,
        background: "rgba(255,255,255,0.1)",
        margin: "0 2px",
        flexShrink: 0,
      }}
    />
  );

  return createPortal(
    <div
      style={{
        position: "absolute",
        top,
        left,
        transform: "translateX(-50%)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        gap: 2,
        background: "#0f0f1a",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 7,
        padding: 3,
        boxShadow: "0 6px 24px rgba(0,0,0,0.55)",
        pointerEvents: "all",
      }}
      // prevent mousedown from blurring the editor
      onMouseDown={(e) => e.preventDefault()}
    >
      {btn("B", state.bold, onBold, { fontWeight: 700 })}
      {btn("I", state.italic, onItalic, { fontStyle: "italic" })}
      {btn("U", state.underline, onUnderline, { textDecoration: "underline" })}
      {sep}
      {btn("🔗", state.link, onLink, { fontSize: 13 })}
      {sep}
      {btn("AA", false, onCase, { fontSize: 9, letterSpacing: "-0.5px", fontWeight: 600 })}
    </div>,
    document.body,
  );
}

// ── main component ────────────────────────────────────────────────────────────

export function TipTapInline({
  value,
  onChange,
  multiline = true,
  className,
  style,
}: {
  value: string;
  onChange: (html: string) => void;
  multiline?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const [toolbarState, setToolbarState] = useState<ToolbarState>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bulletList: false,
        orderedList: false,
        codeBlock: false,
        horizontalRule: false,
        code: false,
      }),
      Underline,
      TextStyle,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "tt-link" },
      }),
    ],
    content: toHtml(value, multiline),
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      handleKeyDown(_view, event) {
        if (!multiline && event.key === "Enter") {
          event.preventDefault();
          return true;
        }
        return false;
      },
      attributes: {
        "data-tiptap-content": "true",
        spellcheck: "false",
      },
    },
    immediatelyRender: false,
  });

  // Track selection to show/hide floating toolbar
  const activeMarks = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return null;
      const { from, to } = ctx.editor.state.selection;
      if (from === to) return null;
      return {
        bold: ctx.editor.isActive("bold"),
        italic: ctx.editor.isActive("italic"),
        underline: ctx.editor.isActive("underline"),
        link: ctx.editor.isActive("link"),
      };
    },
  });

  useEffect(() => {
    if (!editor) return;

    const updateToolbar = () => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        setToolbarState(null);
        return;
      }
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) {
        setToolbarState(null);
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (!rect.width) {
        setToolbarState(null);
        return;
      }
      setToolbarState({
        rect,
        bold: editor.isActive("bold"),
        italic: editor.isActive("italic"),
        underline: editor.isActive("underline"),
        link: editor.isActive("link"),
      });
    };

    const hideToolbar = () => setToolbarState(null);

    editor.on("selectionUpdate", updateToolbar);
    editor.on("transaction", updateToolbar);
    editor.on("blur", hideToolbar);

    return () => {
      editor.off("selectionUpdate", updateToolbar);
      editor.off("transaction", updateToolbar);
      editor.off("blur", hideToolbar);
    };
  }, [editor]);

  // Sync external value changes (only when not focused)
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const next = toHtml(value, multiline);
    if (editor.getHTML() !== next) {
      editor.commands.setContent(next);
    }
  }, [value, editor, multiline]);

  const handleLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href ?? "";
    const url = window.prompt("URL:", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const handleCycleCase = useCallback(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const text = editor.state.doc.textBetween(from, to);
    const next = cycleCase(text);
    editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, next).run();
  }, [editor]);

  return (
    <div ref={containerRef} data-tiptap style={style}>
      <FloatingToolbar
        state={activeMarks ? { ...activeMarks, rect: toolbarState?.rect ?? new DOMRect() } : null}
        onBold={() => editor?.chain().focus().toggleBold().run()}
        onItalic={() => editor?.chain().focus().toggleItalic().run()}
        onUnderline={() => editor?.chain().focus().toggleUnderline().run()}
        onLink={handleLink}
        onCase={handleCycleCase}
      />
      <EditorContent editor={editor} className={className} />
    </div>
  );
}

// ── render helper (plain text → React nodes) ──────────────────────────────────

export function renderRichText(value: string): React.ReactNode {
  if (!value) return null;
  if (value.trimStart().startsWith("<")) {
    return <span dangerouslySetInnerHTML={{ __html: value }} />;
  }
  return <>{value.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}</>;
}
