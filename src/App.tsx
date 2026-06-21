import {
  AlertTriangle,
  CalendarDays,
  Check,
  ClipboardList,
  Clock3,
  Copy,
  Download,
  FileText,
  HeartHandshake,
  Home,
  Plus,
  PhoneCall,
  Printer,
  RotateCcw,
  ShieldCheck,
  Search,
  Upload,
  UserRound,
  X,
} from 'lucide-react'
import type { CSSProperties, ChangeEvent, FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import './App.css'

type NavKey = 'today' | 'profile' | 'routines' | 'log' | 'emergency'
type RoutineFilter = 'all' | 'open' | 'done'

type CareProfile = {
  preferredName: string
  pronouns: string
  homeBase: string
  language: string
  comfortItems: string
  calmingActivities: string
  avoid: string
  notes: string
}

type RoutineItem = {
  id: string
  title: string
  time: string
  category: string
  notes: string
  done: boolean
}

type Contact = {
  id: string
  name: string
  relation: string
  phone: string
  notes: string
}

type LogEntry = {
  id: string
  date: string
  mood: string
  sleep: string
  appetite: string
  notes: string
}

type Backup = {
  version: 1
  exportedAt: string
  profile: CareProfile
  routines: RoutineItem[]
  contacts: Contact[]
  logEntries: LogEntry[]
}

type NavItem = {
  key: NavKey
  label: string
  icon: LucideIcon
}

const storageKey = 'alzheimers-carekit:v1'

const defaultProfile: CareProfile = {
  preferredName: 'Mara',
  pronouns: 'she/her',
  homeBase: 'Blue house on Oak Street',
  language: 'English',
  comfortItems: 'Blue cardigan, photo album, chamomile tea',
  calmingActivities: 'Classic jazz, folding towels, short garden walks',
  avoid: 'Crowded rooms, rushed transitions, loud television',
  notes:
    'Speaks more easily when offered two simple choices. Likes morning routines to start slowly.',
}

const defaultRoutines: RoutineItem[] = [
  {
    id: 'routine-breakfast',
    title: 'Breakfast and morning medicine',
    time: '08:00',
    category: 'Morning',
    notes: 'Serve oatmeal with berries. Confirm medicine with the care plan.',
    done: false,
  },
  {
    id: 'routine-walk',
    title: 'Ten minute garden walk',
    time: '10:30',
    category: 'Activity',
    notes: 'Bring a light jacket and keep the route familiar.',
    done: false,
  },
  {
    id: 'routine-lunch',
    title: 'Lunch and hydration check',
    time: '12:30',
    category: 'Meals',
    notes: 'Offer water before and after the meal.',
    done: false,
  },
  {
    id: 'routine-call',
    title: 'Family call',
    time: '16:00',
    category: 'Connection',
    notes: 'Call Daniel first, then try Ana if needed.',
    done: false,
  },
]

const defaultContacts: Contact[] = [
  {
    id: 'contact-primary',
    name: 'Daniel Reyes',
    relation: 'Primary caregiver',
    phone: '(555) 010-1188',
    notes: 'Call first for schedule changes.',
  },
  {
    id: 'contact-clinic',
    name: 'Memory clinic',
    relation: 'Care team',
    phone: '(555) 010-4400',
    notes: 'Weekdays, 8 AM to 5 PM.',
  },
]

const defaultLogEntries: LogEntry[] = [
  {
    id: 'log-sample',
    date: new Date().toISOString().slice(0, 10),
    mood: 'Settled',
    sleep: 'Good',
    appetite: 'Normal',
    notes: 'Enjoyed looking through the family photo album after lunch.',
  },
]

const navItems: NavItem[] = [
  { key: 'today', label: 'Today', icon: Home },
  { key: 'profile', label: 'Care profile', icon: UserRound },
  { key: 'routines', label: 'Routines', icon: ClipboardList },
  { key: 'log', label: 'Care log', icon: FileText },
  { key: 'emergency', label: 'Emergency', icon: ShieldCheck },
]

const quickMoodOptions = ['Settled', 'Anxious', 'Confused', 'Cheerful']

const emptyRoutine = {
  title: '',
  time: '09:00',
  category: 'Care',
  notes: '',
}

const emptyContact = {
  name: '',
  relation: '',
  phone: '',
  notes: '',
}

const emptyLogEntry = {
  date: new Date().toISOString().slice(0, 10),
  mood: 'Settled',
  sleep: 'Okay',
  appetite: 'Normal',
  notes: '',
}

function createId(prefix: string) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function byRoutineTime(a: RoutineItem, b: RoutineItem) {
  return a.time.localeCompare(b.time)
}

function createBackup(
  profile: CareProfile,
  routines: RoutineItem[],
  contacts: Contact[],
  logEntries: LogEntry[],
): Backup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile,
    routines,
    contacts,
    logEntries,
  }
}

function loadBackup(): Backup {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) {
      return createBackup(
        defaultProfile,
        defaultRoutines,
        defaultContacts,
        defaultLogEntries,
      )
    }

    const parsed = JSON.parse(raw) as Partial<Backup>

    return createBackup(
      { ...defaultProfile, ...parsed.profile },
      Array.isArray(parsed.routines) ? parsed.routines : defaultRoutines,
      Array.isArray(parsed.contacts) ? parsed.contacts : defaultContacts,
      Array.isArray(parsed.logEntries) ? parsed.logEntries : defaultLogEntries,
    )
  } catch {
    return createBackup(
      defaultProfile,
      defaultRoutines,
      defaultContacts,
      defaultLogEntries,
    )
  }
}

function saveBackup(backup: Backup) {
  localStorage.setItem(storageKey, JSON.stringify(backup))
}

function downloadFile(filename: string, body: string, type: string) {
  const blob = new Blob([body], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function csvValue(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}

function logEntriesToCsv(entries: LogEntry[]) {
  const header = ['date', 'mood', 'sleep', 'appetite', 'notes']
  const rows = entries.map((entry) =>
    [entry.date, entry.mood, entry.sleep, entry.appetite, entry.notes]
      .map(csvValue)
      .join(','),
  )

  return [header.join(','), ...rows].join('\n')
}

function includesText(value: string, query: string) {
  return value.toLowerCase().includes(query.trim().toLowerCase())
}

function timeLabel(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function currentSortableTime() {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
  }).format(new Date())
}

function StatBlock({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: LucideIcon
}) {
  return (
    <div className="stat-block">
      <Icon aria-hidden="true" size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function App() {
  const initialData = useMemo(() => loadBackup(), [])
  const [activeTab, setActiveTab] = useState<NavKey>('today')
  const [profile, setProfile] = useState(initialData.profile)
  const [routines, setRoutines] = useState(
    [...initialData.routines].sort(byRoutineTime),
  )
  const [contacts, setContacts] = useState(initialData.contacts)
  const [logEntries, setLogEntries] = useState(
    [...initialData.logEntries].sort((a, b) => b.date.localeCompare(a.date)),
  )
  const [routineDraft, setRoutineDraft] = useState(emptyRoutine)
  const [contactDraft, setContactDraft] = useState(emptyContact)
  const [logDraft, setLogDraft] = useState(emptyLogEntry)
  const [quickLog, setQuickLog] = useState('')
  const [quickMood, setQuickMood] = useState('Settled')
  const [routineFilter, setRoutineFilter] = useState<RoutineFilter>('all')
  const [routineQuery, setRoutineQuery] = useState('')
  const [logQuery, setLogQuery] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const quickNoteRef = useRef<HTMLTextAreaElement>(null)

  const backup = useMemo(
    () => createBackup(profile, routines, contacts, logEntries),
    [contacts, logEntries, profile, routines],
  )

  const completedRoutines = routines.filter((routine) => routine.done).length
  const openRoutines = routines.filter((routine) => !routine.done)
  const nextRoutine = openRoutines[0]
  const upcomingRoutines = openRoutines.slice(0, 3)
  const latestLog = logEntries[0]
  const currentTime = currentSortableTime()
  const dueNowCount = openRoutines.filter(
    (routine) => routine.time <= currentTime,
  ).length
  const todayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date())
  const progress =
    routines.length > 0
      ? Math.round((completedRoutines / routines.length) * 100)
      : 0
  const progressStyle = {
    '--progress-degrees': `${progress * 3.6}deg`,
  } as CSSProperties
  const lastSavedAt = timeLabel(new Date(backup.exportedAt))
  const filteredRoutines = routines.filter((routine) => {
    const matchesFilter =
      routineFilter === 'all' ||
      (routineFilter === 'open' && !routine.done) ||
      (routineFilter === 'done' && routine.done)
    const text = `${routine.title} ${routine.category} ${routine.notes}`

    return matchesFilter && includesText(text, routineQuery)
  })
  const filteredLogEntries = logEntries.filter((entry) =>
    includesText(
      `${entry.date} ${entry.mood} ${entry.sleep} ${entry.appetite} ${entry.notes}`,
      logQuery,
    ),
  )
  const primaryContact = contacts[0]
  const setupSteps = [
    {
      label: 'Profile basics',
      detail:
        profile.preferredName && profile.homeBase
          ? profile.homeBase
          : 'Name and home base',
      complete: Boolean(profile.preferredName && profile.homeBase),
      tab: 'profile' as NavKey,
    },
    {
      label: 'Comfort plan',
      detail:
        profile.comfortItems && profile.calmingActivities
          ? profile.comfortItems
          : 'Comfort items and calming activities',
      complete: Boolean(profile.comfortItems && profile.calmingActivities),
      tab: 'profile' as NavKey,
    },
    {
      label: 'Care circle',
      detail:
        contacts.length > 0 ? `${contacts.length} contacts` : 'At least one contact',
      complete: contacts.length > 0,
      tab: 'profile' as NavKey,
    },
    {
      label: 'Daily routine',
      detail:
        routines.length > 0
          ? `${routines.length} routine items`
          : 'At least one routine',
      complete: routines.length > 0,
      tab: 'routines' as NavKey,
    },
  ]
  const completedSetupSteps = setupSteps.filter((step) => step.complete).length
  const handoffSummary = [
    `Care handoff for ${profile.preferredName || 'today'}`,
    `Progress: ${completedRoutines}/${routines.length} routines complete`,
    nextRoutine
      ? `Next routine: ${nextRoutine.time} - ${nextRoutine.title}`
      : 'Next routine: none open',
    latestLog
      ? `Latest log: ${latestLog.date}; mood ${latestLog.mood}; sleep ${latestLog.sleep}; appetite ${latestLog.appetite}; ${latestLog.notes}`
      : 'Latest log: no entries yet',
    `Comfort items: ${profile.comfortItems || 'not set'}`,
    `Avoid: ${profile.avoid || 'not set'}`,
    primaryContact
      ? `Primary contact: ${primaryContact.name}, ${primaryContact.phone}`
      : 'Primary contact: not set',
  ].join('\n')

  useEffect(() => {
    saveBackup(backup)
  }, [backup])

  function updateProfile(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const field = event.target.name as keyof CareProfile
    setProfile((current) => ({ ...current, [field]: event.target.value }))
  }

  function updateRoutineDraft(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setRoutineDraft((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  function updateContactDraft(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setContactDraft((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  function updateLogDraft(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setLogDraft((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  function addRoutine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!routineDraft.title.trim()) {
      return
    }

    setRoutines((current) =>
      [
        ...current,
        {
          id: createId('routine'),
          title: routineDraft.title.trim(),
          time: routineDraft.time,
          category: routineDraft.category.trim() || 'Care',
          notes: routineDraft.notes.trim(),
          done: false,
        },
      ].sort(byRoutineTime),
    )
    setRoutineDraft(emptyRoutine)
  }

  function toggleRoutine(id: string) {
    setRoutines((current) =>
      current.map((routine) =>
        routine.id === id ? { ...routine, done: !routine.done } : routine,
      ),
    )
  }

  function removeRoutine(id: string) {
    setRoutines((current) => current.filter((routine) => routine.id !== id))
  }

  function resetRoutines() {
    setRoutines((current) =>
      current.map((routine) => ({ ...routine, done: false })),
    )
  }

  function markNextRoutineDone() {
    if (!nextRoutine) {
      return
    }

    setRoutines((current) =>
      current.map((routine) =>
        routine.id === nextRoutine.id ? { ...routine, done: true } : routine,
      ),
    )
  }

  function addContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!contactDraft.name.trim() || !contactDraft.phone.trim()) {
      return
    }

    setContacts((current) => [
      ...current,
      {
        id: createId('contact'),
        name: contactDraft.name.trim(),
        relation: contactDraft.relation.trim(),
        phone: contactDraft.phone.trim(),
        notes: contactDraft.notes.trim(),
      },
    ])
    setContactDraft(emptyContact)
  }

  function removeContact(id: string) {
    setContacts((current) => current.filter((contact) => contact.id !== id))
  }

  function addLogEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!logDraft.notes.trim()) {
      return
    }

    setLogEntries((current) =>
      [
        {
          id: createId('log'),
          date: logDraft.date,
          mood: logDraft.mood,
          sleep: logDraft.sleep,
          appetite: logDraft.appetite,
          notes: logDraft.notes.trim(),
        },
        ...current,
      ].sort((a, b) => b.date.localeCompare(a.date)),
    )
    setLogDraft(emptyLogEntry)
  }

  function addQuickLogEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!quickLog.trim()) {
      return
    }

    setLogEntries((current) => [
      {
        id: createId('log'),
        date: new Date().toISOString().slice(0, 10),
        mood: quickMood,
        sleep: 'Not recorded',
        appetite: 'Not recorded',
        notes: quickLog.trim(),
      },
      ...current,
    ])
    setQuickLog('')
  }

  function focusQuickNote() {
    quickNoteRef.current?.focus()
  }

  function removeLogEntry(id: string) {
    setLogEntries((current) => current.filter((entry) => entry.id !== id))
  }

  function exportBackup() {
    downloadFile(
      'alzheimers-carekit-backup.json',
      JSON.stringify(backup, null, 2),
      'application/json',
    )
  }

  function exportCareLog() {
    downloadFile('alzheimers-care-log.csv', logEntriesToCsv(logEntries), 'text/csv')
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const imported = JSON.parse(await file.text()) as Backup
      setProfile({ ...defaultProfile, ...imported.profile })
      setRoutines(
        (Array.isArray(imported.routines) ? imported.routines : []).sort(
          byRoutineTime,
        ),
      )
      setContacts(Array.isArray(imported.contacts) ? imported.contacts : [])
      setLogEntries(
        (Array.isArray(imported.logEntries) ? imported.logEntries : []).sort(
          (a, b) => b.date.localeCompare(a.date),
        ),
      )
      setImportMessage('Backup imported')
      setCopyMessage('')
    } catch {
      setImportMessage('Backup could not be imported')
      setCopyMessage('')
    }
    event.target.value = ''
  }

  async function copyHandoffSummary() {
    try {
      await navigator.clipboard.writeText(handoffSummary)
      setCopyMessage('Handoff copied')
      setImportMessage('')
    } catch {
      setCopyMessage('Copy unavailable')
      setImportMessage('')
    }
  }

  function printEmergencyCard() {
    setActiveTab('emergency')
    window.setTimeout(() => window.print(), 50)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Alzheimer's CareKit</p>
          <h1>Care dashboard for {profile.preferredName || 'today'}</h1>
          {(importMessage || copyMessage) && (
            <p className="status-line">{copyMessage || importMessage}</p>
          )}
        </div>
        <div className="topbar-actions">
          <button
            className="icon-button"
            type="button"
            onClick={exportBackup}
            title="Download backup"
            aria-label="Download backup"
          >
            <Download aria-hidden="true" size={20} />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Import backup"
            aria-label="Import backup"
          >
            <Upload aria-hidden="true" size={20} />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={printEmergencyCard}
            title="Print emergency card"
            aria-label="Print emergency card"
          >
            <Printer aria-hidden="true" size={20} />
          </button>
          <input
            ref={fileInputRef}
            className="hidden-input"
            type="file"
            accept="application/json"
            onChange={importBackup}
          />
        </div>
      </header>

      <nav className="tabs" aria-label="CareKit sections">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.key}
              className={item.key === activeTab ? 'tab active' : 'tab'}
              type="button"
              onClick={() => setActiveTab(item.key)}
            >
              <Icon aria-hidden="true" size={18} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <main>
        {activeTab === 'today' && (
          <section className="section-grid">
            <div className="intro-panel">
              <div>
                <p className="eyebrow">{todayLabel}</p>
                <h2>Next up</h2>
                <div className="status-badges" aria-label="Shift status">
                  <span>{dueNowCount} due now</span>
                  <span>{openRoutines.length} open</span>
                  <span>{lastSavedAt ? `Saved ${lastSavedAt}` : 'Saved locally'}</span>
                </div>
                {nextRoutine ? (
                  <div className="next-routine">
                    <span>{nextRoutine.time}</span>
                    <strong>{nextRoutine.title}</strong>
                    <p>{nextRoutine.notes}</p>
                  </div>
                ) : (
                  <div className="next-routine">
                    <span>{progress}%</span>
                    <strong>Routines complete</strong>
                    <p>All planned items are marked done for now.</p>
                  </div>
                )}
                <div className="hero-actions">
                  <button
                    className="primary-button"
                    type="button"
                    onClick={markNextRoutineDone}
                    disabled={!nextRoutine}
                  >
                    <Check aria-hidden="true" size={18} />
                    Mark next done
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={focusQuickNote}
                  >
                    <Plus aria-hidden="true" size={18} />
                    Add note
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={copyHandoffSummary}
                  >
                    <Copy aria-hidden="true" size={18} />
                    Copy handoff
                  </button>
                </div>
              </div>
              <div className="command-sidecar">
                <div
                  className="progress-ring"
                  style={progressStyle}
                  aria-label={`${progress}% complete`}
                >
                  <span>{progress}%</span>
                </div>
                {primaryContact && (
                  <a className="primary-contact" href={`tel:${primaryContact.phone}`}>
                    <PhoneCall aria-hidden="true" size={18} />
                    <span>{primaryContact.name}</span>
                    <strong>{primaryContact.phone}</strong>
                  </a>
                )}
              </div>
            </div>

            <div className="stats-row">
              <StatBlock
                icon={Check}
                label="Completed"
                value={`${completedRoutines}/${routines.length}`}
              />
              <StatBlock
                icon={Clock3}
                label="Due now"
                value={String(dueNowCount)}
              />
              <StatBlock
                icon={CalendarDays}
                label="Contacts"
                value={String(contacts.length)}
              />
              <StatBlock
                icon={ShieldCheck}
                label="Setup"
                value={`${completedSetupSteps}/${setupSteps.length}`}
              />
            </div>

            <section className="work-panel setup-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Care setup</p>
                  <h2>{completedSetupSteps} of {setupSteps.length} ready</h2>
                </div>
              </div>
              <div className="setup-list">
                {setupSteps.map((step) => (
                  <article
                    className={step.complete ? 'setup-step done' : 'setup-step'}
                    key={step.label}
                  >
                    <span className="setup-check" aria-hidden="true">
                      {step.complete && <Check size={16} />}
                    </span>
                    <div>
                      <h3>{step.label}</h3>
                      <p>{step.detail}</p>
                    </div>
                    <button
                      className="secondary-button compact-button"
                      type="button"
                      onClick={() => setActiveTab(step.tab)}
                    >
                      Edit
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <div className="dashboard-split">
              <section className="work-panel handoff-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Shift handoff</p>
                    <h2>Brief</h2>
                  </div>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={copyHandoffSummary}
                  >
                    <Copy aria-hidden="true" size={18} />
                    Copy
                  </button>
                </div>
                <dl className="handoff-list">
                  <div>
                    <dt>Next routine</dt>
                    <dd>
                      {nextRoutine
                        ? `${nextRoutine.time} - ${nextRoutine.title}`
                        : 'None open'}
                    </dd>
                  </div>
                  <div>
                    <dt>Latest note</dt>
                    <dd>{latestLog ? latestLog.notes : 'No log entries yet'}</dd>
                  </div>
                  <div>
                    <dt>Primary contact</dt>
                    <dd>
                      {contacts[0]
                        ? `${contacts[0].name}, ${contacts[0].phone}`
                        : 'Not set'}
                    </dd>
                  </div>
                </dl>
              </section>

              <form className="work-panel quick-note-panel" onSubmit={addQuickLogEntry}>
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Quick note</p>
                    <h2>Add to care log</h2>
                  </div>
                </div>
                <textarea
                  ref={quickNoteRef}
                  aria-label="Quick care note"
                  value={quickLog}
                  onChange={(event) => setQuickLog(event.target.value)}
                  placeholder="One important observation from this shift."
                />
                <div className="mood-chips" aria-label="Quick note mood">
                  {quickMoodOptions.map((mood) => (
                    <button
                      key={mood}
                      className={quickMood === mood ? 'selected' : ''}
                      type="button"
                      aria-pressed={quickMood === mood}
                      onClick={() => setQuickMood(mood)}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
                <button className="primary-button" type="submit">
                  <Plus aria-hidden="true" size={18} />
                  Save note
                </button>
              </form>
            </div>

            <div className="work-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Today's routine</p>
                  <h2>Checklist</h2>
                </div>
                <button className="secondary-button" type="button" onClick={resetRoutines}>
                  <RotateCcw aria-hidden="true" size={18} />
                  Reset
                </button>
              </div>
              <div className="item-list">
                {upcomingRoutines.map((routine) => (
                  <article
                    className={routine.done ? 'routine-card done' : 'routine-card'}
                    key={routine.id}
                  >
                    <button
                      className="check-button"
                      type="button"
                      onClick={() => toggleRoutine(routine.id)}
                      aria-label={`Mark ${routine.title} ${
                        routine.done ? 'not done' : 'done'
                      }`}
                    >
                      {routine.done && <Check aria-hidden="true" size={18} />}
                    </button>
                    <div>
                      <span className="time-pill">{routine.time}</span>
                      <h3>{routine.title}</h3>
                      <p>{routine.notes}</p>
                    </div>
                  </article>
                ))}
                {upcomingRoutines.length === 0 && (
                  <p className="empty-state">No open routines for now.</p>
                )}
              </div>
            </div>

            <aside className="notice-panel">
              <AlertTriangle aria-hidden="true" size={22} />
              <div>
                <h2>Care note</h2>
                <p>
                  This tool organizes caregiver information. It is not medical
                  advice, diagnosis, or emergency guidance.
                </p>
              </div>
            </aside>
          </section>
        )}

        {activeTab === 'profile' && (
          <section className="section-grid two-column">
            <form className="work-panel form-panel" onSubmit={(event) => event.preventDefault()}>
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Care profile</p>
                  <h2>Person-centered notes</h2>
                </div>
              </div>
              <label>
                Preferred name
                <input
                  name="preferredName"
                  value={profile.preferredName}
                  onChange={updateProfile}
                />
              </label>
              <label>
                Pronouns
                <input name="pronouns" value={profile.pronouns} onChange={updateProfile} />
              </label>
              <label>
                Home base
                <input name="homeBase" value={profile.homeBase} onChange={updateProfile} />
              </label>
              <label>
                Primary language
                <input name="language" value={profile.language} onChange={updateProfile} />
              </label>
              <label>
                Comfort items
                <textarea
                  name="comfortItems"
                  value={profile.comfortItems}
                  onChange={updateProfile}
                />
              </label>
              <label>
                Calming activities
                <textarea
                  name="calmingActivities"
                  value={profile.calmingActivities}
                  onChange={updateProfile}
                />
              </label>
              <label>
                Things to avoid
                <textarea name="avoid" value={profile.avoid} onChange={updateProfile} />
              </label>
              <label>
                Notes
                <textarea name="notes" value={profile.notes} onChange={updateProfile} />
              </label>
            </form>

            <div className="work-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Contacts</p>
                  <h2>Care circle</h2>
                </div>
              </div>
              <form className="inline-form" onSubmit={addContact}>
                <input
                  name="name"
                  placeholder="Name"
                  value={contactDraft.name}
                  onChange={updateContactDraft}
                />
                <input
                  name="relation"
                  placeholder="Relation"
                  value={contactDraft.relation}
                  onChange={updateContactDraft}
                />
                <input
                  name="phone"
                  placeholder="Phone"
                  value={contactDraft.phone}
                  onChange={updateContactDraft}
                />
                <textarea
                  name="notes"
                  placeholder="Notes"
                  value={contactDraft.notes}
                  onChange={updateContactDraft}
                />
                <button className="primary-button" type="submit">
                  <Plus aria-hidden="true" size={18} />
                  Add contact
                </button>
              </form>
              <div className="item-list">
                {contacts.map((contact) => (
                  <article className="contact-card" key={contact.id}>
                    <div>
                      <h3>{contact.name}</h3>
                      <p>{contact.relation}</p>
                      <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                      {contact.notes && <p>{contact.notes}</p>}
                    </div>
                    <button
                      className="icon-button quiet"
                      type="button"
                      onClick={() => removeContact(contact.id)}
                      aria-label={`Remove ${contact.name}`}
                    >
                      <X aria-hidden="true" size={18} />
                    </button>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'routines' && (
          <section className="section-grid two-column">
            <form className="work-panel form-panel" onSubmit={addRoutine}>
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Routines</p>
                  <h2>Add checklist item</h2>
                </div>
              </div>
              <label>
                Title
                <input
                  name="title"
                  value={routineDraft.title}
                  onChange={updateRoutineDraft}
                  placeholder="Morning medication"
                />
              </label>
              <label>
                Time
                <input
                  name="time"
                  type="time"
                  value={routineDraft.time}
                  onChange={updateRoutineDraft}
                />
              </label>
              <label>
                Category
                <input
                  name="category"
                  value={routineDraft.category}
                  onChange={updateRoutineDraft}
                />
              </label>
              <label>
                Notes
                <textarea
                  name="notes"
                  value={routineDraft.notes}
                  onChange={updateRoutineDraft}
                  placeholder="Add context that helps another caregiver."
                />
              </label>
              <button className="primary-button" type="submit">
                <Plus aria-hidden="true" size={18} />
                Add routine
              </button>
            </form>

            <div className="work-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Routine list</p>
                  <h2>
                    {filteredRoutines.length} of {routines.length} items
                  </h2>
                </div>
              </div>
              <div className="filter-bar">
                <label className="search-field">
                  <Search aria-hidden="true" size={18} />
                  <input
                    aria-label="Search routines"
                    value={routineQuery}
                    onChange={(event) => setRoutineQuery(event.target.value)}
                    placeholder="Search routines"
                  />
                </label>
                <div className="segmented-control" aria-label="Routine filter">
                  {(['all', 'open', 'done'] as RoutineFilter[]).map((filter) => (
                    <button
                      key={filter}
                      className={routineFilter === filter ? 'selected' : ''}
                      type="button"
                      aria-pressed={routineFilter === filter}
                      onClick={() => setRoutineFilter(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              <div className="item-list">
                {filteredRoutines.map((routine) => (
                  <article className="routine-card compact" key={routine.id}>
                    <div>
                      <span className="time-pill">{routine.time}</span>
                      <h3>{routine.title}</h3>
                      <p>
                        {routine.category}
                        {routine.notes ? ` - ${routine.notes}` : ''}
                      </p>
                    </div>
                    <button
                      className="icon-button quiet"
                      type="button"
                      onClick={() => removeRoutine(routine.id)}
                      aria-label={`Remove ${routine.title}`}
                    >
                      <X aria-hidden="true" size={18} />
                    </button>
                  </article>
                ))}
                {filteredRoutines.length === 0 && (
                  <p className="empty-state">No routines match this view.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'log' && (
          <section className="section-grid two-column">
            <form className="work-panel form-panel" onSubmit={addLogEntry}>
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Care log</p>
                  <h2>Daily observation</h2>
                </div>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={exportCareLog}
                >
                  <Download aria-hidden="true" size={18} />
                  CSV
                </button>
              </div>
              <label>
                Date
                <input
                  name="date"
                  type="date"
                  value={logDraft.date}
                  onChange={updateLogDraft}
                />
              </label>
              <label>
                Mood
                <select name="mood" value={logDraft.mood} onChange={updateLogDraft}>
                  <option>Settled</option>
                  <option>Anxious</option>
                  <option>Withdrawn</option>
                  <option>Confused</option>
                  <option>Cheerful</option>
                </select>
              </label>
              <label>
                Sleep
                <select name="sleep" value={logDraft.sleep} onChange={updateLogDraft}>
                  <option>Good</option>
                  <option>Okay</option>
                  <option>Interrupted</option>
                  <option>Poor</option>
                </select>
              </label>
              <label>
                Appetite
                <select
                  name="appetite"
                  value={logDraft.appetite}
                  onChange={updateLogDraft}
                >
                  <option>Normal</option>
                  <option>Low</option>
                  <option>High</option>
                  <option>Skipped meal</option>
                </select>
              </label>
              <label>
                Notes
                <textarea
                  name="notes"
                  value={logDraft.notes}
                  onChange={updateLogDraft}
                  placeholder="What changed, what helped, and what to watch next."
                />
              </label>
              <button className="primary-button" type="submit">
                <Plus aria-hidden="true" size={18} />
                Add note
              </button>
            </form>

            <div className="work-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">History</p>
                  <h2>
                    {filteredLogEntries.length} of {logEntries.length} entries
                  </h2>
                </div>
              </div>
              <label className="search-field full-width">
                <Search aria-hidden="true" size={18} />
                <input
                  aria-label="Search care log"
                  value={logQuery}
                  onChange={(event) => setLogQuery(event.target.value)}
                  placeholder="Search care log"
                />
              </label>
              <div className="item-list">
                {filteredLogEntries.map((entry) => (
                  <article className="log-card" key={entry.id}>
                    <div>
                      <div className="log-meta">
                        <span>{entry.date}</span>
                        <span>{entry.mood}</span>
                        <span>{entry.sleep}</span>
                        <span>{entry.appetite}</span>
                      </div>
                      <p>{entry.notes}</p>
                    </div>
                    <button
                      className="icon-button quiet"
                      type="button"
                      onClick={() => removeLogEntry(entry.id)}
                      aria-label={`Remove log entry from ${entry.date}`}
                    >
                      <X aria-hidden="true" size={18} />
                    </button>
                  </article>
                ))}
                {filteredLogEntries.length === 0 && (
                  <p className="empty-state">No log entries match this search.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'emergency' && (
          <section className="section-grid">
            <div className="print-card">
              <div className="emergency-header">
                <div>
                  <p className="eyebrow">Emergency card</p>
                  <h2>{profile.preferredName}</h2>
                </div>
                <HeartHandshake aria-hidden="true" size={34} />
              </div>
              <div className="emergency-grid">
                <div>
                  <strong>Home base</strong>
                  <p>{profile.homeBase}</p>
                </div>
                <div>
                  <strong>Primary language</strong>
                  <p>{profile.language}</p>
                </div>
                <div>
                  <strong>Comfort items</strong>
                  <p>{profile.comfortItems}</p>
                </div>
                <div>
                  <strong>Calming activities</strong>
                  <p>{profile.calmingActivities}</p>
                </div>
                <div>
                  <strong>Things to avoid</strong>
                  <p>{profile.avoid}</p>
                </div>
                <div>
                  <strong>Care notes</strong>
                  <p>{profile.notes}</p>
                </div>
              </div>
              <div className="emergency-contacts">
                <h3>Contacts</h3>
                {contacts.map((contact) => (
                  <div key={contact.id}>
                    <strong>{contact.name}</strong>
                    <span>{contact.relation}</span>
                    <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
