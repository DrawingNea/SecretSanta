import { Header } from "./Header";
import type { Group } from "../types";

export function JoinView({
  group,
  whoAmI,
  setWhoAmI,
}: {
  group: Group;
  whoAmI: string;
  setWhoAmI: (s: string) => void;
}) {
  const myTarget = whoAmI ? group.assignments[whoAmI] : "";

  return (
    <>
      <Header title={group.title || "Secret Santa"} subtitle="Pick your name to reveal your match" />
      <div className="row">
        <label className="label">I am</label>
        <select className="input" value={whoAmI} onChange={(e) => setWhoAmI(e.target.value)}>
          <option value="">— select your name —</option>
          {group.names.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {whoAmI && (
        <>
          <div className="divider" />
          <div className="revealBox">
            <div className="hint">Your Secret Santa assignment:</div>
            <div className="big">{myTarget}</div>
          </div>
          <p className="muted">Shhh… Don’t share this screen. Everyone only sees their own match.</p>
        </>
      )}
    </>
  );
}
