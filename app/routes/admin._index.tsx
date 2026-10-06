/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faArrowRotateRight, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { apiGet } from "~/api-client";
import { ApiAdminStatsUrl } from "~/data/api-urls";
import { Modal, ModalHeader } from "~/components/modal";

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
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setData(await apiGet<AdminStatsResponse>(ApiAdminStatsUrl));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const maxDayCount = Math.max(
    1,
    ...(data?.stats.apiCallsByDay.map((entry) => entry.count) ?? [1])
  );

  return (
    <Modal className="w-[min(96vw,1100px)]">
      <ModalHeader title="Admin Dashboard" closeTo="/" />
      <div className="px-3 pb-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Users, inventory and API usage overview.
          </p>
        </div>
        <button
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-200 transition-colors hover:bg-white/10 disabled:opacity-50"
          disabled={loading}
          onClick={load}
          type="button"
        >
          <FontAwesomeIcon
            className={loading ? "animate-spin" : undefined}
            icon={faArrowRotateRight}
          />
          <span className="ml-2">Refresh</span>
        </button>
      </div>

      {error !== null && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Failed to load stats: {error}
        </div>
      )}

      {data === null ? (
        <div className="py-16 text-center text-sm text-neutral-400">
          {loading ? "Loading..." : "No data"}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Total Users" value={data.stats.totalUsers} />
            <StatCard label="Active Users (24h)" value={data.stats.activeUsers24h} />
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
                      <td className={`${tdClass} py-6 text-center text-neutral-500`} colSpan={4}>
                        No requests recorded yet.
                      </td>
                    </tr>
                  ) : (
                    data.stats.apiCallsByRoute.map((entry, index) => (
                      <tr
                        className={index % 2 === 0 ? "bg-white/3" : undefined}
                        key={`${entry.method}-${entry.path}-${entry.status}-${index}`}
                      >
                        <td className={`${tdClass} font-mono text-xs`}>{entry.method}</td>
                        <td className={`${tdClass} font-mono text-xs break-all`}>{entry.path}</td>
                        <td className={`${tdClass} font-mono text-xs`}>{entry.status}</td>
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
                      <td className={`${tdClass} py-6 text-center text-neutral-500`} colSpan={6}>
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
                            <td className={`${tdClass} text-right font-mono text-xs`}>
                              {user.inventoryVersion}
                            </td>
                            <td className={`${tdClass} text-right text-xs text-neutral-400`}>
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
                                        <th className={`${thClass} text-left`}>Item</th>
                                        <th className={`${thClass} text-right`}>Wear</th>
                                        <th className={`${thClass} text-right`}>StatTrak</th>
                                        <th className={`${thClass} text-right`}>Stickers</th>
                                        <th className={`${thClass} text-right`}>Keychains</th>
                                        <th className={`${thClass} text-right`}>Name Tag</th>
                                        <th className={`${thClass} text-right`}>Equipped</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {user.items.map((item) => (
                                        <tr key={item.uid}>
                                          <td className={`${tdClass} text-left font-medium text-white`}>
                                            {item.name}
                                          </td>
                                          <td className={`${tdClass} text-right font-mono text-xs`}>
                                            {formatWear(item.wear)}
                                          </td>
                                          <td className={`${tdClass} text-right font-mono text-xs`}>
                                            {item.statTrak !== undefined
                                              ? formatNumber(item.statTrak)
                                              : "—"}
                                          </td>
                                          <td className={`${tdClass} text-right font-mono text-xs`}>
                                            {item.stickerCount}
                                          </td>
                                          <td className={`${tdClass} text-right font-mono text-xs`}>
                                            {item.keychainCount}
                                          </td>
                                          <td className={`${tdClass} text-right text-xs text-amber-200/80`}>
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
      )}
      </div>
    </Modal>
  );
}