// frontend/src/App.jsx
// LangGraph-style UI adapted to work with your existing backend

import React, { useState, useEffect } from 'react';
import { Play, RefreshCw, CheckCircle, Loader, AlertCircle, Wifi, WifiOff, TrendingUp, Globe } from 'lucide-react';

const MarketingAgentSimulator = () => {
  const [input, setInput] = useState("What are the best marketing channels for B2B SaaS companies?");
  const [executing, setExecuting] = useState(false);
  const [currentNode, setCurrentNode] = useState(null);
  const [nodeHistory, setNodeHistory] = useState([]);
  const [stateLog, setStateLog] = useState([]);
  const [finalOutput, setFinalOutput] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const [maxResults, setMaxResults] = useState(5);

  const nodes = [
    { id: 'input', label: 'Input Processing', x: 50, y: 50 },
    { id: 'research', label: 'Web Research', x: 50, y: 150 },
    { id: 'analysis', label: 'GPT Analysis', x: 50, y: 250 },
    { id: 'synthesis', label: 'Insight Synthesis', x: 50, y: 350 },
    { id: 'output', label: 'Output Formatting', x: 50, y: 450 }
  ];

  // Check backend connection
  const checkBackend = async () => {
    try {
      const response = await fetch('http://localhost:8000/health');
      const data = await response.json();
      setBackendConnected(data.status === 'healthy');
      return true;
    } catch (error) {
      setBackendConnected(false);
      return false;
    }
  };

  // Execute with animated node progression
  const executeAgent = async () => {
    if (!input.trim()) {
      alert('Please enter a query');
      return;
    }

    const connected = await checkBackend();
    if (!connected) {
      alert('Backend not connected! Start the FastAPI server:\ncd backend && uvicorn app.main:app --reload');
      return;
    }

    setExecuting(true);
    setCurrentNode(null);
    setNodeHistory([]);
    setStateLog([]);
    setFinalOutput(null);

    try {
      // Simulate node progression while actual API call happens
      const progressNodes = async () => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          setCurrentNode(node.id);
          setNodeHistory(prev => [...prev, node.id]);
          
          // Add state logs
          let stateData = {};
          switch(node.id) {
            case 'input':
              stateData = {
                query: input,
                max_results: maxResults,
                status: 'Processing query parameters'
              };
              break;
            case 'research':
              stateData = {
                status: 'Searching web with SerpAPI',
                search_queries: [input],
                progress: 'Fetching search results...'
              };
              break;
            case 'analysis':
              stateData = {
                status: 'Analyzing with Google Gemini',
                model: '2.5-flash',
                progress: 'Generating insights...'
              };
              break;
            case 'synthesis':
              stateData = {
                status: 'Synthesizing insights',
                progress: 'Formatting results...'
              };
              break;
            case 'output':
              stateData = {
                status: 'Preparing final output',
                progress: 'Complete'
              };
              break;
          }
          
          setStateLog(prev => [...prev, {
            node: node.id,
            state: stateData,
            timestamp: new Date().toISOString()
          }]);

          // Variable timing based on node
          const delay = node.id === 'research' ? 3000 : 
                       node.id === 'analysis' ? 4000 : 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      };

      // Start node animation
      const progressPromise = progressNodes();

      // Make actual API call
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input,
          max_results: maxResults
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Wait for animation to complete
      await progressPromise;

      // Format output
      setFinalOutput({
        insights: data.insights || [],
        sources: data.sources || [],
        thought_trace: {
          research_phase: `Retrieved ${data.sources?.length || 0} sources`,
          analysis_phase: `Generated ${data.insights?.length || 0} insights`,
          synthesis_phase: `Average confidence: ${calculateAvgConfidence(data.insights)}`,
          quality_metrics: {
            total_insights: data.total_insights,
            processing_time: data.processing_time,
            timestamp: data.timestamp
          }
        },
        metadata: {
          execution_time_ms: data.processing_time * 1000,
          nodes_executed: nodes.length,
          timestamp: data.timestamp || new Date().toISOString()
        }
      });

      setCurrentNode(null);
    } catch (error) {
      console.error('Execution error:', error);
      alert(`Error: ${error.message}`);
      setStateLog(prev => [...prev, {
        node: 'error',
        state: { error: error.message },
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setExecuting(false);
    }
  };

  const calculateAvgConfidence = (insights) => {
    if (!insights || insights.length === 0) return '0.00';
    const avg = insights.reduce((sum, i) => sum + (i.confidence || 0), 0) / insights.length;
    return avg.toFixed(2);
  };

  const reset = () => {
    setCurrentNode(null);
    setNodeHistory([]);
    setStateLog([]);
    setFinalOutput(null);
  };

  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 5000); // Check every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            Marketing.MBA Intelligence Agent
          </h1>
          <p className="text-slate-300">AI-powered marketing analysis with Google Gemini 2.5-flash and SerpAPI</p>
          
          {/* Backend Status */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg">
              {backendConnected ? (
                <>
                  <Wifi size={16} className="text-green-400" />
                  <span className="text-sm text-green-400">Backend Connected</span>
                </>
              ) : (
                <>
                  <WifiOff size={16} className="text-red-400" />
                  <span className="text-sm text-red-400">Backend Offline</span>
                </>
              )}
            </div>
          </div>
          
          {!backendConnected && (
            <div className="mt-3 bg-red-900/20 border border-red-500/30 rounded p-3 text-sm">
              <strong>Backend not running!</strong> Start it with: 
              <code className="bg-slate-800 px-2 py-1 rounded ml-2">cd backend && uvicorn app.main:app --reload</code>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Input Section */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-purple-500/20">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Play size={20} className="text-purple-400" />
              Marketing Query
            </h2>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-32 bg-slate-900/50 rounded p-3 text-sm border border-slate-700 focus:border-purple-500 focus:outline-none resize-none"
              placeholder="Enter your marketing research query..."
              disabled={executing}
            />
            
            <div className="mt-4 mb-4">
              <label className="block text-sm text-slate-300 mb-2">
                Number of Insights: {maxResults}
              </label>
              <input
                type="range"
                min="3"
                max="10"
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value))}
                disabled={executing}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={executeAgent}
                disabled={executing || !backendConnected}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-700 disabled:to-slate-700 px-4 py-2 rounded font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {executing ? <Loader size={18} className="animate-spin" /> : <Play size={18} />}
                {executing ? 'Executing...' : 'Execute Analysis'}
              </button>
              <button
                onClick={reset}
                disabled={executing}
                className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 px-4 py-2 rounded font-semibold flex items-center gap-2 transition-all"
              >
                <RefreshCw size={18} />
                Reset
              </button>
            </div>
          </div>

          {/* Graph Visualization */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-purple-500/20">
            <h2 className="text-xl font-semibold mb-4">Agent Execution Pipeline</h2>
            <div className="relative h-96 bg-slate-900/50 rounded">
              <svg className="w-full h-full">
                {/* Edges */}
                {nodes.slice(0, -1).map((node, i) => (
                  <line
                    key={`edge-${i}`}
                    x1="50%"
                    y1={`${(i + 1) * 18 + 3}%`}
                    x2="50%"
                    y2={`${(i + 2) * 18 + 3}%`}
                    stroke={nodeHistory.includes(nodes[i + 1].id) ? '#a855f7' : '#475569'}
                    strokeWidth="2"
                    className="transition-all duration-500"
                  />
                ))}
                
                {/* Nodes */}
                {nodes.map((node, i) => {
                  const isActive = currentNode === node.id;
                  const isCompleted = nodeHistory.includes(node.id) && currentNode !== node.id;
                  
                  return (
                    <g key={node.id}>
                      <circle
                        cx="50%"
                        cy={`${(i + 1) * 18 + 3}%`}
                        r="20"
                        fill={isActive ? '#a855f7' : isCompleted ? '#10b981' : '#1e293b'}
                        stroke={isActive ? '#ec4899' : isCompleted ? '#10b981' : '#475569'}
                        strokeWidth="3"
                        className="transition-all duration-500"
                      />
                      {isActive && (
                        <circle
                          cx="50%"
                          cy={`${(i + 1) * 18 + 3}%`}
                          r="25"
                          fill="none"
                          stroke="#a855f7"
                          strokeWidth="2"
                          opacity="0.5"
                          className="animate-ping"
                        />
                      )}
                      <text
                        x="50%"
                        y={`${(i + 1) * 18 + 3}%`}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-semibold fill-white"
                      >
                        {isActive ? '⚡' : isCompleted ? '✓' : i + 1}
                      </text>
                      <text
                        x="50%"
                        y={`${(i + 1) * 18 + 8}%`}
                        textAnchor="middle"
                        className="text-xs fill-slate-300"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* State Log */}
        {stateLog.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-purple-500/20 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-purple-400" />
              Execution Trace
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stateLog.map((log, i) => (
                <div key={i} className="bg-slate-900/50 rounded p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-purple-400">{log.node.toUpperCase()}</span>
                    <span className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(log.state, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final Output */}
        {finalOutput && (
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-green-500/20">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-green-400">
              <CheckCircle size={20} />
              Analysis Results
            </h2>
            <div className="space-y-6">
              {/* Insights */}
              <div>
                <h3 className="font-semibold text-purple-400 mb-3 flex items-center gap-2">
                  <TrendingUp size={18} />
                  Insights
                </h3>
                <div className="space-y-3">
                  {finalOutput.insights.map((insight, i) => (
                    <div key={i} className="bg-slate-900/50 rounded p-4 border border-slate-700">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-semibold text-white">{insight.title}</span>
                        <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm">{insight.detail}</p>
                      <span className="text-xs text-purple-400 mt-2 inline-block">{insight.category}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Sources */}
              <div>
                <h3 className="font-semibold text-purple-400 mb-3 flex items-center gap-2">
                  <Globe size={18} />
                  Sources
                </h3>
                <div className="space-y-2">
                  {finalOutput.sources.map((source, i) => (
                    <div key={i} className="bg-slate-900/50 rounded p-3 border border-slate-700">
                      <a 
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-blue-400 hover:text-blue-300"
                      >
                        {source.title}
                      </a>
                      <p className="text-xs text-slate-400 mt-1">{source.snippet}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thought Trace */}
              <div>
                <h3 className="font-semibold text-purple-400 mb-2">Thought Trace: Metrics</h3>
                <div className="bg-slate-900/50 rounded p-4 border border-slate-700">
                  <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(finalOutput.thought_trace, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Metadata */}
              <div className="pt-4 border-t border-slate-700">
                <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                  <span>Execution: {finalOutput.metadata.execution_time_ms.toFixed(0)}ms</span>
                  <span>Nodes: {finalOutput.metadata.nodes_executed}</span>
                  <span>{new Date(finalOutput.metadata.timestamp).toLocaleString()}</span>
                  <span>Copyright @2025, Marketing.MBA</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!executing && !finalOutput && (
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-12 border border-purple-500/20 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">Ready to Analyze</h3>
            <p className="text-slate-400">Enter your marketing query and click Execute to begin</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketingAgentSimulator;