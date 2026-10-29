import type { NewspaperData } from "@/lib/newspaper";
import type { TemplateId } from "@/lib/types";
import { ClassicNewspaper } from "./classic";
import { dmSerif, newsreader, patrickHand, playfair } from "./fonts";
import { MagazineNewspaper } from "./magazine";
import { ScrapbookNewspaper } from "./scrapbook";

export function Newspaper({ data, template }: { data: NewspaperData; template: TemplateId }) {
  return (
    <div className={`${playfair.variable} ${newsreader.variable} ${dmSerif.variable} ${patrickHand.variable}`}>
      {template === "classic" ? <ClassicNewspaper data={data} /> : null}
      {template === "magazine" ? <MagazineNewspaper data={data} /> : null}
      {template === "scrapbook" ? <ScrapbookNewspaper data={data} /> : null}
    </div>
  );
}
