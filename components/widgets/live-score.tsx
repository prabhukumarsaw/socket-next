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
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
      <div className="bg-green-600 px-5 py-3 flex items-center justify-between">
        <h3 className="text-lg font-black text-white uppercase tracking-wide">Live Scores</h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-xs font-bold text-white uppercase">Live</span>
        </div>
      </div>

      <div className="divide-y divide-zinc-800">
        {MOCK_MATCHES.map((match) => (
          <div key={match.id} className="p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 font-bold uppercase">{match.league}</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  match.status === "Live" ? "bg-red-500/20 text-red-500" : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {match.status === "Live" ? match.time : match.status}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 font-medium group-hover:text-white transition-colors">
                    {match.home}
                  </span>
                  <span className="text-zinc-100 font-bold">{match.homeScore}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 font-medium group-hover:text-white transition-colors">
                    {match.away}
                  </span>
                  <span className="text-zinc-100 font-bold">{match.awayScore}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-950 p-3 text-center border-t border-zinc-800">
        <button className="text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider transition-colors flex items-center justify-center gap-2 w-full">
          <Activity className="w-3 h-3" />
          View All Scores
        </button>
      </div>
    </div>
  )
}
