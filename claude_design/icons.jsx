/* global React */
// Lucide-style minimal stroked icons. 16px default. Stroke = currentColor.

const Icon = ({ d, size = 16, fill = 'none', stroke = 'currentColor', sw = 1.6, children, viewBox = '0 0 24 24', ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox={viewBox}
    fill={fill}
    stroke={stroke}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    {d ? <path d={d} /> : children}
  </svg>
);

const I = {
  Search:  (p) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Icon>,
  Plus:    (p) => <Icon {...p} d="M12 5v14M5 12h14" />,
  Check:   (p) => <Icon {...p} d="M20 6 9 17l-5-5" />,
  X:       (p) => <Icon {...p} d="M18 6 6 18M6 6l12 12" />,
  ArrowRight: (p) => <Icon {...p} d="M5 12h14M13 5l7 7-7 7" />,
  Chevron: (p) => <Icon {...p} d="m6 9 6 6 6-6" />,
  ChevronUp: (p) => <Icon {...p} d="m18 15-6-6-6 6" />,
  ChevronRight: (p) => <Icon {...p} d="m9 6 6 6-6 6" />,
  PanelLeft: (p) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></Icon>,
  Filter:  (p) => <Icon {...p} d="M3 6h18M6 12h12M10 18h4" />,
  Settings:(p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01A1.65 1.65 0 0 0 10 4.6V4.5a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V10c.36.18.65.46.83.83a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Icon>,
  Sun:     (p) => <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></Icon>,
  Moon:    (p) => <Icon {...p} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  Globe:   (p) => <Icon {...p}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></Icon>,
  Bell:    (p) => <Icon {...p} d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M13.73 21a2 2 0 0 1-3.46 0" />,
  Folder:  (p) => <Icon {...p} d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />,
  GitBranch: (p) => <Icon {...p}><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></Icon>,
  GitMerge: (p) => <Icon {...p}><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></Icon>,
  GitPull: (p) => <Icon {...p}><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/></Icon>,
  GitCommit:(p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/></Icon>,
  Github:  (p) => <Icon {...p} d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />,
  Play:    (p) => <Icon {...p} fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></Icon>,
  Pause:   (p) => <Icon {...p}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></Icon>,
  Square:  (p) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/></Icon>,
  Trees:   (p) => <Icon {...p} d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0M21 12a3 3 0 0 0-3-3v0a3 3 0 0 0-3 3v.2A2 2 0 0 0 16 16h2v6m-2-6h-1m1 0h.5M7 16v6" />,
  List:    (p) => <Icon {...p} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  Kanban:  (p) => <Icon {...p}><rect x="3" y="4" width="5" height="16"/><rect x="10" y="4" width="5" height="10"/><rect x="17" y="4" width="4" height="13"/></Icon>,
  Activity:(p) => <Icon {...p} d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  AlertTriangle: (p) => <Icon {...p} d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />,
  Sparkles:(p) => <Icon {...p} d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />,
  More:    (p) => <Icon {...p}><circle cx="12" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></Icon>,
  Code:    (p) => <Icon {...p} d="m16 18 6-6-6-6M8 6l-6 6 6 6" />,
  Terminal:(p) => <Icon {...p} d="m4 17 6-6-6-6M12 19h8" />,
  ExternalLink:(p) => <Icon {...p} d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />,
  Refresh: (p) => <Icon {...p} d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />,
  Eye:     (p) => <Icon {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></Icon>,
  Clock:   (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Icon>,
  Send:    (p) => <Icon {...p} d="m22 2-7 20-4-9-9-4Z M22 2 11 13" />,
  CornerDown: (p) => <Icon {...p} d="M9 10l-5 5 5 5M20 4v7a4 4 0 0 1-4 4H4" />,
  User:    (p) => <Icon {...p}><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/></Icon>,
  Database:(p) => <Icon {...p}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></Icon>,
  Cpu:     (p) => <Icon {...p}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></Icon>,
  Zap:     (p) => <Icon {...p} d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  Drop:    (p) => <Icon {...p} d="M12 3s7 8 7 13a7 7 0 0 1-14 0c0-5 7-13 7-13z" />,
  Leaf:    (p) => <Icon {...p} d="M11 20A7 7 0 0 1 4 13c0-4 4-9 9-9 5 0 8 3 8 8a7 7 0 0 1-7 8M2 22l8-8" />,
  Bug:     (p) => <Icon {...p}><rect x="8" y="6" width="8" height="14" rx="4"/><path d="M19 7l-3 2M5 7l3 2M19 13h-3M5 13h3M19 19l-3-2M5 19l3-2M12 4V2M9 2h6"/></Icon>,
  Compass: (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><polygon points="16 8 14 14 8 16 10 10 16 8"/></Icon>,
  Layers:  (p) => <Icon {...p} d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
  Logout:  (p) => <Icon {...p} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  Trash:   (p) => <Icon {...p} d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />,
  Save:    (p) => <Icon {...p} d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8" />,
  Box:     (p) => <Icon {...p} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />,
};

window.I = I;
