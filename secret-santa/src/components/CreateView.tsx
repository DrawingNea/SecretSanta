import React from "react";
import { Header } from "./Header";
import { Alert } from "./Alert";
import { createDerangement } from "../helpers/derangement.helper";
import { makeRng } from "../helpers/rng.helper";
import { toBase64Url } from "../helpers/base64.helper";
import type { Group } from "../types";

export function CreateView() {
  const [title, setTitle] = React.useState("Secret Santa 2025");
  const [namesRaw, setNamesRaw] = React.useState("");
  const [inviteLink, setInviteLink] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function sanitizeNames(input: string): string[] {
    const names = input
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
    const seen = new Set<string>();
    return names.filter((n) => {
      const k = n.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function generate() {
    setError(null);
    setInviteLink(null);
    const names = sanitizeNames(namesRaw);
    if (names.length < 3) {
      setError("Please enter at least 3 distinct names.");
      return;
    }
    try {
      const assignments = createDerangement(names, makeRng());
      const group: Group = {
        title: title.trim() || "Secret Santa",
        names,
        assignments,
        createdAt: Date.now(),
      };
      const encoded = toBase64Url(group);
      const url = new URL(window.location.href);
      url.searchParams.set("g", encoded);
      setInviteLink(url.toString());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not generate assignments. Try again.");
    }
  }

  async function copyLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      alert("Invite link copied to clipboard!");
    } catch {
      const ta = document.getElementById("invite-ta") as HTMLTextAreaElement | null;
      if (ta) {
        ta.select();
        document.execCommand("copy");
        alert("Copied!");
      }
    }
  }

  return (
    <>
      <Header title="Secret Santa" subtitle="Create a group and share the invite link" />
      <div className="row">
        <label className="label">Group title</label>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Team Winter Wonderland"
        />
      </div>

      <div className="row">
        <label className="label">Participants</label>
        <textarea
          className="input"
          placeholder="Enter names, one per line (or comma-separated)"
          value={namesRaw}
          onChange={(e) => setNamesRaw(e.target.value)}
          rows={8}
        />
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="actions">
        <button className="btn primary" onClick={generate}>Generate invite link</button>
      </div>

      {inviteLink && (
        <>
          <div className="divider" />
          <div className="row">
            <label className="label">Invite link</label>
            <textarea id="invite-ta" className="input" rows={3} readOnly value={inviteLink} />
          </div>
          <div className="actions">
            <button className="btn" onClick={copyLink}>Copy link</button>
            <a className="btn ghost" href={inviteLink}>Open link</a>
          </div>
          <p className="muted">Share this link with participants. They’ll open it, select their name, and see their match.</p>
        </>
      )}
    </>
  );
}
