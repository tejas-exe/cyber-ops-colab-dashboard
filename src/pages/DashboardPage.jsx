import React, { useState, useRef, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Treemap,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from "recharts";
import {
  UploadCloud,
  Loader2,
  Activity,
  Briefcase,
  PlusCircle,
  FolderOpen,
  ArrowLeft,
  Users,
  UserPlus,
  Trash2,
  ChevronDown,
  ChevronUp,
  History,
  Info,
  Calendar,
  Network,
  Waves,
  LayoutGrid,
  Divide
} from "lucide-react";
import "../index.css";
import VirtualizedCVEList from "../components/VirtualizedCVEList";
import DiscussionRoom from "../components/DiscussionRoom";
import {
  useUserMeta,
  useWorkspaces,
  useWorkspaceDetails,
  useCreateWorkspace,
  useInviteMember,
  useRemoveMember,
  useAnalyzeLog,
} from "../hooks/useWorkspace";

// ── Visualizer ────────────────────────────────────────────────────────────────

const VulnerabilityVisualizer = ({ data }) => {
  const [activeTab, setActiveTab] = useState('force');

  const getAttackType = (description) => {
    const desc = description.toLowerCase();
    if (desc.includes('rce') || desc.includes('execution')) return 'RCE';
    if (desc.includes('xss') || desc.includes('scripting')) return 'XSS';
    if (desc.includes('lfi') || desc.includes('inclusion')) return 'LFI';
    if (desc.includes('injection') || desc.includes('sql')) return 'Injection';
    if (desc.includes('bypass') || desc.includes('auth')) return 'Auth';
    return 'Other';
  };

  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      attackType: getAttackType(item.description),
      z: item.risk * 10
    }));
  }, [data]);

  const treeData = useMemo(() => {
    const types = Array.from(new Set(processedData.map(d => d.attackType)));
    return types.map(type => ({
      name: type,
      children: processedData.filter(d => d.attackType === type).map(d => ({
        name: d.cve,
        size: d.risk
      }))
    }));
  }, [processedData]);

  const renderTabs = () => (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '1rem' }}>
      {[
        { id: 'force', label: 'Force Network', icon: <Network size={18} />, color: '#3b82f6' },
        { id: 'river', label: 'Risk River', icon: <Waves size={18} />, color: '#8b5cf6' },
        { id: 'tree', label: 'Treemap', icon: <LayoutGrid size={18} />, color: '#10b981' },
        { id: 'parallel', label: 'Analysis Flow', icon: <Divide size={18} />, color: '#f59e0b' }
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.75rem 1.25rem',
            borderRadius: '999px',
            background: activeTab === tab.id ? `${tab.color}20` : 'rgba(255,255,255,0.03)',
            border: `1px solid ${activeTab === tab.id ? tab.color : 'rgba(255,255,255,0.1)'}`,
            color: activeTab === tab.id ? tab.color : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.3s',
            whiteSpace: 'nowrap',
            fontWeight: 600
          }}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ margin: '3rem 0', background: 'var(--bg-card)', padding: '2.5rem', borderRadius: '2rem', border: '1px solid var(--border-light)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Vulnerability Intelligence Lab</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Advanced visual heuristics for attack surface analysis.</p>
        </div>
      </div>

      {renderTabs()}

      <div style={{ height: '500px', width: '100%', background: 'rgba(0,0,0,0.1)', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
        {activeTab === 'force' && (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
                <XAxis type="number" dataKey="x" name="Cluster" hide domain={[0, 100]} />
                <YAxis type="number" dataKey="y" name="Severity" hide domain={[0, 100]} />
                <ZAxis type="number" dataKey="risk" range={[100, 800]} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Scatter name="CVEs" data={processedData.map((d) => {
                  const typeOffset = d.attackType.charCodeAt(0) * 1337;
                  return {
                    ...d,
                    x: (typeOffset % 80) + 10,
                    y: (d.cvss * 8) + 10 + (Math.random() * 5)
                  };
                })}>
                  {processedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.riskLevel === 'critical' ? '#ef4444' : entry.riskLevel === 'high' ? '#f97316' : '#3b82f6'}
                      style={{ filter: 'drop-shadow(0 0 12px rgba(0,0,0,0.5))' }}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>

            {/* Legend Overlay */}
            <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', background: 'rgba(15, 23, 42, 0.8)', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Intelligence Layout</p>
              {['critical', 'high', 'medium'].map(risk => (
                <div key={risk} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: risk === 'critical' ? '#ef4444' : risk === 'high' ? '#f97316' : '#3b82f6' }}></div>
                  <span style={{ textTransform: 'capitalize' }}>{risk} Risk</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'river' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processedData} margin={{ top: 50, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              />
              <Area type="monotone" dataKey="risk" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRisk)" />
              <Area type="monotone" dataKey="cvss" stroke="#3b82f6" fillOpacity={1} fill="rgba(59, 130, 246, 0.2)" />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'tree' && (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treeData}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="#0f172a"
              fill="#3b82f6"
            >
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              />
            </Treemap>
          </ResponsiveContainer>
        )}

        {activeTab === 'parallel' && (
          <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ margin: '0 0 1rem 0' }}>Multi-Variate Risk Correlation</h4>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2rem' }}>
              {['CVSS', 'EPSS', 'RISK', 'PATCH LAG'].map(axis => (
                <div key={axis} style={{ position: 'relative', height: '100%', width: '1px', background: 'rgba(255,255,255,0.1)' }}>
                  <span style={{ position: 'absolute', bottom: '-2.5rem', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{axis}</span>
                  {processedData.slice(0, 5).map((d, idx) => (
                    <div key={idx} style={{
                      position: 'absolute',
                      bottom: `${axis === 'CVSS' ? d.cvss * 10 : axis === 'EPSS' ? d.epss * 100 : axis === 'RISK' ? d.risk * 20 : Math.random() * 80}%`,
                      left: '-4px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: d.riskLevel === 'critical' ? '#ef4444' : '#3b82f6'
                    }}></div>
                  ))}
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3.5rem', textAlign: 'center' }}>Lines correlating metrics across CVE nodes indicate attack density and remediation urgency.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Local only UI state
  const [cveData, setCveData] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [expandedCve, setExpandedCve] = useState(null);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [inviteUserId, setInviteUserId] = useState("");
  const [isRemediationCollapsed, setIsRemediationCollapsed] = useState(false);
  const [expandedAnalyses, setExpandedAnalyses] = useState({});
  const fileInputRef = useRef(null);

  const itemsPerPage = 8;
  const currentPage = parseInt(searchParams.get("page") || "1");

  // ── React Query hooks ──────────────────────────────────────────────────────
  const token = localStorage.getItem("accessToken");
  const hasToken = !!token;

  const { data: user } = useUserMeta(hasToken);
  const { data: workspaces = [], isLoading: loadingWorkspaces } = useWorkspaces(hasToken);
  const { data: selectedWorkspace } = useWorkspaceDetails(workspaceId);

  const createWorkspace = useCreateWorkspace();
  const inviteMember = useInviteMember(workspaceId ?? "");
  const removeMember = useRemoveMember(workspaceId ?? "");
  const analyzeLog = useAnalyzeLog(workspaceId);

  // Redirect if unauthenticated
  React.useEffect(() => {
    if (!hasToken) navigate("/login");
  }, [hasToken, navigate]);

  // Clear CVE data when workspace changes
  React.useEffect(() => {
    setCveData([]);
  }, [workspaceId]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handlePageChange = (newPage) => setSearchParams({ page: newPage });

  const handleWorkspaceSelect = (ws) => navigate(`/dashboard/${ws.id}`);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    try {
      const newWs = await createWorkspace.mutateAsync(newWorkspaceName.trim());
      setNewWorkspaceName("");
      setIsCreatingWorkspace(false);
      handleWorkspaceSelect(newWs);
    } catch {
      alert("Failed to create workspace");
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteUserId.trim()) return;
    try {
      await inviteMember.mutateAsync(inviteUserId.trim());
      setInviteUserId("");
      alert("Member invited successfully");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to invite member");
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await removeMember.mutateAsync(memberId);
    } catch {
      alert("Error removing member");
    }
  };

  const handleFileAnalysis = async (file) => {
    try {
      const result = await analyzeLog.mutateAsync(file);
      setCveData(result);
    } catch {
      alert("Failed to process the log file.");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (!selectedWorkspace) return;
    if (e.dataTransfer.files?.[0]) handleFileAnalysis(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (!selectedWorkspace) return;
    if (e.target.files?.[0]) handleFileAnalysis(e.target.files[0]);
  };

  const toggleExpand = (cve) => setExpandedCve(expandedCve === cve ? null : cve);

  const toggleAnalysisAccordion = (id) =>
    setExpandedAnalyses(prev => ({ ...prev, [id]: !prev[id] }));

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = {
    total: cveData.length,
    critical: cveData.filter(d => d.riskLevel === 'critical').length,
    high: cveData.filter(d => d.riskLevel === 'high').length,
    avgRisk: cveData.length
      ? (cveData.reduce((acc, d) => acc + d.risk, 0) / cveData.length).toFixed(1)
      : 0
  };

  const isOwner = selectedWorkspace?.createdById === user?.id;
  const isUploading = analyzeLog.isPending;

  // ── Render: Workspaces Grid ────────────────────────────────────────────────

  const renderWorkspacesGrid = () => (
    <div className="dashboard-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: "2.5rem", fontWeight: 800 }}>My Workspaces</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Select a workspace to manage logs and collaborate.</p>
        </div>
        <button className="btn-glow" onClick={() => setIsCreatingWorkspace(true)}>
          <PlusCircle size={20} /> Create New
        </button>
      </div>

      {isCreatingWorkspace && (
        <div style={{
          background: "var(--bg-card)",
          padding: "2rem",
          borderRadius: "1.5rem",
          border: "1px solid var(--border-light)",
          marginBottom: "2rem",
          maxWidth: "500px"
        }}>
          <h3 style={{ marginBottom: "1rem" }}>Create New Workspace</h3>
          <form onSubmit={handleCreateWorkspace}>
            <input
              type="text"
              placeholder="Workspace Name"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              className="glass-input"
              style={{ width: '100%', marginBottom: '1rem' }}
              required
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={createWorkspace.isPending}>
                {createWorkspace.isPending ? <Loader2 className="spinner" size={18} /> : "Create"}
              </button>
              <button type="button" onClick={() => setIsCreatingWorkspace(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loadingWorkspaces ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}>
          <Loader2 className="spinner" size={48} color="var(--primary-accent)" />
        </div>
      ) : (
        <div className="grid-heat" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {workspaces.map(ws => (
            <div key={ws.id} className="card" onClick={() => handleWorkspaceSelect(ws)} style={{ cursor: 'pointer' }}>
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px' }}>
                    <Briefcase size={24} color="var(--primary-accent)" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>{ws.name}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Created {new Date(ws.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              <div className="metrics" style={{ marginTop: '1rem' }}>
                <div className="metric">
                  <span className="metric-label">Members</span>
                  <span className="metric-value">{ws.members?.length || 0}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Analyses</span>
                  <span className="metric-value">{ws._count?.analyses || 0}</span>
                </div>
              </div>
            </div>
          ))}
          {workspaces.length === 0 && !isCreatingWorkspace && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem' }}>
              <FolderOpen size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>No workspaces found. Create one to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── Render: Workspace Detail ───────────────────────────────────────────────

  const renderWorkspaceDetail = () => {
    if (!selectedWorkspace) return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8rem' }}>
        <Loader2 className="spinner" size={48} color="var(--primary-accent)" />
      </div>
    );

    return (
      <div className="dashboard-container" style={{ maxWidth: '1600px', margin: '0 auto', padding: '2rem' }}>
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <button
              onClick={() => { navigate("/dashboard"); setCveData([]); }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '0.5rem', fontSize: '0.9rem' }}
            >
              <ArrowLeft size={14} /> Back to Workspaces
            </button>
            <h1 style={{ fontSize: "2.2rem", fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {selectedWorkspace.name}
              <span style={{ fontSize: '0.7rem', padding: '4px 12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-accent)', borderRadius: '999px', fontWeight: 700, border: '1px solid rgba(59, 130, 246, 0.2)', letterSpacing: '0.05em' }}>
                {isOwner ? "WORKSPACE OWNER" : "TEAM MEMBER"}
              </span>
            </h1>
          </div>

          {cveData.length > 0 && (
            <button className="btn-glow" style={{ padding: "0.8rem 1.6rem", fontSize: "0.95rem", borderRadius: '12px' }} onClick={() => setCveData([])}>
              <PlusCircle size={18} style={{ marginRight: '8px' }} /> New Scan
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start' }}>
          {/* Main Content Area */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
              {[
                { label: 'Total CVEs', value: stats.total, color: '#3b82f6' },
                { label: 'Critical Risk', value: stats.critical, color: '#ef4444' },
                { label: 'High Priority', value: stats.high, color: '#f97316' },
                { label: 'Avg Risk', value: stats.avgRisk, color: '#8b5cf6' }
              ].map((stat, i) => (
                <div key={i} style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border-light)', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{stat.label}</p>
                  <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Upload Zone */}
            {!cveData.length && !isUploading && (
              <div
                className="upload-zone"
                onClick={() => fileInputRef.current.click()}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                style={{ minHeight: '350px', background: dragActive ? 'rgba(59, 130, 246, 0.05)' : 'rgba(30, 41, 59, 0.3)', border: `2px dashed ${dragActive ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255,255,255,0.05)'}` }}
              >
                <div className="upload-content">
                  <UploadCloud size={64} style={{ color: 'var(--primary-accent)', opacity: 0.8 }} />
                  <div style={{ margin: '2rem 0' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Start Intelligence Analysis</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '400px', margin: '0 auto' }}>Upload application or system logs to identify vulnerabilities and calculate real-world risk probabilities.</p>
                  </div>
                  <button className="btn-primary" style={{ padding: '1rem 2.5rem', borderRadius: '12px', fontWeight: 600 }}>Select Log File</button>
                  <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleChange} accept=".log,.txt" />
                </div>
              </div>
            )}

            {/* Loading */}
            {isUploading && (
              <div style={{ textAlign: 'center', padding: '6rem', background: 'var(--bg-card)', borderRadius: '2rem', border: '1px solid var(--border-light)' }}>
                <Loader2 className="spinner" size={56} color="var(--primary-accent)" style={{ margin: '0 auto 2rem' }} />
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Processing Security Intelligence...</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Correlating findings with NVD database and calculating EPSS probability.</p>
              </div>
            )}

            {/* CVE Results */}
            {cveData.length > 0 && !isUploading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                <VulnerabilityVisualizer data={cveData} />

                <section>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Vulnerability Grid</h2>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '6px 14px', borderRadius: '99px' }}>
                      Surface Area: {cveData.length} Nodes
                    </span>
                  </div>

                  <div className="grid-heat" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {cveData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                      <div key={item.cve} className={`card risk-${item.riskLevel}`} style={{ padding: '1.5rem' }}>
                        <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                          <span className="card-title" style={{ fontSize: '1.2rem', fontWeight: 700 }}>{item.cve}</span>
                          <span className="risk-badge">{item.riskLevel}</span>
                        </div>
                        <div className="metrics" style={{ gridTemplateColumns: '1fr 1fr 1fr', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.03)' }}>
                          <div className="metric"><span className="metric-label" style={{ fontSize: '0.7rem' }}>CVSS</span><span className="metric-value">{item.cvss}</span></div>
                          <div className="metric"><span className="metric-label" style={{ fontSize: '0.7rem' }}>EPSS</span><span className="metric-value">{item.epss?.toFixed(3)}</span></div>
                          <div className="metric"><span className="metric-label" style={{ fontSize: '0.7rem' }}>RISK</span><span className="metric-value" style={{ color: 'var(--primary-accent)' }}>{item.risk.toFixed(1)}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {cveData.length > itemsPerPage && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '3rem' }}>
                      <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="btn-secondary" style={{ width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                        <ChevronLeft size={20} />
                      </button>
                      <div style={{ padding: '8px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', fontSize: '1rem', fontWeight: 700 }}>
                        {currentPage} / {Math.ceil(cveData.length / itemsPerPage)}
                      </div>
                      <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= Math.ceil(cveData.length / itemsPerPage)} className="btn-secondary" style={{ width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  )}
                </section>

                <div className="cve-details-section">
                  <div
                    onClick={() => setIsRemediationCollapsed(!isRemediationCollapsed)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '1.75rem', background: 'linear-gradient(to right, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.2))', borderRadius: '1.5rem', border: '1px solid var(--border-light)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
                        <Info size={24} color="#10b981" />
                      </div>
                      <h3 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>Remediation Strategies & Intelligence</h3>
                    </div>
                    {isRemediationCollapsed ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
                  </div>

                  {!isRemediationCollapsed && (
                    <div style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.1)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.03)', overflow: 'hidden' }}>
                      <VirtualizedCVEList
                        data={cveData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                        expandedCve={expandedCve}
                        onToggle={toggleExpand}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div style={{ width: '400px', position: 'sticky', top: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Team Section */}
            <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Users size={22} color="var(--primary-accent)" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Workspace Team</h3>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{selectedWorkspace.members?.length} active</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {selectedWorkspace.members?.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800 }}>
                        {m.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, textOverflow: 'ellipsis', overflow: 'hidden' }}>{m.user?.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden' }}>{m.user?.email}</p>
                      </div>
                    </div>
                    {isOwner && m.userId !== user?.id && (
                      <button onClick={() => handleRemoveMember(m.userId)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {isOwner && (
                <form onSubmit={handleInviteMember} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text" placeholder="Invite Researcher ID..." value={inviteUserId}
                      onChange={(e) => setInviteUserId(e.target.value)}
                      className="glass-input" style={{ width: '100%', padding: '1rem 1.25rem', fontSize: '0.9rem' }}
                    />
                    <button type="submit" className="btn-glow" style={{ position: 'absolute', right: '6px', top: '6px', bottom: '6px', padding: '0 15px', borderRadius: '10px' }} disabled={inviteMember.isPending}>
                      {inviteMember.isPending ? <Loader2 className="spinner" size={16} /> : <UserPlus size={18} />}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Research History Section */}
            <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border-light)', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                <History size={22} color="var(--primary-accent)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Snapshot History</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
                {selectedWorkspace.analyses?.length > 0 ? (
                  selectedWorkspace.analyses.map((analysis, idx) => (
                    <div key={analysis.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.25rem', padding: '1.25rem', transition: 'transform 0.2s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                        <div>
                          <div style={{ fontSize: '1rem', fontWeight: 700 }}>Analysis #{selectedWorkspace.analyses.length - idx}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{new Date(analysis.createdAt).toLocaleDateString()}</div>
                        </div>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-accent)', padding: '4px 10px', borderRadius: '99px', fontWeight: 700 }}>
                          {analysis.response?.length || 0} CVEs
                        </span>
                      </div>
                      <button
                        className="btn-secondary" style={{ width: '100%', fontSize: '0.85rem', padding: '10px', fontWeight: 600 }}
                        onClick={() => { setCveData(analysis.response); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      >
                        Restore Dashboard
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', borderRadius: '1.5rem', border: '1px dashed rgba(255,255,255,0.05)' }}>
                    No analysis history found for this workspace.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
      {!workspaceId ? renderWorkspacesGrid() : renderWorkspaceDetail()}
      {workspaceId && selectedWorkspace && (
        <DiscussionRoom
          workspaceName={selectedWorkspace.name}
          workspaceId={workspaceId}
          members={selectedWorkspace.members || []}
          user={user}
        />
      )}
    </div>
  );
}
