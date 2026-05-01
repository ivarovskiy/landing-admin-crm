export type BlockDefinition = {
  key: string
  type: string
  variant: string
  label: string
  description?: string
  defaultData: Record<string, any>
}

export type BlockPreset = {
  key: string          // e.g. "header:v1:ibc-full"
  blockKey: string     // e.g. "header:v1"
  label: string
  description?: string
  data: Record<string, any>
}

export type PageTemplate = {
  key: string
  label: string
  description?: string
  blocks: Array<{ type: string; variant: string; data: Record<string, any> }>
}

export const BLOCK_LIBRARY: BlockDefinition[] = [
  {
    key: "header:v1",
    type: "header",
    variant: "v1",
    label: "Header (v1)",
    description: "Навбар: лого + меню + CTA (mobile drawer)",
    defaultData: {
      brand: { label: "IBC Ballet", href: "#top" },
      mobile: {
        top: {
          phoneHref: "tel:+16108830878",
          emailHref: "mailto:simplydancepa@gmail.com",
        },
        masthead: {
          logo: { kind: "asset", name: "ibc-ballet-pre" },
          tagline:
            "ENHANCE\nYOUR TECHNIQUE,\nGET\nPERSONALIZED ATTENTION\nAND\nSHINE ON STAGE",
        },
        portal: { label: "Parent Portal", href: "#" },
        menu: [
          {
            label: "About Us",
            href: "#about",
            children: [
              { label: "New Facility", href: "#new-facility" },
              { label: "Student Accomplishments", href: "#accomplishments" },
              { label: "Reviews", href: "#reviews" },
            ],
          },
          {
            label: "Faculty",
            href: "#faculty",
            children: [
              { label: "Artistic Director", href: "#artistic-director" },
              { label: "Ballet Master", href: "#ballet-master" },
              { label: "Teachers", href: "#teachers" },
            ],
          },
          {
            label: "Masterclass Series",
            href: "#masterclasses",
            children: [
              { label: "Info", href: "#masterclass-info" },
              { label: "Registration", href: "#masterclass-registration" },
              { label: "Faculty", href: "#masterclass-faculty" },
            ],
          },
          { label: "Competitions", href: "#competitions" },
          {
            label: "Nutcracker 2025 (15)",
            href: "#nutcracker",
            children: [
              { label: "Info", href: "#nutcracker-info" },
              { label: "Auditions", href: "#nutcracker-auditions" },
            ],
          },
          {
            label: "Performances",
            href: "#performances",
            children: [
              { label: "Nutcracker 2024", href: "#nutcracker-2024" },
              { label: "Showcase 2024", href: "#showcase-2024" },
              { label: "Spring Gala", href: "#spring-gala" },
            ],
          },
          { label: "Merch", href: "#merch" },
          { label: "Contact Us", href: "#address" },
          {
            label: "Summer Program (14)",
            href: "#summer",
            children: [
              { label: "Info", href: "#summer-info" },
              { label: "Auditions", href: "#summer-auditions" },
              { label: "Registration", href: "#summer-registration" },
            ],
          },
        ],
        promo: {
          label: "CHECK OUT",
          label2: "OUR",
          logo: { kind: "asset", name: "simply-dance" },
          logoText: "SIMPLY DANCE",
          subText: "CHILDREN'S PROGRAMS",
          href: "#",
        },
      },
      desktop: {
        phone: "(610) 883-0878",
        phoneHref: "tel:+16108830878",
        logo: { kind: "asset", name: "ibc-ballet-pre" },
        portal: { label: "Parent Portal", href: "#" },
        navigation: {
          left: [
            {
              label: "About Us",
              href: "#about",
              children: [
                { label: "New Facility", href: "#new-facility" },
                { label: "Student Accomplishments", href: "#accomplishments" },
                { label: "Reviews", href: "#reviews" },
              ],
            },
            {
              label: "Faculty",
              href: "#faculty",
              children: [
                { label: "Artistic Director", href: "#artistic-director" },
                { label: "Ballet Master", href: "#ballet-master" },
                { label: "Teachers", href: "#teachers" },
              ],
            },
            {
              label: "Masterclass Series",
              href: "#masterclasses",
              children: [
                { label: "Info", href: "#masterclass-info" },
                { label: "Registration", href: "#masterclass-registration" },
                { label: "Faculty", href: "#masterclass-faculty" },
              ],
            },
            { label: "Competitions", href: "#competitions" },
          ],
          right: [
            {
              label: "Nutcracker 2025 (15)",
              href: "#nutcracker",
              children: [
                { label: "Info", href: "#nutcracker-info" },
                { label: "Auditions", href: "#nutcracker-auditions" },
              ],
            },
            {
              label: "Performances",
              href: "#performances",
              children: [
                { label: "Nutcracker 2024", href: "#nutcracker-2024" },
                { label: "Showcase 2024", href: "#showcase-2024" },
                { label: "Spring Gala", href: "#spring-gala" },
              ],
            },
            { label: "Merch", href: "#merch" },
            { label: "Contact Us", href: "#address" },
          ],
        },
      },
    },
  },
  {
    key: "hero:slider-v1",
    type: "hero",
    variant: "slider-v1",
    label: "Hero Slider (v1)",
    description: "Слайдер: текст + зображення (mobile-first), з базовими dot controls",
    defaultData: {
      slides: [
        {
          id: "school-year",
          template: "copy-left-image-right",
          title: "SCHOOL YEAR\n2025-26",
          subtitle: "Registration Now Open",
          subtitleVariant: "plain",
          cta: { label: "Learn more", href: "#address" },
          media: {
            kind: "image",
            src: "https://placehold.co/900x900/png?text=+",
            alt: "Ballet",
            aspectRatio: "1/1",
            objectFit: "cover",
          },
          layout: {
            desktop: {
              gap: "42px",
              mediaWidth: "40%",
              textWidth: "92%",
              textAlign: "center",
              contentJustify: "center",
              titleSize: "clamp(54px, 5.5vw, 84px)",
              subtitleSize: "clamp(20px, 2vw, 30px)",
            },
            mobile: { imageFirst: false },
          },
        },
      ],
      options: {
        autoPlayMs: 0,
        showDots: true,
        showArrows: false,
      },
      _layout: {
        anchor: "hero",
        container: "full",
      },
    },
  },
  {
    key: "features:v1",
    type: "features",
    variant: "v1",
    label: "Features (Our School) (v1)",
    description: "Секція Our School: заголовок + підзаголовок + 3 фічі з іконками",
    defaultData: {
      title: "OUR SCHOOL",
      subtitle:
        "Join to enhance your technique, \nget personalized attention and shine on stage",
      items: [
        {
          title: "BRAND NEW\nFACILITY",
          text:
            "Three large studio spaces basking in natural sunlight, new spring Marley floors and great atmosphere all around.",
          icon: "ballet-bar",
          "_layout": { "hide": { "base": true } }
        },
        {
          title: "JUNIOR COMPANY\nAUDITIONS",
          text:
            "Two full-length ballets per year with opportunities to perform principal and soloist roles, working with guest choreographers.",
          icon: "ballet-shoes",
        },
        {
          title: "STUDENT\nACHIEVEMENTS",
          text:
            "Classical ballet is the basis of a good dance education. It provides the foundation for all other dance forms.",
          icon: "prize-cup",
          "_layout": { "hide": { "base": true } }
        },
      ],
      _layout: {
        anchor: "our-school",
        container: "full",
      },
    },
  },
  {
    key: "scrapbook:v1",
    type: "scrapbook",
    variant: "v1",
    label: "Scrapbook (v1)",
    description: "Фіксований scrapbook mosaic grid на 8 слотів",
    defaultData: {
      title: "SCRAPBOOK",
      items: [
        { src: "", alt: "Scrapbook image 1", href: "" },
        { src: "", alt: "Scrapbook image 2", href: "" },
        { src: "", alt: "Scrapbook image 3", href: "" },
        { src: "", alt: "Scrapbook image 4", href: "" },
        { src: "", alt: "Scrapbook image 5", href: "" },
        { src: "", alt: "Scrapbook image 6", href: "" },
        { src: "", alt: "Scrapbook image 7", href: "" },
        { src: "", alt: "Scrapbook image 8", href: "" },
      ],
      _layout: {
        anchor: "scrapbook",
        container: "full",
      },
    },
  },
  {
    key: "studio-address:v1",
    type: "studio-address",
    variant: "v1",
    label: "Studio Address (v1)",
    description: "Адреса студії: карта + адреса + соцмережі + контакти",
    defaultData: {
      title: "STUDIO ADDRESS",
      map: {
        embedUrl: "",
        imageSrc: "/maps/map_ibc.png",
        alt: "Studio location map",
        linkUrl: "https://www.google.com/maps?q=580+Lancaster+Ave+Malvern+PA+19455"
      },
      addressLines: ["580 LANCASTER AVE", "MALVERN, PA 19455"],
      notes: ["ACROSS FROM WAWA", "OFF LANCASTER AVE"],
      socials: [
        { icon: "instagram", href: "#", label: "Instagram" },
        { icon: "facebook", href: "#", label: "Facebook" },
      ],
      contacts: {
        phone: "(610) 883-0878",
        email: "SIMPLYDANCEPA@GMAIL.COM",
      },
      _layout: {
        anchor: "address",
        container: "full",
        // order НЕ задаємо тут — base беремо з DB order, md/lg тільки якщо треба override
      },
    },
  },
  {
    key: "footer:v1",
    type: "footer",
    variant: "v1",
    label: "Footer (v1)",
    description: "Нижній футер",
    defaultData: {
      left: {
        href: "#top",
        logo: { kind: "asset", name: "ibc-logo-large" },
        subText: "IBC BALLET PRE-PROFESSIONAL",
      },
      right: {
        promo: {
          href: "#",
          label: "Check Out Our Children's Website",
          logo: { kind: "asset", name: "sds-logo-large" },
          subText: "CHILDREN'S PROGRAMS"
        }
      },
      columns: [
        {
          links: [
            { label: "About Us", href: "#about" },
            { label: "Faculty", href: "#faculty" },
          ],
        },
        {
          links: [
            { label: "Masterclass Series", href: "#masterclasses" },
            { label: "Competitions", href: "#competitions" },
            { label: "Nutcracker 2024", href: "#nutcracker" },
          ],
        },
        {
          links: [
            { label: "Performances", href: "#performances" },
            { label: "Merch", href: "#merch" },
            { label: "Contact Us", href: "#address" },
          ],
        },
      ],
      bottomText: "Copyright © 2026 Simply Dance Studio • All Rights Reserved",
      _layout: {
        anchor: "footer",
        container: "full",
      },
    },
  },
  {
    key: "text-block:v1",
    type: "text-block",
    variant: "v1",
    label: "Text Block (v1)",
    description: "Простий текстовий блок: кікер + заголовок + текст + CTA",
    defaultData: {
      kicker: "",
      heading: "",
      body: "",
      cta: { label: "", href: "#" },
      align: "left",
      _layout: {
        anchor: "",
        container: "full",
      },
    },
  },
  {
    key: "doc-header:v1",
    type: "doc-header",
    variant: "v1",
    label: "Doc Header (v1)",
    description: "Заголовок документ-сторінки: кікер + stamp title + subtitle + divider",
    defaultData: {
      kicker: "Parent Portal",
      title: "New Student Memo",
      subtitle: "Welcome to Simply Dance!",
    },
  },
  {
    key: "doc-body:v1",
    type: "doc-body",
    variant: "v1",
    label: "Doc Body (v1)",
    description: "Тіло документ-сторінки: текстові секції ліворуч + зображення праворуч",
    defaultData: {
      sections: [
        { id: "s1", heading: "We Believe in Classical Ballet", body: "Classical ballet is the basis of a good dance education." },
      ],
      image: { src: "", alt: "" },
    },
  },
  {
    key: "scroll-story:v1",
    type: "scroll-story",
    variant: "v1",
    label: "Scroll Story (v1)",
    description: "Sticky-scroll layout: коротша колонка прилипає, довша скролиться",
    defaultData: {
      stickyTop: "0px",
      showProgress: false,
      left: [
        { kind: "image", src: "", alt: "" },
      ],
      right: [
        { kind: "text", heading: "SECTION TITLE", body: "First paragraph.\n\nSecond paragraph." },
      ],
    },
  },
  {
    key: "content-page:v1",
    type: "content-page",
    variant: "v1",
    label: "Content Page (v1)",
    description: "Контентна сторінка: кікер + заголовок + секції з текстом/зображеннями",
    defaultData: {
      kicker: "PROGRAM",
      title: "PAGE TITLE",
      subtitle: "Subtitle text here",
      cta: { label: "", href: "#" },
      left: [
        {
          kind: "image",
          src: "",
          alt: "",
          aspectRatio: "4/3",
          mobileOrder: 2,
          layout: { lg: { width: "340px" } },
        },
        {
          kind: "text",
          heading: "HEADING",
          body: "Body text here.",
          mobileOrder: 4,
          layout: { lg: { width: "420px", gapBefore: "32px" } },
        },
      ],
      right: [
        {
          kind: "text",
          heading: "HEADING",
          body: "Body text here.",
          mobileOrder: 1,
          layout: { lg: { width: "392px" } },
        },
        {
          kind: "image",
          src: "",
          alt: "",
          aspectRatio: "4/3",
          mobileOrder: 3,
          layout: { lg: { width: "435px", gapBefore: "32px" } },
        },
      ],
    },
  },
]

export const DEFAULT_BLOCK_KEY = "hero:slider-v1"

export function getBlockKey(type: string, variant: string) {
  return `${type}:${variant}`
}

export function findBlockDef(key: string) {
  return BLOCK_LIBRARY.find((b) => b.key === key)
}

/* ============================================================
   IBC shared data — reused across presets and page templates
   ============================================================ */

const IBC_HEADER_DATA = {
  brand: { label: "IBC Ballet", href: "#top" },
  mobile: {
    top: {
      phoneHref: "tel:+16108830878",
      emailHref: "mailto:simplydancepa@gmail.com",
    },
    masthead: {
      logo: { kind: "asset", name: "ibc-ballet-pre" },
      tagline: "ENHANCE\nYOUR TECHNIQUE,\nGET\nPERSONALIZED\nATTENTION\nAND\nSHINE ON STAGE",
    },
    portal: { label: "Parent Portal", href: "#" },
    menu: [
      { label: "About Us", href: "#about" },
      {
        label: "Faculty", href: "#faculty",
        children: [
          { label: "Artistic Director", href: "#artistic-director" },
          { label: "Ballet Master", href: "#ballet-master" },
          { label: "Teachers", href: "#teachers" },
        ],
      },
      {
        label: "Masterclass Series", href: "#masterclasses",
        children: [
          { label: "Info", href: "#masterclass-info" },
          { label: "Registry", href: "#masterclass-registry" },
          { label: "Faculty", href: "#masterclass-faculty" },
        ],
      },
      { label: "Competitions", href: "#competitions" },
      { label: "Nutcracker 2025", href: "#nutcracker" },
      {
        label: "Performances", href: "#performances",
        children: [
          { label: "Nutcracker 2024", href: "#nutcracker-2024" },
          { label: "Showcase 2024", href: "#showcase-2024" },
          { label: "Spring Gala", href: "#spring-gala" },
        ],
      },
      { label: "Merch", href: "#merch" },
      { label: "Contact Us", href: "#address" },
    ],
    promo: {
      label: "CHECK OUT", label2: "OUR",
      logo: { kind: "asset", name: "simply-dance" },
      logoText: "SIMPLY DANCE", subText: "CHILDREN'S PROGRAMS", href: "#",
    },
  },
  desktop: {
    phone: "(610) 883-0878",
    phoneHref: "tel:+16108830878",
    logo: { kind: "asset", name: "ibc-ballet-pre" },
    portal: { label: "Parent Portal", href: "#" },
    secondaryPortal: { label: "IBC Ballet Company", href: "#" },
    navigation: {
      left: [
        { label: "About Us", href: "#about" },
        {
          label: "Faculty", href: "#faculty",
          children: [
            { label: "Artistic Director", href: "#artistic-director" },
            { label: "Ballet Master", href: "#ballet-master" },
            { label: "Teachers", href: "#teachers" },
          ],
        },
        {
          label: "Masterclass Series", href: "#masterclasses",
          children: [
            { label: "Info", href: "#masterclass-info" },
            { label: "Registry", href: "#masterclass-registry" },
            { label: "Faculty", href: "#masterclass-faculty" },
          ],
        },
        { label: "Competitions", href: "#competitions" },
      ],
      right: [
        { label: "Nutcracker 2025", href: "#nutcracker" },
        {
          label: "Performances", href: "#performances",
          children: [
            { label: "Nutcracker 2024", href: "#nutcracker-2024" },
            { label: "Showcase 2024", href: "#showcase-2024" },
            { label: "Spring Gala", href: "#spring-gala" },
          ],
        },
        { label: "Merch", href: "#merch" },
        { label: "Contact Us", href: "#address" },
      ],
    },
  },
  _layout: { anchor: "top", container: "full" },
}

const IBC_FOOTER_DATA = {
  left: {
    href: "#top",
    logo: { kind: "asset", name: "ibc-logo-large" },
    subText: "IBC BALLET PRE-PROFESSIONAL",
  },
  columns: [
    { links: [{ label: "About Us", href: "#about" }, { label: "Faculty", href: "#faculty" }] },
    { links: [{ label: "Masterclass Series", href: "#masterclass" }, { label: "Competition", href: "#competition" }, { label: "Nutcracker 2024", href: "#nutcracker" }] },
    { links: [{ label: "Performances", href: "#performances" }, { label: "Merch", href: "#merch" }, { label: "Contact Us", href: "#address" }] },
  ],
  right: {
    portal: { label: "Parent Portal", href: "#", icon: "lock" },
    promo: {
      label: "Check Out Our Children's Website",
      href: "#",
      logo: { kind: "asset", name: "sds-logo-large" },
      logoText: "SIMPLY DANCE STUDIO",
      subText: "CHILDREN'S PROGRAMS",
    },
  },
  bottomText: "Copyright © 2026 Simply Dance Studio • All Rights Reserved",
  _layout: { anchor: "footer", container: "full" },
}

const IBC_HERO_DATA = {
  slides: [
    {
      id: "school-year",
      template: "copy-left-image-right",
      title: "SCHOOL YEAR\n2025-26",
      subtitle: "Registration Now Open",
      subtitleVariant: "plain",
      cta: { label: "LEARN MORE", href: "/summer-program" },
      media: {
        kind: "image",
        src: "https://placehold.co/900x900/png?text=+",
        alt: "Ballet",
        aspectRatio: "1/1",
        objectFit: "cover",
      },
      layout: {
        desktop: {
          gap: "42px", mediaWidth: "40%", textWidth: "92%",
          textAlign: "center", contentJustify: "center",
          titleSize: "clamp(54px, 5.5vw, 84px)",
          subtitleSize: "clamp(20px, 2vw, 30px)",
        },
        mobile: { imageFirst: false },
      },
    },
    {
      id: "2026",
      template: "full-image",
      title: "2026",
      media: {
        kind: "image",
        src: "https://placehold.co/1440x700/png?text=+",
        alt: "2026",
        aspectRatio: "1320/700",
        objectFit: "cover",
      },
    },
  ],
  options: { autoPlayMs: 0, showDots: true, showArrows: false },
  _layout: { anchor: "hero", container: "full" },
}

const IBC_FEATURES_DATA = {
  title: "OUR SCHOOL",
  subtitle: "Join to enhance your technique,\nget personalized attention and shine on stage",
  items: [
    { title: "BRAND NEW\nFACILITY", text: "Three large studio spaces basking in natural sunlight, new spring Marley floors and great atmosphere all around.", icon: "ballet-bar", _layout: { hide: { base: true } } },
    { title: "JUNIOR COMPANY\nAUDITIONS", text: "Two full-length ballets per year with opportunities to perform principal and soloist roles, working with guest choreographers.", icon: "ballet-shoes" },
    { title: "STUDENT\nACHIEVEMENTS", text: "Classical ballet is the basis of a good dance education. It provides the foundation for all other dance forms.", icon: "prize-cup", _layout: { hide: { base: true } } },
  ],
  _layout: { anchor: "our-school", container: "full" },
}

const IBC_ADDRESS_DATA = {
  title: "STUDIO ADDRESS",
  map: {
    embedUrl: "",
    imageSrc: "/maps/map_ibc.png",
    alt: "Studio location map",
    linkUrl: "https://www.google.com/maps?q=580+Lancaster+Ave+Malvern+PA+19455",
  },
  addressLines: ["580 LANCASTER AVE", "MALVERN, PA 19455"],
  notes: ["ACROSS FROM WAWA", "OFF LANCASTER AVE"],
  socials: [
    { icon: "instagram", href: "#", label: "Instagram" },
    { icon: "facebook", href: "#", label: "Facebook" },
  ],
  contacts: { phone: "(610) 883-0878", email: "SIMPLYDANCEPA@GMAIL.COM" },
  _layout: { anchor: "address", container: "full" },
}

/* ============================================================
   Block Presets — real IBC data, ready to use
   ============================================================ */

export const BLOCK_PRESETS: BlockPreset[] = [
  {
    key: "header:v1:ibc",
    blockKey: "header:v1",
    label: "IBC Ballet — Header",
    description: "Full nav: Faculty, Masterclass Series, Performances dropdowns",
    data: IBC_HEADER_DATA,
  },
  {
    key: "hero:slider-v1:ibc-home",
    blockKey: "hero:slider-v1",
    label: "IBC Ballet — Hero slider (home)",
    description: "School Year 2025-26 + full-image 2026 slides",
    data: IBC_HERO_DATA,
  },
  {
    key: "features:v1:ibc",
    blockKey: "features:v1",
    label: "IBC Ballet — Our School",
    description: "Brand New Facility · Junior Company · Student Achievements",
    data: IBC_FEATURES_DATA,
  },
  {
    key: "studio-address:v1:ibc",
    blockKey: "studio-address:v1",
    label: "IBC Ballet — Studio Address",
    description: "580 Lancaster Ave · Malvern PA · map + socials",
    data: IBC_ADDRESS_DATA,
  },
  {
    key: "footer:v1:ibc",
    blockKey: "footer:v1",
    label: "IBC Ballet — Footer",
    description: "Full footer with nav columns + Simply Dance promo",
    data: IBC_FOOTER_DATA,
  },
]

export function findBlockPreset(key: string) {
  return BLOCK_PRESETS.find((p) => p.key === key)
}

/* ============================================================
   Page Templates — full page block sets
   ============================================================ */

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    key: "blank",
    label: "Blank page",
    description: "Start from scratch — no blocks",
    blocks: [],
  },
  {
    key: "ibc-home",
    label: "IBC Ballet — Home",
    description: "Header + Hero slider + Our School + Studio Address + Footer",
    blocks: [
      { type: "header", variant: "v1", data: IBC_HEADER_DATA },
      { type: "hero", variant: "slider-v1", data: IBC_HERO_DATA },
      { type: "features", variant: "v1", data: IBC_FEATURES_DATA },
      { type: "studio-address", variant: "v1", data: IBC_ADDRESS_DATA },
      { type: "footer", variant: "v1", data: IBC_FOOTER_DATA },
    ],
  },
  {
    key: "ibc-content",
    label: "IBC Ballet — Content page",
    description: "Header + Content Page + Footer",
    blocks: [
      { type: "header", variant: "v1", data: IBC_HEADER_DATA },
      { type: "content-page", variant: "v1", data: { kicker: "PROGRAM", title: "PAGE TITLE", subtitle: "", left: [], right: [] } },
      { type: "footer", variant: "v1", data: IBC_FOOTER_DATA },
    ],
  },
  {
    key: "ibc-doc-page",
    label: "IBC Ballet — Document page",
    description: "Header + Doc Header + Doc Body + Footer",
    blocks: [
      { type: "header", variant: "v1", data: IBC_HEADER_DATA },
      { type: "doc-header", variant: "v1", data: { kicker: "Parent Portal", title: "New Student Memo", subtitle: "Welcome to Simply Dance!" } },
      { type: "doc-body", variant: "v1", data: { sections: [{ id: "s1", heading: "", body: "" }], image: { src: "", alt: "" } } },
      { type: "footer", variant: "v1", data: IBC_FOOTER_DATA },
    ],
  },
  {
    key: "header-footer",
    label: "Header + Footer only",
    description: "IBC header and footer, empty middle",
    blocks: [
      { type: "header", variant: "v1", data: IBC_HEADER_DATA },
      { type: "footer", variant: "v1", data: IBC_FOOTER_DATA },
    ],
  },
]

export function findPageTemplate(key: string) {
  return PAGE_TEMPLATES.find((t) => t.key === key)
}