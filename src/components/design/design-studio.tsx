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
  TEMPLATE_DEFAULTS,
  type FilterId,
  type FontPairId,
  type PaletteId,
  type PaperId,
  type ShapeId,
} from "@/lib/design-options";
import { TEMPLATES } from "@/lib/issues";
import type { NewspaperData } from "@/lib/newspaper";
import type { TemplateId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Chips, ControlLabel, PanelSection, Tile, TileGrid, Toggle } from "./controls";

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
            ? "Kaydedildi! Bundan sonraki sayılar bu tasarımla başlayacak. 🎉"
            : alsoGroupDefault
              ? "Kaydedildi ve grubun varsayılan tasarımı yapıldı! 🎉"
              : "Kaydedildi! 🎉",
      });
      router.refresh();
    });
  }

  const templateOption = { value: "template", label: "Şablonun" } as const;

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
          <h1 className="text-3xl font-semibold">🎨 Gazete Tasarım Stüdyosu</h1>
          <p className="text-sm text-ink-soft">
            {mode === "group"
              ? "Grubun varsayılan tasarımı: yeni sayılar bu görünümle başlar."
              : mode === "issue"
                ? "Bu sayının görünümü. Değişiklikler anında önizlenir; kaydedince herkes yeni hâlini görür."
                : "Deneme modu: istediğin kadar oyna, hiçbir şey kaydedilmez."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setDesign((prev) => randomDesign(prev))}>
            <Dices className="size-4" aria-hidden="true" /> Bana sürpriz yap
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
            <RotateCcw className="size-4" aria-hidden="true" /> Görünümü sıfırla
          </Button>
          {mode === "demo" ? (
            <ButtonLink href="/kayit" size="sm">
              Kendi gazeteni başlat
            </ButtonLink>
          ) : (
            <Button size="sm" onClick={save} disabled={pending || !dirty}>
              <Save className="size-4" aria-hidden="true" /> {pending ? "Kaydediliyor…" : dirty ? "Kaydet" : "Kaydedildi"}
            </Button>
          )}
        </div>
      </div>

      {status ? (
        <Alert tone={status.tone} className="no-print mb-4">
          {status.text}{" "}
          {status.tone === "success" && viewHref ? (
            <Link href={viewHref} className="underline">
              Gazeteyi aç
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
                <span className="block font-bold text-sage-deep">Grubun varsayılanı da olsun</span>
                <span className="text-ink-soft">Sonraki sayılar bu tasarımla başlasın (editör notu hariç).</span>
              </span>
            </label>
          ) : null}

          <PanelSection title="🗞️ Şablon" defaultOpen>
            <TemplatePicker name="studio-template" value={template} onChange={setTemplate} compact />
            <p className="text-xs text-ink-soft">
              Aşağıdaki ayarlarda &quot;Şablonun&quot; seçeneği, {TEMPLATES[template].name} şablonunun kendi tercihini kullanır.
            </p>
          </PanelSection>

          <PanelSection title="✍️ Başlık ve metinler">
            <div>
              <ControlLabel hint="Boş bırakırsan grubun adı yazar.">Gazetenin adı</ControlLabel>
              <Input value={design.mastheadTitle} maxLength={60} placeholder={data.groupName} onChange={(e) => set("mastheadTitle", e.target.value)} />
            </div>
            <div>
              <ControlLabel>Slogan</ControlLabel>
              <Input value={design.tagline} maxLength={100} placeholder={defaults.tagline} onChange={(e) => set("tagline", e.target.value)} />
            </div>
            {mode === "group" ? (
              <p className="rounded-xl bg-sand/70 px-3 py-2 text-xs text-ink-soft">
                Editörün notu her sayıya özeldir; onu sayının kendi tasarım stüdyosundan yazabilirsin.
              </p>
            ) : (
              <>
                <div>
                  <ControlLabel hint="Gazetenin başında, bu sayıya özel bir giriş yazısı.">Editörün notu</ControlLabel>
                  <Textarea
                    value={design.editorNote}
                    maxLength={1500}
                    rows={4}
                    placeholder="Bu ay hepinizi çok özledim…"
                    onChange={(e) => set("editorNote", e.target.value)}
                  />
                </div>
                <div>
                  <ControlLabel>Editörün imzası</ControlLabel>
                  <Input value={design.editorSignature} maxLength={60} placeholder="Ayşe" onChange={(e) => set("editorSignature", e.target.value)} />
                </div>
              </>
            )}
            <div>
              <ControlLabel hint="Gazetenin sonunda, her sayıda tekrar edebilecek bir veda.">Kapanış notu</ControlLabel>
              <Textarea
                value={design.closingNote}
                maxLength={500}
                rows={2}
                placeholder="Bir sonraki buluşmaya kadar kendinize iyi bakın!"
                onChange={(e) => set("closingNote", e.target.value)}
              />
            </div>
          </PanelSection>

          <PanelSection title="🎨 Renkler">
            <TileGrid label="Renk paleti">
              <Tile selected={design.palette === "template"} onClick={() => set("palette", "template")} label="Şablonun">
                <PaletteSwatch palette={PALETTES[defaults.palette]} />
              </Tile>
              {(Object.keys(PALETTES) as PaletteId[]).map((id) => (
                <Tile key={id} selected={design.palette === id} onClick={() => set("palette", id)} label={PALETTES[id].name}>
                  <PaletteSwatch palette={PALETTES[id]} />
                </Tile>
              ))}
            </TileGrid>
            <div>
              <ControlLabel hint="Başlıklar ve etiketler için kendi rengini seç.">Özel vurgu rengi</ControlLabel>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Özel vurgu rengi"
                  value={design.accentColor || palette.accent}
                  onChange={(e) => set("accentColor", e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-white p-1"
                />
                {design.accentColor ? (
                  <Button variant="ghost" size="sm" onClick={() => set("accentColor", "")}>
                    Paletinkine dön
                  </Button>
                ) : (
                  <span className="text-xs text-ink-soft">Şu an paletin rengi kullanılıyor.</span>
                )}
              </div>
            </div>
          </PanelSection>

          <PanelSection title="🔤 Yazı tipi">
            <TileGrid label="Başlık + metin eşleşmesi">
              {(["template", ...Object.keys(FONT_PAIRS)] as Array<FontPairId | "template">).map((id) => {
                const pair = FONT_PAIRS[id === "template" ? defaults.fontPair : id];
                return (
                  <Tile key={id} selected={design.fontPair === id} onClick={() => set("fontPair", id)} label={id === "template" ? "Şablonun" : pair.name}>
                    <span className="flex h-12 flex-col items-center justify-center rounded-lg bg-white">
                      <span className="text-xl leading-none" style={{ fontFamily: pair.head, fontWeight: pair.headWeight }}>
                        Ağ
                      </span>
                      <span className="text-[0.65rem] leading-tight text-ink-soft" style={{ fontFamily: pair.body }}>
                        şiir gibi
                      </span>
                    </span>
                  </Tile>
                );
              })}
            </TileGrid>
            <Chips
              label="Yazı boyutu"
              value={design.textSize}
              onChange={(v) => set("textSize", v)}
              options={[
                { value: "s", label: "Küçük" },
                { value: "m", label: "Orta" },
                { value: "l", label: "Büyük" },
              ]}
            />
          </PanelSection>

          <PanelSection title="📄 Sayfa">
            <TileGrid label="Kâğıt dokusu">
              {(["template", ...Object.keys(PAPERS)] as Array<PaperId | "template">).map((id) => (
                <Tile key={id} selected={design.paper === id} onClick={() => set("paper", id)} label={id === "template" ? "Şablonun" : PAPERS[id].name}>
                  <span
                    className="block h-12 rounded-lg border border-black/10"
                    style={paperPreviewStyle(id === "template" ? defaults.paper : id, palette)}
                    aria-hidden="true"
                  />
                </Tile>
              ))}
            </TileGrid>
            <Chips
              label="Sütun sayısı"
              hint="Geniş ekranlarda. Telefonda her zaman tek sütun."
              value={design.columns}
              onChange={(v) => set("columns", v)}
              options={[templateOption, { value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3", label: "3" }]}
            />
            <Chips
              label="Boşluklar"
              value={design.density}
              onChange={(v) => set("density", v)}
              options={[
                { value: "airy", label: "Ferah" },
                { value: "cozy", label: "Dengeli" },
                { value: "compact", label: "Sıkı" },
              ]}
            />
            <Chips
              label="Başlık hizası"
              value={design.align}
              onChange={(v) => set("align", v)}
              options={[templateOption, { value: "center", label: "Ortada" }, { value: "left", label: "Solda" }]}
            />
            <Chips
              label="Süslemeler"
              hint="Bantlar, damgalar, çıkartmalar, dalgalar…"
              value={design.decorations}
              onChange={(v) => set("decorations", v)}
              options={[
                { value: "none", label: "Yok" },
                { value: "some", label: "Biraz" },
                { value: "lots", label: "Bol bol" },
              ]}
            />
          </PanelSection>

          <PanelSection title="📷 Fotoğraflar">
            <TileGrid label="Filtre">
              {(["template", ...Object.keys(FILTERS)] as Array<FilterId | "template">).map((id) => (
                <Tile
                  key={id}
                  selected={design.photoFilter === id}
                  onClick={() => set("photoFilter", id)}
                  label={id === "template" ? "Şablonun" : FILTERS[id].name}
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
            <TileGrid label="Çerçeve">
              {(["template", ...Object.keys(SHAPES)] as Array<ShapeId | "template">).map((id) => {
                const shape = id === "template" ? defaults.photoShape : id;
                return (
                  <Tile key={id} selected={design.photoShape === id} onClick={() => set("photoShape", id)} label={id === "template" ? "Şablonun" : SHAPES[id].name}>
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
              label="Boyut"
              value={design.photoSize}
              onChange={(v) => set("photoSize", v)}
              options={[
                { value: "s", label: "Küçük" },
                { value: "m", label: "Orta" },
                { value: "l", label: "Büyük" },
              ]}
            />
            <div>
              <ControlLabel hint={photos.length ? "Gazetenin en başında büyük gösterilecek fotoğraf." : "Gazete yayımlanınca fotoğraflardan birini seçebilirsin."}>
                Kapak fotoğrafı
              </ControlLabel>
              <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Kapak fotoğrafı">
                <Tile selected={design.cover === "auto"} onClick={() => set("cover", "auto")} label="Otomatik">
                  <span className="flex h-12 items-center justify-center rounded-lg bg-sand text-lg" aria-hidden="true">
                    ✨
                  </span>
                </Tile>
                <Tile selected={design.cover === "none"} onClick={() => set("cover", "none")} label="Kapaksız">
                  <span className="flex h-12 items-center justify-center rounded-lg bg-sand text-lg" aria-hidden="true">
                    🚫
                  </span>
                </Tile>
                {photos.slice(0, 18).map((m, i) => (
                  <Tile key={m.id} selected={design.cover === m.id} onClick={() => set("cover", m.id)} label={`${i + 1}. foto`}>
                    <img src={m.src ?? ""} alt="" className="h-12 w-full rounded-lg object-cover" />
                  </Tile>
                ))}
              </div>
            </div>
          </PanelSection>

          <PanelSection title="🧩 Düzen">
            <Chips
              label="Gazete nasıl dizilsin?"
              value={design.arrangement}
              onChange={(v) => set("arrangement", v)}
              options={[
                { value: "question", label: "Soru soru" },
                { value: "person", label: "Kişi kişi" },
              ]}
              hint="Kişi kişi: herkesin kendi köşesi olur."
            />
            <Chips
              label="Yanıt sırası"
              value={design.order}
              onChange={(v) => set("order", v)}
              options={[
                { value: "time", label: "Yazılış sırası" },
                { value: "name", label: "İsme göre" },
                { value: "shuffle", label: "Karışık" },
              ]}
            />
            <div className="space-y-3">
              <Toggle checked={design.dropCap} onChange={(v) => set("dropCap", v)} label="Büyük ilk harf" hint="Klasik gazetedeki gibi ilk harf iri olsun." />
              <Toggle checked={design.showAvatars} onChange={(v) => set("showAvatars", v)} label="Profil fotoğrafları" />
              <Toggle checked={design.showNumbers} onChange={(v) => set("showNumbers", v)} label="Soru numaraları" />
              <Toggle checked={design.showContributors} onChange={(v) => set("showContributors", v)} label="Yazanlar listesi" />
              <Toggle checked={design.showDate} onChange={(v) => set("showDate", v)} label="Tarih" />
              <Toggle checked={design.showStats} onChange={(v) => set("showStats", v)} label="Sayılar (yazı, fotoğraf, video)" />
            </div>
          </PanelSection>
        </aside>

        {/* Canlı önizleme */}
        <section id="onizleme" aria-label="Canlı önizleme" className="min-w-0 scroll-mt-4">
          <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2">
            <a href="#ayarlar" className="text-sm font-bold text-ink-soft hover:text-ink lg:hidden">
              ↑ Ayarlara dön
            </a>
            {sampleNotice ? <p className="rounded-full bg-mustard-soft px-3 py-1 text-xs font-bold text-mustard-ink">{sampleNotice}</p> : <span />}
            <div className="flex gap-1 rounded-full border border-line bg-paper p-1" role="group" aria-label="Önizleme boyutu">
              <button
                type="button"
                aria-pressed={device === "desktop"}
                onClick={() => setDevice("desktop")}
                className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold", device === "desktop" ? "bg-ink text-white" : "text-ink-soft")}
              >
                <Monitor className="size-3.5" aria-hidden="true" /> Bilgisayar
              </button>
              <button
                type="button"
                aria-pressed={device === "phone"}
                onClick={() => setDevice("phone")}
                className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold", device === "phone" ? "bg-ink text-white" : "text-ink-soft")}
              >
                <Smartphone className="size-3.5" aria-hidden="true" /> Telefon
              </button>
            </div>
          </div>
          <div className={cn("transition-[max-width] duration-300 print:max-w-none", device === "phone" ? "mx-auto max-w-[390px]" : "max-w-none")}>
            <Newspaper data={data} template={template} design={design} />
          </div>
        </section>
      </div>

      {/* Telefonda panel uzun; önizlemeye tek dokunuşla atla. */}
      <a
        href="#onizleme"
        className="no-print fixed bottom-4 right-4 z-20 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white shadow-lift lg:hidden"
      >
        👀 Önizleme
      </a>
    </div>
  );
}
