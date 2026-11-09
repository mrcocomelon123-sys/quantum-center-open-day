import type { AgendaDay } from "@/lib/conference";

export function AgendaTable({ day }: { day: AgendaDay }) {
  return (
    <section id={day.id} className="rounded-xl border border-border bg-card shadow-sm">
      <div className="rounded-t-xl border-b border-border bg-secondary px-6 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{day.label}</p>
        <h2 className="mt-1 text-xl font-bold text-foreground">{day.date}</h2>
      </div>
      <ul className="divide-y divide-border">
        {day.items.map((item, i) =>
          item.kind === "session" ? (
            <li
              key={i}
              className="bg-muted px-6 py-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground"
            >
              {item.title}
            </li>
          ) : (
            <li key={i} className="flex flex-col gap-1 px-6 py-3 sm:flex-row sm:gap-6">
              <span className="w-36 shrink-0 font-mono text-sm text-muted-foreground">
                {item.time}
              </span>
              <span className="flex flex-col gap-0.5">
                <span
                  className={
                    item.kind === "break" || item.kind === "note"
                      ? "text-sm italic text-muted-foreground"
                      : "text-sm font-semibold text-foreground"
                  }
                >
                  {item.title}
                  {item.affiliation ? (
                    <span className="font-normal text-muted-foreground">
                      {", "}
                      {item.affiliation}
                    </span>
                  ) : null}
                </span>
                {item.talk ? (
                  <span className="text-sm italic text-accent">{item.talk}</span>
                ) : null}
              </span>
            </li>

          ),
        )}
      </ul>
    </section>
  );
}
