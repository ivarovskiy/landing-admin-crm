import { Container, Kicker, OutlineStampText, STAMP_SECTION_TITLE } from "@/components/landing/ui";
import { Icon } from "@/components/landing/icons";
import { normalizeTel } from "@/lib/section-utils";
import Image from "next/image";

type Social = { icon?: "instagram" | "facebook"; href?: string; label?: string };

export function StudioAddressV1({ data }: { data: any }) {
  const title = data?.title ?? "STUDIO ADDRESS";

  const map = data?.map ?? {};
  const addressLines: string[] = Array.isArray(data?.addressLines) ? data.addressLines : [];
  const notes: string[] = Array.isArray(data?.notes) ? data.notes : [];
  const socials: Social[] = Array.isArray(data?.socials) ? data.socials : [];

  const phone: string | undefined = data?.contacts?.phone;
  const email: string | undefined = data?.contacts?.email;

  const phoneHref: string | undefined =
    data?.contacts?.phoneHref ?? (phone ? `tel:${normalizeTel(phone)}` : undefined);

  const emailHref: string | undefined =
    data?.contacts?.emailHref ?? (email ? `mailto:${email}` : undefined);

  const hasEmbed = typeof map?.embedUrl === "string" && map.embedUrl.length > 0;
  const hasImage = typeof map?.imageSrc === "string" && map.imageSrc.length > 0;
  const mapLink = typeof map?.linkUrl === "string" && map.linkUrl.length > 0 ? map.linkUrl : undefined;

  return (
    <section className="studio-address-section">
      <Container>
        <div className="studio-address__title-wrap">
          <OutlineStampText
            className="studio-address__title"
            data-el="title"
            stamp={STAMP_SECTION_TITLE}
          >
            {title}
          </OutlineStampText>

          {data?.subtitle && data?.showSubtitle !== false ? (
            <p className="studio-address__subtitle" data-el="subtitle">
              {data.subtitle}
            </p>
          ) : null}
        </div>

        {/* Map */}
        <div className="studio-address__map-wrap" data-el="map-image">
          <div className="studio-address__map-container">
            <div className="studio-address__map-frame">
              {hasEmbed ? (
                <iframe
                  title={map?.alt ?? "Map"}
                  src={map.embedUrl}
                  className="studio-address__map-iframe"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : hasImage ? (
                mapLink ? (
                  <a href={mapLink} target="_blank" rel="noreferrer" className="studio-address__map-link">
                    <Image
                      src={map.imageSrc}
                      alt={map?.alt ?? ""}
                      fill
                      sizes="(max-width: 767px) 100vw, 830px"
                      style={{ objectFit: "cover" }}
                    />
                  </a>
                ) : (
                  <Image
                    src={map.imageSrc}
                    alt={map?.alt ?? ""}
                    fill
                    sizes="(max-width: 767px) 100vw, 830px"
                    style={{ objectFit: "cover" }}
                  />
                )
              ) : null}
            </div>
          </div>
        </div>

        {/* Under-map row */}
        <div className="studio-address__info">
          <div className="studio-address__row">
            {/* Address (left) */}
            {addressLines.length ? (
              <div className="studio-address__address">
                {addressLines.map((l, i) => (
                  <Kicker key={i} data-el={`address-${i}`}>{l}</Kicker>
                ))}
              </div>
            ) : (
              <div />
            )}

            {/* Socials (center) */}
            {socials.length ? (
              <div className="studio-address__socials">
                {socials.map((s, i) => (
                  <a
                    key={i}
                    href={s.href ?? "#"}
                    aria-label={s.label ?? "Social"}
                    data-el={`social-${i}`}
                    className="ds-icon-btn studio-address__social-link"
                    target={s.href?.startsWith("http") ? "_blank" : undefined}
                    rel={s.href?.startsWith("http") ? "noreferrer" : undefined}
                  >
                    <Icon name={s.icon ?? "instagram"} className="studio-address__social-icon" aria-hidden />
                  </a>
                ))}
              </div>
            ) : (
              <div />
            )}

            {/* Notes (right) — desktop only */}
            {notes.length ? (
              <div className="studio-address__notes">
                {notes.map((l, i) => (
                  <Kicker key={i} data-el={`note-${i}`}>{l}</Kicker>
                ))}
              </div>
            ) : (
              <div className="studio-address__notes-placeholder" />
            )}
          </div>

          {/* Phone / Email centered below */}
          <div className="studio-address__contacts">
            {phone && phoneHref ? (
              <a href={phoneHref} className="studio-address__contact-link" data-el="phone">
                <Icon name="phone" className="studio-address__contact-icon--phone" aria-hidden />
                <Kicker size="sm">{phone}</Kicker>
              </a>
            ) : null}

            {email && emailHref ? (
              <a href={emailHref} className="studio-address__contact-link studio-address__contact-link--mail" data-el="email">
                <Icon name="mail-dt" className="studio-address__contact-icon--mail" aria-hidden />
                <Kicker size="sm">{email}</Kicker>
              </a>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
