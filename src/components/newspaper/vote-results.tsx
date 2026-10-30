import type { CSSProperties } from "react";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import type { ResolvedDesign } from "@/lib/design";
import type { VoteOption, VoteResults as Results } from "@/lib/newspaper";
import { cn } from "@/lib/utils";
import { tx } from "./parts";

// Anket ve "kim daha çok?" sonuçları. Renkler şablonun paletinden gelir (CSS değişkenleri),
// böylece grafik her şablonda o şablonun görünümüne uyar ve yazdırılınca da aynı kalır.

const COLORS = [
  "var(--np-accent)",
  "var(--np-accent2)",
  "color-mix(in srgb, var(--np-accent) 55%, var(--np-paper))",
  "color-mix(in srgb, var(--np-accent2) 55%, var(--np-paper))",
  "color-mix(in srgb, var(--np-ink) 45%, var(--np-paper))",
  "var(--np-highlight)",
];

const percent = (votes: number, total: number) => (total ? Math.round((votes / total) * 100) : 0);

/** Oy sayısına göre sıra (eşitlikte aynı sıra): [4, 4, 2] → [1, 1, 3] */
function ranks(options: VoteOption[]): number[] {
  return options.map((o) => 1 + options.filter((x) => x.votes > o.votes).length);
}

function Donut({ options, total, label }: { options: VoteOption[]; total: number; label: string }) {
  let start = 0;
  const stops = options
    .map((o, i) => {
      const end = start + (total ? (o.votes / total) * 100 : 0);
      const stop = `${COLORS[i % COLORS.length]} ${start}% ${end}%`;
      start = end;
      return stop;
    })
    .join(", ");
  return (
    <div
      className="relative mx-auto size-36 shrink-0 rounded-full @2xl:size-40"
      style={{ background: total ? `conic-gradient(${stops})` : "var(--np-rule)" }}
      role="img"
      aria-label={label}
    >
      <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full text-center" style={{ background: "var(--np-paper)" }}>
        <span className="np-head text-3xl leading-none">{total}</span>
        <span className="np-small np-muted mt-0.5">{label}</span>
      </div>
    </div>
  );
}

function PollResults({ vote, d }: { vote: Results; d: ResolvedDesign }) {
  const say = tx(d);
  const order = ranks(vote.options);
  const votesWord = (n: number) => say("oy", n === 1 ? "vote" : "votes");
  return (
    <div className="grid items-center gap-6 @2xl:grid-cols-[auto_minmax(0,1fr)] @2xl:gap-10">
      <Donut options={vote.options} total={vote.total} label={votesWord(vote.total)} />
      <ul className="space-y-4">
        {vote.options.map((o, i) => {
          const pct = percent(o.votes, vote.total);
          const winner = vote.total > 0 && order[i] === 1;
          return (
            <li key={i}>
              <div className="flex items-baseline justify-between gap-3">
                <span className={cn("flex min-w-0 items-center gap-2", winner && "font-bold")}>
                  <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="min-w-0 break-words">{o.label}</span>
                  {winner ? <span aria-label={say("En çok seçilen", "Top choice")}>👑</span> : null}
                </span>
                <span className="np-small shrink-0 tabular-nums">
                  <strong className="text-[1.15em]">{say(`%${pct}`, `${pct}%`)}</strong>
                  <span className="np-muted"> · {o.votes} {votesWord(o.votes)}</span>
                </span>
              </div>
              <div className="mt-1.5 h-3 overflow-hidden rounded-full" style={{ background: "color-mix(in srgb, var(--np-rule) 70%, transparent)" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
              </div>
              {o.voters.length && d.show.avatars ? (
                <AvatarStack
                  size="xs"
                  max={8}
                  className="mt-2"
                  ringClassName="ring-[var(--np-paper)]"
                  people={o.voters.map((p) => ({ name: p.name, src: p.avatarUrl }))}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const MEDALS = ["🥇", "🥈", "🥉"];
const ON_COLORS = ["var(--np-on-accent)", "var(--np-on-accent2)", "var(--np-ink)"];

function WhoResults({ vote, d }: { vote: Results; d: ResolvedDesign }) {
  const say = tx(d);
  const order = ranks(vote.options);
  const top = vote.options.slice(0, 3);
  const best = vote.options[0]?.votes ?? 0;
  const votesWord = (n: number) => say("oy", n === 1 ? "vote" : "votes");
  // Kürsü: ikinci solda, birinci ortada, üçüncü sağda.
  const podium = top.length === 3 ? [top[1], top[0], top[2]] : top.length === 2 ? [top[1], top[0]] : top;
  // Kürsü yüksekliği oy sayısıyla orantılı: 3rem (en az) ile 8rem (birinci) arası.
  const height = (o: VoteOption) => `${3 + 5 * (o.votes / (best || 1))}rem`;

  return (
    <div>
      {vote.options[0] ? (
        <p className="text-center">
          <span className="np-small np-muted uppercase tracking-[0.2em]">{say("Kazanan", "The winner")}</span>
          <span className="np-head mt-1 block text-4xl leading-tight @2xl:text-5xl">
            👑 {vote.options.filter((o, i) => order[i] === 1).map((o) => o.label).join(" & ")}
          </span>
        </p>
      ) : null}
      <div className="mx-auto mt-6 flex max-w-xl items-end justify-center gap-3 @2xl:gap-5" aria-hidden="true">
        {podium.map((o) => {
          const i = vote.options.indexOf(o);
          const rank = order[i];
          return (
            <div key={o.label + i} className="flex w-1/3 max-w-40 flex-col items-center">
              <span className="text-2xl">{MEDALS[rank - 1] ?? ""}</span>
              {o.person ? (
                <Avatar
                  name={o.person.name}
                  src={o.person.avatarUrl}
                  size={rank === 1 ? "lg" : "md"}
                  className="np-rule-ink mt-1 border-[3px]"
                />
              ) : null}
              <span className="np-small mt-1.5 max-w-full truncate text-center font-bold">{o.label}</span>
              <div
                className="mt-2 flex w-full items-start justify-center rounded-t-xl pt-2"
                style={{ height: height(o), background: COLORS[(rank - 1) % COLORS.length], color: ON_COLORS[rank - 1] ?? "var(--np-ink)" } as CSSProperties}
              >
                <span className="np-head text-2xl leading-none">{rank}</span>
              </div>
            </div>
          );
        })}
      </div>
      <ul className="np-rule mx-auto max-w-xl border-t pt-4">
        {vote.options.map((o, i) => (
          <li key={o.label + i} className="flex items-center gap-3 py-1.5">
            <span className="np-small np-muted w-6 text-right tabular-nums">{order[i]}.</span>
            {o.person ? <Avatar name={o.person.name} src={o.person.avatarUrl} size="xs" /> : null}
            <span className="min-w-0 flex-1 truncate font-semibold">{o.label}</span>
            <span className="h-2 w-24 overflow-hidden rounded-full @2xl:w-40" style={{ background: "color-mix(in srgb, var(--np-rule) 70%, transparent)" }}>
              <span className="block h-full rounded-full" style={{ width: `${percent(o.votes, best)}%`, background: COLORS[(order[i] - 1) % COLORS.length] }} />
            </span>
            <span className="np-small w-14 text-right tabular-nums">
              {o.votes} {votesWord(o.votes)}
            </span>
          </li>
        ))}
      </ul>
      <p className="np-small np-muted mt-3 text-center italic">
        {say("Oylar gizli: kimin kime oy verdiğini kimse bilmiyor 🤫", "Votes are secret: nobody knows who voted for whom 🤫")}
      </p>
    </div>
  );
}

/** Bölümün yanıtları yerine gösterilen sonuç kartı. */
export function VoteResults({ vote, d, className }: { vote: Results; d: ResolvedDesign; className?: string }) {
  const say = tx(d);
  const empty = vote.total === 0;
  return (
    <div className={cn("np-vote print-avoid-break rounded-[1.5rem] p-5 @2xl:p-8", className)}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <span className="np-small font-bold uppercase tracking-[0.2em]">
          {vote.kind === "poll" ? `📊 ${say("Anket", "Poll")}` : `🏆 ${say("Kim daha çok?", "Most likely to…")}`}
        </span>
        <span className="np-small np-muted">
          {vote.total} {say("oy", vote.total === 1 ? "vote" : "votes")}
        </span>
      </div>
      {empty ? (
        <p className="np-muted italic">{say("Bu soruya kimse oy vermedi.", "Nobody voted on this one.")}</p>
      ) : vote.kind === "poll" ? (
        <PollResults vote={vote} d={d} />
      ) : (
        <WhoResults vote={vote} d={d} />
      )}
    </div>
  );
}
