import * as AlertDialog from '@radix-ui/react-alert-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import * as Toast from '@radix-ui/react-toast'
import * as Tooltip from '@radix-ui/react-tooltip'
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
  HeartPulse,
  ShieldCheck,
  Search,
  Upload,
  UserRound,
  X,
} from 'lucide-react'
import type { CSSProperties, ChangeEvent, FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import './App.css'

type NavKey = 'today' | 'profile' | 'routines' | 'log' | 'safety' | 'emergency'
type PrintTarget = 'none' | 'emergency' | 'shift'
type RoutineFilter = 'all' | 'open' | 'done'
type ToastTone = 'success' | 'info' | 'danger'

type ToastState = {
  title: string
  description: string
  tone: ToastTone
}

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

type SafetyItem = {
  id: string
  title: string
  category: string
  detail: string
  done: boolean
}

type SupportCard = {
  id: string
  cue: string
  tryThis: string
  avoid: string
  note: string
  usedToday: boolean
}

type Backup = {
  version: 1
  exportedAt: string
  profile: CareProfile
  routines: RoutineItem[]
  contacts: Contact[]
  logEntries: LogEntry[]
  safetyItems: SafetyItem[]
  supportCards: SupportCard[]
}

type NavItem = {
  key: NavKey
  label: string
  shortLabel: string
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

const defaultSafetyItems: SafetyItem[] = [
  {
    id: 'safety-id-card',
    title: 'Emergency contact card is ready',
    category: 'Wandering prep',
    detail: 'Keep a current contact card in the wallet, coat pocket, or go bag.',
    done: false,
  },
  {
    id: 'safety-walk-route',
    title: 'Favorite walking routes are written down',
    category: 'Wandering prep',
    detail: 'Note familiar places, nearby exits, and who to call first.',
    done: false,
  },
  {
    id: 'safety-trip-hazards',
    title: 'Walkways are clear',
    category: 'Home safety',
    detail: 'Check cords, loose rugs, clutter, and poorly lit paths.',
    done: false,
  },
  {
    id: 'safety-quiet-space',
    title: 'Quiet reset space is prepared',
    category: 'Comfort',
    detail: 'Keep comfort items, low noise, and soft lighting ready.',
    done: false,
  },
]

const defaultSupportCards: SupportCard[] = [
  {
    id: 'support-looking-for-home',
    cue: 'Looking for home or asking to leave',
    tryThis:
      'Validate the feeling, offer a familiar object, and redirect to a short walk or photo album.',
    avoid: 'Arguing about where home is or rushing the transition.',
    note: 'Use two simple choices and a calm voice.',
    usedToday: false,
  },
  {
    id: 'support-evening-confusion',
    cue: 'Evening confusion or restlessness',
    tryThis:
      'Lower noise, simplify the room, offer water, and start a familiar evening routine.',
    avoid: 'Crowded rooms, loud television, and too many questions at once.',
    note: 'Classic jazz and folding towels usually help.',
    usedToday: false,
  },
]

const navItems: NavItem[] = [
  { key: 'today', label: 'Today', shortLabel: 'Today', icon: Home },
  { key: 'profile', label: 'Care profile', shortLabel: 'Profile', icon: UserRound },
  { key: 'routines', label: 'Routines', shortLabel: 'Routines', icon: ClipboardList },
  { key: 'log', label: 'Care log', shortLabel: 'Log', icon: FileText },
  { key: 'safety', label: 'Safety', shortLabel: 'Safety', icon: ShieldCheck },
  {
    key: 'emergency',
    label: 'Emergency',
    shortLabel: 'Urgent',
    icon: HeartHandshake,
  },
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

const emptySafetyItem = {
  title: '',
  category: 'Home safety',
  detail: '',
}

const emptySupportCard = {
  cue: '',
  tryThis: '',
  avoid: '',
  note: '',
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
  safetyItems: SafetyItem[],
  supportCards: SupportCard[],
): Backup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile,
    routines,
    contacts,
    logEntries,
    safetyItems,
    supportCards,
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
        defaultSafetyItems,
        defaultSupportCards,
      )
    }

    const parsed = JSON.parse(raw) as Partial<Backup>

    return createBackup(
      { ...defaultProfile, ...parsed.profile },
      Array.isArray(parsed.routines) ? parsed.routines : defaultRoutines,
      Array.isArray(parsed.contacts) ? parsed.contacts : defaultContacts,
      Array.isArray(parsed.logEntries) ? parsed.logEntries : defaultLogEntries,
      Array.isArray(parsed.safetyItems)
        ? parsed.safetyItems
        : defaultSafetyItems,
      Array.isArray(parsed.supportCards)
        ? parsed.supportCards
        : defaultSupportCards,
    )
  } catch {
    return createBackup(
      defaultProfile,
      defaultRoutines,
      defaultContacts,
      defaultLogEntries,
      defaultSafetyItems,
      defaultSupportCards,
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

function dateTimeLabel(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
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

function TooltipIconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          className="icon-button"
          type="button"
          onClick={onClick}
          aria-label={label}
        >
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="tooltip-content" sideOffset={8}>
          {label}
          <Tooltip.Arrow className="tooltip-arrow" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

function ConfirmAction({
  children,
  title,
  description,
  confirmLabel,
  tone = 'danger',
  onConfirm,
}: {
  children: ReactNode
  title: string
  description: string
  confirmLabel: string
  tone?: 'danger' | 'neutral'
  onConfirm: () => void
}) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{children}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay" />
        <AlertDialog.Content className="dialog-content">
          <AlertDialog.Title className="dialog-title">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="dialog-description">
            {description}
          </AlertDialog.Description>
          <div className="dialog-actions">
            <AlertDialog.Cancel asChild>
              <button className="secondary-button" type="button">
                Cancel
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                className={tone === 'danger' ? 'danger-button' : 'primary-button'}
                type="button"
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
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
  const [safetyItems, setSafetyItems] = useState(initialData.safetyItems)
  const [supportCards, setSupportCards] = useState(initialData.supportCards)
  const [routineDraft, setRoutineDraft] = useState(emptyRoutine)
  const [contactDraft, setContactDraft] = useState(emptyContact)
  const [logDraft, setLogDraft] = useState(emptyLogEntry)
  const [safetyDraft, setSafetyDraft] = useState(emptySafetyItem)
  const [supportDraft, setSupportDraft] = useState(emptySupportCard)
  const [quickLog, setQuickLog] = useState('')
  const [quickMood, setQuickMood] = useState('Settled')
  const [routineFilter, setRoutineFilter] = useState<RoutineFilter>('all')
  const [routineQuery, setRoutineQuery] = useState('')
  const [logQuery, setLogQuery] = useState('')
  const [printTarget, setPrintTarget] = useState<PrintTarget>('none')
  const [toastOpen, setToastOpen] = useState(false)
  const [toastData, setToastData] = useState<ToastState>({
    title: 'Ready',
    description: '',
    tone: 'info',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const quickNoteRef = useRef<HTMLTextAreaElement>(null)

  const backup = useMemo(
    () =>
      createBackup(
        profile,
        routines,
        contacts,
        logEntries,
        safetyItems,
        supportCards,
      ),
    [contacts, logEntries, profile, routines, safetyItems, supportCards],
  )

  const completedRoutines = routines.filter((routine) => routine.done).length
  const openRoutines = routines.filter((routine) => !routine.done)
  const nextRoutine = openRoutines[0]
  const upcomingRoutines = openRoutines.slice(0, 3)
  const latestLog = logEntries[0]
  const recentLogEntries = logEntries.slice(0, 5)
  const completedSafetyItems = safetyItems.filter((item) => item.done).length
  const openSafetyItems = safetyItems.filter((item) => !item.done)
  const usedSupportCards = supportCards.filter((card) => card.usedToday).length
  const highlightedSupportCard = supportCards[0]
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
  const generatedAtLabel = dateTimeLabel(new Date(backup.exportedAt))
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
    {
      label: 'Safety plan',
      detail:
        safetyItems.length > 0
          ? `${completedSafetyItems}/${safetyItems.length} checks ready`
          : 'At least one safety check',
      complete: safetyItems.length > 0,
      tab: 'safety' as NavKey,
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
    `Safety checks: ${completedSafetyItems}/${safetyItems.length} ready`,
    openSafetyItems[0]
      ? `Safety follow-up: ${openSafetyItems[0].title}`
      : 'Safety follow-up: none open',
    highlightedSupportCard
      ? `Support cue: ${highlightedSupportCard.cue}; try ${highlightedSupportCard.tryThis}`
      : 'Support cue: none saved',
    `Comfort items: ${profile.comfortItems || 'not set'}`,
    `Avoid: ${profile.avoid || 'not set'}`,
    primaryContact
      ? `Primary contact: ${primaryContact.name}, ${primaryContact.phone}`
      : 'Primary contact: not set',
  ].join('\n')

  useEffect(() => {
    saveBackup(backup)
  }, [backup])

  function showToast(
    title: string,
    description: string,
    tone: ToastTone = 'info',
  ) {
    setToastOpen(false)
    window.setTimeout(() => {
      setToastData({ title, description, tone })
      setToastOpen(true)
    }, 20)
  }

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

  function updateSafetyDraft(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setSafetyDraft((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  function updateSupportDraft(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setSupportDraft((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  function addRoutine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = routineDraft.title.trim()
    if (!title) {
      return
    }

    setRoutines((current) =>
      [
        ...current,
        {
          id: createId('routine'),
          title,
          time: routineDraft.time,
          category: routineDraft.category.trim() || 'Care',
          notes: routineDraft.notes.trim(),
          done: false,
        },
      ].sort(byRoutineTime),
    )
    setRoutineDraft(emptyRoutine)
    showToast('Routine added', `${title} is now on the checklist.`, 'success')
  }

  function toggleRoutine(id: string) {
    setRoutines((current) =>
      current.map((routine) =>
        routine.id === id ? { ...routine, done: !routine.done } : routine,
      ),
    )
  }

  function removeRoutine(id: string) {
    const removed = routines.find((routine) => routine.id === id)
    setRoutines((current) => current.filter((routine) => routine.id !== id))
    showToast(
      'Routine removed',
      `${removed?.title ?? 'Routine'} was removed from the checklist.`,
      'danger',
    )
  }

  function resetRoutines() {
    setRoutines((current) =>
      current.map((routine) => ({ ...routine, done: false })),
    )
    showToast('Checklist reset', 'All routine items are open again.', 'info')
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
    showToast('Routine completed', `${nextRoutine.title} marked done.`, 'success')
  }

  function addContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = contactDraft.name.trim()
    const phone = contactDraft.phone.trim()
    if (!name || !phone) {
      return
    }

    setContacts((current) => [
      ...current,
      {
        id: createId('contact'),
        name,
        relation: contactDraft.relation.trim(),
        phone,
        notes: contactDraft.notes.trim(),
      },
    ])
    setContactDraft(emptyContact)
    showToast('Contact added', `${name} is in the care circle.`, 'success')
  }

  function removeContact(id: string) {
    const removed = contacts.find((contact) => contact.id === id)
    setContacts((current) => current.filter((contact) => contact.id !== id))
    showToast(
      'Contact removed',
      `${removed?.name ?? 'Contact'} was removed from the care circle.`,
      'danger',
    )
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
    showToast('Care note added', 'The observation was saved to history.', 'success')
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
    showToast('Quick note saved', `${quickMood} note added to history.`, 'success')
  }

  function focusQuickNote() {
    quickNoteRef.current?.focus()
  }

  function removeLogEntry(id: string) {
    setLogEntries((current) => current.filter((entry) => entry.id !== id))
    showToast('Log entry removed', 'The note was removed from history.', 'danger')
  }

  function addSafetyItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = safetyDraft.title.trim()
    if (!title) {
      return
    }

    setSafetyItems((current) => [
      ...current,
      {
        id: createId('safety'),
        title,
        category: safetyDraft.category.trim() || 'Safety',
        detail: safetyDraft.detail.trim(),
        done: false,
      },
    ])
    setSafetyDraft(emptySafetyItem)
    showToast('Safety check added', `${title} is in the safety plan.`, 'success')
  }

  function toggleSafetyItem(id: string) {
    setSafetyItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      ),
    )
  }

  function removeSafetyItem(id: string) {
    const removed = safetyItems.find((item) => item.id === id)
    setSafetyItems((current) => current.filter((item) => item.id !== id))
    showToast(
      'Safety check removed',
      `${removed?.title ?? 'Safety check'} was removed.`,
      'danger',
    )
  }

  function resetSafetyItems() {
    setSafetyItems((current) => current.map((item) => ({ ...item, done: false })))
    showToast('Safety checks reset', 'All safety checks are open again.', 'info')
  }

  function addSupportCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cue = supportDraft.cue.trim()
    const tryThis = supportDraft.tryThis.trim()
    if (!cue || !tryThis) {
      return
    }

    setSupportCards((current) => [
      ...current,
      {
        id: createId('support'),
        cue,
        tryThis,
        avoid: supportDraft.avoid.trim(),
        note: supportDraft.note.trim(),
        usedToday: false,
      },
    ])
    setSupportDraft(emptySupportCard)
    showToast('Support card added', `${cue} is ready for handoff.`, 'success')
  }

  function toggleSupportCard(id: string) {
    setSupportCards((current) =>
      current.map((card) =>
        card.id === id ? { ...card, usedToday: !card.usedToday } : card,
      ),
    )
  }

  function removeSupportCard(id: string) {
    const removed = supportCards.find((card) => card.id === id)
    setSupportCards((current) => current.filter((card) => card.id !== id))
    showToast(
      'Support card removed',
      `${removed?.cue ?? 'Support card'} was removed.`,
      'danger',
    )
  }

  function exportBackup() {
    downloadFile(
      'alzheimers-carekit-backup.json',
      JSON.stringify(backup, null, 2),
      'application/json',
    )
    showToast('Backup downloaded', 'A local JSON backup was created.', 'success')
  }

  function exportCareLog() {
    downloadFile('alzheimers-care-log.csv', logEntriesToCsv(logEntries), 'text/csv')
    showToast('CSV exported', 'The care log was downloaded as a CSV.', 'success')
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
      setSafetyItems(
        Array.isArray(imported.safetyItems)
          ? imported.safetyItems
          : defaultSafetyItems,
      )
      setSupportCards(
        Array.isArray(imported.supportCards)
          ? imported.supportCards
          : defaultSupportCards,
      )
      showToast('Backup imported', 'The local care workspace was updated.', 'success')
    } catch {
      showToast(
        'Import failed',
        'That file could not be used as a backup.',
        'danger',
      )
    }
    event.target.value = ''
  }

  async function copyHandoffSummary() {
    try {
      await navigator.clipboard.writeText(handoffSummary)
      showToast('Handoff copied', 'The shift brief is ready to paste.', 'success')
    } catch {
      showToast('Copy unavailable', 'Clipboard access was blocked.', 'danger')
    }
  }

  function triggerPrint(target: Exclude<PrintTarget, 'none'>) {
    setPrintTarget(target)
    window.setTimeout(() => {
      window.print()
      window.setTimeout(() => setPrintTarget('none'), 300)
    }, 50)
  }

  function printShiftPacket() {
    triggerPrint('shift')
  }

  function printEmergencyCard() {
    setActiveTab('emergency')
    triggerPrint('emergency')
  }

  return (
    <Tooltip.Provider delayDuration={250}>
      <Toast.Provider swipeDirection="right">
        <Tabs.Root
          className={`app-shell print-${printTarget}`}
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as NavKey)}
        >
          <a className="skip-link" href="#main-content">
            Skip to main content
          </a>
          <div className="app-frame">
            <aside className="app-sidebar" aria-label="Care workspace">
              <div className="brand-lockup">
                <span className="brand-mark" aria-hidden="true">
                  A
                </span>
                <div>
                  <p className="eyebrow">Alzheimer's CareKit</p>
                  <strong>Local care workspace</strong>
                </div>
              </div>

              <Tabs.List className="tabs sidebar-nav" aria-label="CareKit sections">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Tabs.Trigger
                      key={item.key}
                      className="tab"
                      value={item.key}
                      aria-label={item.label}
                    >
                      <Icon aria-hidden="true" size={18} />
                      <span className="tab-label-full">{item.label}</span>
                      <span className="tab-label-short">{item.shortLabel}</span>
                    </Tabs.Trigger>
                  )
                })}
              </Tabs.List>

              <div className="sidebar-card">
                <span className="sidebar-label">Shift snapshot</span>
                <strong>{progress}% complete</strong>
                <p>
                  {nextRoutine
                    ? `${nextRoutine.time} - ${nextRoutine.title}`
                    : 'No open routines right now'}
                </p>
                <p>{openSafetyItems.length} safety checks open</p>
                {primaryContact && (
                  <a className="sidebar-call" href={`tel:${primaryContact.phone}`}>
                    <PhoneCall aria-hidden="true" size={16} />
                    {primaryContact.name}
                  </a>
                )}
              </div>
            </aside>

            <div className="content-shell">
              <header className="topbar">
                <div>
                  <p className="eyebrow">{todayLabel}</p>
                  <h1>Care command center for {profile.preferredName || 'today'}</h1>
                  <p className="topbar-copy">
                    Saved locally at {lastSavedAt}. {openRoutines.length} open
                    routines, {openSafetyItems.length} safety checks,{' '}
                    {logEntries.length} notes.
                  </p>
                </div>
                <div className="topbar-actions">
                  <TooltipIconButton
                    label="Print shift packet"
                    onClick={printShiftPacket}
                  >
                    <FileText aria-hidden="true" size={20} />
                  </TooltipIconButton>
                  <TooltipIconButton label="Download backup" onClick={exportBackup}>
                    <Download aria-hidden="true" size={20} />
                  </TooltipIconButton>
                  <TooltipIconButton
                    label="Import backup"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload aria-hidden="true" size={20} />
                  </TooltipIconButton>
                  <TooltipIconButton
                    label="Print emergency card"
                    onClick={printEmergencyCard}
                  >
                    <Printer aria-hidden="true" size={20} />
                  </TooltipIconButton>
                  <input
                    ref={fileInputRef}
                    className="hidden-input"
                    type="file"
                    accept="application/json"
                    onChange={importBackup}
                  />
                </div>
              </header>

              <main id="main-content" tabIndex={-1}>
        {activeTab === 'today' && (
          <section className="section-grid">
            <div className="intro-panel">
              <div>
                <p className="eyebrow">{todayLabel}</p>
                <h2>Next up</h2>
                <div className="status-badges" aria-label="Shift status">
                  <span>{dueNowCount} due now</span>
                  <span>{openRoutines.length} open</span>
                  <span>{openSafetyItems.length} safety open</span>
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
                label="Safety"
                value={`${completedSafetyItems}/${safetyItems.length}`}
              />
              <StatBlock
                icon={HeartPulse}
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
                  <div className="panel-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={copyHandoffSummary}
                    >
                      <Copy aria-hidden="true" size={18} />
                      Copy
                    </button>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={printShiftPacket}
                    >
                      <Printer aria-hidden="true" size={18} />
                      Print
                    </button>
                  </div>
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
                    <dt>Safety follow-up</dt>
                    <dd>
                      {openSafetyItems[0]
                        ? openSafetyItems[0].title
                        : 'No open safety checks'}
                    </dd>
                  </div>
                  <div>
                    <dt>Support cue</dt>
                    <dd>
                      {highlightedSupportCard
                        ? highlightedSupportCard.cue
                        : 'No support cards yet'}
                    </dd>
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

            <section className="work-panel support-now-panel">
              <div>
                <p className="eyebrow">Support now</p>
                <h2>
                  {highlightedSupportCard
                    ? highlightedSupportCard.cue
                    : 'Build a calming response plan'}
                </h2>
                <p>
                  {highlightedSupportCard
                    ? highlightedSupportCard.tryThis
                    : 'Save practical cues, what to try, and what to avoid for harder moments.'}
                </p>
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setActiveTab('safety')}
              >
                <ShieldCheck aria-hidden="true" size={18} />
                Open safety plan
              </button>
            </section>

            <div className="work-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Today's routine</p>
                  <h2>Checklist</h2>
                </div>
                <ConfirmAction
                  title="Reset today's checklist?"
                  description="This reopens every routine item for the current care day."
                  confirmLabel="Reset checklist"
                  tone="neutral"
                  onConfirm={resetRoutines}
                >
                  <button className="secondary-button" type="button">
                    <RotateCcw aria-hidden="true" size={18} />
                    Reset
                  </button>
                </ConfirmAction>
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
                  aria-label="Contact name"
                  name="name"
                  placeholder="Name"
                  value={contactDraft.name}
                  onChange={updateContactDraft}
                />
                <input
                  aria-label="Contact relation"
                  name="relation"
                  placeholder="Relation"
                  value={contactDraft.relation}
                  onChange={updateContactDraft}
                />
                <input
                  aria-label="Contact phone"
                  name="phone"
                  placeholder="Phone"
                  value={contactDraft.phone}
                  onChange={updateContactDraft}
                />
                <textarea
                  aria-label="Contact notes"
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
                    <ConfirmAction
                      title={`Remove ${contact.name}?`}
                      description="This removes the contact from the care circle on this device."
                      confirmLabel="Remove contact"
                      onConfirm={() => removeContact(contact.id)}
                    >
                      <button
                        className="icon-button quiet danger-icon"
                        type="button"
                        aria-label={`Remove ${contact.name}`}
                      >
                        <X aria-hidden="true" size={18} />
                      </button>
                    </ConfirmAction>
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
                    <ConfirmAction
                      title={`Remove ${routine.title}?`}
                      description="This removes the routine from the shared checklist on this device."
                      confirmLabel="Remove routine"
                      onConfirm={() => removeRoutine(routine.id)}
                    >
                      <button
                        className="icon-button quiet danger-icon"
                        type="button"
                        aria-label={`Remove ${routine.title}`}
                      >
                        <X aria-hidden="true" size={18} />
                      </button>
                    </ConfirmAction>
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
                    <ConfirmAction
                      title={`Remove log entry from ${entry.date}?`}
                      description="This removes the care note from this device."
                      confirmLabel="Remove note"
                      onConfirm={() => removeLogEntry(entry.id)}
                    >
                      <button
                        className="icon-button quiet danger-icon"
                        type="button"
                        aria-label={`Remove log entry from ${entry.date}`}
                      >
                        <X aria-hidden="true" size={18} />
                      </button>
                    </ConfirmAction>
                  </article>
                ))}
                {filteredLogEntries.length === 0 && (
                  <p className="empty-state">No log entries match this search.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'safety' && (
          <section className="section-grid">
            <div className="stats-row">
              <StatBlock
                icon={ShieldCheck}
                label="Safety ready"
                value={`${completedSafetyItems}/${safetyItems.length}`}
              />
              <StatBlock
                icon={AlertTriangle}
                label="Open checks"
                value={String(openSafetyItems.length)}
              />
              <StatBlock
                icon={HeartPulse}
                label="Support cards"
                value={String(supportCards.length)}
              />
              <StatBlock
                icon={Check}
                label="Tried today"
                value={String(usedSupportCards)}
              />
            </div>

            <section className="notice-panel">
              <AlertTriangle aria-hidden="true" size={22} />
              <div>
                <h2>Safety and support planning</h2>
                <p>
                  Use this space to keep practical checks and calming responses
                  visible for the next caregiver. It is not monitoring,
                  medical advice, or emergency guidance.
                </p>
              </div>
            </section>

            <section className="section-grid two-column">
              <form className="work-panel form-panel" onSubmit={addSafetyItem}>
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Safety plan</p>
                    <h2>Add preparedness check</h2>
                  </div>
                </div>
                <label>
                  Title
                  <input
                    name="title"
                    value={safetyDraft.title}
                    onChange={updateSafetyDraft}
                    placeholder="Favorite walking route is written down"
                  />
                </label>
                <label>
                  Category
                  <input
                    name="category"
                    value={safetyDraft.category}
                    onChange={updateSafetyDraft}
                    placeholder="Wandering prep"
                  />
                </label>
                <label>
                  Details
                  <textarea
                    name="detail"
                    value={safetyDraft.detail}
                    onChange={updateSafetyDraft}
                    placeholder="What another caregiver should check or know."
                  />
                </label>
                <button className="primary-button" type="submit">
                  <Plus aria-hidden="true" size={18} />
                  Add safety check
                </button>
              </form>

              <div className="work-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Preparedness</p>
                    <h2>{completedSafetyItems} ready</h2>
                  </div>
                  <ConfirmAction
                    title="Reset safety checks?"
                    description="This reopens every safety preparedness check."
                    confirmLabel="Reset checks"
                    tone="neutral"
                    onConfirm={resetSafetyItems}
                  >
                    <button className="secondary-button" type="button">
                      <RotateCcw aria-hidden="true" size={18} />
                      Reset
                    </button>
                  </ConfirmAction>
                </div>
                <div className="item-list">
                  {safetyItems.map((item) => (
                    <article
                      className={item.done ? 'safety-card done' : 'safety-card'}
                      key={item.id}
                    >
                      <button
                        className="check-button"
                        type="button"
                        onClick={() => toggleSafetyItem(item.id)}
                        aria-label={`Mark ${item.title} ${
                          item.done ? 'not ready' : 'ready'
                        }`}
                      >
                        {item.done && <Check aria-hidden="true" size={18} />}
                      </button>
                      <div>
                        <span className="time-pill">{item.category}</span>
                        <h3>{item.title}</h3>
                        {item.detail && <p>{item.detail}</p>}
                      </div>
                      <ConfirmAction
                        title={`Remove ${item.title}?`}
                        description="This removes the safety check from this device."
                        confirmLabel="Remove check"
                        onConfirm={() => removeSafetyItem(item.id)}
                      >
                        <button
                          className="icon-button quiet danger-icon"
                          type="button"
                          aria-label={`Remove ${item.title}`}
                        >
                          <X aria-hidden="true" size={18} />
                        </button>
                      </ConfirmAction>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section-grid two-column">
              <form className="work-panel form-panel" onSubmit={addSupportCard}>
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Support card</p>
                    <h2>Add calming response</h2>
                  </div>
                </div>
                <label>
                  Cue
                  <input
                    name="cue"
                    value={supportDraft.cue}
                    onChange={updateSupportDraft}
                    placeholder="Looking for home or asking to leave"
                  />
                </label>
                <label>
                  Try first
                  <textarea
                    name="tryThis"
                    value={supportDraft.tryThis}
                    onChange={updateSupportDraft}
                    placeholder="Validate the feeling, offer a familiar item, then redirect."
                  />
                </label>
                <label>
                  Avoid
                  <textarea
                    name="avoid"
                    value={supportDraft.avoid}
                    onChange={updateSupportDraft}
                    placeholder="Arguments, rushing, noisy rooms."
                  />
                </label>
                <label>
                  Handoff note
                  <textarea
                    name="note"
                    value={supportDraft.note}
                    onChange={updateSupportDraft}
                    placeholder="Anything that worked recently."
                  />
                </label>
                <button className="primary-button" type="submit">
                  <Plus aria-hidden="true" size={18} />
                  Add support card
                </button>
              </form>

              <div className="work-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Response library</p>
                    <h2>{supportCards.length} cards</h2>
                  </div>
                </div>
                <div className="item-list">
                  {supportCards.map((card) => (
                    <article
                      className={
                        card.usedToday ? 'support-card used' : 'support-card'
                      }
                      key={card.id}
                    >
                      <div>
                        <h3>{card.cue}</h3>
                        <dl className="support-list">
                          <div>
                            <dt>Try first</dt>
                            <dd>{card.tryThis}</dd>
                          </div>
                          {card.avoid && (
                            <div>
                              <dt>Avoid</dt>
                              <dd>{card.avoid}</dd>
                            </div>
                          )}
                          {card.note && (
                            <div>
                              <dt>Handoff note</dt>
                              <dd>{card.note}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                      <div className="card-actions">
                        <button
                          className={
                            card.usedToday
                              ? 'primary-button compact-button'
                              : 'secondary-button compact-button'
                          }
                          type="button"
                          aria-pressed={card.usedToday}
                          onClick={() => toggleSupportCard(card.id)}
                        >
                          <Check aria-hidden="true" size={16} />
                          Tried today
                        </button>
                        <ConfirmAction
                          title={`Remove ${card.cue}?`}
                          description="This removes the support card from this device."
                          confirmLabel="Remove card"
                          onConfirm={() => removeSupportCard(card.id)}
                        >
                          <button
                            className="icon-button quiet danger-icon"
                            type="button"
                            aria-label={`Remove ${card.cue}`}
                          >
                            <X aria-hidden="true" size={18} />
                          </button>
                        </ConfirmAction>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
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
                  <strong>Safety follow-up</strong>
                  <p>
                    {openSafetyItems[0]
                      ? openSafetyItems[0].title
                      : 'No open safety checks'}
                  </p>
                </div>
                <div>
                  <strong>Support cue</strong>
                  <p>
                    {highlightedSupportCard
                      ? highlightedSupportCard.cue
                      : 'No support cards saved'}
                  </p>
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
          </div>
      <section className="print-only shift-packet" aria-hidden={printTarget !== 'shift'}>
        <header className="shift-print-header">
          <div>
            <p>Alzheimer's CareKit</p>
            <h2>Shift packet for {profile.preferredName || 'care recipient'}</h2>
          </div>
          <div>
            <strong>Generated</strong>
            <span>{generatedAtLabel}</span>
          </div>
        </header>

        <section className="shift-print-section summary-grid">
          <div>
            <strong>Routine progress</strong>
            <p>{completedRoutines} of {routines.length} complete</p>
          </div>
          <div>
            <strong>Next routine</strong>
            <p>
              {nextRoutine
                ? `${nextRoutine.time} - ${nextRoutine.title}`
                : 'No open routines'}
            </p>
          </div>
          <div>
            <strong>Due now</strong>
            <p>{dueNowCount} open items</p>
          </div>
          <div>
            <strong>Primary contact</strong>
            <p>
              {primaryContact
                ? `${primaryContact.name}, ${primaryContact.phone}`
                : 'Not set'}
            </p>
          </div>
          <div>
            <strong>Safety checks</strong>
            <p>{completedSafetyItems} of {safetyItems.length} ready</p>
          </div>
          <div>
            <strong>Support cards</strong>
            <p>{usedSupportCards} tried today</p>
          </div>
        </section>

        <section className="shift-print-section">
          <h3>Person-centered care</h3>
          <dl className="print-detail-list">
            <div>
              <dt>Home base</dt>
              <dd>{profile.homeBase || 'Not set'}</dd>
            </div>
            <div>
              <dt>Primary language</dt>
              <dd>{profile.language || 'Not set'}</dd>
            </div>
            <div>
              <dt>Comfort items</dt>
              <dd>{profile.comfortItems || 'Not set'}</dd>
            </div>
            <div>
              <dt>Calming activities</dt>
              <dd>{profile.calmingActivities || 'Not set'}</dd>
            </div>
            <div>
              <dt>Things to avoid</dt>
              <dd>{profile.avoid || 'Not set'}</dd>
            </div>
            <div>
              <dt>Notes</dt>
              <dd>{profile.notes || 'Not set'}</dd>
            </div>
          </dl>
        </section>

        <section className="shift-print-section">
          <h3>Today's routines</h3>
          <table className="print-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Routine</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {routines.map((routine) => (
                <tr key={routine.id}>
                  <td>{routine.time}</td>
                  <td>{routine.title}</td>
                  <td>{routine.done ? 'Done' : 'Open'}</td>
                  <td>{routine.notes || routine.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="shift-print-section">
          <h3>Safety checks</h3>
          <table className="print-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Check</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {safetyItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.category}</td>
                  <td>{item.title}</td>
                  <td>{item.done ? 'Ready' : 'Open'}</td>
                  <td>{item.detail || 'Not set'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="shift-print-section">
          <h3>Support cards</h3>
          <table className="print-table">
            <thead>
              <tr>
                <th>Cue</th>
                <th>Try first</th>
                <th>Avoid</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {supportCards.map((card) => (
                <tr key={card.id}>
                  <td>{card.cue}</td>
                  <td>{card.tryThis}</td>
                  <td>{card.avoid || 'Not set'}</td>
                  <td>{card.note || (card.usedToday ? 'Tried today' : 'Not set')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="shift-print-section">
          <h3>Recent care log</h3>
          {recentLogEntries.length > 0 ? (
            <table className="print-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Mood</th>
                  <th>Sleep</th>
                  <th>Appetite</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {recentLogEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.date}</td>
                    <td>{entry.mood}</td>
                    <td>{entry.sleep}</td>
                    <td>{entry.appetite}</td>
                    <td>{entry.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No care log entries yet.</p>
          )}
        </section>

        <section className="shift-print-section">
          <h3>Contacts</h3>
          <table className="print-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Relation</th>
                <th>Phone</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td>{contact.name}</td>
                  <td>{contact.relation}</td>
                  <td>{contact.phone}</td>
                  <td>{contact.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <p className="print-safety-note">
          Caregiver organization only. Not medical advice, diagnosis, emergency
          guidance, or treatment recommendation.
        </p>
      </section>
        </Tabs.Root>
        <Toast.Root
          className={`toast-root ${toastData.tone}`}
          open={toastOpen}
          onOpenChange={setToastOpen}
        >
          <Toast.Title className="toast-title">{toastData.title}</Toast.Title>
          {toastData.description && (
            <Toast.Description className="toast-description">
              {toastData.description}
            </Toast.Description>
          )}
          <Toast.Close className="toast-close" aria-label="Close notification">
            <X aria-hidden="true" size={16} />
          </Toast.Close>
        </Toast.Root>
        <Toast.Viewport className="toast-viewport" />
      </Toast.Provider>
    </Tooltip.Provider>
  )
}

export default App
