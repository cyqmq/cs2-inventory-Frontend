/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  faArrowRotateRight,
  faChevronDown,
  faChevronUp
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Fragment, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { apiUrl } from "~/api-client";
import { ApiAdminStatsUrl } from "~/data/api-urls";

const ADMIN_TOKEN_STORAGE_KEY = "adminToken";

interface AdminItem {
  uid: number;
  id: number;
  name: string;
  wear?: number;
  statTrak?: number;
  nameTag?: string;
  stickerCount: number;
  keychainCount: number;
  equipped: boolean;
}

interface AdminUser {
  id: string;
  name: string;
  avatar: string;
  lastSeen: number;
  createdAt: number;
  inventoryVersion: number;
  itemCount: number;
  equippedCount: number;
  items: AdminItem[];
}

interface AdminStatsResponse {
  stats: {
    totalUsers: number;
    activeUsers24h: number;
    totalApiCalls: number;
    apiCalls24h: number;
    totalItems: number;
    apiCallsByRoute: {
      method: string;
      path: string;
      status: number;
      count: number;
    }[];
    apiCallsByDay: { day: string; count: number }[];
  };
  users: AdminUser[];
}

type LoadStatus =
  | "idle"
  | "loading"
  | "ready"
  | "unauthorized"
  | "disabled"
  | "error";

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString();
}

function formatWear(wear: number | undefined) {
  if (wear === undefined) {
    return "—";
  }
  return `${(wear * 100).toFixed(2)}%`;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="text-xs tracking-wide text-neutral-400 uppercase">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-white">
        {formatNumber(value)}
      </div>
    </div>
  );
}

function TableShell({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5">
      <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-white">
        {title}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

const thClass = "px-4 py-2 text-left text-xs font-medium text-neutral-400";
const tdClass = "px-4 py-2 text-sm text-neutral-200";

export default function AdminDashboard() {
  const [data, setData] = useState<AdminStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [token, setToken] = useState<string>(
    () => sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) ?? ""
  );
  const [tokenInput, setTokenInput] = useState("");

  async function load() {
    setStatus("loading");
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (token !== "") {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(apiUrl(ApiAdminStatsUrl), {
        credentials: "include",
        headers
      });
      if (response.status === 401) {
        setData(null);
        setStatus("unauthorized");
        return;
      }
      if (response.status === 403) {
        setData(null);
        setStatus("disabled");
        return;
      }
      if (!response.ok) {
        throw new Error(
          `API GET ${ApiAdminStatsUrl} failed: ${response.status}`
        );
      }
      setData((await response.json()) as AdminStatsResponse);
      setStatus("ready");
    } catch (err) {
      setData(null);
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    if (token !== "" && status === "idle") {
      void load();
    }
  }, [token]);

  function handleTokenSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = tokenInput.trim();
    if (trimmed === "") {
      return;
    }
    sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, trimmed);
    setToken(trimmed);
    setTokenInput("");
    void load();
  }

  function handleSignOut() {
    sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    setToken("");
    setTokenInput("");
    setData(null);
    setStatus("idle");
  }

  const maxDayCount = Math.max(
    1,
    ...(data?.stats.apiCallsByDay.map((entry) => entry.count) ?? [1])
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Users, inventory and API usage overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {token !== "" && status !== "idle" ? (
            <button
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-200 transition-colors hover:bg-white/10"
              onClick={handleSignOut}
              type="button"
            >
              Sign out
            </button>
          ) : null}
          <button
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-200 transition-colors hover:bg-white/10 disabled:opacity-50"
            disabled={status === "loading"}
            onClick={() => void load()}
            type="button"
          >
            <FontAwesomeIcon
              className={status === "loading" ? "animate-spin" : undefined}
              icon={faArrowRotateRight}
            />
            <span className="ml-2">Refresh</span>
          </button>
        </div>
      </div>

      {error !== null && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Failed to load stats: {error}
        </div>
      )}

      {status === "unauthorized" || (token === "" && status === "idle") ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">Admin access</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Enter the admin token to view the dashboard.
          </p>
          <form className="mt-4 flex max-w-md gap-2" onSubmit={handleTokenSubmit}>
            <input
              autoFocus
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-blue-500/50"
              onChange={(event) => setTokenInput(event.target.value)}
              placeholder="Admin token"
              type="password"
              value={tokenInput}
            />
            <button
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
              disabled={tokenInput.trim() === ""}
              type="submit"
            >
              Sign in
            </button>
          </form>
        </div>
      ) : null}

      {status === "disabled" ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Admin dashboard is disabled. Set the{" "}
          <code className="font-mono text-xs">ADMIN_API_TOKEN</code> environment
          variable on the API Worker to enable it.
        </div>
      ) : null}

      {status === "loading" && data === null ? (
        <div className="py-16 text-center text-sm text-neutral-400">
          Loading...
        </div>
      ) : null}

      {status === "error" ? (
        <div className="py-16 text-center text-sm text-neutral-400">
          Failed to load. Try refreshing.
        </div>
      ) : null}

      {status === "ready" && data !== null ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Total Users" value={data.stats.totalUsers} />
            <StatCard
              label="Active Users (24h)"
              value={data.stats.activeUsers24h}
            />
            <StatCard label="Total API Calls" value={data.stats.totalApiCalls} />
            <StatCard label="API Calls (24h)" value={data.stats.apiCalls24h} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TableShell title="API Calls by Route (Top 20)">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={thClass}>Method</th>
                    <th className={thClass}>Path</th>
                    <th className={thClass}>Status</th>
                    <th className={`${thClass} text-right`}>Calls</th>
                  </tr>
                </thead>
                <tbody>
                  {data.stats.apiCallsByRoute.length === 0 ? (
                    <tr>
                      <td
                        className={`${tdClass} py-6 text-center text-neutral-500`}
                        colSpan={4}
                      >
                        No requests recorded yet.
                      </td>
                    </tr>
                  ) : (
                    data.stats.apiCallsByRoute.map((entry, index) => (
                      <tr
                        className={index % 2 === 0 ? "bg-white/3" : undefined}
                        key={`${entry.method}-${entry.path}-${entry.status}-${index}`}
                      >
                        <td className={`${tdClass} font-mono text-xs`}>
                          {entry.method}
                        </td>
                        <td className={`${tdClass} font-mono text-xs break-all`}>
                          {entry.path}
                        </td>
                        <td className={`${tdClass} font-mono text-xs`}>
                          {entry.status}
                        </td>
                        <td className={`${tdClass} text-right font-semibold`}>
                          {formatNumber(entry.count)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableShell>

            <TableShell title="API Calls per Day (Last 7 Days)">
              {data.stats.apiCallsByDay.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-neutral-500">
                  No requests recorded yet.
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {data.stats.apiCallsByDay.map((entry) => (
                    <div className="flex items-center gap-3" key={entry.day}>
                      <div className="w-24 shrink-0 font-mono text-xs text-neutral-300">
                        {entry.day}
                      </div>
                      <div className="h-4 flex-1 overflow-hidden rounded bg-white/5">
                        <div
                          className="h-full rounded bg-blue-500/70"
                          style={{
                            width: `${Math.max(
                              2,
                              Math.round((entry.count / maxDayCount) * 100)
                            )}%`
                          }}
                        />
                      </div>
                      <div className="w-10 shrink-0 text-right text-xs font-semibold text-white">
                        {formatNumber(entry.count)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TableShell>
          </div>

          <div className="mt-4">
            <TableShell title={`Users (${formatNumber(data.users.length)})`}>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={thClass}>Name</th>
                    <th className={`${thClass} text-right`}>Items</th>
                    <th className={`${thClass} text-right`}>Equipped</th>
                    <th className={`${thClass} text-right`}>Inventory Ver.</th>
                    <th className={`${thClass} text-right`}>Last Seen</th>
                    <th className={`${thClass} text-right`}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.length === 0 ? (
                    <tr>
                      <td
                        className={`${tdClass} py-6 text-center text-neutral-500`}
                        colSpan={6}
                      >
                        No users yet.
                      </td>
                    </tr>
                  ) : (
                    data.users.map((user, index) => {
                      const expanded = expandedUser === user.id;
                      return (
                        <Fragment key={user.id}>
                          <tr
                            className={
                              index % 2 === 0
                                ? "cursor-pointer bg-white/3 hover:bg-white/[0.07]"
                                : "cursor-pointer hover:bg-white/[0.07]"
                            }
                            key={user.id}
                            onClick={() =>
                              setExpandedUser(expanded ? null : user.id)
                            }
                          >
                            <td className={tdClass}>
                              <div className="flex items-center gap-2">
                                {user.avatar !== "" ? (
                                  <img
                                    alt=""
                                    className="size-6 rounded-full"
                                    src={user.avatar}
                                  />
                                ) : null}
                                <span className="font-medium text-white">
                                  {user.name}
                                </span>
                              </div>
                            </td>
                            <td className={`${tdClass} text-right`}>
                              {formatNumber(user.itemCount)}
                            </td>
                            <td className={`${tdClass} text-right`}>
                              {formatNumber(user.equippedCount)}
                            </td>
                            <td
                              className={`${tdClass} text-right font-mono text-xs`}
                            >
                              {user.inventoryVersion}
                            </td>
                            <td
                              className={`${tdClass} text-right text-xs text-neutral-400`}
                            >
                              {formatDate(user.lastSeen)}
                            </td>
                            <td className={`${tdClass} text-right`}>
                              <FontAwesomeIcon
                                icon={expanded ? faChevronUp : faChevronDown}
                                size="xs"
                              />
                            </td>
                          </tr>
                          {expanded && (
                            <tr key={`${user.id}-items`}>
                              <td colSpan={6} className="bg-black/20 px-4 py-3">
                                {user.items.length === 0 ? (
                                  <div className="py-2 text-sm text-neutral-500">
                                    Inventory is empty.
                                  </div>
                                ) : (
                                  <table className="w-full">
                                    <thead>
                                      <tr>
                                        <th className={`${thClass} text-left`}>
                                          Item
                                        </th>
                                        <th className={`${thClass} text-right`}>
                                          Wear
                                        </th>
                                        <th className={`${thClass} text-right`}>
                                          StatTrak
                                        </th>
                                        <th className={`${thClass} text-right`}>
                                          Stickers
                                        </th>
                                        <th className={`${thClass} text-right`}>
                                          Keychains
                                        </th>
                                        <th className={`${thClass} text-right`}>
                                          Name Tag
                                        </th>
                                        <th className={`${thClass} text-right`}>
                                          Equipped
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {user.items.map((item) => (
                                        <tr key={item.uid}>
                                          <td
                                            className={`${tdClass} text-left font-medium text-white`}
                                          >
                                            {item.name}
                                          </td>
                                          <td
                                            className={`${tdClass} text-right font-mono text-xs`}
                                          >
                                            {formatWear(item.wear)}
                                          </td>
                                          <td
                                            className={`${tdClass} text-right font-mono text-xs`}
                                          >
                                            {item.statTrak !== undefined
                                              ? formatNumber(item.statTrak)
                                              : "—"}
                                          </td>
                                          <td
                                            className={`${tdClass} text-right font-mono text-xs`}
                                          >
                                            {item.stickerCount}
                                          </td>
                                          <td
                                            className={`${tdClass} text-right font-mono text-xs`}
                                          >
                                            {item.keychainCount}
                                          </td>
                                          <td
                                            className={`${tdClass} text-right text-xs text-amber-200/80`}
                                          >
                                            {item.nameTag ?? "—"}
                                          </td>
                                          <td className={`${tdClass} text-right`}>
                                            {item.equipped ? (
                                              <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-300">
                                                Yes
                                              </span>
                                            ) : (
                                              "—"
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </TableShell>
          </div>
        </>
      ) : null}
    </div>
  );
}