"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Underline } from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { TextAlign } from "@tiptap/extension-text-align";
import { Mark, mergeAttributes } from "@tiptap/core";
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

// ── TypoMark — applies a CSS class inline to selected text ────────────────────
//
// Renders as <span class="typo-xxx" data-typo="typo-xxx">…</span>.
// The data-typo attr is used for round-trip parseHTML so the mark survives
// serialize→parse (HTML stored in DB → loaded back into editor).

const TypoMark = Mark.create({
  name: "typoClass",

  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-typo"),
        renderHTML: (attrs) =>
          attrs.class ? { class: attrs.class, "data-typo": attrs.class } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-typo]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

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
  title,
  style: extraStyle,
}: {
  label: string;
  active: boolean;
  handler: () => void;
  title?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      title={title}
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

  // position: fixed — viewport-relative, no scrollY needed, never drifts on scroll
  const toolbarH = 38;
  const gap = 8;
  const rawTop = state.rect.top - toolbarH - gap;
  const top = Math.max(8, rawTop);
  const left = Math.max(8, state.rect.left + state.rect.width / 2);

  return createPortal(
    <div
      style={{
        position: "fixed",
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
      <Btn label="B" title="Bold" active={state.bold} handler={onBold} style={{ fontWeight: 700 }} />
      <Btn label="I" title="Italic" active={state.italic} handler={onItalic} style={{ fontStyle: "italic" }} />
      <Btn label="U" title="Underline" active={state.underline} handler={onUnderline} style={{ textDecoration: "underline" }} />
      <Btn label="S" title="Strikethrough" active={state.strike} handler={onStrike} style={{ textDecoration: "line-through" }} />

      <Sep />

      {/* Lists — only for multiline fields */}
      {state.multiline && (
        <>
          <Btn label="•—" title="Bullet list" active={state.bulletList} handler={onBulletList} style={{ fontSize: 11 }} />
          <Btn label="1." title="Numbered list" active={state.orderedList} handler={onOrderedList} style={{ fontSize: 11 }} />
          <Sep />
        </>
      )}

      {/* Link */}
      <Btn label="🔗" title="Link" active={state.link} handler={onLink} style={{ fontSize: 13 }} />

      <Sep />

      {/* Text alignment — only for multiline fields */}
      {state.multiline && (
        <>
          <Btn label="≡L" title="Align left" active={state.alignLeft} handler={onAlignLeft} style={{ fontSize: 10, letterSpacing: "-0.3px" }} />
          <Btn label="≡C" title="Align center" active={state.alignCenter} handler={onAlignCenter} style={{ fontSize: 10, letterSpacing: "-0.3px" }} />
          <Btn label="≡R" title="Align right" active={state.alignRight} handler={onAlignRight} style={{ fontSize: 10, letterSpacing: "-0.3px" }} />
          <Sep />
        </>
      )}

      {/* Case cycle */}
      <Btn label="AA" title="Cycle case (UPPER / lower / Title)" active={false} handler={onCase} style={{ fontSize: 9, letterSpacing: "-0.5px", fontWeight: 600 }} />
    </div>,
    document.body,
  );
}

// ── TypoBar — permanent bar above the editor for typography presets ────────────
//
// • No text selected  → applies the chosen preset to ALL text in the block
// • Text selected     → applies only to the selected words
//
// The select element uses explicit system-font styles so it is never affected
// by whatever typo class the outer wrapper carries.

type EditorInstance = ReturnType<typeof useEditor>;

function TypoBar({
  editor,
  typoOptions,
  initialTypo,
}: {
  editor: EditorInstance;
  typoOptions: { value: string; label: string }[];
  initialTypo?: string;
}) {
  if (!editor) return null;

  const currentTypo = (editor.getAttributes("typoClass").class as string | null) ?? initialTypo ?? "";

  const applyTypo = (cls: string) => {
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;
    const markType = editor.schema.marks.typoClass;
    if (!markType) return;

    const { tr } = editor.state;
    if (cls) {
      const mark = markType.create({ class: cls });
      hasSelection
        ? tr.addMark(from, to, mark)
        : tr.addMark(0, editor.state.doc.content.size, mark);
    } else {
      hasSelection
        ? tr.removeMark(from, to, markType)
        : tr.removeMark(0, editor.state.doc.content.size, markType);
    }
    editor.view.dispatch(tr);
    editor.commands.focus();
  };

  return (
    <div
      contentEditable={false}
      style={{ marginBottom: 4, userSelect: "none" }}
    >
      <select
        value={currentTypo}
        onChange={(e) => applyTypo(e.target.value)}
        title="Typography preset — applies to selected text, or to the whole block if nothing is selected"
        style={{
          // Fully reset font so outer typo classes never bleed in
          font: "11px/1.4 system-ui, -apple-system, sans-serif",
          textTransform: "none",
          letterSpacing: "normal",
          color: "#333",
          WebkitTextStroke: "0",
          filter: "none",
          textShadow: "none",
          padding: "2px 4px",
          borderRadius: 4,
          border: "1px solid rgba(0,0,0,0.22)",
          background: "rgba(255,255,255,0.88)",
          cursor: "pointer",
          outline: "none",
          maxWidth: "180px",
        }}
      >
        {typoOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export function TipTapInline({
  value,
  onChange,
  multiline = true,
  className,
  style,
  typoClass,
  typoOptions,
}: {
  value: string;
  onChange: (html: string) => void;
  multiline?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Current block-level typo class. Used once on mount to migrate old content
   *  (applies as a TypoMark to all text if no marks exist yet). Also shown
   *  as the selected value in the TypoBar when cursor has no mark. */
  typoClass?: string;
  /** If provided, renders a TypoBar above the editor with these preset options. */
  typoOptions?: { value: string; label: string }[];
}) {
  const [toolbarState, setToolbarState] = useState<ToolbarState>(null);
  const isSettingContent = useRef(false);
  // Tracks whether user is mid-drag-selection — toolbar is hidden during drag
  const isDragging = useRef(false);
  // Capture typoClass at mount so migration runs exactly once
  const initialTypoRef = useRef(typoClass);

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
      TypoMark,
    ],
    content: toHtml(value, multiline),
    onUpdate: ({ editor: e }) => {
      if (isSettingContent.current) return;
      onChange(e.getHTML());
    },
    editorProps: {
      handleKeyDown(view, event) {
        if (!multiline && event.key === "Enter") {
          event.preventDefault();
          return true;
        }
        if (event.key === "Enter") {
          const { $from } = view.state.selection;
          // Inside a list item: let TipTap handle it (creates new list item)
          if ($from.parent.type.name === "listItem") return false;
          event.preventDefault();
          const br = view.state.schema.nodes.hardBreak;
          if (br) {
            view.dispatch(view.state.tr.replaceSelectionWith(br.create()).scrollIntoView());
          }
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

  // Migration: on editor mount, if a typoClass is set and the content has no
  // existing TypoMarks, apply the class as a mark to all text. This ensures
  // old content (stored before marks were introduced) renders consistently in
  // edit mode. Suppressed via isSettingContent so onChange doesn't fire.
  useEffect(() => {
    if (!editor || !initialTypoRef.current) return;
    let hasMark = false;
    editor.state.doc.descendants((node) => {
      if (!hasMark && node.isText && node.marks.some((m) => m.type.name === "typoClass")) {
        hasMark = true;
      }
    });
    if (hasMark) return;
    const markType = editor.schema.marks.typoClass;
    if (!markType) return;
    const size = editor.state.doc.content.size;
    if (size <= 0) return;
    const { tr } = editor.state;
    tr.addMark(0, size, markType.create({ class: initialTypoRef.current }));
    isSettingContent.current = true;
    editor.view.dispatch(tr);
    isSettingContent.current = false;
  }, [editor]); // intentionally [editor] only — migration runs once on mount

  // Computes and sets toolbar state from current editor selection.
  // Only called after selection settles (keyboard nav or pointerup).
  const computeToolbar = useCallback(() => {
    if (!editor) return;
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
  }, [editor, multiline]);

  useEffect(() => {
    if (!editor) return;

    const hideToolbar = () => setToolbarState(null);

    // Keyboard selection: selectionUpdate fires when not dragging
    const handleSelectionUpdate = () => {
      if (!isDragging.current) computeToolbar();
    };

    // Mouse drag: hide toolbar on pointerdown inside editor, show on pointerup
    const handlePointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-tiptap]")) {
        isDragging.current = true;
        setToolbarState(null);
      }
    };

    const handlePointerUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      // Defer so the browser has committed the final selection
      requestAnimationFrame(computeToolbar);
    };

    editor.on("selectionUpdate", handleSelectionUpdate);
    editor.on("blur", hideToolbar);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointerup", handlePointerUp);

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
      editor.off("blur", hideToolbar);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [editor, computeToolbar]);

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

  return (
    <div data-tiptap style={style}>
      {typoOptions && (
        <TypoBar editor={editor} typoOptions={typoOptions} initialTypo={typoClass} />
      )}
      <FloatingToolbar
        state={toolbarState}
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
