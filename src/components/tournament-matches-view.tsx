"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Match {
  id: string;
  team1: string;
  team2: string;
  score1: number | null;
  score2: number | null;
}

interface Group {
  id: string;
  name: string;
  teams: string[];
}

interface TournamentMatchesViewProps {
  tournamentId: string;
  //   final: Match | null;
  //   semiFinals: Match[];
  //   quarterFinals: Match[];
  //   roundOf16: Match[];
  //   groups: Group[];
}

// PLACEHOLDER
const groups = [
  {
    id: "123",
    name: "Gruppe A",
    teams: ["Team1", "Team2", "Team3", "Team4"],
  },
  {
    id: "123",
    name: "Gruppe B",
    teams: ["Team1", "Team2", "Team3", "Team4"],
  },
  {
    id: "123",
    name: "Gruppe C",
    teams: ["Team1", "Team2", "Team3", "Team4"],
  },
  {
    id: "123",
    name: "Gruppe D",
    teams: ["Team1", "Team2", "Team3", "Team4"],
  },
  {
    id: "123",
    name: "Gruppe E",
    teams: ["Team1", "Team2", "Team3", "Team4"],
  },
  {
    id: "123",
    name: "Gruppe F",
    teams: ["Team1", "Team2", "Team3", "Team4"],
  },
  {
    id: "123",
    name: "Gruppe G",
    teams: ["Team1", "Team2", "Team3", "Team4"],
  },
  {
    id: "123",
    name: "Gruppe H",
    teams: ["Team1", "Team2", "Team3", "Team4"],
  },
];

const final = {
  id: "123",
  team1: "Test1",
  team2: "Test2",
  score1: null,
  score2: null,
};

const semiFinals = [
  {
    id: "123",
    team1: "Test1",
    team2: "Test2",
    score1: null,
    score2: null,
  },
  {
    id: "123",
    team1: "Test1",
    team2: "Test2",
    score1: null,
    score2: null,
  },
];

const quarterFinals = [
  {
    id: "123",
    team1: "Test1",
    team2: "Test2",
    score1: null,
    score2: null,
  },
  {
    id: "123",
    team1: "Test1",
    team2: "Test2",
    score1: null,
    score2: null,
  },
  {
    id: "123",
    team1: "Test1",
    team2: "Test2",
    score1: null,
    score2: null,
  },
  {
    id: "123",
    team1: "Test1",
    team2: "Test2",
    score1: null,
    score2: null,
  },
];

const roundOf16 = [
  {
    id: "123",
    team1: "Test1",
    team2: "Test2",
    score1: null,
    score2: null,
  },
  {
    id: "123",
    team1: "Test1",
    team2: "Test2",
    score1: null,
    score2: null,
  },
  {
    id: "123",
    team1: "Test1",
    team2: "Test2",
    score1: null,
    score2: null,
  },
  {
    id: "123",
    team1: "Test1",
    team2: "Test2",
    score1: null,
    score2: null,
  },
  {
    id: "123",
    team1: "Test1",
    team2: "Test2",
    score1: null,
    score2: null,
  },
  {
    id: "123",
    team1: "Test1",
    team2: "Test2",
    score1: null,
    score2: null,
  },
  {
    id: "123",
    team1: "Test1",
    team2: "Test2",
    score1: null,
    score2: null,
  },
  {
    id: "123",
    team1: "Test1",
    team2: "Test2",
    score1: null,
    score2: null,
  },
];

export function TournamentMatchesView({
  tournamentId,
}: TournamentMatchesViewProps) {
  return (
    <div className="min-w-full overflow-x-scroll">
      <div className="flex w-full flex-col items-start md:items-center justify-center">
        {/* Finale */}
        {final && (
          <div className="mb-4 flex flex-col items-center">
            <h2 className="text-xl font-semibold">Finale</h2>
            <MatchView match={final} />
          </div>
        )}

        {/* Halbfinale */}
        <div className="mb-4 flex space-x-4">
          {semiFinals.map((match) => (
            <MatchView key={match.id} match={match} />
          ))}
        </div>

        {/* Viertelfinale */}
        <div className="mb-4 flex space-x-4">
          {quarterFinals.map((match) => (
            <MatchView key={match.id} match={match} />
          ))}
        </div>

        {/* Achtelfinale */}
        <div className="mb-4 flex space-x-4">
          {roundOf16.map((match) => (
            <MatchView key={match.id} match={match} />
          ))}
        </div>

        {/* Gruppen */}
        <div>
          <h2 className="text-xl font-semibold">Gruppen</h2>
          <div className="flex space-x-4">
            {groups.map((group) => (
              <GroupView key={group.id} group={group} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MatchViewProps {
  match: Match;
}

function MatchView({ match }: MatchViewProps) {
  return (
    <div className="rounded-md border p-2">
      <div className="flex items-center justify-center gap-2">
        <p>{match.team1}</p>
        <p className="border-2">{0}</p>
      </div>
      <div className="flex items-center justify-center gap-2">
        <p>{match.team1}</p>
        <p className="border-2">{0}</p>
      </div>
    </div>
  );
}

interface GroupViewProps {
  group: Group;
}

function GroupView({ group }: GroupViewProps) {
  return (
    <div className="rounded-md border p-2">
      <h3 className="font-semibold">{group.name}</h3>
      <ul>
        {group.teams.map((team) => (
          <li key={team}>{team}</li>
        ))}
      </ul>
    </div>
  );
}
