import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Network,
  Shield,
  Phone,
  Globe,
  Share2,
  Info,
  Loader2,
  ListFilter
} from 'lucide-react';

import { api } from '../services/api';
import { GraphResponse, GraphNode, GraphEdge } from '../types';

export const EvidenceGraphView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const caseIdParam = searchParams.get('case_id');

  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [viewMode, setViewMode] = useState<'visual' | 'table'>('visual');

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        setLoading(true);
        const data = await api.getGraph(caseIdParam ? Number(caseIdParam) : undefined);
        setGraphData(data);
        if (data.nodes.length > 0) {
          setSelectedNode(data.nodes[0]);
        }
      } catch (err) {
        console.error('Failed to load evidence graph', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, [caseIdParam]);

  const filteredNodes = graphData?.nodes.filter((node) =>
    node.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
    node.type.toLowerCase().includes(searchFilter.toLowerCase())
  ) || [];

  const getNodeEdges = (nodeId: string): GraphEdge[] => {
    if (!graphData) return [];
    return graphData.edges.filter(
      (e) => e.source === nodeId || e.target === nodeId
    );
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'case':
        return <Shield size={16} color="var(--brand-cyan)" />;
      case 'upi':
        return <Share2 size={16} color="#34d399" />;
      case 'phone':
        return <Phone size={16} color="#fbbf24" />;
      case 'url':
        return <Globe size={16} color="#f87171" />;
      default:
        return <Network size={16} color="#a78bfa" />;
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Network size={24} color="var(--brand-cyan)" />
            Evidence Correlation Network
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Defensible cross-case graph linking incidents by verified anchors (shared VPAs, phone numbers, and domains).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
            <button
              onClick={() => setViewMode('visual')}
              className={`btn ${viewMode === 'visual' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', border: 'none' }}
            >
              Interactive Network
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', border: 'none' }}
            >
              <ListFilter size={14} />
              List Alternative
            </button>
          </div>
        </div>
      </div>

      {/* Legend & Stats Banner */}
      <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.85rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Entity Types:</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-cyan)' }}>
            <Shield size={14} /> Case Record
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399' }}>
            <Share2 size={14} /> Shared UPI VPA
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24' }}>
            <Phone size={14} /> Phone Number
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f87171' }}>
            <Globe size={14} /> Phishing Domain
          </span>
        </div>

        <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {graphData ? `${graphData.nodes.length} Nodes &bull; ${graphData.edges.length} Correlated Links` : '...'}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <Loader2 size={36} className="spin" style={{ color: 'var(--brand-cyan)', margin: '0 auto 1rem auto' }} />
          <p style={{ color: 'var(--text-muted)' }}>Generating multi-entity graph...</p>
        </div>
      ) : !graphData || graphData.nodes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <Network size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Active Evidence Correlations</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Cases must share concrete anchors (e.g. matching VPA or phone) to generate correlation edges.</p>
        </div>
      ) : viewMode === 'visual' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1fr)', gap: '1.5rem' }}>
          {/* Graph Visual Canvas / Interactive Matrix */}
          <div className="card" style={{ padding: '1.5rem', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Filter graph nodes..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>

            {/* Visual Node Cluster Layout */}
            <div style={{
              flex: 1,
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              padding: '1.5rem',
              overflowY: 'auto',
              maxHeight: '480px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '1rem',
              alignContent: 'start'
            }}>
              {filteredNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const nodeEdges = getNodeEdges(node.id);
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    style={{
                      backgroundColor: isSelected ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
                      border: `1px solid ${isSelected ? 'var(--brand-cyan)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 0 2px rgba(6, 182, 212, 0.3)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                      {getNodeIcon(node.type)}
                      <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {node.type}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', wordBreak: 'break-all', marginBottom: '0.35rem' }}>
                      {node.label}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>{nodeEdges.length} connections</span>
                      {node.risk_category && (
                        <span style={{ textTransform: 'uppercase', color: node.risk_category === 'critical' ? '#ef4444' : '#fbbf24' }}>
                          {node.risk_category}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Node Detail & Relationship Sidebar */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div className="card-header">
              <span className="card-title">
                <Info size={18} color="var(--brand-cyan)" />
                Entity Inspector
              </span>
            </div>

            {selectedNode ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {getNodeIcon(selectedNode.type)}
                  <span className="badge" style={{ backgroundColor: 'var(--bg-surface-elevated)' }}>
                    {selectedNode.type.toUpperCase()}
                  </span>
                </div>

                <h3 className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', wordBreak: 'break-all', marginBottom: '1rem' }}>
                  {selectedNode.label}
                </h3>

                {selectedNode.type === 'case' && selectedNode.properties.case_id && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      <strong>Threat: </strong>{selectedNode.properties.primary_threat_type}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      <strong>Status: </strong>{selectedNode.properties.status}
                    </div>
                    <Link
                      to={`/investigate/${selectedNode.properties.case_id}`}
                      className="btn btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', width: '100%' }}
                    >
                      Investigate Case Dossier &rarr;
                    </Link>
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                    Connected Evidence Links ({getNodeEdges(selectedNode.id).length})
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto' }}>
                    {getNodeEdges(selectedNode.id).map((edge, idx) => (
                      <div key={idx} style={{ backgroundColor: 'var(--bg-app)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 700, color: edge.is_inferred ? '#fbbf24' : '#38bdf8' }}>
                            {edge.relationship_type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="mono" style={{ color: 'var(--text-muted)' }}>
                            {edge.is_inferred ? 'Inferred' : 'Observed'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {edge.justification}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Select a node from the network to inspect its relationships and evidence anchors.
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Accessible List-Based Alternative */
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Source Entity</th>
                <th>Relationship Type</th>
                <th>Target Entity</th>
                <th>Classification</th>
                <th>Defensible Justification</th>
              </tr>
            </thead>
            <tbody>
              {graphData.edges.map((edge) => (
                <tr key={edge.id}>
                  <td className="mono" style={{ fontWeight: 600, color: 'var(--brand-cyan)' }}>
                    {edge.source}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {edge.relationship_type.replace('_', ' ')}
                  </td>
                  <td className="mono" style={{ fontWeight: 600, color: '#fbbf24' }}>
                    {edge.target}
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: edge.is_inferred ? 'rgba(245, 158, 11, 0.15)' : 'rgba(2, 132, 199, 0.15)', color: edge.is_inferred ? '#fbbf24' : '#38bdf8' }}>
                      {edge.is_inferred ? 'Inferred' : 'Observed'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', maxWidth: '350px' }}>
                    {edge.justification}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
