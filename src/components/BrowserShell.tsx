import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Globe, Search, Puzzle, AlignJustify } from "lucide-react";

interface BrowserShellProps {
  children: React.ReactNode;
  currentUrl: string;
  setCurrentUrl: (url: string) => void;
  onNavigateToPortal: () => void;
  onNavigateToSearch: () => void;
}

export const BrowserShell: React.FC<BrowserShellProps> = ({
  children,
  currentUrl,
  setCurrentUrl,
  onNavigateToPortal,
  onNavigateToSearch,
}) => {
  const [urlInput, setUrlInput] = useState(currentUrl);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [history, setHistory] = useState<string[]>([currentUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    setUrlInput(currentUrl);
  }, [currentUrl]);

  const navigateTo = (url: string) => {
    const cleanUrl = url.trim().toLowerCase();
    
    // Check if user is typing a search query or a direct URL
    if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://") || cleanUrl.includes(".") && !cleanUrl.includes(" ")) {
      let finalUrl = url;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        finalUrl = "https://" + url;
      }
      
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(finalUrl);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setCurrentUrl(finalUrl);

      if (finalUrl.includes("ethernet.edu.et") || finalUrl.includes("wuetc.net")) {
        onNavigateToPortal();
      } else {
        onNavigateToSearch();
        setShowResults(false);
      }
    } else {
      // Treat as search query
      setSearchQuery(url);
      setShowResults(true);
      onNavigateToSearch();
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(`https://www.google.com/search?q=${encodeURIComponent(url)}`);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setCurrentUrl(`https://www.google.com/search?q=${encodeURIComponent(url)}`);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      navigateTo(urlInput);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigateTo(searchQuery);
    }
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const url = history[newIndex];
      setCurrentUrl(url);
      if (url.includes("ethernet.edu.et") || url.includes("wuetc.net")) {
        onNavigateToPortal();
      } else {
        onNavigateToSearch();
        if (url.includes("search?q=")) {
          const query = decodeURIComponent(url.split("q=")[1]);
          setSearchQuery(query);
          setShowResults(true);
        } else {
          setShowResults(false);
        }
      }
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const url = history[newIndex];
      setCurrentUrl(url);
      if (url.includes("ethernet.edu.et") || url.includes("wuetc.net")) {
        onNavigateToPortal();
      } else {
        onNavigateToSearch();
        if (url.includes("search?q=")) {
          const query = decodeURIComponent(url.split("q=")[1]);
          setSearchQuery(query);
          setShowResults(true);
        } else {
          setShowResults(false);
        }
      }
    }
  };

  const handleRefresh = () => {
    // Simply reset state or trigger reload effect
    setUrlInput(currentUrl);
  };

  const isPortalUrl = currentUrl.includes("ethernet.edu.et") || currentUrl.includes("wuetc.net");

  return (
    <div className="browser-window">
      {/* Browser Chrome Header */}
      <div className="browser-header">
        <div className="browser-top-row">
          {/* OS Window dots */}
          <div className="browser-dots">
            <div className="browser-dot red"></div>
            <div className="browser-dot yellow"></div>
            <div className="browser-dot green"></div>
          </div>

          {/* Browser Tabs */}
          <div className="browser-tabs">
            <div 
              className={`browser-tab ${!isPortalUrl ? "active" : ""}`}
              onClick={() => {
                navigateTo("https://www.google.com");
              }}
            >
              <Search size={12} />
              <span>{!showResults ? "Ethiopia Search" : `Search: ${searchQuery}`}</span>
            </div>
            {isPortalUrl && (
              <div className="browser-tab active">
                <Globe size={12} />
                <span>INDMET E-Learning</span>
                <span className="browser-tab-close">×</span>
              </div>
            )}
          </div>

          {/* User controls / extension bar */}
          <div className="browser-chrome-actions">
            <button className="browser-action-btn"><Puzzle size={14} /></button>
            <button className="browser-action-btn"><AlignJustify size={14} /></button>
          </div>
        </div>

        {/* Navigation / URL Row */}
        <div className="browser-navigation-row">
          <div className="browser-nav-arrows">
            <button 
              className="browser-action-btn" 
              onClick={handleBack} 
              disabled={historyIndex === 0}
              style={{ opacity: historyIndex === 0 ? 0.4 : 1 }}
            >
              <ArrowLeft size={16} />
            </button>
            <button 
              className="browser-action-btn" 
              onClick={handleForward} 
              disabled={historyIndex === history.length - 1}
              style={{ opacity: historyIndex === history.length - 1 ? 0.4 : 1 }}
            >
              <ArrowRight size={16} />
            </button>
            <button className="browser-action-btn" onClick={handleRefresh}>
              <RotateCw size={14} />
            </button>
          </div>

          <form className="browser-url-container" onSubmit={handleUrlSubmit}>
            <Globe size={14} />
            <input 
              type="text" 
              className="browser-url-input" 
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
          </form>
        </div>
      </div>

      {/* Browser Body / Viewport */}
      <div className="browser-body">
        {isPortalUrl ? (
          /* Portal App Render */
          children
        ) : !showResults ? (
          /* Google-like Search Homepage */
          <div className="search-engine-page">
            <div className="search-logo">EthioSearch</div>
            <form className="search-box-container" onSubmit={handleSearchSubmit}>
              <div className="search-input-wrapper">
                <Search size={18} color="#94a3b8" />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Search exit exam portal, past papers, or type URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="search-btn-row" style={{ marginTop: "20px" }}>
                <button type="submit" className="search-btn">Search Info</button>
                <button 
                  type="button" 
                  className="search-btn"
                  onClick={() => navigateTo("https://wuetc.net/elearning")}
                >
                  I'm Feeling Lucky
                </button>
              </div>
            </form>
            <p style={{ color: "#64748b", fontSize: "13px", marginTop: "24px" }}>
              Try searching: <span style={{ color: "#3b82f6", cursor: "pointer", textDecoration: "underline" }} onClick={() => navigateTo("exit exam portal")}>exit exam portal</span> or type <span style={{ color: "#3b82f6" }}>wuetc.net/elearning</span> in address bar.
            </p>
          </div>
        ) : (
          /* Google-like Search Results Page */
          <div className="search-results-page">
            <div className="results-header-text">
              About 3,420 results (0.18 seconds) for "{searchQuery}"
            </div>

            {/* Result 1 (Exit Exam Portal) */}
            <div className="search-result-item">
              <div className="result-url">
                https://ethernet.edu.et/exam <span style={{ fontSize: "10px" }}>▼</span>
              </div>
              <span 
                className="result-title" 
                onClick={() => navigateTo("https://ethernet.edu.et/exam")}
              >
                Ethiopian National Exit Exam Portal - Ministry of Education
              </span>
              <div className="result-snippet">
                Welcome to the National Exit Examination Registration and Elearning portal. Access your student registration forms, check fee statuses, and launch scheduled exams.
              </div>
            </div>

            {/* Result 2 (Model Exam Site) */}
            <div className="search-result-item">
              <div className="result-url">
                https://wuetc.net/elearning <span style={{ fontSize: "10px" }}>▼</span>
              </div>
              <span 
                className="result-title" 
                onClick={() => navigateTo("https://wuetc.net/elearning")}
              >
                INDMET E-Learning - Model Exit Exam Platform
              </span>
              <div className="result-snippet">
                Online mock exam environment and model quizzes for engineering, sciences, and healthcare disciplines. Practice with realistic Moodle interface templates.
              </div>
            </div>

            {/* Other irrelevant results */}
            <div className="search-result-item">
              <div className="result-url">
                https://www.learnethiopia.com/exit-exam <span style={{ fontSize: "10px" }}>▼</span>
              </div>
              <span className="result-title" style={{ color: "#a78bfa" }}>
                How to prepare for the Ethiopian exit exam - Study Blueprints
              </span>
              <div className="result-snippet">
                Read tips, curriculum guides, and exam blueprints issued by the Ministry of Education for the 2024 exit exams. Download past mock question PDFs.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
