'use client';
import React, { useState, useEffect } from 'react';
import { BarChart3, Wrench, Search, Bell, User, Moon, Sun, Menu, X, Home, Users, Database, MousePointerClick, Eye, TrendingUp } from 'lucide-react';
import AdminGuard from '../components/AdminGuard';
const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  // State for real data from API
  const [tools, setTools] = useState([]);
  const [recentClicks, setRecentClicks] = useState([]);
  const [topTools, setTopTools] = useState([]);
  const [dateRange, setDateRange] = useState('today'); // today, week, month

  // Fetch all data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch tools
      try {
        const toolsRes = await fetch('/api/tools');
        if (toolsRes.ok) {
          const toolsData = await toolsRes.json();
          setTools(Array.isArray(toolsData) ? toolsData : []);
        }
      } catch (err) {
        console.error('Tools fetch error:', err);
        setTools([]);
      }

      // Fetch recent clicks
      try {
        const clicksRes = await fetch('/api/analytics/clicks?limit=100');
        if (clicksRes.ok) {
          const clicksData = await clicksRes.json();
          setRecentClicks(clicksData.clicks || []);
          setTopTools(clicksData.stats || []);
        }
      } catch (err) {
        console.error('Clicks fetch error:', err);
        setRecentClicks([]);
        setTopTools([]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTool = async (id) => {
    const tool = tools.find(t => t._id === id);
    if (!tool) return;
    
    const newStatus = !tool.status;
    
    try {
      const response = await fetch(`/api/tools/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        setTools(tools.map(t =>
          t._id === id ? { ...t, status: newStatus } : t
        ));
      }
    } catch (error) {
      console.error('Error toggling tool:', error);
    }
  };

  // Calculate stats based on actual data
  const getUniqueIPs = () => {
    const ips = new Set();
    recentClicks.forEach(click => {
      if (click.ip) ips.add(click.ip);
    });
    return ips.size;
  };

  const getUniqueToolsClicked = () => {
    const toolNames = new Set();
    recentClicks.forEach(click => {
      if (click.toolName) toolNames.add(click.toolName);
    });
    return toolNames.size;
  };

  const getTodayClicks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return recentClicks.filter(click => {
      const clickDate = new Date(click.timestamp || click.createdAt);
      return clickDate >= today;
    }).length;
  };

  const getPageLoadCount = () => {
    return recentClicks.filter(click => 
      click.element === 'Page Load' || click.toolName === 'All Tools Page'
    ).length;
  };

  const categories = ['all', ...new Set(tools.map(tool => tool.category).filter(Boolean))];

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    totalTools: tools.length,
    activeTools: tools.filter(t => t.status).length,
    inactiveTools: tools.filter(t => !t.status).length,
    totalClicks: recentClicks.length,
    todayClicks: getTodayClicks(),
    uniqueVisitors: getUniqueIPs(),
    uniqueToolsClicked: getUniqueToolsClicked(),
    pageLoads: getPageLoadCount(),
    topToolsCount: topTools.length,
  };

  // --- Style Objects ---
  
  const styles = {
    container: (isDark) => ({
      minHeight: '100vh',
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
      color: isDark ? '#F9FAFB' : '#111827',
    }),
    header: (isDark) => ({
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderColor: isDark ? '#374151' : '#E5E7EB',
      borderBottomWidth: '1px',
      padding: '1rem 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }),
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
    },
    menuButton: (isDark) => ({
      padding: '0.5rem',
      borderRadius: '0.5rem',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: isDark ? '#D1D5DB' : '#4B5563',
    }),
    headerTitle: (isDark) => ({
      fontSize: '1.25rem',
      lineHeight: '1.75rem',
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#111827',
    }),
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
    },
    iconButton: (isDark) => ({
      padding: '0.5rem',
      borderRadius: '0.5rem',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
    }),
    avatar: (isDark) => ({
      width: '2rem',
      height: '2rem',
      borderRadius: '9999px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#2563EB' : '#3B82F6',
    }),
    contentArea: {
      display: 'flex',
    },
    sidebar: (isDark) => ({
      width: '16rem',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderColor: isDark ? '#374151' : '#E5E7EB',
      borderRightWidth: '1px',
      minHeight: 'calc(100vh - 65px)',
      padding: '1.5rem',
    }),
    nav: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    },
    navButton: (isDark, isActive) => ({
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      transition: 'background-color 150ms, color 150ms',
      border: 'none',
      cursor: 'pointer',
      textAlign: 'left',
      backgroundColor: isActive 
        ? (isDark ? '#2563EB' : '#3B82F6')
        : 'transparent',
      color: isActive
        ? '#FFFFFF'
        : (isDark ? '#D1D5DB' : '#374151'),
      fontWeight: '500',
    }),
    profileCard: (isDark) => ({
      marginTop: '2rem',
      padding: '1rem',
      borderRadius: '0.5rem',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
    }),
    profileCardHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '0.75rem',
    },
    profileCardAvatar: (isDark) => ({
      width: '2.5rem',
      height: '2.5rem',
      borderRadius: '9999px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#2563EB' : '#3B82F6',
    }),
    profileCardName: (isDark) => ({
      fontWeight: '600',
      fontSize: '0.875rem',
      color: isDark ? '#FFFFFF' : '#111827',
    }),
    profileCardEmail: (isDark) => ({
      fontSize: '0.75rem',
      color: isDark ? '#9CA3AF' : '#4B5563',
    }),
    mainContent: {
      flex: '1 1 0%',
      padding: '2rem',
      maxWidth: '100%',
      overflow: 'auto',
    },
    pageHeader: (isDark) => ({
      marginBottom: '1.5rem',
      title: {
        fontSize: '1.5rem',
        lineHeight: '2rem',
        fontWeight: '700',
        marginBottom: '0.5rem',
        color: isDark ? '#FFFFFF' : '#111827',
      },
      subtitle: {
        color: isDark ? '#9CA3AF' : '#4B5563',
      }
    }),
    statGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem',
    },
    statCard: (isDark) => ({
      padding: '1.5rem',
      borderRadius: '0.5rem',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    }),
    statCardHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '0.5rem',
    },
    statCardLabel: (isDark) => ({
      fontSize: '0.875rem',
      fontWeight: '500',
      color: isDark ? '#9CA3AF' : '#4B5563',
    }),
    statCardValue: (color) => ({
      fontSize: '1.875rem',
      lineHeight: '2.25rem',
      fontWeight: '700',
      color: color,
    }),
    statCardFooter: (isDark) => ({
      fontSize: '0.75rem',
      marginTop: '0.25rem',
      color: isDark ? '#6B7280' : '#6B7280',
    }),
    dashboardGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem',
    },
    contentCard: (isDark) => ({
      padding: '1.5rem',
      borderRadius: '0.5rem',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    }),
    contentCardTitle: (isDark) => ({
      fontWeight: '600',
      marginBottom: '1rem',
      color: isDark ? '#FFFFFF' : '#111827',
    }),
    listItem: (isDark, isLast) => ({
      padding: '0.75rem',
      borderRadius: '0.5rem',
      backgroundColor: isDark ? '#374151' : '#F9FAFB',
      marginBottom: isLast ? 0 : '0.75rem',
    }),
    listItemTitle: (isDark) => ({
      fontWeight: '500',
      fontSize: '0.875rem',
      color: isDark ? '#FFFFFF' : '#111827',
    }),
    listItemDescription: (isDark) => ({
      fontSize: '0.75rem',
      color: isDark ? '#9CA3AF' : '#4B5563',
    }),
    badge: (colors) => ({
      fontSize: '0.75rem',
      padding: '0.25rem 0.5rem',
      borderRadius: '0.25rem',
      backgroundColor: colors.bg,
      color: colors.text,
      fontWeight: '500',
    }),
    toolbar: {
      marginBottom: '1.5rem',
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap',
    },
    searchInputContainer: {
      flex: '1 1 200px',
      position: 'relative',
    },
    searchInput: (isDark) => ({
      width: '100%',
      padding: '0.5rem 1rem 0.5rem 2.5rem',
      borderRadius: '0.5rem',
      borderWidth: '1px',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderColor: isDark ? '#374151' : '#D1D5DB',
      color: isDark ? '#FFFFFF' : '#111827',
      boxSizing: 'border-box',
    }),
    searchInputIcon: {
      position: 'absolute',
      left: '0.75rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9CA3AF',
    },
    selectInput: (isDark) => ({
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      borderWidth: '1px',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderColor: isDark ? '#374151' : '#D1D5DB',
      color: isDark ? '#FFFFFF' : '#111827',
    }),
    tableContainer: (isDark) => ({
      borderRadius: '0.5rem',
      overflow: 'auto',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    }),
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: '600px',
    },
    tableHead: (isDark) => ({
      backgroundColor: isDark ? '#374151' : '#F9FAFB',
    }),
    tableHeaderCell: (isDark) => ({
      padding: '0.75rem 1.5rem',
      textAlign: 'left',
      fontSize: '0.75rem',
      fontWeight: '500',
      color: isDark ? '#D1D5DB' : '#6B7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }),
    tableBody: (isDark) => ({
      borderColor: isDark ? '#374151' : '#E5E7EB',
    }),
    tableRow: (isDark, index) => ({
      borderTopWidth: index === 0 ? '0' : '1px',
      borderColor: isDark ? '#374151' : '#E5E7EB',
    }),
    tableCell: (isDark, isHeader = false) => ({
      padding: '1rem 1.5rem',
      whiteSpace: 'nowrap',
      fontWeight: isHeader ? '500' : '400',
      fontSize: '0.875rem',
      color: isHeader 
        ? (isDark ? '#FFFFFF' : '#111827')
        : (isDark ? '#D1D5DB' : '#4B5563'),
    }),
    toggleButton: (isDark, isActive) => ({
      position: 'relative',
      display: 'inline-flex',
      height: '1.5rem',
      width: '2.75rem',
      alignItems: 'center',
      borderRadius: '9999px',
      transition: 'background-color 150ms',
      backgroundColor: isActive ? '#2563EB' : (isDark ? '#4B5563' : '#D1D5DB'),
      border: 'none',
      cursor: 'pointer',
    }),
    toggleButtonHandle: (isActive) => ({
      display: 'inline-block',
      height: '1.25rem',
      width: '1.25rem',
      transform: isActive ? 'translateX(1.5rem)' : 'translateX(0.25rem)',
      borderRadius: '9999px',
      backgroundColor: '#FFFFFF',
      transition: 'transform 150ms',
    }),
    refreshButton: (isDark) => ({
      padding: '0.5rem 1rem',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      color: isDark ? '#FFFFFF' : '#111827',
      border: '1px solid',
      borderColor: isDark ? '#4B5563' : '#D1D5DB',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '500',
    }),
    loadingSpinner: {
      textAlign: 'center',
      padding: '2rem',
      color: '#9CA3AF',
    }
  };

  if (loading) {
    return (
      <div style={styles.container(darkMode)}>
        <div style={styles.loadingSpinner}>Loading dashboard data...</div>
      </div>
    );
  }

  return (<AdminGuard>
    <div style={styles.container(darkMode)}>
      <header style={styles.header(darkMode)}>
        <div style={styles.headerLeft}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={styles.menuButton(darkMode)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 style={styles.headerTitle(darkMode)}>
            TOOL ANALYTICS
          </h1>
        </div>
        <div style={styles.headerRight}>
          <button
            onClick={fetchDashboardData}
            style={styles.refreshButton(darkMode)}
          >
            Refresh
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={styles.iconButton(darkMode)}
          >
            {darkMode ? <Sun size={20} style={{ color: '#FACC15' }} /> : <Moon size={20} style={{ color: darkMode ? '#D1D5DB' : '#4B5563' }} />}
          </button>
          <Bell size={20} style={{ color: darkMode ? '#D1D5DB' : '#4B5563' }} />
          <div style={styles.avatar(darkMode)}>
            <User size={18} style={{ color: '#FFFFFF' }} />
          </div>
        </div>
      </header>

      <div style={styles.contentArea}>
        {sidebarOpen && (
          <aside style={styles.sidebar(darkMode)}>
            <nav style={styles.nav}>
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Home },
                { id: 'tools', label: 'Tool Manager', icon: Wrench },
                { id: 'clicks', label: 'Click Tracking', icon: MousePointerClick },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={styles.navButton(darkMode, activeTab === item.id)}
                >
                  <item.icon size={20} />
                  <span style={{ fontWeight: '500' }}>{item.label}</span>
                </button>
              ))}
            </nav>

            <div style={styles.profileCard(darkMode)}>
              <div style={styles.profileCardHeader}>
                <div style={styles.profileCardAvatar(darkMode)}>
                  <User size={20} style={{ color: '#FFFFFF' }} />
                </div>
                <div>
                  <div style={styles.profileCardName(darkMode)}>Admin User</div>
                  <div style={styles.profileCardEmail(darkMode)}>admin@filemint.com</div>
                </div>
              </div>
            </div>
          </aside>
        )}

        <main style={styles.mainContent}>
          {activeTab === 'dashboard' && (
            <div>
              <div style={styles.pageHeader(darkMode)}>
                <h2 style={styles.pageHeader(darkMode).title}>
                  Dashboard Overview
                </h2>
                <p style={styles.pageHeader(darkMode).subtitle}>
                  Real-time analytics and tool performance metrics
                </p>
              </div>

              <div style={styles.statGrid}>
                <div style={styles.statCard(darkMode)}>
                  <div style={styles.statCardHeader}>
                    <div style={styles.statCardLabel(darkMode)}>Total Interactions</div>
                    <MousePointerClick size={20} style={{ color: '#3B82F6' }} />
                  </div>
                  <div style={styles.statCardValue('#3B82F6')}>{stats.totalClicks}</div>
                  <div style={styles.statCardFooter(darkMode)}>{stats.todayClicks} today</div>
                </div>

                <div style={styles.statCard(darkMode)}>
                  <div style={styles.statCardHeader}>
                    <div style={styles.statCardLabel(darkMode)}>Page Loads</div>
                    <Eye size={20} style={{ color: '#22C55E' }} />
                  </div>
                  <div style={styles.statCardValue('#22C55E')}>{stats.pageLoads}</div>
                  <div style={styles.statCardFooter(darkMode)}>total page visits</div>
                </div>

                

                <div style={styles.statCard(darkMode)}>
                  <div style={styles.statCardHeader}>
                    <div style={styles.statCardLabel(darkMode)}>Unique Visitors</div>
                    <Users size={20} style={{ color: '#F97316' }} />
                  </div>
                  <div style={styles.statCardValue('#F97316')}>{stats.uniqueVisitors}</div>
                  <div style={styles.statCardFooter(darkMode)}>distinct IP addresses</div>
                </div>

                <div style={styles.statCard(darkMode)}>
                  <div style={styles.statCardHeader}>
                    <div style={styles.statCardLabel(darkMode)}>Tools Clicked</div>
                    <TrendingUp size={20} style={{ color: '#EC4899' }} />
                  </div>
                  <div style={styles.statCardValue('#EC4899')}>{stats.uniqueToolsClicked}</div>
                  <div style={styles.statCardFooter(darkMode)}>different tools interacted</div>
                </div>

                <div style={styles.statCard(darkMode)}>
                  <div style={styles.statCardHeader}>
                    <div style={styles.statCardLabel(darkMode)}>Top Performers</div>
                    <BarChart3 size={20} style={{ color: '#8B5CF6' }} />
                  </div>
                  <div style={styles.statCardValue('#8B5CF6')}>{stats.topToolsCount}</div>
                  <div style={styles.statCardFooter(darkMode)}>tracked in analytics</div>
                </div>
              </div>

              <div style={styles.dashboardGrid}>
                <div style={styles.contentCard(darkMode)}>
                  <h3 style={styles.contentCardTitle(darkMode)}>Top Performing Tools</h3>
                  <div>
                    {topTools.length > 0 ? (
                      topTools.slice(0, 5).map((tool, index) => (
                        <div key={index} style={styles.listItem(darkMode, index === 4)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <div style={styles.listItemTitle(darkMode)}>{tool._id || 'Unknown Tool'}</div>
                              <div style={styles.listItemDescription(darkMode)}>{tool.count} clicks recorded</div>
                            </div>
                            <div style={styles.badge({ bg: '#DCFCE7', text: '#166534' })}>
                              #{index + 1}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '1rem' }}>
                        No tool interaction data available yet
                      </p>
                    )}
                  </div>
                </div>

                <div style={styles.contentCard(darkMode)}>
                  <h3 style={styles.contentCardTitle(darkMode)}>Recent Activity</h3>
                  <div>
                    {recentClicks.length > 0 ? (
                      recentClicks.slice(0, 5).map((click, index) => (
                        <div key={index} style={styles.listItem(darkMode, index === 4)}>
                          <div style={styles.listItemTitle(darkMode)}>
                            {click.toolName || 'Activity'}
                          </div>
                          <div style={styles.listItemDescription(darkMode)}>
                            {click.element || 'Interaction'} • {click.timestamp ? new Date(click.timestamp).toLocaleString() : 'Recent'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '1rem' }}>
                        No recent activity
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
            <div>
              <div style={styles.pageHeader(darkMode)}>
                <h2 style={styles.pageHeader(darkMode).title}>
                  Tool Manager
                </h2>
                <p style={styles.pageHeader(darkMode).subtitle}>
                  Manage and monitor all {stats.totalTools} available tools
                </p>
              </div>

              <div style={styles.toolbar}>
                <div style={styles.searchInputContainer}>
                  <Search style={styles.searchInputIcon} size={20} />
                  <input
                    type="text"
                    placeholder="Search tools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput(darkMode)}
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={styles.selectInput(darkMode)}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>

              {filteredTools.length > 0 ? (
                <div style={styles.tableContainer(darkMode)}>
                  <table style={styles.table}>
                    <thead style={styles.tableHead(darkMode)}>
                      <tr>
                        <th style={styles.tableHeaderCell(darkMode)}>Tool Name</th>
                        <th style={styles.tableHeaderCell(darkMode)}>Category</th>
                        <th style={styles.tableHeaderCell(darkMode)}>Total Visits</th>
                        <th style={styles.tableHeaderCell(darkMode)}>Total Users</th>
                        <th style={styles.tableHeaderCell(darkMode)}>Status</th>
                      </tr>
                    </thead>
                    <tbody style={styles.tableBody(darkMode)}>
                      {filteredTools.map((tool, index) => (
                        <tr key={tool._id} style={styles.tableRow(darkMode, index)}>
                          <td style={styles.tableCell(darkMode, true)}>{tool.name}</td>
                          <td style={styles.tableCell(darkMode)}>{tool.category}</td>
                          <td style={styles.tableCell(darkMode)}>{(tool.totalVisits || 0).toLocaleString()}</td>
                          <td style={styles.tableCell(darkMode)}>{(tool.totalUsers || 0).toLocaleString()}</td>
                          <td style={styles.tableCell(darkMode)}>
                            <button
                              onClick={() => toggleTool(tool._id)}
                              style={styles.toggleButton(darkMode, tool.status)}
                            >
                              <span style={styles.toggleButtonHandle(tool.status)} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem' }}>
                  No tools found matching your criteria
                </p>
              )}
            </div>
          )}

          {activeTab === 'clicks' && (
            <div>
              <div style={styles.pageHeader(darkMode)}>
                <h2 style={styles.pageHeader(darkMode).title}>
                  Click Tracking
                </h2>
                <p style={styles.pageHeader(darkMode).subtitle}>
                  {recentClicks.length} total interactions recorded
                </p>
              </div>

              {recentClicks.length > 0 ? (
                <div style={styles.tableContainer(darkMode)}>
                  <table style={styles.table}>
                    <thead style={styles.tableHead(darkMode)}>
                      <tr>
                        <th style={styles.tableHeaderCell(darkMode)}>Tool Name</th>
                        <th style={styles.tableHeaderCell(darkMode)}>Element</th>
                        <th style={styles.tableHeaderCell(darkMode)}>Category</th>
                        <th style={styles.tableHeaderCell(darkMode)}>Page</th>
                        <th style={styles.tableHeaderCell(darkMode)}>Time</th>
                      </tr>
                    </thead>
                    <tbody style={styles.tableBody(darkMode)}>
                      {recentClicks.map((click, index) => (
                        <tr key={click._id || index} style={styles.tableRow(darkMode, index)}>
                          <td style={styles.tableCell(darkMode, true)}>
                            {click.toolName || click.tool || 'N/A'}
                          </td>
                          <td style={styles.tableCell(darkMode)}>
                            {click.element || 'N/A'}
                          </td>
                          <td style={styles.tableCell(darkMode)}>
                            {click.category || 'N/A'}
                          </td>
                          <td style={styles.tableCell(darkMode)}>
                            {click.page || 'N/A'}
                          </td>
                          <td style={styles.tableCell(darkMode)}>
                            {click.timestamp ? new Date(click.timestamp).toLocaleString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>
                  No click data recorded yet
                </p>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <div style={styles.pageHeader(darkMode)}>
                <h2 style={styles.pageHeader(darkMode).title}>
                  Analytics Overview
                </h2>
                <p style={styles.pageHeader(darkMode).subtitle}>
                  Comprehensive metrics and performance indicators
                </p>
              </div>

              <div style={{...styles.statGrid, marginBottom: '1.5rem'}}>
                <div style={styles.statCard(darkMode)}>
                  <div style={styles.statCardValue('#3B82F6')}>{stats.totalClicks}</div>
                  <div style={styles.statCardLabel(darkMode)}>Total Clicks</div>
                  <div style={styles.statCardFooter(darkMode)}>All time interactions</div>
                </div>
                <div style={styles.statCard(darkMode)}>
                  <div style={styles.statCardValue('#22C55E')}>{stats.pageLoads}</div>
                  <div style={styles.statCardLabel(darkMode)}>Page Loads</div>
                  <div style={styles.statCardFooter(darkMode)}>Total page visits</div>
                </div>
                <div style={styles.statCard(darkMode)}>
                  <div style={styles.statCardValue('#A855F7')}>{stats.uniqueVisitors}</div>
                  <div style={styles.statCardLabel(darkMode)}>Unique Visitors</div>
                  <div style={styles.statCardFooter(darkMode)}>Distinct IP addresses</div>
                </div>
                <div style={styles.statCard(darkMode)}>
                  <div style={styles.statCardValue('#F97316')}>{stats.activeTools}</div>
                  <div style={styles.statCardLabel(darkMode)}>Active Tools</div>
                  <div style={styles.statCardFooter(darkMode)}>Currently enabled</div>
                </div>
                <div style={styles.statCard(darkMode)}>
                  <div style={styles.statCardValue('#EC4899')}>{stats.uniqueToolsClicked}</div>
                  <div style={styles.statCardLabel(darkMode)}>Tools Interacted</div>
                  <div style={styles.statCardFooter(darkMode)}>Different tools clicked</div>
                </div>
                <div style={styles.statCard(darkMode)}>
                  <div style={styles.statCardValue('#8B5CF6')}>{stats.todayClicks}</div>
                  <div style={styles.statCardLabel(darkMode)}>Today's Clicks</div>
                  <div style={styles.statCardFooter(darkMode)}>Since midnight</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div></AdminGuard>
  );
};

export default AdminPanel;