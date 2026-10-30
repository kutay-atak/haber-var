import type { Locale } from "@/lib/i18n";
import { buildSections, DEFAULT_DESIGN, pickCover, resolveDesign, type NewspaperDesign } from "@/lib/design";
import type { NewspaperData } from "@/lib/newspaper";
import type { TemplateId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { newspaperFonts } from "./fonts";
import type { TemplateProps } from "./parts";
import { AlbumTemplate } from "./templates/album";
import { ClassicTemplate } from "./templates/classic";
import { LetterTemplate } from "./templates/letter";
import { MagazineTemplate } from "./templates/magazine";
import { MinimalTemplate } from "./templates/minimal";
import { NightTemplate } from "./templates/night";
import { RetroTemplate } from "./templates/retro";
import { ScrapbookTemplate } from "./templates/scrapbook";
import { TabloidTemplate } from "./templates/tabloid";

function TemplateBody({ template, ...props }: TemplateProps & { template: TemplateId }) {
  switch (template) {
    case "magazine":
      return <MagazineTemplate {...props} />;
    case "scrapbook":
      return <ScrapbookTemplate {...props} />;
    case "letter":
      return <LetterTemplate {...props} />;
    case "album":
      return <AlbumTemplate {...props} />;
    case "minimal":
      return <MinimalTemplate {...props} />;
    case "night":
      return <NightTemplate {...props} />;
    case "tabloid":
      return <TabloidTemplate {...props} />;
    case "retro":
      return <RetroTemplate {...props} />;
    default:
      return <ClassicTemplate {...props} />;
  }
}

/**
 * Gazetenin kendisi. Sunucuda (okuma sayfası) ve tarayıcıda (tasarım stüdyosunun
 * canlı önizlemesi) aynı şekilde çalışır.
 */
export function Newspaper({
  data,
  template,
  design = DEFAULT_DESIGN,
  locale = "tr",
  className,
}: {
  data: NewspaperData;
  template: TemplateId;
  design?: NewspaperDesign;
  locale?: Locale;
  className?: string;
}) {
  const d = resolveDesign(design, template, data.groupName, locale);
  return (
    <div className={newspaperFonts}>
      <article className={cn("np-root shadow-lift print:shadow-none", className)} style={d.style} data-template={template} lang={locale}>
        <TemplateBody template={template} data={data} sections={buildSections(data, d)} d={d} cover={pickCover(data, d)} />
      </article>
    </div>
  );
}
