import { OutlineStampText, STAMP_HERO_TITLE } from "@/components/landing/ui";
import { MediaImage } from "@/components/media-image";
import ClipIcon from "@/assets/icons/clip.svg";

type NsmSection = {
  heading?: string;
  body?: string;
};

type NsmImage = {
  src?: string;
  alt?: string;
  animation?: "none" | "fade-in" | "slide-up";
  aspectRatio?: string;
  width?: string;
  height?: string;
};

type NsmClip = {
  src?: string;
  width?: string;
  height?: string;
  alt?: string;
};

export function NewStudentMemoV1({ data }: { data: any }) {
  const kicker = data?.kicker ?? "";
  const title = data?.title ?? "";
  const subtitle = data?.subtitle ?? "";
  const image = data?.image as NsmImage | undefined;
  const clip = data?.clip as NsmClip | undefined;
  const sections: NsmSection[] = Array.isArray(data?.sections) ? data.sections : [];

  const imageFrameClass = [
    "nsm__image-frame",
    image?.animation && image.animation !== "none"
      ? `nsm__image-frame--anim-${image.animation}`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const imageFrameStyle: React.CSSProperties = {};
  if (image?.aspectRatio) imageFrameStyle.aspectRatio = image.aspectRatio;
  if (image?.width) imageFrameStyle.width = image.width;
  if (image?.height) imageFrameStyle.height = image.height;

  const clipStyle: React.CSSProperties = {};
  if (clip?.width) clipStyle.width = clip.width;
  if (clip?.height) clipStyle.height = clip.height;

  return (
    <div className="nsm">
      <div className="ds-container">
        <header className="nsm__header">
          {kicker ? <p className="nsm__kicker">{kicker}</p> : null}
          {title ? (
            <OutlineStampText as="h1" stamp={STAMP_HERO_TITLE} className="nsm__title">
              {title}
            </OutlineStampText>
          ) : null}
          {subtitle ? <p className="nsm__subtitle">{subtitle}</p> : null}
        </header>

        <div className="nsm__body">
          <div className="nsm__text-col">
            {sections.map((section, i) => (
              <div key={i} className="nsm__section">
                {section.heading ? (
                  <h2 className="nsm__section-title">{section.heading}</h2>
                ) : null}
                {section.body
                  ? section.body.split("\n\n").map((para, j) => (
                      <p key={j} className="nsm__body-text">
                        {para}
                      </p>
                    ))
                  : null}
              </div>
            ))}
          </div>

          <div className="nsm__image-col">
            <div className={imageFrameClass} style={imageFrameStyle}>
              {/* Clip/paperclip icon */}
              <div className="nsm__clip" style={clipStyle} aria-hidden="true">
                {clip?.src ? (
                  <img src={clip.src} alt={clip.alt ?? ""} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <ClipIcon />
                )}
              </div>

              {image?.src ? (
                <MediaImage
                  src={image.src}
                  alt={image.alt ?? ""}
                  className="nsm__image"
                  sizes="(max-width: 767px) 100vw, 380px"
                />
              ) : (
                <div className="nsm__image-placeholder">Image</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
