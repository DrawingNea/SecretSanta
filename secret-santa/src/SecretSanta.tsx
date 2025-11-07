import React from "react";
import "./styles/secret-santa.css";
import { Shell, Card } from "./components/Card";
import { Header } from "./components/Header";
import { Alert } from "./components/Alert";
import { useSearchParam } from "./hooks/useSearchParam.hook";
import { fromBase64Url } from "./helpers/base64.helper";
import { CreateView } from "./components/CreateView";
import { JoinView } from "./components/JoinView";
import type { Group } from "./types";

export default function SecretSanta() {
  const gParam = useSearchParam("g");
  const [group, setGroup] = React.useState<Group | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [whoAmI, setWhoAmI] = React.useState<string>("");

  React.useEffect(() => {
    if (!gParam) {
      setGroup(null);
      setError(null);
      return;
    }
    const parsed = fromBase64Url<Group>(gParam);
    if (!parsed || !parsed.names?.length || !parsed.assignments) {
      setError("Invalid or corrupted invite link.");
      setGroup(null);
      return;
    }
    for (const n of parsed.names) {
      if (!parsed.assignments[n]) {
        setError("This invite link is missing assignments.");
        setGroup(null);
        return;
      }
    }
    setError(null);
    setGroup(parsed);
  }, [gParam]);

  return (
    <Shell>
      <Card>
        {!group ? (
          <CreateView />
        ) : error ? (
          <>
            <Header title="Secret Santa" subtitle="Join a group" />
            <Alert variant="error">{error}</Alert>
          </>
        ) : (
          <JoinView group={group} whoAmI={whoAmI} setWhoAmI={setWhoAmI} />
        )}
      </Card>
    </Shell>
  );
}
