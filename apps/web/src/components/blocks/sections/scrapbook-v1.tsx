import { TipTapInline, renderRichText } from "@/components/rich-text";
import { TYPO_PRESETS } from "@/lib/typo-presets";
import { Container, OutlineStampText } from "@/components/landing/ui";
import { MediaImage } from "@/components/media-image";
import { cn } from "@/lib/cn";

type ScrapbookItem = {
  src?: string;
  alt?: string;
  href?: string;
};

const SLOT_CLASSES = [
  "scrapbook__tile--1",
  "scrapbook__tile--2",
  "scrapbook__tile--3",
  "scrapbook__tile--4",
  "scrapbook__tile--5",
  "scrapbook__tile--6",
  "scrapbook__tile--7",
  "scrapbook__tile--8",
] as const;

function normalizeItems(raw: unknown): ScrapbookItem[] {
  const items = Array.isArray(raw) ? raw : [];

  return Array.from({ length: 8 }, (_, idx) => {
    const item = items[idx];
    if (!item || typeof item !== "object") return {};
    return item as ScrapbookItem;
  });
}

function ScrapbookTile({
  item,
  idx,
}: {
  item: ScrapbookItem;
  idx: number;
}) {
  const inner = item?.src ? (
    <MediaImage
      src={item.src}
      alt={item.alt ?? ""}
      sizes="(max-width: 767px) 50vw, 350px"
      style={{ width: "100%", height: "100%" }}
    />
  ) : (
    <div className="scrapbook__placeholder" aria-hidden="true" />
  );

  return (
    <div
      className={cn("scrapbook__tile", SLOT_CLASSES[idx])}
      data-el={`tile-${idx + 1}`}
    >
      {item?.href ? (
        <a href={item.href} className="scrapbook__tile-link">
          {inner}
        </a>
      ) : (
        <div className="scrapbook__tile-link">{inner}</div>
      )}
    </div>
  );
}

export function ScrapbookV1({
  data,
  editMode,
  onChange,
}: {
  data: any;
  editMode?: boolean;
  onChange?: (next: unknown) => void;
}) {
  const title = data?.title ?? "SCRAPBOOK";
  const items = normalizeItems(data?.items);

  const update = editMode && onChange
    ? (field: string, value: unknown) => onChange({ ...data, [field]: value })
    : null;

  return (
    <section className="scrapbook">
      <Container>
        <div className="scrapbook__title-wrap">
          <OutlineStampText
            as="h2"
            className="scrapbook__title"
            data-el="title"
            shadowContent={update ? renderRichText(title) : undefined}
          >
            {update ? (
              <TipTapInline
                value={title}
                onChange={(html) => update("title", html)}
                multiline={false}
                typoOptions={TYPO_PRESETS}
              />
            ) : title}
          </OutlineStampText>

          {(data?.subtitle && data?.showSubtitle !== false) || update ? (
            <p className="scrapbook__subtitle" data-el="subtitle">
              {update ? (
                <TipTapInline
                  value={data?.subtitle ?? ""}
                  onChange={(html) => update("subtitle", html)}
                  multiline={false}
                  typoOptions={TYPO_PRESETS}
                />
              ) : data.subtitle}
            </p>
          ) : null}
        </div>

        <div className="scrapbook__grid">
          {items.map((item, idx) => (
            <ScrapbookTile key={idx} item={item} idx={idx} />
          ))}
        </div>
      </Container>
    </section>
  );
}
