"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Underline } from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { TextAlign } from "@tiptap/extension-text-align";
import { Mark, mergeAttributes } from "@tiptap/core";
import { useEffect, useLayoutEffect, useCallback, useRef, useState, type CSSProperties } from "react";
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
  inList: boolean;
  alignLeft: boolean;
  alignCenter: boolean;
  alignRight: boolean;
  alignJustify: boolean;
  inBlockquote: boolean;
  typoClass: string;
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
  onAlignJustify: () => void;
  onBlockquote: () => void;
  onHR: () => void;
  onClearFormat: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  onThinSpace: () => void;
  typoOptions?: { value: string; label: string }[];
  onTypoChange?: (cls: string) => void;
  /** When provided, shown as the selected value in the typo dropdown (external state). */
  currentTypoClass?: string;
  /** Whether the font offset is currently applied to this block. */
  fontOffsetActive?: boolean;
  /** Called when user toggles the font offset button. Applies to the whole block, not inline. */
  onFontOffset?: () => void;
  /** When true, the font offset button is shown in the toolbar. */
  fontOffsetAvailable?: boolean;
  /** Called when the user picks an alignment — propagates to the element level (not just paragraph).
   *  undefined = reset (no explicit alignment). */
  onElementAlignChange?: (align: "left" | "center" | "right" | undefined) => void;
  /** Current element-level alignment (controls active state for align buttons). */
  elementAlign?: "left" | "center" | "right";
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
        minWidth: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 5,
        border: "none",
        background: active ? "rgba(99,102,241,0.35)" : "transparent",
        color: active ? "#a5b4fc" : "rgba(255,255,255,0.82)",
        cursor: "pointer",
        fontSize: 14,
        padding: "0 5px",
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
      height: 22,
      background: "rgba(255,255,255,0.12)",
      margin: "0 3px",
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
  onAlignJustify,
  onBlockquote,
  onHR,
  onClearFormat,
  onIndent,
  onOutdent,
  onThinSpace,
  typoOptions,
  onTypoChange,
  currentTypoClass,
  fontOffsetActive,
  onFontOffset,
  fontOffsetAvailable,
  onElementAlignChange,
  elementAlign,
}: FloatingToolbarProps) {
  if (!state) return null;

  const showAlignButtons = state.multiline || !!onElementAlignChange;
  const toolbarH = state.multiline ? 120 : showAlignButtons ? 80 : 56;
  const gap = 8;
  const rawTop = state.rect.top - toolbarH - gap;
  const top = Math.max(8, rawTop);
  const left = Math.max(8, state.rect.left + state.rect.width / 2);

  return createPortal(
    <div
      data-tt-toolbar
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
        borderRadius: 9,
        padding: 5,
        boxShadow: "0 6px 24px rgba(0,0,0,0.55)",
        pointerEvents: "all",
        flexWrap: "wrap",
        maxWidth: 460,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Typography preset select — shown first when available */}
      {typoOptions && onTypoChange && (
        <>
          <select
            value={currentTypoClass ?? state.typoClass}
            onChange={(e) => onTypoChange(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            title="Typography preset (applies to selected text)"
            style={{
              font: "11px/1.4 system-ui, -apple-system, sans-serif",
              color: "rgba(255,255,255,0.82)",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 4,
              padding: "2px 4px",
              cursor: "pointer",
              outline: "none",
              maxWidth: 150,
              WebkitTextStroke: "0",
              filter: "none",
              textShadow: "none",
              textTransform: "none",
              letterSpacing: "normal",
            }}
          >
            {typoOptions.map((o) => (
              <option key={o.value} value={o.value} style={{ background: "#1a1a2e", color: "#fff" }}>
                {o.label}
              </option>
            ))}
          </select>
          <Sep />
        </>
      )}

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
          {state.inList && (
            <>
              <Btn label="⇤" title="Outdent (decrease indent)" active={false} handler={onOutdent} style={{ fontSize: 13 }} />
              <Btn label="⇥" title="Indent (increase indent)" active={false} handler={onIndent} style={{ fontSize: 13 }} />
            </>
          )}
          <Sep />
        </>
      )}

      {/* Link */}
      <Btn label="🔗" title="Link" active={state.link} handler={onLink} style={{ fontSize: 13 }} />

      <Sep />

      {/* Text alignment — always shown when onElementAlignChange is provided (element-level),
          or for multiline fields (paragraph-level). Justify only for multiline. */}
      {showAlignButtons && (
        <>
          <Btn label="≡L" title="Align left"
            active={onElementAlignChange ? elementAlign === "left" : state.alignLeft}
            handler={onAlignLeft}
            style={{ fontSize: 10, letterSpacing: "-0.3px" }} />
          <Btn label="≡C" title="Align center"
            active={onElementAlignChange ? elementAlign === "center" : state.alignCenter}
            handler={onAlignCenter}
            style={{ fontSize: 10, letterSpacing: "-0.3px" }} />
          <Btn label="≡R" title="Align right"
            active={onElementAlignChange ? elementAlign === "right" : state.alignRight}
            handler={onAlignRight}
            style={{ fontSize: 10, letterSpacing: "-0.3px" }} />
          {state.multiline && (
            <Btn label="≡J" title="Justify" active={state.alignJustify} handler={onAlignJustify} style={{ fontSize: 10, letterSpacing: "-0.3px" }} />
          )}
          <Sep />
        </>
      )}

      {/* Block-level — multiline only */}
      {state.multiline && (
        <>
          <Btn label="❝" title="Blockquote" active={state.inBlockquote} handler={onBlockquote} style={{ fontSize: 13 }} />
          <Btn label="—" title="Horizontal rule" active={false} handler={onHR} style={{ fontSize: 13, fontWeight: 700 }} />
          <Sep />
        </>
      )}

      {/* Clear formatting */}
      <Btn label="Ix" title="Clear formatting" active={false} handler={onClearFormat} style={{ fontSize: 11, fontStyle: "italic" }} />

      <Sep />

      {/* Case cycle */}
      <Btn label="AA" title="Cycle case (UPPER / lower / Title)" active={false} handler={onCase} style={{ fontSize: 9, letterSpacing: "-0.5px", fontWeight: 600 }} />

      <Sep />

      {/* Thin space (U+2009) — narrow typographic space */}
      <Btn label="½·" title="Insert thin space (½ пробілу, U+2009)" active={false} handler={onThinSpace} style={{ fontSize: 10, letterSpacing: "-0.3px" }} />

      {/* Font offset toggle — whole-block padding, only for fonts with configured offset */}
      {fontOffsetAvailable && onFontOffset && (
        <>
          <Sep />
          <Btn label="↤" title="Apply font offset to this block" active={!!fontOffsetActive} handler={onFontOffset} style={{ fontSize: 13 }} />
        </>
      )}
    </div>,
    document.body,
  );
}

type EditorInstance = ReturnType<typeof useEditor>;

// Read the typo class actually present in the document (not cursor-dependent)
function getDocTypo(editor: NonNullable<EditorInstance>): string {
  const { from, to } = editor.state.selection;
  const hasSelection = from !== to;
  // With selection: return the mark on the selected text
  if (hasSelection) {
    return (editor.getAttributes("typoClass").class as string | null) ?? "";
  }
  // No selection: scan the document for the first typoClass mark
  let found = "";
  editor.state.doc.descendants((node) => {
    if (found) return false;
    if (node.isText) {
      const mark = node.marks.find((m) => m.type.name === "typoClass");
      if (mark) {
        found = (mark.attrs.class as string) ?? "";
        return false;
      }
    }
  });
  return found;
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
  onTypoChange,
  currentTypoClass,
  onElementTypoChange,
  showWordCount = false,
  fontOffsetEnabled,
  onFontOffsetToggle,
  currentFontHasOffset,
  onElementAlignChange,
  elementAlign,
}: {
  value: string;
  onChange?: (html: string) => void;
  multiline?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Current block-level typo class. Used once on mount to migrate old content
   *  (applies as a TypoMark to all text if no marks exist yet). */
  typoClass?: string;
  /** If provided, shows a typography preset select inside the floating toolbar. */
  typoOptions?: { value: string; label: string }[];
  /** When provided, replaces the internal mark-based handler — dropdown changes
   *  fire this instead of inserting an inline TypoMark (for external-state fields). */
  onTypoChange?: (cls: string) => void;
  /** Selected value shown in the typo dropdown when using external state. */
  currentTypoClass?: string;
  /** When provided, the typo dropdown propagates changes to the element-level typo
   *  (ElementStyle.typo) instead of applying inline marks. ElementStyle.typo drives
   *  marks via typoClass prop + useEffect, making it the single source of truth. */
  onElementTypoChange?: (cls: string) => void;
  /** Show word count below the editor (opt-in, default false). */
  showWordCount?: boolean;
  /** Whether the font offset is currently applied to this whole block. */
  fontOffsetEnabled?: boolean;
  /** Toggle the font offset on this block (fires externally; does not modify inline marks). */
  onFontOffsetToggle?: () => void;
  /** When true, the font offset button is shown in the toolbar. */
  currentFontHasOffset?: boolean;
  /** Called when the user picks an alignment — propagates to element-level positioning.
   *  undefined = reset (no explicit alignment). */
  onElementAlignChange?: (align: "left" | "center" | "right" | undefined) => void;
  /** Current element-level alignment (for active state in toolbar). */
  elementAlign?: "left" | "center" | "right";
}) {
  const [toolbarState, setToolbarState] = useState<ToolbarState>(null);
  const isSettingContent = useRef(false);
  // Tracks whether user is mid-drag-selection — toolbar is hidden during drag
  const isDragging = useRef(false);
  // Suppress selectionUpdate-triggered hide while interacting with toolbar
  // (e.g. native <select> dropdown steals focus briefly)
  const suppressHideUntil = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  // Capture typoClass at mount so migration runs exactly once
  const initialTypoRef = useRef(typoClass);
  // Track external typoClass changes to update marks when inspector changes the block typo
  const prevTypoClassRef = useRef(typoClass);
  const promotedTypoRef = useRef<string | null>(null);
  // Stable ref so effects can read the current value without being in deps
  const onElementTypoChangeRef = useRef(onElementTypoChange);

  const isEditable = !!onChange;

  const editor = useEditor({
    editable: isEditable,
    extensions: [
      StarterKit.configure({
        blockquote: {},
        codeBlock: false,
        horizontalRule: {},
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
      onChange?.(e.getHTML());
    },
    editorProps: {
      handleKeyDown(view, event) {
        if (!multiline && event.key === "Enter") {
          event.preventDefault();
          return true;
        }
        if (event.key === "Enter") {
          const { $from } = view.state.selection;
          // Inside a list item: let TipTap handle (creates new list item)
          if ($from.parent.type.name === "listItem") return false;

          event.preventDefault();
          const brType = view.state.schema.nodes.hardBreak;

          // Double Enter: previous node is a hardBreak → remove it and split paragraph
          if (brType && $from.nodeBefore?.type === brType) {
            const brPos = $from.pos - 1;
            const tr = view.state.tr.delete(brPos, brPos + 1).split(brPos);
            view.dispatch(tr.scrollIntoView());
            return true;
          }

          // Single Enter: insert hard line break
          if (brType) {
            view.dispatch(view.state.tr.replaceSelectionWith(brType.create()).scrollIntoView());
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

  useLayoutEffect(() => {
    onElementTypoChangeRef.current = onElementTypoChange;
  }, [onElementTypoChange]);

  // Migration: on editor mount, ensure typo marks are consistent with the current mode.
  // - External typo mode (onElementTypoChange provided): promote legacy inline
  //   typo marks to ElementStyle.typo, but do not strip marks on mount. Merely
  //   entering Text mode must be visually inert.
  // - Internal typo mode: apply element-level typoClass mark to all text if any mismatch.
  useLayoutEffect(() => {
    if (!editor) return;
    const markType = editor.schema.marks.typoClass;
    if (!markType) return;
    const size = editor.state.doc.content.size;
    if (size <= 0) return;

    if (onElementTypoChangeRef.current) {
      const inlineTypo = getDocTypo(editor);
      if (!initialTypoRef.current && inlineTypo) {
        promotedTypoRef.current = inlineTypo;
        onElementTypoChangeRef.current(inlineTypo);
      }
      return;
    }

    if (!initialTypoRef.current) return;
    // Check if every text node already has the correct mark — skip if already in sync
    let mismatch = false;
    editor.state.doc.descendants((node) => {
      if (mismatch || !node.isText) return;
      const mark = node.marks.find((m) => m.type.name === "typoClass");
      if (!mark || mark.attrs.class !== initialTypoRef.current) mismatch = true;
    });
    if (!mismatch) return;
    const { tr } = editor.state;
    tr.removeMark(0, size, markType);
    tr.addMark(0, size, markType.create({ class: initialTypoRef.current }));
    isSettingContent.current = true;
    editor.view.dispatch(tr);
    isSettingContent.current = false;
  }, [editor]); // intentionally [editor] only — runs once on mount

  // When the external typoClass prop changes (e.g. inspector changes the block typo),
  // strip all inline marks so the outer element's class drives the style (external mode),
  // or replace all marks (internal mode). onChange fires so stored HTML is updated.
  useLayoutEffect(() => {
    if (!editor) return;
    if (typoClass === prevTypoClassRef.current) return;
    prevTypoClassRef.current = typoClass;
    const markType = editor.schema.marks.typoClass;
    if (!markType) return;
    const size = editor.state.doc.content.size;
    if (size <= 0) return;
    if (onElementTypoChangeRef.current && promotedTypoRef.current === typoClass) {
      promotedTypoRef.current = null;
      return;
    }
    const { tr } = editor.state;
    tr.removeMark(0, size, markType);
    // Only re-add marks in internal mode; external mode uses outer element class
    if (typoClass && !onElementTypoChangeRef.current) tr.addMark(0, size, markType.create({ class: typoClass }));
    editor.view.dispatch(tr);
    // onChange fires via onUpdate so stored HTML is updated
  }, [editor, typoClass]);

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
    const root = rootRef.current;
    if (!root || !sel.anchorNode || !sel.focusNode || !root.contains(sel.anchorNode) || !root.contains(sel.focusNode)) {
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
      inList: editor.isActive("bulletList") || editor.isActive("orderedList"),
      alignLeft: editor.isActive({ textAlign: "left" }),
      alignCenter: editor.isActive({ textAlign: "center" }),
      alignRight: editor.isActive({ textAlign: "right" }),
      alignJustify: editor.isActive({ textAlign: "justify" }),
      inBlockquote: editor.isActive("blockquote"),
      typoClass: getDocTypo(editor),
      multiline,
    });
  }, [editor, multiline]);

  useEffect(() => {
    if (!editor) return;

    // Keyboard selection: selectionUpdate fires when not dragging
    const handleSelectionUpdate = () => {
      if (isDragging.current || Date.now() < suppressHideUntil.current) return;
      computeToolbar();
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      // Click inside the floating toolbar portal — suppress selection-update hide for 500ms
      if (target.closest("[data-tt-toolbar]")) {
        suppressHideUntil.current = Date.now() + 500;
        return;
      }
      if (rootRef.current?.contains(target)) {
        // Starting a new drag-selection inside the editor
        isDragging.current = true;
        setToolbarState(null);
      } else {
        // Clicked outside editor and toolbar — hide
        isDragging.current = false;
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
    // Re-check active marks after any content change (e.g. Bold toggle, typing)
    editor.on("update", computeToolbar);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointerup", handlePointerUp);

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
      editor.off("update", computeToolbar);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [editor, computeToolbar]);

  // Sync editable state when onChange changes (e.g. drag mode toggle)
  useEffect(() => {
    if (!editor) return;
    if (editor.isEditable !== isEditable) {
      editor.setEditable(isEditable);
      if (!isEditable) queueMicrotask(() => setToolbarState(null));
    }
  }, [editor, isEditable]);

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

  const handleThinSpace = useCallback(() => {
    editor?.chain().focus().insertContent(" ").run();
  }, [editor]);

  const handleApplyTypo = useCallback((cls: string) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;
    const markType = editor.schema.marks.typoClass;
    if (!markType) return;
    const { tr } = editor.state;
    if (cls) {
      const mark = markType.create({ class: cls });
      if (hasSelection) tr.addMark(from, to, mark);
      else tr.addMark(0, editor.state.doc.content.size, mark);
    } else {
      if (hasSelection) tr.removeMark(from, to, markType);
      else tr.removeMark(0, editor.state.doc.content.size, markType);
    }
    editor.view.dispatch(tr);
    editor.commands.focus();
  }, [editor]);

  const wordCount = editor
    ? editor.state.doc.textContent.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div data-tiptap ref={rootRef} style={style}>
      {editor ? (
        <>
          <FloatingToolbar
            state={toolbarState}
            onBold={() => editor.chain().focus().toggleBold().run()}
            onItalic={() => editor.chain().focus().toggleItalic().run()}
            onUnderline={() => editor.chain().focus().toggleUnderline().run()}
            onStrike={() => editor.chain().focus().toggleStrike().run()}
            onLink={handleLink}
            onCase={handleCycleCase}
            onBulletList={() => editor.chain().focus().toggleBulletList().run()}
            onOrderedList={() => editor.chain().focus().toggleOrderedList().run()}
            onAlignLeft={() => {
              if (onElementAlignChange) {
                // Suppress onChange so the stale HTML doesn't race with the element-level align update
                isSettingContent.current = true;
                editor.chain().focus().unsetTextAlign().run();
                isSettingContent.current = false;
                onElementAlignChange(elementAlign === "left" ? undefined : "left");
              } else {
                editor.chain().focus().setTextAlign("left").run();
              }
            }}
            onAlignCenter={() => {
              if (onElementAlignChange) {
                isSettingContent.current = true;
                editor.chain().focus().unsetTextAlign().run();
                isSettingContent.current = false;
                onElementAlignChange(elementAlign === "center" ? undefined : "center");
              } else {
                editor.chain().focus().setTextAlign("center").run();
              }
            }}
            onAlignRight={() => {
              if (onElementAlignChange) {
                isSettingContent.current = true;
                editor.chain().focus().unsetTextAlign().run();
                isSettingContent.current = false;
                onElementAlignChange(elementAlign === "right" ? undefined : "right");
              } else {
                editor.chain().focus().setTextAlign("right").run();
              }
            }}
            onAlignJustify={() => editor.chain().focus().setTextAlign("justify").run()}
            onBlockquote={() => editor.chain().focus().toggleBlockquote().run()}
            onHR={() => editor.chain().focus().setHorizontalRule().run()}
            onClearFormat={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            typoOptions={typoOptions}
            onTypoChange={onTypoChange ?? (onElementTypoChange ?? (typoOptions ? handleApplyTypo : undefined))}
            currentTypoClass={onElementTypoChange ? (typoClass ?? currentTypoClass) : currentTypoClass}
            onIndent={() => editor.chain().focus().sinkListItem("listItem").run()}
            onOutdent={() => editor.chain().focus().liftListItem("listItem").run()}
            onThinSpace={handleThinSpace}
            fontOffsetAvailable={currentFontHasOffset}
            fontOffsetActive={fontOffsetEnabled}
            onFontOffset={onFontOffsetToggle}
            onElementAlignChange={onElementAlignChange}
            elementAlign={elementAlign}
          />
          <EditorContent editor={editor} className={className} />
        </>
      ) : (
        <div data-tiptap-content="true" className={className} aria-hidden="true">
          {renderRichText(value)}
        </div>
      )}
      {multiline && showWordCount && (
        <div
          style={{
            marginTop: 4,
            fontSize: 10,
            color: "rgba(0,0,0,0.35)",
            userSelect: "none",
            lineHeight: 1,
          }}
        >
          {wordCount} {wordCount === 1 ? "word" : "words"}
        </div>
      )}
    </div>
  );
}

// ── render helper (value → React nodes) ──────────────────────────────────────

export function renderRichText(value: string): React.ReactNode {
  if (!value) return null;
  if (value.trimStart().startsWith("<")) {
    const html = value.replace(/<p><\/p>/g, "<p><br></p>");
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return <>{value.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}</>;
}
