"use client";

import { Dices, Monitor, RotateCcw, Save, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition, type CSSProperties } from "react";
import { saveGroupDesign, saveIssueDesign } from "@/actions/design";
import { TemplatePicker } from "@/components/issues/template-picker";
import { newspaperFonts } from "@/components/newspaper/fonts";
import { Newspaper } from "@/components/newspaper/newspaper";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import {
  allPhotos,
  DEFAULT_DESIGN,
  effectivePalette,
  paperPreviewStyle,
  randomDesign,
  type NewspaperDesign,
} from "@/lib/design";
import {
  FILTERS,
  FONT_PAIRS,
  PALETTES,
  PAPERS,
  SHAPES,
  optionName,
  TEMPLATE_DEFAULTS,
  type FilterId,
  type FontPairId,
  type PaletteId,
  type PaperId,
  type ShapeId,
} from "@/lib/design-options";
import { templateText } from "@/lib/issues";
import type { NewspaperData } from "@/lib/newspaper";
import type { TemplateId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Chips, ControlLabel, PanelSection, Tile, TileGrid, Toggle } from "./controls";
import { useLocale, useT } from "@/components/i18n";

const SAMPLE_PHOTO = "/demo/manzara.svg";

function PaletteSwatch({ palette }: { palette: { paper: string; ink: string; accent: string; accent2: string; highlight: string } }) {
  return (
    <span
      className="relative block h-12 overflow-hidden rounded-lg border border-black/10"
      style={{ background: palette.paper }}
      aria-hidden="true"
    >
      <span className="absolute left-2 top-2 h-1.5 w-8 rounded-full" style={{ background: palette.ink }} />
      <span className="absolute left-2 top-5 h-1 w-6 rounded-full opacity-60" style={{ background: palette.ink }} />
      <span className="absolute bottom-1.5 right-1.5 size-4 rounded-full" style={{ background: palette.accent }} />
      <span className="absolute bottom-1.5 right-6 size-4 rounded-full" style={{ background: palette.accent2 }} />
      <span className="absolute bottom-1.5 right-[2.6rem] size-4 rounded-full" style={{ background: palette.highlight }} />
    </span>
  );
}

export interface DesignStudioProps {
  mode: "issue" | "group" | "demo";
  targetId: string | null;
  initialTemplate: TemplateId;
  initialDesign: NewspaperDesign;
  data: NewspaperData;
  sampleNotice?: string | null;
  back?: { href: string; label: string };
  viewHref?: string;
}

export function DesignStudio({ mode, targetId, initialTemplate, initialDesign, data, sampleNotice, back, viewHref }: DesignStudioProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [template, setTemplate] = useState<TemplateId>(initialTemplate);
  const [design, setDesign] = useState<NewspaperDesign>(initialDesign);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify([initialTemplate, initialDesign]));
  const [alsoGroupDefault, setAlsoGroupDefault] = useState(false);
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const t = useT();
  const locale = useLocale();
  const name = (n: string) => optionName(n, locale);

  const dirty = JSON.stringify([template, design]) !== savedSnapshot;
  const defaults = TEMPLATE_DEFAULTS[template];
  const palette = effectivePalette(design, template);
  const photos = useMemo(() => allPhotos(data), [data]);

  function set<K extends keyof NewspaperDesign>(key: K, value: NewspaperDesign[K]) {
    setStatus(null);
    setDesign((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    if (!dirty || mode === "demo") return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, mode]);

  function save() {
    if (mode === "demo" || !targetId) return;
    setStatus(null);
    startTransition(async () => {
      const result =
        mode === "issue"
          ? await saveIssueDesign(targetId, template, design, alsoGroupDefault)
          : await saveGroupDesign(targetId, template, design);
      if (!result.ok) {
        setStatus({ tone: "error", text: result.error });
        return;
      }
      setSavedSnapshot(JSON.stringify([template, design]));
      setStatus({
        tone: "success",
        text:
          mode === "group"
            ? t("Kaydedildi! Bundan sonraki sayılar bu tasarımla başlayacak. 🎉", "Saved! Future issues will start with this design. 🎉")
            : alsoGroupDefault
              ? t("Kaydedildi ve grubun varsayılan tasarımı yapıldı! 🎉", "Saved and set as the group's default design! 🎉")
              : t("Kaydedildi! 🎉", "Saved! 🎉"),
      });
      router.refresh();
    });
  }

  const templateLabel = t("Şablonun", "Template's");
  const templateOption = { value: "template", label: templateLabel } as const;

  return (
    <div className={cn(newspaperFonts, "mx-auto w-full max-w-[100rem] px-3 py-6 sm:px-6 print:p-0")}>
      {/* Üst çubuk */}
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          {back ? (
            <Link href={back.href} className="text-sm font-bold text-ink-soft hover:text-ink">
              ← {back.label}
            </Link>
          ) : null}
          <h1 className="text-3xl font-semibold">🎨 {t("Gazete Tasarım Stüdyosu", "Newspaper Design Studio")}</h1>
          <p className="text-sm text-ink-soft">
            {mode === "group"
              ? t("Grubun varsayılan tasarımı: yeni sayılar bu görünümle başlar.", "The group's default design: new issues start with this look.")
              : mode === "issue"
                ? t(
                    "Bu sayının görünümü. Değişiklikler anında önizlenir; kaydedince herkes yeni hâlini görür.",
                    "This issue's look. Changes preview instantly; once you save, everyone sees the new version.",
                  )
                : t("Deneme modu: istediğin kadar oyna, hiçbir şey kaydedilmez.", "Playground mode: experiment as much as you like, nothing is saved.")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setDesign((prev) => randomDesign(prev))}>
            <Dices className="size-4" aria-hidden="true" /> {t("Bana sürpriz yap", "Surprise me")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatus(null);
              // Sadece görünüm sıfırlanır; yazdığın metinler ve kapak seçimi korunur.
              setDesign((prev) => ({
                ...DEFAULT_DESIGN,
                mastheadTitle: prev.mastheadTitle,
                tagline: prev.tagline,
                editorNote: prev.editorNote,
                editorSignature: prev.editorSignature,
                closingNote: prev.closingNote,
                cover: prev.cover,
              }));
            }}
          >
            <RotateCcw className="size-4" aria-hidden="true" /> {t("Görünümü sıfırla", "Reset look")}
          </Button>
          {mode === "demo" ? (
            <ButtonLink href="/kayit" size="sm">
              {t("Kendi gazeteni başlat", "Start your own newspaper")}
            </ButtonLink>
          ) : (
            <Button size="sm" onClick={save} disabled={pending || !dirty}>
              <Save className="size-4" aria-hidden="true" /> {pending ? t("Kaydediliyor…", "Saving…") : dirty ? t("Kaydet", "Save") : t("Kaydedildi", "Saved")}
            </Button>
          )}
        </div>
      </div>

      {status ? (
        <Alert tone={status.tone} className="no-print mb-4">
          {status.text}{" "}
          {status.tone === "success" && viewHref ? (
            <Link href={viewHref} className="underline">
              {t("Gazeteyi aç", "Open the newspaper")}
            </Link>
          ) : null}
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[23rem_minmax(0,1fr)] print:block">
        {/* Ayar paneli */}
        <aside
          id="ayarlar"
          className="no-print @container scroll-mt-4 space-y-3 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:pr-1"
        >
          {mode === "issue" ? (
            <label className="flex items-start gap-3 rounded-2xl bg-sage-soft p-4 text-sm">
              <input
                type="checkbox"
                checked={alsoGroupDefault}
                onChange={(e) => setAlsoGroupDefault(e.target.checked)}
                className="mt-0.5 size-4 accent-[#356a4f]"
              />
              <span>
                <span className="block font-bold text-sage-deep">{t("Grubun varsayılanı da olsun", "Also make it the group default")}</span>
                <span className="text-ink-soft">
                  {t("Sonraki sayılar bu tasarımla başlasın (editör notu hariç).", "Future issues start with this design (except the editor's note).")}
                </span>
              </span>
            </label>
          ) : null}

          <PanelSection title={`🗞️ ${t("Şablon", "Template")}`} defaultOpen>
            <TemplatePicker name="studio-template" value={template} onChange={setTemplate} compact />
            <p className="text-xs text-ink-soft">
              {t(
                `Aşağıdaki ayarlarda "Şablonun" seçeneği, ${templateText(template, locale).name} şablonunun kendi tercihini kullanır.`,
                `In the settings below, "Template's" uses the ${templateText(template, locale).name} template's own choice.`,
              )}
            </p>
          </PanelSection>

          <PanelSection title={`✍️ ${t("Başlık ve metinler", "Masthead and text")}`}>
            <div>
              <ControlLabel hint={t("Boş bırakırsan grubun adı yazar.", "Leave empty to use the group name.")}>{t("Gazetenin adı", "Newspaper name")}</ControlLabel>
              <Input value={design.mastheadTitle} maxLength={60} placeholder={data.groupName} onChange={(e) => set("mastheadTitle", e.target.value)} />
            </div>
            <div>
              <ControlLabel>{t("Slogan", "Tagline")}</ControlLabel>
              <Input value={design.tagline} maxLength={100} placeholder={locale === "en" ? defaults.taglineEn : defaults.tagline} onChange={(e) => set("tagline", e.target.value)} />
            </div>
            {mode === "group" ? (
              <p className="rounded-xl bg-sand/70 px-3 py-2 text-xs text-ink-soft">
                {t(
                  "Editörün notu her sayıya özeldir; onu sayının kendi tasarım stüdyosundan yazabilirsin.",
                  "The editor's note belongs to each issue; you can write it in that issue's design studio.",
                )}
              </p>
            ) : (
              <>
                <div>
                  <ControlLabel hint={t("Gazetenin başında, bu sayıya özel bir giriş yazısı.", "An introduction for this issue, at the top of the newspaper.")}>
                    {t("Editörün notu", "Editor's note")}
                  </ControlLabel>
                  <Textarea
                    value={design.editorNote}
                    maxLength={1500}
                    rows={4}
                    placeholder={t("Bu ay hepinizi çok özledim…", "I missed you all so much this month…")}
                    onChange={(e) => set("editorNote", e.target.value)}
                  />
                </div>
                <div>
                  <ControlLabel>{t("Editörün imzası", "Editor's signature")}</ControlLabel>
                  <Input value={design.editorSignature} maxLength={60} placeholder={t("Ayşe", "Alex")} onChange={(e) => set("editorSignature", e.target.value)} />
                </div>
              </>
            )}
            <div>
              <ControlLabel hint={t("Gazetenin sonunda, her sayıda tekrar edebilecek bir veda.", "A sign-off at the end of the newspaper that can repeat every issue.")}>
                {t("Kapanış notu", "Closing note")}
              </ControlLabel>
              <Textarea
                value={design.closingNote}
                maxLength={500}
                rows={2}
                placeholder={t("Bir sonraki buluşmaya kadar kendinize iyi bakın!", "Take care of yourselves until we meet again!")}
                onChange={(e) => set("closingNote", e.target.value)}
              />
            </div>
          </PanelSection>

          <PanelSection title={`🎨 ${t("Renkler", "Colours")}`}>
            <TileGrid label={t("Renk paleti", "Colour palette")}>
              <Tile selected={design.palette === "template"} onClick={() => set("palette", "template")} label={templateLabel}>
                <PaletteSwatch palette={PALETTES[defaults.palette]} />
              </Tile>
              {(Object.keys(PALETTES) as PaletteId[]).map((id) => (
                <Tile key={id} selected={design.palette === id} onClick={() => set("palette", id)} label={name(PALETTES[id].name)}>
                  <PaletteSwatch palette={PALETTES[id]} />
                </Tile>
              ))}
            </TileGrid>
            <div>
              <ControlLabel hint={t("Başlıklar ve etiketler için kendi rengini seç.", "Pick your own colour for headings and labels.")}>
                {t("Özel vurgu rengi", "Custom accent colour")}
              </ControlLabel>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label={t("Özel vurgu rengi", "Custom accent colour")}
                  value={design.accentColor || palette.accent}
                  onChange={(e) => set("accentColor", e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-white p-1"
                />
                {design.accentColor ? (
                  <Button variant="ghost" size="sm" onClick={() => set("accentColor", "")}>
                    {t("Paletinkine dön", "Use the palette's")}
                  </Button>
                ) : (
                  <span className="text-xs text-ink-soft">{t("Şu an paletin rengi kullanılıyor.", "Currently using the palette's colour.")}</span>
                )}
              </div>
            </div>
          </PanelSection>

          <PanelSection title={`🔤 ${t("Yazı tipi", "Typography")}`}>
            <TileGrid label={t("Başlık + metin eşleşmesi", "Heading + body pairing")}>
              {(["template", ...Object.keys(FONT_PAIRS)] as Array<FontPairId | "template">).map((id) => {
                const pair = FONT_PAIRS[id === "template" ? defaults.fontPair : id];
                return (
                  <Tile key={id} selected={design.fontPair === id} onClick={() => set("fontPair", id)} label={id === "template" ? templateLabel : name(pair.name)}>
                    <span className="flex h-12 flex-col items-center justify-center rounded-lg bg-white">
                      <span className="text-xl leading-none" style={{ fontFamily: pair.head, fontWeight: pair.headWeight }}>
                        Ağ
                      </span>
                      <span className="text-[0.65rem] leading-tight text-ink-soft" style={{ fontFamily: pair.body }}>
                        {t("şiir gibi", "like a poem")}
                      </span>
                    </span>
                  </Tile>
                );
              })}
            </TileGrid>
            <Chips
              label={t("Yazı boyutu", "Text size")}
              value={design.textSize}
              onChange={(v) => set("textSize", v)}
              options={[
                { value: "s", label: t("Küçük", "Small") },
                { value: "m", label: t("Orta", "Medium") },
                { value: "l", label: t("Büyük", "Large") },
              ]}
            />
          </PanelSection>

          <PanelSection title={`📄 ${t("Sayfa", "Page")}`}>
            <TileGrid label={t("Kâğıt dokusu", "Paper texture")}>
              {(["template", ...Object.keys(PAPERS)] as Array<PaperId | "template">).map((id) => (
                <Tile key={id} selected={design.paper === id} onClick={() => set("paper", id)} label={id === "template" ? templateLabel : name(PAPERS[id].name)}>
                  <span
                    className="block h-12 rounded-lg border border-black/10"
                    style={paperPreviewStyle(id === "template" ? defaults.paper : id, palette)}
                    aria-hidden="true"
                  />
                </Tile>
              ))}
            </TileGrid>
            <Chips
              label={t("Sütun sayısı", "Columns")}
              hint={t("Geniş ekranlarda. Telefonda her zaman tek sütun.", "On wide screens. Always one column on phones.")}
              value={design.columns}
              onChange={(v) => set("columns", v)}
              options={[templateOption, { value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3", label: "3" }]}
            />
            <Chips
              label={t("Boşluklar", "Spacing")}
              value={design.density}
              onChange={(v) => set("density", v)}
              options={[
                { value: "airy", label: t("Ferah", "Airy") },
                { value: "cozy", label: t("Dengeli", "Balanced") },
                { value: "compact", label: t("Sıkı", "Compact") },
              ]}
            />
            <Chips
              label={t("Başlık hizası", "Title alignment")}
              value={design.align}
              onChange={(v) => set("align", v)}
              options={[templateOption, { value: "center", label: t("Ortada", "Centred") }, { value: "left", label: t("Solda", "Left") }]}
            />
            <Chips
              label={t("Süslemeler", "Decorations")}
              hint={t("Bantlar, damgalar, çıkartmalar, dalgalar…", "Tape, stamps, stickers, waves…")}
              value={design.decorations}
              onChange={(v) => set("decorations", v)}
              options={[
                { value: "none", label: t("Yok", "None") },
                { value: "some", label: t("Biraz", "Some") },
                { value: "lots", label: t("Bol bol", "Lots") },
              ]}
            />
          </PanelSection>

          <PanelSection title={`📷 ${t("Fotoğraflar", "Photos")}`}>
            <TileGrid label={t("Filtre", "Filter")}>
              {(["template", ...Object.keys(FILTERS)] as Array<FilterId | "template">).map((id) => (
                <Tile
                  key={id}
                  selected={design.photoFilter === id}
                  onClick={() => set("photoFilter", id)}
                  label={id === "template" ? templateLabel : name(FILTERS[id].name)}
                >
                  <img
                    src={SAMPLE_PHOTO}
                    alt=""
                    className="h-12 w-full rounded-lg object-cover"
                    style={{ filter: FILTERS[id === "template" ? defaults.photoFilter : id].css }}
                  />
                </Tile>
              ))}
            </TileGrid>
            <TileGrid label={t("Çerçeve", "Frame")}>
              {(["template", ...Object.keys(SHAPES)] as Array<ShapeId | "template">).map((id) => {
                const shape = id === "template" ? defaults.photoShape : id;
                return (
                  <Tile key={id} selected={design.photoShape === id} onClick={() => set("photoShape", id)} label={id === "template" ? templateLabel : name(SHAPES[id].name)}>
                    <span className="flex h-12 items-center justify-center rounded-lg bg-sand/60" style={{ "--np-paper": "#f6ecdf" } as CSSProperties}>
                      <span
                        className={cn(
                          "block",
                          shape === "polaroid" && "np-shape-polaroid !p-1 !pb-2.5",
                          shape === "pul" && "np-shape-pul !border-4 !p-0.5",
                        )}
                      >
                        <img src={SAMPLE_PHOTO} alt="" className="h-8 w-10 object-cover" style={{ borderRadius: shape === "polaroid" || shape === "pul" ? 0 : SHAPES[shape].radius }} />
                      </span>
                    </span>
                  </Tile>
                );
              })}
            </TileGrid>
            <Chips
              label={t("Boyut", "Size")}
              value={design.photoSize}
              onChange={(v) => set("photoSize", v)}
              options={[
                { value: "s", label: t("Küçük", "Small") },
                { value: "m", label: t("Orta", "Medium") },
                { value: "l", label: t("Büyük", "Large") },
              ]}
            />
            <div>
              <ControlLabel
                hint={
                  photos.length
                    ? t("Gazetenin en başında büyük gösterilecek fotoğraf.", "The photo shown large at the top of the newspaper.")
                    : t("Gazete yayımlanınca fotoğraflardan birini seçebilirsin.", "Once the newspaper is published you can pick one of its photos.")
                }
              >
                {t("Kapak fotoğrafı", "Cover photo")}
              </ControlLabel>
              <div className="grid grid-cols-4 gap-1.5" role="group" aria-label={t("Kapak fotoğrafı", "Cover photo")}>
                <Tile selected={design.cover === "auto"} onClick={() => set("cover", "auto")} label={t("Otomatik", "Automatic")}>
                  <span className="flex h-12 items-center justify-center rounded-lg bg-sand text-lg" aria-hidden="true">
                    ✨
                  </span>
                </Tile>
                <Tile selected={design.cover === "none"} onClick={() => set("cover", "none")} label={t("Kapaksız", "No cover")}>
                  <span className="flex h-12 items-center justify-center rounded-lg bg-sand text-lg" aria-hidden="true">
                    🚫
                  </span>
                </Tile>
                {photos.slice(0, 18).map((m, i) => (
                  <Tile key={m.id} selected={design.cover === m.id} onClick={() => set("cover", m.id)} label={t(`${i + 1}. foto`, `Photo ${i + 1}`)}>
                    <img src={m.src ?? ""} alt="" className="h-12 w-full rounded-lg object-cover" />
                  </Tile>
                ))}
              </div>
            </div>
          </PanelSection>

          <PanelSection title={`🧩 ${t("Düzen", "Layout")}`}>
            <Chips
              label={t("Gazete nasıl dizilsin?", "How should the newspaper be arranged?")}
              value={design.arrangement}
              onChange={(v) => set("arrangement", v)}
              options={[
                { value: "question", label: t("Soru soru", "By question") },
                { value: "person", label: t("Kişi kişi", "By person") },
              ]}
              hint={t("Kişi kişi: herkesin kendi köşesi olur.", "By person: everyone gets their own column.")}
            />
            <Chips
              label={t("Yanıt sırası", "Answer order")}
              value={design.order}
              onChange={(v) => set("order", v)}
              options={[
                { value: "time", label: t("Yazılış sırası", "As written") },
                { value: "name", label: t("İsme göre", "By name") },
                { value: "shuffle", label: t("Karışık", "Shuffled") },
              ]}
            />
            <div className="space-y-3">
              <Toggle checked={design.dropCap} onChange={(v) => set("dropCap", v)} label={t("Büyük ilk harf", "Drop cap")} hint={t("Klasik gazetedeki gibi ilk harf iri olsun.", "A big first letter, like a classic newspaper.")} />
              <Toggle checked={design.showAvatars} onChange={(v) => set("showAvatars", v)} label={t("Profil fotoğrafları", "Profile pictures")} />
              <Toggle checked={design.showNumbers} onChange={(v) => set("showNumbers", v)} label={t("Soru numaraları", "Question numbers")} />
              <Toggle checked={design.showContributors} onChange={(v) => set("showContributors", v)} label={t("Yazanlar listesi", "List of contributors")} />
              <Toggle checked={design.showDate} onChange={(v) => set("showDate", v)} label={t("Tarih", "Date")} />
              <Toggle checked={design.showStats} onChange={(v) => set("showStats", v)} label={t("Sayılar (yazı, fotoğraf, video)", "Stats (stories, photos, videos)")} />
            </div>
          </PanelSection>
        </aside>

        {/* Canlı önizleme */}
        <section id="onizleme" aria-label={t("Canlı önizleme", "Live preview")} className="min-w-0 scroll-mt-4">
          <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2">
            <a href="#ayarlar" className="text-sm font-bold text-ink-soft hover:text-ink lg:hidden">
              ↑ {t("Ayarlara dön", "Back to settings")}
            </a>
            {sampleNotice ? <p className="rounded-full bg-mustard-soft px-3 py-1 text-xs font-bold text-mustard-ink">{sampleNotice}</p> : <span />}
            <div className="flex gap-1 rounded-full border border-line bg-paper p-1" role="group" aria-label={t("Önizleme boyutu", "Preview size")}>
              <button
                type="button"
                aria-pressed={device === "desktop"}
                onClick={() => setDevice("desktop")}
                className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold", device === "desktop" ? "bg-ink text-white" : "text-ink-soft")}
              >
                <Monitor className="size-3.5" aria-hidden="true" /> {t("Bilgisayar", "Desktop")}
              </button>
              <button
                type="button"
                aria-pressed={device === "phone"}
                onClick={() => setDevice("phone")}
                className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold", device === "phone" ? "bg-ink text-white" : "text-ink-soft")}
              >
                <Smartphone className="size-3.5" aria-hidden="true" /> {t("Telefon", "Phone")}
              </button>
            </div>
          </div>
          <div className={cn("transition-[max-width] duration-300 print:max-w-none", device === "phone" ? "mx-auto max-w-[390px]" : "max-w-none")}>
            <Newspaper data={data} template={template} design={design} locale={locale} />
          </div>
        </section>
      </div>

      {/* Telefonda panel uzun; önizlemeye tek dokunuşla atla. */}
      <a
        href="#onizleme"
        className="no-print fixed bottom-4 right-4 z-20 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white shadow-lift lg:hidden"
      >
        👀 {t("Önizleme", "Preview")}
      </a>
    </div>
  );
}
