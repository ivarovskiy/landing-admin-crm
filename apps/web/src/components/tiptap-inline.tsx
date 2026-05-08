"use client";

import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Underline } from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { TextAlign } from "@tiptap/extension-text-align";
import { useEffect, useCallback, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

// ── helpers ───────────────────────────────────────────────────────────────────

export function toHtml(value: string, multiline: boolean): string {
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
  strike: boolean;
  link: boolean;
  bulletList: boolean;
  orderedList: boolean;
  alignLeft: boolean;
  alignCenter: boolean;
  alignRight: boolean;
  multiline: boolean;
} | null;

type FloatingToolbarProps = {
  state: ToolbarState;
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onStrike: () => void;
  onLink: () => void;
  onCase: () => void;
  onBulletList: () => void;
  onOrderedList: () => void;
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
};

function Btn({
  label,
  active,
  handler,
  style: extraStyle,
}: {
  label: string;
  active: boolean;
  handler: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        handler();
      }}
      style={{
        minWidth: 28,
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
        padding: "0 4px",
        ...extraStyle,
      }}
    >
      {label}
    </button>
  );
}

const Sep = () => (
  <div
    style={{
      width: 1,
      height: 18,
      background: "rgba(255,255,255,0.12)",
      margin: "0 2px",
      flexShrink: 0,
    }}
  />
);

function FloatingToolbar({
  state,
  onBold,
  onItalic,
  onUnderline,
  onStrike,
  onLink,
  onCase,
  onBulletList,
  onOrderedList,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
}: FloatingToolbarProps) {
  if (!state) return null;

  const top = state.rect.top + window.scrollY - 44;
  const left = state.rect.left + window.scrollX + state.rect.width / 2;

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
        flexWrap: "wrap",
        maxWidth: 340,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Text marks */}
      <Btn label="B" active={state.bold} handler={onBold} style={{ fontWeight: 700 }} />
      <Btn label="I" active={state.italic} handler={onItalic} style={{ fontStyle: "italic" }} />
      <Btn label="U" active={state.underline} handler={onUnderline} style={{ textDecoration: "underline" }} />
      <Btn label="S" active={state.strike} handler={onStrike} style={{ textDecoration: "line-through" }} />

      <Sep />

      {/* Lists — only for multiline fields */}
      {state.multiline && (
        <>
          <Btn label="•—" active={state.bulletList} handler={onBulletList} style={{ fontSize: 11 }} />
          <Btn label="1." active={state.orderedList} handler={onOrderedList} style={{ fontSize: 11 }} />
          <Sep />
        </>
      )}

      {/* Link */}
      <Btn label="🔗" active={state.link} handler={onLink} style={{ fontSize: 13 }} />

      <Sep />

      {/* Text alignment — only for multiline fields */}
      {state.multiline && (
        <>
          <Btn label="≡L" active={state.alignLeft} handler={onAlignLeft} style={{ fontSize: 10, letterSpacing: "-0.3px" }} />
          <Btn label="≡C" active={state.alignCenter} handler={onAlignCenter} style={{ fontSize: 10, letterSpacing: "-0.3px" }} />
          <Btn label="≡R" active={state.alignRight} handler={onAlignRight} style={{ fontSize: 10, letterSpacing: "-0.3px" }} />
          <Sep />
        </>
      )}

      {/* Case cycle */}
      <Btn label="AA" active={false} handler={onCase} style={{ fontSize: 9, letterSpacing: "-0.5px", fontWeight: 600 }} />
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
  // Prevents onUpdate from firing during programmatic setContent calls
  const isSettingContent = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        code: false,
      }),
      Underline,
      TextStyle,
      TextAlign.configure({
        types: ["paragraph"],
        defaultAlignment: "",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "tt-link" },
      }),
    ],
    content: toHtml(value, multiline),
    onUpdate: ({ editor: e }) => {
      if (isSettingContent.current) return;
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

  // Track selection for floating toolbar
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
        strike: ctx.editor.isActive("strike"),
        link: ctx.editor.isActive("link"),
        bulletList: ctx.editor.isActive("bulletList"),
        orderedList: ctx.editor.isActive("orderedList"),
        alignLeft: ctx.editor.isActive({ textAlign: "left" }),
        alignCenter: ctx.editor.isActive({ textAlign: "center" }),
        alignRight: ctx.editor.isActive({ textAlign: "right" }),
        multiline,
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
        strike: editor.isActive("strike"),
        link: editor.isActive("link"),
        bulletList: editor.isActive("bulletList"),
        orderedList: editor.isActive("orderedList"),
        alignLeft: editor.isActive({ textAlign: "left" }),
        alignCenter: editor.isActive({ textAlign: "center" }),
        alignRight: editor.isActive({ textAlign: "right" }),
        multiline,
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
  }, [editor, multiline]);

  // Sync external value → editor (only when not focused, suppress onUpdate)
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const next = toHtml(value, multiline);
    if (editor.getHTML() !== next) {
      isSettingContent.current = true;
      editor.commands.setContent(next);
      isSettingContent.current = false;
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

  const toolbarVisible =
    activeMarks && toolbarState?.rect && toolbarState.rect.width > 0
      ? { ...activeMarks, rect: toolbarState.rect }
      : null;

  return (
    <div ref={containerRef} data-tiptap style={style}>
      <FloatingToolbar
        state={toolbarVisible}
        onBold={() => editor?.chain().focus().toggleBold().run()}
        onItalic={() => editor?.chain().focus().toggleItalic().run()}
        onUnderline={() => editor?.chain().focus().toggleUnderline().run()}
        onStrike={() => editor?.chain().focus().toggleStrike().run()}
        onLink={handleLink}
        onCase={handleCycleCase}
        onBulletList={() => editor?.chain().focus().toggleBulletList().run()}
        onOrderedList={() => editor?.chain().focus().toggleOrderedList().run()}
        onAlignLeft={() => editor?.chain().focus().setTextAlign("left").run()}
        onAlignCenter={() => editor?.chain().focus().setTextAlign("center").run()}
        onAlignRight={() => editor?.chain().focus().setTextAlign("right").run()}
      />
      <EditorContent editor={editor} className={className} />
    </div>
  );
}

// ── render helper (value → React nodes) ──────────────────────────────────────

export function renderRichText(value: string): React.ReactNode {
  if (!value) return null;
  if (value.trimStart().startsWith("<")) {
    return <span dangerouslySetInnerHTML={{ __html: value }} />;
  }
  return <>{value.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}</>;
}
