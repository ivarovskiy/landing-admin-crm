import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const roles = ['admin', 'editor', 'viewer'] as const;

  for (const key of roles) {
    await prisma.role.upsert({
      where: { key },
      create: { key },
      update: {},
    });
  }

  const email = process.env.ADMIN_EMAIL || 'admin@local.test';
  const password = process.env.ADMIN_PASSWORD || 'admin123456';

  const existing = await prisma.user.findUnique({ where: { email } });

  const user =
    existing ??
    (await prisma.user.create({
      data: {
        email,
        passwordHash: await argon2.hash(password),
        status: 'active',
      },
    }));

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { key: 'admin' } });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
    create: { userId: user.id, roleId: adminRole.id },
    update: {},
  });

  // ---- Seed Theme (published) ----
  const themeKey = 'default';

  const tokens: any = {
    // MVP tokens: це буде перетворюватись у CSS vars на фронті
    colors: {
      bg: "#FEFCE3",
      fg: "#1F0B14",
      primary: "#dd1c47",
      muted: "#7C4256",
      card: "#FFF9EF",
      line: "#dd1c47",
    },
    typography: {
      fontSans: "var(--font-maru), system-ui, -apple-system, Segoe UI, Roboto, Arial",
      fontDisplay: "var(--font-display), system-ui, -apple-system, Segoe UI, Roboto, Arial",
    },
    radius: {
      sm: '8px',
      md: '12px',
      lg: '16px',
    },

  };

  await prisma.theme.upsert({
    where: { key: themeKey },
    create: {
      key: themeKey,
      tokens,
      status: 'published',
      publishedAt: new Date(),
    },
    update: {
      tokens,
      status: 'published',
      publishedAt: new Date(),
    },
  });


  const seedThemeOnly = process.env.SEED_THEME_ONLY === "1";
  if (seedThemeOnly) {
    console.log("Seeded theme only (SEED_THEME_ONLY=1)");
    return;
  }

  // ---- Seed Page: home (published) ----
  const homeSlug = 'home';
  const homeLocale = 'uk';

  const seo: any = {
    title: 'Business Landing (MVP)',
    description: 'Landing page rendered from Page Model (backend-driven)',
    og: {
      title: 'Business Landing',
      description: 'Backend-driven landing with blocks',
      type: 'website',
    },
  };

  const blocks: Array<{ type: string; variant: string; order: number; data: any }> = [
    {
      type: "header",
      variant: "v1",
      order: 1,
      data: {
        brand: { label: "IBC Ballet", href: "#top" },
        links: [
          { label: "About Us", href: "#about" },
          { label: "Faculty", href: "#faculty" },
          { label: "Masterclass Series", href: "#masterclasses" },
          { label: "Competitions", href: "#competitions" },
          { label: "Nutcracker 2025", href: "#nutcracker" },
          { label: "Performances", href: "#performances" },
          { label: "Merch", href: "#merch" },
          { label: "Contact Us", href: "#address" },
        ],
        mobile: {
          top: {
            phoneHref: "tel:+16108830878",
            emailHref: "mailto:simplydancepa@gmail.com",
          },
          masthead: {
            logo: { kind: "asset", name: "ibc-ballet-pre" },
            subText: "PRE-PROFESSIONAL",
            tagline:
              "ENHANCE\nYOUR TECHNIQUE,\nGET\nPERSONALIZED\nATTENTION\nAND\nSHINE ON STAGE",
          },
          portal: { label: "Parent Portal", href: "#" },
          menu: [
            { label: "About Us", href: "#about" },
            {
              label: "Faculty",
              href: "#faculty",
              children: [
                { label: "Artistic Director", href: "#artistic-director" },
                { label: "Ballet Master", href: "#ballet-master" },
                { label: "Teachers", href: "#teachers" },
              ],
            },
            { label: "Masterclass Series", href: "#masterclasses" },
            { label: "Competitions", href: "#competitions" },
            { label: "Nutcracker 2025", href: "#nutcracker" },
            { label: "Performances", href: "#performances" },
            { label: "Merch", href: "#merch" },
            { label: "Contact Us", href: "#address" },
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
              { label: "About Us", href: "#about" },
              {
                label: "Faculty",
                href: "#faculty",
                children: [
                  { label: "Artistic Director", href: "#artistic-director" },
                  { label: "Ballet Master", href: "#ballet-master" },
                  { label: "Teachers", href: "#teachers" },
                ],
              },
              { label: "Masterclass Series", href: "#masterclasses" },
              { label: "Competitions", href: "#competitions" },
            ],
            right: [
              { label: "Nutcracker 2025", href: "#nutcracker" },
              { label: "Performances", href: "#performances" },
              { label: "Merch", href: "#merch" },
              { label: "Contact Us", href: "#address" },
            ],
          },
        },
        _layout: { anchor: "top", container: "full" },
      },
    },

    {
      type: "hero",
      variant: "slider-v1",
      order: 2,
      data: {
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
          }
        ],
        options: { autoPlayMs: 0, showDots: true, showArrows: false },
        _layout: { anchor: "hero", container: "full" },
      },
    },

    {
      type: "features",
      variant: "v1",
      order: 3,
      data: {
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
        _layout: { anchor: "our-school", container: "full" },
      },
    },

    {
      type: "studio-address",
      variant: "v1",
      order: 4,
      data: {
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
        _layout: { anchor: "address", container: "full" },
      },
    },

    {
      type: "footer",
      variant: "v1",
      order: 5,
      data: {
        left: {
          href: "#top",
          logo: { kind: "asset", name: "ibc-logo-large" },
          logoText: "IBC BALLET",
          subText: "IBC BALLET PRE-PROFESSIONAL",
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
              { label: "Masterclass Series", href: "#masterclass" },
              { label: "Competition", href: "#competition" },
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
        right: {
          portal: { label: "Parent Portal", href: "#", icon: "lock" },
          promo: {
            label: "Check Out Our Children’s Website",
            href: "#",
            logo: { kind: "asset", name: "sds-logo-large" },
            logoText: "SIMPLY DANCE STUDIO",
            subText: "CHILDREN'S PROGRAMS",
          },
        },
        bottomText: "Copyright © 2026 Simply Dance Studio • All Rights Reserved",
        _layout: { anchor: "footer", container: "full" },
      },
    },
  ];

  // upsert page + replace blocks deterministically
  const existingPage = await prisma.page.findFirst({
    where: { slug: homeSlug, locale: homeLocale },
    select: { id: true },
  });

  if (!existingPage) {
    await prisma.page.create({
      data: {
        slug: homeSlug,
        locale: homeLocale,
        status: 'published',
        seo,
        publishedAt: new Date(),
        blocks: { create: blocks.map((b) => ({ ...b })) },
      },
    });
  } else {
    await prisma.$transaction([
      prisma.block.deleteMany({ where: { pageId: existingPage.id } }),
      prisma.page.update({
        where: { id: existingPage.id },
        data: {
          status: 'published',
          seo,
          publishedAt: new Date(),
          blocks: { create: blocks.map((b) => ({ ...b })) },
        },
      }),
    ]);
  }

  // ---- Seed Page: summer-program (published) ----
  const spSlug = "summer-program";
  const spBlocks: Array<{ type: string; variant: string; order: number; data: any }> = [
    {
      type: "header",
      variant: "v1",
      order: 1,
      data: {
        ...blocks[0].data,
      },
    },
    {
      type: "content-page",
      variant: "v1",
      order: 2,
      data: {
        kicker: "SUMMER PROGRAM",
        title: "NEW GUEST TEACHERS",
        subtitle: "Sign up by June 15",
        left: [
          {
            kind: "image",
            src: "https://placehold.co/684x414/png?text=+",
            alt: "Summer program",
            aspectRatio: "342 / 207",
            mobileOrder: 2,
            layout: { lg: { width: "342px" } },
          },
          {
            kind: "image",
            src: "https://placehold.co/684x660/png?text=+",
            alt: "Studio",
            aspectRatio: "342 / 330",
            mobileOrder: 3,
            layout: { lg: { width: "342px", offsetX: "73px", gapBefore: "29px" } },
          },
          {
            kind: "text",
            body: "Classical ballet is the basis of a good dance education. It provides the foundation for all other dance forms. It is the most demanding, most disciplined but also the most rewarding of forms.\n\nAccomplishing solid ballet foundation is crucial to becoming an outstanding dancer: classically trained dancers can later transfer their skills into jazz, modern dance, or any other dance form they might decide to pursue.",
            mobileOrder: 6,
            layout: { lg: { width: "392px", gapBefore: "27px" } },
          },
          {
            kind: "text",
            heading: "WE BELIEVE IN CLASSICAL BALLET TRAINING",
            body: "Classical ballet is the basis of a good dance education. It provides the foundation for all other dance forms. It is the most demanding, most disciplined but also the most rewarding of forms.\n\nAccomplishing solid ballet foundation is crucial to becoming an outstanding dancer: classically trained dancers can later transfer their skills into jazz, modern dance, or any other dance form they might decide to pursue.",
            mobileOrder: 7,
            layout: { lg: { width: "424px", gapBefore: "48px" } },
          },
        ],
        right: [
          {
            kind: "text",
            heading: "WE BELIEVE IN CLASSICAL BALLET TRAINING",
            body: "Classical ballet is the basis of a good dance education. It provides the foundation for all other dance forms. It is the most demanding, most disciplined but also the most rewarding of forms.\n\nAccomplishing solid ballet foundation is crucial to becoming an outstanding dancer: classically trained dancers can later transfer their skills into jazz, modern dance, or any other dance form they might decide to pursue.",
            mobileOrder: 1,
            layout: { lg: { width: "392px" } },
          },
          {
            kind: "image",
            src: "https://placehold.co/870x726/png?text=+",
            alt: "Performance",
            aspectRatio: "435 / 363",
            mobileOrder: 4,
            layout: { lg: { width: "435px", gapBefore: "34px" } },
          },
          {
            kind: "text",
            heading: "WE BELIEVE IN VAGANOVA METHOD",
            body: "We are a ballet academy dedicated to the education and development of classical ballet dancers in the method of training developed by Agrippina Vaganova, considered by many the greatest pedagogue of the 20th century. All our classes are taught by professionally trained dance and education specialists. Please take a minute to check out their bios to learn more.\n\nVaganova method is acknowledged all over the world as the foremost training syllabus of the classical ballet. It is an extraordinary system that allows to develop the knowledge of how one's body should be used in order to dance with expression, yet without injuries, like the best Russian and Ukrainian dancers do.",
            mobileOrder: 5,
            layout: { lg: { width: "435px", gapBefore: "33px" } },
          },
        ],
      }
    },
    {
      type: "footer",
      variant: "v1",
      order: 3,
      data: {
        ...blocks[blocks.length - 1].data,
      },
    },
  ];

  const existingSp = await prisma.page.findFirst({
    where: { slug: spSlug, locale: homeLocale },
    select: { id: true },
  });

  if (!existingSp) {
    await prisma.page.create({
      data: {
        slug: spSlug,
        locale: homeLocale,
        status: "published",
        seo: {
          title: "Summer Program — New Guest Teachers",
          description: "Sign up by June 15 for our summer ballet program.",
        },
        publishedAt: new Date(),
        blocks: { create: spBlocks.map((b) => ({ ...b })) },
      },
    });
  } else {
    await prisma.$transaction([
      prisma.block.deleteMany({ where: { pageId: existingSp.id } }),
      prisma.page.update({
        where: { id: existingSp.id },
        data: {
          status: "published",
          seo: {
            title: "Summer Program — New Guest Teachers",
            description: "Sign up by June 15 for our summer ballet program.",
          },
          publishedAt: new Date(),
          blocks: { create: spBlocks.map((b) => ({ ...b })) },
        },
      }),
    ]);
  }

  console.log(`Seeded roles + admin: ${email}`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
