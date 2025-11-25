import { Activity } from "lucide-react"

interface Match {
  id: string
  home: string
  away: string
  homeScore: number
  awayScore: number
  status: "Live" | "HT" | "FT"
  time?: string
  league: string
}

const MOCK_MATCHES: Match[] = [
  {
    id: "1",
    home: "Man City",
    away: "Arsenal",
    homeScore: 2,
    awayScore: 1,
    status: "Live",
    time: "78'",
    league: "Premier League",
  },
  {
    id: "2",
    home: "Real Madrid",
    away: "Barcelona",
    homeScore: 0,
    awayScore: 0,
    status: "Live",
    time: "34'",
    league: "La Liga",
  },
  {
    id: "3",
    home: "Lakers",
    away: "Warriors",
    homeScore: 112,
    awayScore: 108,
    status: "FT",
    league: "NBA",
  },
]

export function LiveScoreWidget() {
  return (
    <div className="bg-background rounded-xl border border-border overflow-hidden">
      <div className="bg-primary px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-bold text-primary-foreground uppercase tracking-wide">Live Scores</h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
          <span className="text-xs font-bold text-primary-foreground uppercase">Live</span>
        </div>
      </div>

      <div className="divide-y divide-border">
        {MOCK_MATCHES.map((match) => (
          <div key={match.id} className="p-3 sm:p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-semibold uppercase">{match.league}</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  match.status === "Live" 
                    ? "bg-destructive/20 text-destructive dark:bg-destructive/30" 
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {match.status === "Live" ? match.time : match.status}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground font-medium group-hover:text-primary transition-colors">
                    {match.home}
                  </span>
                  <span className="text-foreground font-bold text-base">{match.homeScore}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground font-medium group-hover:text-primary transition-colors">
                    {match.away}
                  </span>
                  <span className="text-foreground font-bold text-base">{match.awayScore}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-muted/30 p-3 text-center border-t border-border">
        <button className="text-xs font-semibold text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors flex items-center justify-center gap-2 w-full">
          <Activity className="w-3 h-3" />
          View All Scores
        </button>
      </div>
    </div>
  )
}
