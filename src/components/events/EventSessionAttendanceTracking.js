import {
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  QrCode,
  Search,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

const DEFAULT_SESSIONS = [
  {
    id: "session-001",
    title: "Opening Keynote",
    speaker: "Event Organizer",
    startTime: "09:00",
    endTime: "10:00",
    date: "2026-08-20",
  },
  {
    id: "session-002",
    title: "AI & Machine Learning",
    speaker: "Dr. Ananya Shah",
    startTime: "10:15",
    endTime: "11:30",
    date: "2026-08-20",
  },
  {
    id: "session-003",
    title: "Building Modern Web Apps",
    speaker: "Rahul Mehta",
    startTime: "11:45",
    endTime: "13:00",
    date: "2026-08-20",
  },
  {
    id: "session-004",
    title: "Hackathon Project Review",
    speaker: "Technical Panel",
    startTime: "14:00",
    endTime: "16:00",
    date: "2026-08-20",
  },
];

const DEFAULT_PARTICIPANTS = [
  {
    id: "REG-1001",
    name: "Aarav Sharma",
    email: "aarav@example.com",
  },
  {
    id: "REG-1002",
    name: "Priya Patel",
    email: "priya@example.com",
  },
  {
    id: "REG-1003",
    name: "Rahul Joshi",
    email: "rahul@example.com",
  },
  {
    id: "REG-1004",
    name: "Neha Shah",
    email: "neha@example.com",
  },
  {
    id: "REG-1005",
    name: "Karan Mehta",
    email: "karan@example.com",
  },
  {
    id: "REG-1006",
    name: "Diya Patel",
    email: "diya@example.com",
  },
];

const createDefaultAttendance = (
  sessions,
  participants
) => {
  const attendance = {};

  sessions.forEach((session, sessionIndex) => {
    attendance[session.id] = {};

    participants.forEach(
      (participant, participantIndex) => {
        const present =
          (sessionIndex +
            participantIndex) %
            3 !==
          0;

        attendance[session.id][
          participant.id
        ] = {
          status: present
            ? "Present"
            : "Absent",
          checkInTime: present
            ? `${session.startTime}`
            : null,
          method: present
            ? "QR Check-in"
            : null,
        };
      }
    );
  });

  return attendance;
};

const EventSessionAttendanceTracking = ({
  eventId = "event-001",
  eventTitle = "AI & ML Hackathon",
  sessions = DEFAULT_SESSIONS,
  participants = DEFAULT_PARTICIPANTS,
  initialAttendance,
  onCheckIn,
  onCheckOut,
  onAttendanceChange,
  onExport,
  className = "",
}) => {
  const [attendance, setAttendance] =
    useState(
      initialAttendance ||
        createDefaultAttendance(
          sessions,
          participants
        )
    );

  const [selectedSessionId, setSelectedSessionId] =
    useState(
      sessions[0]?.id || ""
    );

  const [search, setSearch] = useState(
    ""
  );

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [showQrModal, setShowQrModal] =
    useState(false);

  const [notice, setNotice] =
    useState("");

  const [activeTab, setActiveTab] =
    useState("attendance");

  const selectedSession =
    sessions.find(
      (session) =>
        session.id ===
        selectedSessionId
    ) || sessions[0];

  const sessionAttendance =
    attendance[
      selectedSession?.id
    ] || {};

  const filteredParticipants =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return participants.filter(
        (participant) => {
          const matchesSearch =
            !query ||
            participant.name
              .toLowerCase()
              .includes(query) ||
            participant.email
              .toLowerCase()
              .includes(query) ||
            participant.id
              .toLowerCase()
              .includes(query);

          const record =
            sessionAttendance[
              participant.id
            ];

          const matchesStatus =
            statusFilter === "All" ||
            record?.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      participants,
      search,
      statusFilter,
      sessionAttendance,
    ]);

  const getSessionStats = (
    sessionId
  ) => {
    const records =
      attendance[sessionId] || {};

    const total =
      participants.length;

    const present = participants.filter(
      (participant) =>
        records[participant.id]
          ?.status === "Present"
    ).length;

    const absent = total - present;

    const percentage =
      total > 0
        ? Math.round(
            (present / total) * 100
          )
        : 0;

    return {
      total,
      present,
      absent,
      percentage,
    };
  };

  const currentStats =
    selectedSession
      ? getSessionStats(
          selectedSession.id
        )
      : {
          total: 0,
          present: 0,
          absent: 0,
          percentage: 0,
        };

  const totalPresentAcrossSessions =
    sessions.reduce(
      (total, session) =>
        total +
        getSessionStats(session.id)
          .present,
      0
    );

  const averageAttendance =
    sessions.length > 0
      ? Math.round(
          sessions.reduce(
            (total, session) =>
              total +
              getSessionStats(
                session.id
              ).percentage,
            0
          ) / sessions.length
        )
      : 0;

  const updateAttendance = async ({
    sessionId,
    participantId,
    status,
    method = "Manual",
  }) => {
    const now = new Date();

    const previous =
      attendance[sessionId]?.[
        participantId
      ];

    const updatedRecord = {
      status,
      method,
      checkInTime:
        status === "Present"
          ? previous?.checkInTime ||
            formatTime(now)
          : null,
      checkOutTime:
        status === "Absent"
          ? null
          : previous?.checkOutTime ||
            null,
      updatedAt:
        now.toISOString(),
    };

    setAttendance((current) => ({
      ...current,
      [sessionId]: {
        ...(current[sessionId] || {}),
        [participantId]:
          updatedRecord,
      },
    }));

    const participant =
      participants.find(
        (item) =>
          item.id === participantId
      );

    setNotice(
      `${participant?.name || "Participant"} marked ${status.toLowerCase()}.`
    );

    await onAttendanceChange?.({
      eventId,
      eventTitle,
      sessionId,
      participantId,
      status,
      method,
      record: updatedRecord,
    });

    if (status === "Present") {
      await onCheckIn?.({
        eventId,
        eventTitle,
        sessionId,
        participantId,
        record: updatedRecord,
      });
    }
  };

  const handleQrCheckIn = async (
    participantId
  ) => {
    if (!selectedSession) return;

    await updateAttendance({
      sessionId:
        selectedSession.id,
      participantId,
      status: "Present",
      method: "QR Check-in",
    });

    setShowQrModal(false);
  };

  const exportAttendance = () => {
    const rows = [
      [
        "Registration ID",
        "Participant",
        "Email",
        "Session",
        "Date",
        "Start Time",
        "End Time",
        "Status",
        "Check-in Time",
        "Check-in Method",
      ],
    ];

    sessions.forEach((session) => {
      participants.forEach(
        (participant) => {
          const record =
            attendance[session.id]?.[
              participant.id
            ] || {};

          rows.push([
            participant.id,
            participant.name,
            participant.email,
            session.title,
            session.date,
            session.startTime,
            session.endTime,
            record.status ||
              "Absent",
            record.checkInTime || "",
            record.method || "",
          ]);
        }
      );
    });

    const csv = rows
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replace(
                /"/g,
                '""'
              )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download = `${eventTitle
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()}-session-attendance.csv`;

    link.click();

    URL.revokeObjectURL(url);

    onExport?.({
      eventId,
      eventTitle,
      rows,
    });

    setNotice(
      "Attendance report exported successfully."
    );
  };

  return (
    <section
      className={`rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-950 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
            <BarChart3
              size={21}
              className="text-indigo-600 dark:text-indigo-400"
            />
          </div>

          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Organizer Analytics
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
              Session Attendance Tracking
            </h2>

            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500 dark:text-slate-400">
              Track participant attendance for individual event sessions using
              QR check-in or manual attendance.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={exportAttendance}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-[9px] font-bold text-white hover:bg-indigo-700"
        >
          <Download size={13} />
          Export Attendance
        </button>
      </div>

      {/* Notice */}
      {notice && (
        <div className="mt-5 flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 dark:border-indigo-900/30 dark:bg-indigo-900/10">
          <p className="text-[9px] font-semibold text-indigo-700 dark:text-indigo-300">
            {notice}
          </p>

          <button
            type="button"
            onClick={() => setNotice("")}
            className="text-indigo-400 hover:text-indigo-700"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<Users size={15} />}
          label="Participants"
          value={participants.length}
        />

        <StatCard
          icon={<CheckCircle2 size={15} />}
          label="Current Session Present"
          value={currentStats.present}
        />

        <StatCard
          icon={<Calendar size={15} />}
          label="Sessions"
          value={sessions.length}
        />

        <StatCard
          icon={<BarChart3 size={15} />}
          label="Average Attendance"
          value={`${averageAttendance}%`}
        />
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-xl bg-slate-200 p-1 dark:bg-slate-800">
        <TabButton
          active={
            activeTab === "attendance"
          }
          onClick={() =>
            setActiveTab("attendance")
          }
        >
          Participant Attendance
        </TabButton>

        <TabButton
          active={
            activeTab === "overview"
          }
          onClick={() =>
            setActiveTab("overview")
          }
        >
          Session Overview
        </TabButton>
      </div>

      {/* Participant attendance */}
      {activeTab === "attendance" && (
        <div className="mt-5">
          {/* Session selector */}
          <div className="grid gap-3 md:grid-cols-2">
            {sessions.map((session) => {
              const stats =
                getSessionStats(
                  session.id
                );

              const active =
                session.id ===
                selectedSessionId;

              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() =>
                    setSelectedSessionId(
                      session.id
                    )
                  }
                  className={`rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/20 dark:ring-indigo-900/20"
                      : "border-slate-200 bg-white hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-900"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                        Session
                      </p>

                      <h3 className="mt-1 text-xs font-bold text-slate-800 dark:text-white">
                        {session.title}
                      </h3>
                    </div>

                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[7px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {stats.percentage}%
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-[8px] text-slate-400">
                    <span>
                      {session.startTime} -{" "}
                      {session.endTime}
                    </span>

                    <span>
                      {stats.present}/
                      {stats.total} present
                    </span>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all"
                      style={{
                        width: `${stats.percentage}%`,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Current session */}
          {selectedSession && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                      {selectedSession.title}
                    </h3>

                    <span className="rounded-full bg-green-50 px-2 py-1 text-[7px] font-bold text-green-600 dark:bg-green-900/20 dark:text-green-400">
                      {currentStats.percentage}%
                      Attendance
                    </span>
                  </div>

                  <p className="mt-1 text-[8px] text-slate-400">
                    {selectedSession.date} ·{" "}
                    {selectedSession.startTime} -{" "}
                    {selectedSession.endTime}
                  </p>

                  <p className="mt-1 text-[8px] text-slate-400">
                    Speaker:{" "}
                    {selectedSession.speaker}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowQrModal(true)
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-[9px] font-bold text-indigo-600 hover:bg-indigo-100 dark:border-indigo-900/40 dark:bg-indigo-900/20 dark:text-indigo-400"
                >
                  <QrCode size={14} />
                  QR Check-in
                </button>
              </div>

              {/* Search/filter */}
              <div className="mt-5 flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search participant or registration ID..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[9px] font-semibold text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                >
                  <option value="All">
                    All Status
                  </option>

                  <option value="Present">
                    Present
                  </option>

                  <option value="Absent">
                    Absent
                  </option>
                </select>
              </div>

              {/* Participant table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="px-3 py-3 text-left text-[7px] font-bold uppercase tracking-wide text-slate-400">
                        Participant
                      </th>

                      <th className="px-3 py-3 text-left text-[7px] font-bold uppercase tracking-wide text-slate-400">
                        Registration ID
                      </th>

                      <th className="px-3 py-3 text-left text-[7px] font-bold uppercase tracking-wide text-slate-400">
                        Status
                      </th>

                      <th className="px-3 py-3 text-left text-[7px] font-bold uppercase tracking-wide text-slate-400">
                        Check-in
                      </th>

                      <th className="px-3 py-3 text-left text-[7px] font-bold uppercase tracking-wide text-slate-400">
                        Method
                      </th>

                      <th className="px-3 py-3 text-right text-[7px] font-bold uppercase tracking-wide text-slate-400">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredParticipants.map(
                      (participant) => {
                        const record =
                          sessionAttendance[
                            participant.id
                          ] || {
                            status:
                              "Absent",
                          };

                        return (
                          <ParticipantRow
                            key={
                              participant.id
                            }
                            participant={
                              participant
                            }
                            record={record}
                            onPresent={() =>
                              updateAttendance({
                                sessionId:
                                  selectedSession.id,
                                participantId:
                                  participant.id,
                                status:
                                  "Present",
                                method:
                                  "Manual",
                              })
                            }
                            onAbsent={() =>
                              updateAttendance({
                                sessionId:
                                  selectedSession.id,
                                participantId:
                                  participant.id,
                                status:
                                  "Absent",
                                method:
                                  "Manual",
                              })
                            }
                          />
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              {filteredParticipants.length ===
                0 && (
                <div className="py-10 text-center">
                  <Users
                    size={22}
                    className="mx-auto text-slate-300 dark:text-slate-600"
                  />

                  <p className="mt-2 text-[9px] font-semibold text-slate-400">
                    No participants found.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Session overview */}
      {activeTab === "overview" && (
        <div className="mt-5">
          <div className="grid gap-3 lg:grid-cols-2">
            {sessions.map((session) => {
              const stats =
                getSessionStats(
                  session.id
                );

              return (
                <SessionOverviewCard
                  key={session.id}
                  session={session}
                  stats={stats}
                  onClick={() => {
                    setSelectedSessionId(
                      session.id
                    );
                    setActiveTab(
                      "attendance"
                    );
                  }}
                />
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <BarChart3
                size={15}
                className="text-indigo-600 dark:text-indigo-400"
              />

              <h3 className="text-xs font-bold text-slate-800 dark:text-white">
                Attendance Summary
              </h3>
            </div>

            <div className="mt-5">
              {sessions.map((session) => {
                const stats =
                  getSessionStats(
                    session.id
                  );

                return (
                  <div
                    key={session.id}
                    className="mb-4 last:mb-0"
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <p className="truncate text-[8px] font-semibold text-slate-600 dark:text-slate-300">
                        {session.title}
                      </p>

                      <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400">
                        {stats.percentage}%
                      </p>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all"
                        style={{
                          width: `${stats.percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <SummaryBox
              label="Total Session Check-ins"
              value={
                totalPresentAcrossSessions
              }
            />

            <SummaryBox
              label="Average Session Attendance"
              value={`${averageAttendance}%`}
            />
          </div>
        </div>
      )}

      {/* QR modal */}
      {showQrModal &&
        selectedSession && (
          <QrCheckInModal
            session={selectedSession}
            participants={participants}
            attendance={sessionAttendance}
            onClose={() =>
              setShowQrModal(false)
            }
            onCheckIn={
              handleQrCheckIn
            }
          />
        )}
    </section>
  );
};

/* ----------------------------------
   Statistic card
----------------------------------- */

const StatCard = ({
  icon,
  label,
  value,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
          {icon}
        </div>

        <span className="text-lg font-bold text-slate-800 dark:text-white">
          {value}
        </span>
      </div>

      <p className="mt-3 text-[8px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
    </div>
  );
};

/* ----------------------------------
   Tab button
----------------------------------- */

const TabButton = ({
  active,
  children,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg px-4 py-2.5 text-[9px] font-bold ${
        active
          ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
          : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
      }`}
    >
      {children}
    </button>
  );
};

/* ----------------------------------
   Participant row
----------------------------------- */

const ParticipantRow = ({
  participant,
  record,
  onPresent,
  onAbsent,
}) => {
  const present =
    record.status === "Present";

  return (
    <tr className="border-b border-slate-100 last:border-0 dark:border-slate-800">
      <td className="px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-[8px] font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            {getInitials(
              participant.name
            )}
          </div>

          <div>
            <p className="text-[9px] font-bold text-slate-700 dark:text-slate-200">
              {participant.name}
            </p>

            <p className="mt-0.5 text-[7px] text-slate-400">
              {participant.email}
            </p>
          </div>
        </div>
      </td>

      <td className="px-3 py-3 text-[8px] font-semibold text-slate-500 dark:text-slate-400">
        {participant.id}
      </td>

      <td className="px-3 py-3">
        <AttendanceBadge
          status={
            record.status || "Absent"
          }
        />
      </td>

      <td className="px-3 py-3 text-[8px] text-slate-500 dark:text-slate-400">
        {record.checkInTime || "—"}
      </td>

      <td className="px-3 py-3 text-[8px] text-slate-500 dark:text-slate-400">
        {record.method || "—"}
      </td>

      <td className="px-3 py-3">
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={onPresent}
            disabled={present}
            title="Mark Present"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-green-900/20 dark:text-green-400"
          >
            <Check size={12} />
          </button>

          <button
            type="button"
            onClick={onAbsent}
            disabled={!present}
            title="Mark Absent"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-red-900/20 dark:text-red-400"
          >
            <X size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
};

/* ----------------------------------
   Attendance badge
----------------------------------- */

const AttendanceBadge = ({
  status,
}) => {
  const present =
    status === "Present";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[7px] font-bold ${
        present
          ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
          : "bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400"
      }`}
    >
      {present ? (
        <CheckCircle2 size={10} />
      ) : (
        <XCircle size={10} />
      )}

      {status}
    </span>
  );
};

/* ----------------------------------
   Session overview card
----------------------------------- */

const SessionOverviewCard = ({
  session,
  stats,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            {session.date}
          </p>

          <h3 className="mt-1 text-xs font-bold text-slate-800 dark:text-white">
            {session.title}
          </h3>

          <p className="mt-1 text-[8px] text-slate-400">
            {session.startTime} -{" "}
            {session.endTime}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-indigo-100 text-[9px] font-bold text-indigo-600 dark:border-indigo-900/30 dark:text-indigo-400">
          {stats.percentage}%
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniStat
          label="Total"
          value={stats.total}
        />

        <MiniStat
          label="Present"
          value={stats.present}
        />

        <MiniStat
          label="Absent"
          value={stats.absent}
        />
      </div>
    </button>
  );
};

/* ----------------------------------
   Mini stat
----------------------------------- */

const MiniStat = ({
  label,
  value,
}) => {
  return (
    <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-950">
      <p className="text-[7px] font-bold uppercase text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">
        {value}
      </p>
    </div>
  );
};

/* ----------------------------------
   Summary box
----------------------------------- */

const SummaryBox = ({
  label,
  value,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-slate-800 dark:text-white">
        {value}
      </p>
    </div>
  );
};

/* ----------------------------------
   QR Check-in modal
----------------------------------- */

const QrCheckInModal = ({
  session,
  participants,
  attendance,
  onClose,
  onCheckIn,
}) => {
  const [registrationId, setRegistrationId] =
    useState("");

  const [error, setError] =
    useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const normalized =
      registrationId
        .trim()
        .toUpperCase();

    const participant =
      participants.find(
        (item) =>
          item.id.toUpperCase() ===
          normalized
      );

    if (!participant) {
      setError(
        "Registration ID not found."
      );
      return;
    }

    const record =
      attendance[participant.id];

    if (record?.status === "Present") {
      setError(
        "This participant is already checked in."
      );
      return;
    }

    onCheckIn(participant.id);

    setRegistrationId("");
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <QrCode
                size={17}
                className="text-indigo-600 dark:text-indigo-400"
              />

              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                QR Check-in
              </h3>
            </div>

            <p className="mt-1 text-[8px] leading-4 text-slate-400">
              Scan the participant QR code or enter their registration ID.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={15} />
          </button>
        </div>

        <div className="mt-5 flex flex-col items-center rounded-2xl bg-slate-50 p-6 dark:bg-slate-950">
          <div className="flex h-32 w-32 items-center justify-center rounded-2xl border-4 border-indigo-100 bg-white dark:border-indigo-900/30">
            <QrCode
              size={82}
              strokeWidth={1.4}
              className="text-slate-800 dark:text-slate-200"
            />
          </div>

          <p className="mt-4 text-[9px] font-bold text-slate-700 dark:text-slate-200">
            {session.title}
          </p>

          <p className="mt-1 text-[7px] text-slate-400">
            {session.date} ·{" "}
            {session.startTime}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-5"
        >
          <label className="text-[8px] font-bold text-slate-500 dark:text-slate-400">
            Registration ID
          </label>

          <input
            value={registrationId}
            onChange={(event) =>
              setRegistrationId(
                event.target.value
              )
            }
            placeholder="Example: REG-1001"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />

          {error && (
            <p className="mt-2 text-[8px] font-semibold text-red-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-[9px] font-bold text-white hover:bg-indigo-700"
          >
            <Check size={12} />
            Check In Participant
          </button>
        </form>
      </div>
    </div>
  );
};

/* ----------------------------------
   Helpers
----------------------------------- */

const getInitials = (
  name = ""
) => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]?.toUpperCase() || ""
    )
    .join("");
};

const formatTime = (date) => {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  ).format(date);
};

export default EventSessionAttendanceTracking;