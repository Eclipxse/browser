import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  Command,
  Copy,
  Home,
  LayoutPanelLeft,
  Loader2,
  MoonStar,
  PanelRightOpen,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  X
} from "lucide-react";
import {
  FormEvent,
  KeyboardEvent,
  MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

type Tab = {
  id: string;
  title: string;
  url: string;
  displayUrl: string;
  loading: boolean;
  accent: string;
};

type Bookmark = {
  id: string;
  title: string;
  url: string;
};

type CommandAction = {
  id: string;
  label: string;
  shortcut: string;
  run: () => void;
};

const HOME_URL = "aura://home";
const SEARCH_URL = "https://duckduckgo.com/?q=";
const ACCENTS = ["pink", "lemon", "mint", "sky", "lilac", "coral"];

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function makeHomeTab(): Tab {
  return {
    id: createId("tab"),
    title: "New Aura",
    url: HOME_URL,
    displayUrl: "",
    loading: false,
    accent: ACCENTS[Math.floor(Math.random() * ACCENTS.length)]
  };
}

function normalizeInput(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return HOME_URL;
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) {
    return trimmed;
  }

  const looksLikeDomain =
    trimmed.includes(".") && !trimmed.includes(" ") && !trimmed.startsWith(".");

  if (looksLikeDomain) {
    return `https://${trimmed}`;
  }

  return `${SEARCH_URL}${encodeURIComponent(trimmed)}`;
}

function cleanDisplayUrl(url: string): string {
  if (url === HOME_URL) {
    return "";
  }

  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "") + parsed.pathname;
  } catch {
    return url;
  }
}

function useStoredState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

export function App() {
  const [tabs, setTabs] = useState<Tab[]>(() => [makeHomeTab()]);
  const [activeTabId, setActiveTabId] = useState(() => tabs[0].id);
  const [addressValue, setAddressValue] = useState("");
  const [bookmarks, setBookmarks] = useStoredState<Bookmark[]>(
    "aura-bookmarks",
    [
      { id: "github", title: "GitHub", url: "https://github.com" },
      { id: "docs", title: "MDN", url: "https://developer.mozilla.org" }
    ]
  );
  const [note, setNote] = useStoredState(
    "aura-notes",
    "drop sharp ideas here."
  );
  const [panelOpen, setPanelOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [splitMode, setSplitMode] = useState(false);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const webviewRefs = useRef<Record<string, Electron.WebviewTag | null>>({});

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
  const activeWebview = webviewRefs.current[activeTabId];
  const isBookmarked = bookmarks.some(
    (bookmark) => bookmark.url === activeTab.url
  );

  useEffect(() => {
    setAddressValue(activeTab.displayUrl || activeTab.url.replace(HOME_URL, ""));
  }, [activeTab.displayUrl, activeTab.url]);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const isMod = event.ctrlKey || event.metaKey;

      if (isMod && event.key.toLowerCase() === "l") {
        event.preventDefault();
        addressInputRef.current?.select();
      }

      if (isMod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }

      if (isMod && event.key.toLowerCase() === "t") {
        event.preventDefault();
        createTab();
      }

      if (isMod && event.key.toLowerCase() === "w") {
        event.preventDefault();
        closeTab(activeTabId);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTabId, tabs]);

  function patchTab(id: string, patch: Partial<Tab>) {
    setTabs((currentTabs) =>
      currentTabs.map((tab) => (tab.id === id ? { ...tab, ...patch } : tab))
    );
  }

  function createTab(url = HOME_URL) {
    const tab = makeHomeTab();
    const nextTab = {
      ...tab,
      url,
      displayUrl: cleanDisplayUrl(url),
      title: url === HOME_URL ? tab.title : cleanDisplayUrl(url)
    };

    setTabs((currentTabs) => [...currentTabs, nextTab]);
    setActiveTabId(nextTab.id);
  }

  function closeTab(id: string, event?: MouseEvent<HTMLElement>) {
    event?.stopPropagation();

    setTabs((currentTabs) => {
      if (currentTabs.length === 1) {
        const freshTab = makeHomeTab();
        setActiveTabId(freshTab.id);
        return [freshTab];
      }

      const closingIndex = currentTabs.findIndex((tab) => tab.id === id);
      const nextTabs = currentTabs.filter((tab) => tab.id !== id);

      if (id === activeTabId) {
        const nextActive =
          nextTabs[Math.max(0, closingIndex - 1)] ?? nextTabs[0];
        setActiveTabId(nextActive.id);
      }

      return nextTabs;
    });
  }

  function navigateCurrent(url: string) {
    const normalizedUrl = normalizeInput(url);

    patchTab(activeTabId, {
      url: normalizedUrl,
      displayUrl: cleanDisplayUrl(normalizedUrl),
      title: normalizedUrl === HOME_URL ? "New Aura" : cleanDisplayUrl(normalizedUrl)
    });
  }

  function submitAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigateCurrent(addressValue);
    addressInputRef.current?.blur();
  }

  function toggleBookmark() {
    if (activeTab.url === HOME_URL) {
      return;
    }

    setBookmarks((currentBookmarks) => {
      if (currentBookmarks.some((bookmark) => bookmark.url === activeTab.url)) {
        return currentBookmarks.filter(
          (bookmark) => bookmark.url !== activeTab.url
        );
      }

      return [
        {
          id: createId("bookmark"),
          title: activeTab.title || cleanDisplayUrl(activeTab.url),
          url: activeTab.url
        },
        ...currentBookmarks
      ];
    });
  }

  function duplicateTab() {
    createTab(activeTab.url);
  }

  function goHome() {
    navigateCurrent(HOME_URL);
  }

  function openBookmark(bookmark: Bookmark) {
    createTab(bookmark.url);
  }

  function removeBookmark(id: string) {
    setBookmarks((currentBookmarks) =>
      currentBookmarks.filter((bookmark) => bookmark.id !== id)
    );
  }

  const commands: CommandAction[] = useMemo(
    () => [
      {
        id: "new-tab",
        label: "New tab",
        shortcut: "Ctrl T",
        run: () => createTab()
      },
      {
        id: "focus-address",
        label: "Focus address",
        shortcut: "Ctrl L",
        run: () => addressInputRef.current?.select()
      },
      {
        id: "duplicate-tab",
        label: "Duplicate tab",
        shortcut: "Aura",
        run: duplicateTab
      },
      {
        id: "toggle-panel",
        label: "Toggle side panel",
        shortcut: "Panel",
        run: () => setPanelOpen((open) => !open)
      },
      {
        id: "split-mode",
        label: splitMode ? "Exit split mode" : "Enter split mode",
        shortcut: "Split",
        run: () => setSplitMode((enabled) => !enabled)
      }
    ],
    [activeTab.url, splitMode]
  );

  const filteredCommands = commands.filter((command) =>
    command.label.toLowerCase().includes(paletteQuery.toLowerCase())
  );

  function runCommand(command: CommandAction) {
    command.run();
    setPaletteOpen(false);
    setPaletteQuery("");
  }

  function handlePaletteKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setPaletteOpen(false);
    }

    if (event.key === "Enter" && filteredCommands[0]) {
      runCommand(filteredCommands[0]);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">
            <Sparkles size={18} strokeWidth={2.5} />
          </div>
          <span>Aura</span>
        </div>

        <div className="tab-strip" role="tablist" aria-label="Browser tabs">
          {tabs.map((tab) => (
            <button
              className={`tab-item accent-${tab.accent} ${
                tab.id === activeTabId ? "active" : ""
              }`}
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              title={tab.title}
              type="button"
            >
              <span className="tab-status">
                {tab.loading ? <Loader2 size={13} /> : <MoonStar size={13} />}
              </span>
              <span className="tab-title">{tab.title}</span>
              <span
                className="icon-button mini ghost"
                onClick={(event) => closeTab(tab.id, event)}
                role="button"
                tabIndex={0}
                title="Close tab"
              >
                <X size={13} />
              </span>
            </button>
          ))}
        </div>

        <button
          className="icon-button add-tab"
          onClick={() => createTab()}
          title="New tab"
          type="button"
        >
          <Plus size={18} />
        </button>
      </header>

      <section className="nav-row" aria-label="Navigation">
        <div className="traffic-lights" aria-hidden="true">
          <span className="dot pink" />
          <span className="dot yellow" />
          <span className="dot green" />
        </div>

        <button
          className="icon-button"
          onClick={() => activeWebview?.goBack()}
          title="Back"
          type="button"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          className="icon-button"
          onClick={() => activeWebview?.goForward()}
          title="Forward"
          type="button"
        >
          <ArrowRight size={18} />
        </button>
        <button
          className="icon-button"
          onClick={() => {
            if (activeTab.url === HOME_URL) {
              goHome();
            } else {
              activeWebview?.reload();
            }
          }}
          title="Reload"
          type="button"
        >
          <RefreshCw size={17} />
        </button>
        <button
          className="icon-button"
          onClick={goHome}
          title="Home"
          type="button"
        >
          <Home size={18} />
        </button>

        <form className="address-bar" onSubmit={submitAddress}>
          <Search size={18} />
          <input
            aria-label="Address"
            onChange={(event) => setAddressValue(event.target.value)}
            placeholder="search or enter a site"
            ref={addressInputRef}
            value={addressValue}
          />
          <ShieldCheck size={18} />
        </form>

        <button
          className={`icon-button ${isBookmarked ? "selected" : ""}`}
          onClick={toggleBookmark}
          title={isBookmarked ? "Remove bookmark" : "Bookmark"}
          type="button"
        >
          <Star size={18} />
        </button>
        <button
          className="icon-button"
          onClick={duplicateTab}
          title="Duplicate tab"
          type="button"
        >
          <Copy size={18} />
        </button>
        <button
          className={`icon-button ${splitMode ? "selected" : ""}`}
          onClick={() => setSplitMode((enabled) => !enabled)}
          title="Split workspace"
          type="button"
        >
          <LayoutPanelLeft size={18} />
        </button>
        <button
          className={`icon-button ${panelOpen ? "selected" : ""}`}
          onClick={() => setPanelOpen((open) => !open)}
          title="Side panel"
          type="button"
        >
          <PanelRightOpen size={18} />
        </button>
        <button
          className="icon-button command-button"
          onClick={() => setPaletteOpen(true)}
          title="Command palette"
          type="button"
        >
          <Command size={18} />
        </button>
      </section>

      <main className={`workspace ${panelOpen ? "with-panel" : ""}`}>
        <section className={`browser-stage ${splitMode ? "split" : ""}`}>
          <div className="browser-pane">
            {activeTab.url === HOME_URL ? (
              <HomeSurface
                bookmarks={bookmarks}
                onBookmarkOpen={openBookmark}
                onNavigate={navigateCurrent}
              />
            ) : (
              <WebviewFrame
                key={activeTab.id}
                onNavigate={(url) =>
                  patchTab(activeTab.id, {
                    url,
                    displayUrl: cleanDisplayUrl(url)
                  })
                }
                onStartLoading={() => patchTab(activeTab.id, { loading: true })}
                onStopLoading={() => patchTab(activeTab.id, { loading: false })}
                onTitle={(title) =>
                  patchTab(activeTab.id, { title: title || "Aura" })
                }
                register={(webview) => {
                  webviewRefs.current[activeTab.id] = webview;
                }}
                tab={activeTab}
              />
            )}
          </div>

          {splitMode ? (
            <div className="browser-pane companion">
              <HomeSurface
                bookmarks={bookmarks}
                compact
                onBookmarkOpen={openBookmark}
                onNavigate={navigateCurrent}
              />
            </div>
          ) : null}
        </section>

        {panelOpen ? (
          <aside className="side-panel">
            <section className="panel-section">
              <div className="section-title">
                <BookMarked size={16} />
                <span>Bookmarks</span>
              </div>
              <div className="bookmark-list">
                {bookmarks.map((bookmark) => (
                  <div className="bookmark-row" key={bookmark.id}>
                    <button
                      className="bookmark-link"
                      onClick={() => openBookmark(bookmark)}
                      type="button"
                    >
                      <span>{bookmark.title}</span>
                      <small>{cleanDisplayUrl(bookmark.url)}</small>
                    </button>
                    <button
                      className="icon-button mini"
                      onClick={() => removeBookmark(bookmark.id)}
                      title="Remove bookmark"
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel-section notes-section">
              <div className="section-title">
                <Sparkles size={16} />
                <span>Notes</span>
              </div>
              <textarea
                aria-label="Notes"
                onChange={(event) => setNote(event.target.value)}
                spellCheck={false}
                value={note}
              />
            </section>

            <section className="panel-section profile-card">
              <small>Chrome {window.aura?.versions.chrome ?? "embedded"}</small>
              <strong>cute shell, serious engine.</strong>
            </section>
          </aside>
        ) : null}
      </main>

      {paletteOpen ? (
        <div className="palette-backdrop" onClick={() => setPaletteOpen(false)}>
          <div
            className="command-palette"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="palette-input">
              <Command size={18} />
              <input
                autoFocus
                onChange={(event) => setPaletteQuery(event.target.value)}
                onKeyDown={handlePaletteKey}
                placeholder="type a command"
                value={paletteQuery}
              />
            </div>
            <div className="command-list">
              {filteredCommands.map((command) => (
                <button
                  className="command-row"
                  key={command.id}
                  onClick={() => runCommand(command)}
                  type="button"
                >
                  <span>{command.label}</span>
                  <kbd>{command.shortcut}</kbd>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function WebviewFrame({
  onNavigate,
  onStartLoading,
  onStopLoading,
  onTitle,
  register,
  tab
}: {
  onNavigate: (url: string) => void;
  onStartLoading: () => void;
  onStopLoading: () => void;
  onTitle: (title: string) => void;
  register: (webview: Electron.WebviewTag | null) => void;
  tab: Tab;
}) {
  const ref = useRef<Electron.WebviewTag | null>(null);

  useEffect(() => {
    const webview = ref.current;

    if (!webview) {
      return;
    }

    const handleStart = () => onStartLoading();
    const handleStop = () => onStopLoading();
    const handleNavigate = (event: Event) => {
      const nextUrl = (event as Event & { url?: string }).url;

      if (nextUrl) {
        onNavigate(nextUrl);
      }
    };
    const handleTitle = (event: Event) => {
      onTitle((event as Event & { title?: string }).title ?? "Aura");
    };

    webview.addEventListener("did-start-loading", handleStart);
    webview.addEventListener("did-stop-loading", handleStop);
    webview.addEventListener("did-navigate", handleNavigate);
    webview.addEventListener("did-navigate-in-page", handleNavigate);
    webview.addEventListener("page-title-updated", handleTitle);

    return () => {
      webview.removeEventListener("did-start-loading", handleStart);
      webview.removeEventListener("did-stop-loading", handleStop);
      webview.removeEventListener("did-navigate", handleNavigate);
      webview.removeEventListener("did-navigate-in-page", handleNavigate);
      webview.removeEventListener("page-title-updated", handleTitle);
    };
  }, [onNavigate, onStartLoading, onStopLoading, onTitle]);

  return (
    <webview
      className="webview"
      partition={`persist:aura-${tab.id}`}
      ref={(element) => {
        const webview = element as unknown as Electron.WebviewTag | null;
        ref.current = webview;
        register(webview);
      }}
      src={tab.url}
    />
  );
}

function HomeSurface({
  bookmarks,
  compact = false,
  onBookmarkOpen,
  onNavigate
}: {
  bookmarks: Bookmark[];
  compact?: boolean;
  onBookmarkOpen: (bookmark: Bookmark) => void;
  onNavigate: (url: string) => void;
}) {
  const [query, setQuery] = useState("");
  const quickLinks = bookmarks.slice(0, compact ? 4 : 6);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onNavigate(query);
  }

  return (
    <div className={`home-surface ${compact ? "compact" : ""}`}>
      <div className="hero-badge">
        <Sparkles size={18} />
        <span>Aura</span>
      </div>
      <h1>Browse soft. Move sharp.</h1>

      <form className="home-search" onSubmit={submitSearch}>
        <Search size={20} />
        <input
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="search the web"
          value={query}
        />
        <button type="submit">Go</button>
      </form>

      <div className="quick-grid">
        {quickLinks.map((bookmark) => (
          <button
            className="quick-tile"
            key={bookmark.id}
            onClick={() => onBookmarkOpen(bookmark)}
            type="button"
          >
            <span>{bookmark.title.slice(0, 1)}</span>
            <strong>{bookmark.title}</strong>
            <small>{cleanDisplayUrl(bookmark.url)}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
