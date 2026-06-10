import { useState, useEffect } from 'react'
import axios from 'axios'
import type { TestMetadata, TestContent, Attempt, History } from './types'
import { Clock, Trophy, BookOpen, AlertCircle, Copy, CheckCircle2, ChevronLeft, Zap, ChevronDown, ChevronUp, BarChart2, Star, Plus, Wand2, Trash2, Archive, Edit2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const API_BASE = 'http://localhost:3001/api'

function App() {
  const [view, setView] = useState<'home' | 'test' | 'results'>('home')
  const [tests, setTests] = useState<any[]>([])
  const [currentTest, setCurrentTest] = useState<TestContent | null>(null)
  const [currentFilename, setCurrentFilename] = useState<string | null>(null)
  const [userAnswers, setUserAnswers] = useState<string[]>([])
  const [startTime, setStartTime] = useState<number>(0)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [history, setHistory] = useState<History | null>(null)
  const [notes, setNotes] = useState<string>('')

  // Modals
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false)
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('')
  const [copySuccess, setCopySuccess] = useState<boolean>(false)

  const [showImportModal, setShowImportModal] = useState<boolean>(false)
  const [isAddingNewTopic, setIsAddingNewTopic] = useState<boolean>(true)
  const [importTopic, setImportTopic] = useState<string>('')
  const [importJson, setImportJson] = useState<string>('')
  const [importError, setImportError] = useState<string | null>(null)

  const [showGeneratorModal, setShowGeneratorModal] = useState<boolean>(false)
  const [genTopic, setGenTopic] = useState<string>('')
  const [genDifficulty, setGenDifficulty] = useState<string>('Beginner')

  // Management State
  const [showArchived, setShowArchived] = useState<boolean>(false)
  const [editingTopic, setEditingTopic] = useState<string | null>(null)
  const [newTopicName, setNewTopicName] = useState<string>('')

  // Review State
  const [reviewTab, setReviewTab] = useState<'incorrect' | 'correct'>('incorrect')
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null)

  useEffect(() => {
    fetchTests()
  }, [])

  useEffect(() => {
    let interval: number | undefined;
    if (view === 'test' && startTime > 0) {
      interval = window.setInterval(() => {
        setCurrentTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [view, startTime])

  const fetchTests = async () => {
    try {
      const response = await axios.get(`${API_BASE}/tests`)
      const grouped = response.data.reduce((acc: any, test: TestMetadata) => {
        if (!acc[test.topic]) acc[test.topic] = []
        acc[test.topic].push(test)
        return acc
      }, {})
      setTests(Object.values(grouped).map((group: any) => group.sort((a: any, b: any) => a.hardness - b.hardness)))
    } catch (error) {
      console.error('Failed to fetch tests', error)
    }
  }

  const startTest = async (filename: string) => {
    try {
      const response = await axios.get(`${API_BASE}/tests/${filename}`)
      setCurrentTest(response.data)
      setCurrentFilename(filename)
      setUserAnswers(new Array(response.data.test.length).fill(''))
      const now = Date.now()
      setStartTime(now)
      setCurrentTime(0)
      setView('test')
      
      const testId = filename.replace('.json', '')
      const historyRes = await axios.get(`${API_BASE}/history/${testId}`)
      setHistory(historyRes.data)
      const notesRes = await axios.get(`${API_BASE}/notes/${testId}`)
      setNotes(notesRes.data.notes || '')
      
      setReviewTab('incorrect')
      setExpandedQuestion(null)
    } catch (error) {
      console.error('Failed to start test', error)
    }
  }

  const submitTest = async () => {
    if (!currentTest || !currentFilename) return
    const timeTaken = Math.floor((Date.now() - startTime) / 1000)
    let score = 0
    currentTest.test.forEach((q, i) => { if (userAnswers[i] === q.answer) score++ })
    const testId = currentFilename.replace('.json', '')
    const attempt: Omit<Attempt, 'date'> = { score, total: currentTest.test.length, timeTaken, answers: userAnswers }
    try {
      const response = await axios.post(`${API_BASE}/history/${testId}`, attempt)
      setHistory(response.data)
      setView('results')
      if (score === currentTest.test.length) setReviewTab('correct')
    } catch (error) {
      console.error('Failed to submit test', error)
    }
  }

  const saveNotes = async () => {
    if (!currentFilename) return
    try {
      await axios.post(`${API_BASE}/notes/${currentFilename.replace('.json', '')}`, { notes })
      alert('Notes saved successfully!')
    } catch (error) {
      console.error('Failed to save notes', error)
    }
  }

  const handleImport = async () => {
    setImportError(null)
    try {
      const data = JSON.parse(importJson)
      if (!data.topic || !data.hardness || !data.test) throw new Error('Invalid format: Missing topic, hardness, or test array.')
      if (importTopic) {
        data.topic = importTopic
      }
      await axios.post(`${API_BASE}/tests`, data)
      await fetchTests()
      setShowImportModal(false)
      setImportJson('')
      setImportTopic('')
      alert('Test imported successfully!')
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse JSON.')
    }
  }

  const handleDelete = async (filename: string) => {
    if (!confirm('Are you sure you want to delete this test version? This cannot be undone.')) return
    try {
      await axios.post(`${API_BASE}/tests/${filename}/delete`)
      await fetchTests()
    } catch (error) {
      console.error('Failed to delete test', error)
    }
  }

  const handleArchive = async (filename: string, archived: boolean) => {
    try {
      await axios.post(`${API_BASE}/tests/${filename}/update`, { archived: !archived })
      await fetchTests()
    } catch (error) {
      console.error('Failed to update archive status', error)
    }
  }

  const handleRename = async (oldTopic: string) => {
    if (!newTopicName.trim()) return
    try {
      const related = tests.find(group => group[0].topic === oldTopic)
      if (related) {
        await Promise.all(related.map((t: any) => 
          axios.post(`${API_BASE}/tests/${t.filename}/update`, { topic: newTopicName })
        ))
      }
      await fetchTests()
      setEditingTopic(null)
    } catch (error) {
      console.error('Failed to rename topic', error)
    }
  }

  const generatePrompt = () => {
    const schema = `{
  "topic": "string",
  "hardness": "number (1-10)",
  "date": "${new Date().toISOString().split('T')[0]}",
  "test": [
    {
      "question": "string",
      "mutliple_choices": ["string", "string", "string", "string"],
      "answer": "string (a, b, c, or d)"
    }
  ]
}`
    const prompt = `Generate a high-quality assessment test for the following topic:
---
${genTopic}
---
Difficulty Level: ${genDifficulty} (Assign a numeric hardness 1-10 accordingly).

Requirements:
1. Format as valid JSON matching this exact schema: ${schema}
2. Exactly 5-10 challenging questions.
3. Ensure choices are balanced and realistic.
4. Only return the JSON object.`

    setGeneratedPrompt(prompt)
    setShowGeneratorModal(false)
    setShowPromptModal(true)
  }

  const copyQuestion = (q: any) => {
    const text = `Question: ${q.question}\nOptions: ${q.mutliple_choices.join(', ')}\nCorrect Answer: ${q.answer}`
    navigator.clipboard.writeText(text)
    alert('Question details copied to clipboard!')
  }

  const TopicCard = ({ group }: { group: TestMetadata[] }) => {
    const latest = group[group.length - 1]
    const [selectedFilename, setSelectedFilename] = useState(latest?.filename || '')
    const currentT = group.find(t => t.filename === selectedFilename) || latest

    if (!latest) return null

    return (
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', opacity: group.every(t => t.archived) ? 0.6 : 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            {editingTopic === latest.topic ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  className="input-field" 
                  style={{ padding: '0.25rem 0.5rem', fontSize: '1rem', width: '200px' }}
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  autoFocus
                />
                <button onClick={() => handleRename(latest.topic)} className="btn-primary" style={{ padding: '0.25rem 0.5rem' }}>Save</button>
                <button onClick={() => setEditingTopic(null)} className="btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>{latest.topic}</h3>
                <button 
                  onClick={() => { setEditingTopic(latest.topic); setNewTopicName(latest.topic); }}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem' }}
                >
                  <Edit2 size={12} />
                </button>
              </div>
            )}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 600 }}>
              {group.length} VERSION{group.length > 1 ? 'S' : ''} • LATEST: LEVEL {latest.hardness}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select 
              value={selectedFilename}
              onChange={(e) => setSelectedFilename(e.target.value)}
              className="btn-secondary"
              style={{ appearance: 'auto', padding: '0.4rem 2rem 0.4rem 0.75rem', fontSize: '0.875rem' }}
            >
              {group.map(t => (
                <option key={t.filename} value={t.filename}>{t.archived ? '📦 ' : ''}Level {t.hardness} ({t.date})</option>
              ))}
            </select>
            <button onClick={() => startTest(currentT!.filename)} className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>Start</button>
            
            <div style={{ display: 'flex', borderLeft: '1px solid var(--border)', paddingLeft: '0.75rem', gap: '0.4rem' }}>
              <button onClick={() => handleArchive(currentT!.filename, currentT!.archived)} title={currentT!.archived ? 'Unarchive' : 'Archive'} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <Archive size={16} color={currentT!.archived ? 'var(--accent)' : 'currentColor'} />
              </button>
              <button onClick={() => handleDelete(currentT!.filename)} title="Delete" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}>
                <Trash2 size={16} />
              </button>
              <button onClick={() => { setIsAddingNewTopic(false); setImportTopic(latest.topic); setImportJson(''); setShowImportModal(true); }} className="btn-secondary" style={{ padding: '0.4rem 0.75rem' }}>
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'home') {
    const activeTests = tests.filter(group => group.some(t => !t.archived))
    const archivedTests = tests.filter(group => group.every(t => t.archived))

    return (
      <div style={{ padding: '2rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.6rem', backgroundColor: 'var(--accent)', borderRadius: '0.75rem' }}>
              <BookOpen size={24} color="white" />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Study Assistant</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setShowGeneratorModal(true)} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', gap: '0.5rem' }}>
              <Wand2 size={16} /> Get AI Prompt
            </button>
            <button onClick={() => { setIsAddingNewTopic(true); setImportTopic(''); setImportJson(''); setShowImportModal(true); }} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', gap: '0.5rem' }}>
              <Plus size={16} /> Add Test
            </button>
          </div>
        </div>
        
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Zap size={18} color="var(--accent)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '0.05em' }}>AVAILABLE TESTS</h2>
          </div>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {activeTests.length === 0 && (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <AlertCircle size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No active tests. Click "Add Test" to begin.</p>
              </div>
            )}
            {activeTests.map(group => <TopicCard key={group[0].topic} group={group} />)}
          </div>

          {(showArchived && archivedTests.length > 0) && (
            <div style={{ marginTop: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <Archive size={18} color="var(--text-muted)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>ARCHIVED</h2>
              </div>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {archivedTests.map(group => <TopicCard key={group[0].topic} group={group} />)}
              </div>
            </div>
          )}

          <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '2rem', textAlign: 'center' }}>
            <button 
              onClick={() => setShowArchived(!showArchived)}
              className="btn-secondary"
              style={{ fontSize: '0.875rem' }}
            >
              {showArchived ? 'Hide Archived Tests' : 'Show Archived Tests'}
            </button>
          </div>
        </section>

        {/* AI Prompt Generator Modal */}
        {showGeneratorModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}>
            <div className="glass-card" style={{ padding: '2rem', maxWidth: '500px', width: '100%' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Generate AI Prompt</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>TOPIC OR DESCRIPTION</label>
                  <textarea 
                    className="input-field" 
                    style={{ height: '100px', resize: 'none' }}
                    placeholder="e.g., Advanced React Hooks including Concurrent Mode and Server Components..."
                    value={genTopic}
                    onChange={(e) => setGenTopic(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>TARGET DIFFICULTY</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                    {['Beginner', 'Advanced', 'Master', 'Expert'].map(d => (
                      <button 
                        key={d}
                        onClick={() => setGenDifficulty(d)}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '2px solid', borderColor: genDifficulty === d ? 'var(--accent)' : 'var(--border)', backgroundColor: genDifficulty === d ? 'rgba(139, 92, 246, 0.1)' : 'transparent', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button onClick={() => setShowGeneratorModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                  <button onClick={generatePrompt} className="btn-primary" style={{ flex: 2 }} disabled={!genTopic}>Generate Prompt</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prompt Result Modal */}
        {showPromptModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}>
            <div className="glass-card" style={{ padding: '2rem', maxWidth: '600px', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Your AI Prompt</h2>
                <button onClick={() => setShowPromptModal(false)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
              </div>
              <textarea readOnly className="input-field" style={{ height: '250px', fontFamily: 'monospace', fontSize: '0.875rem', resize: 'none', marginBottom: '1.5rem' }} value={generatedPrompt} />
              <button 
                onClick={() => { navigator.clipboard.writeText(generatedPrompt); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }}
                className="btn-primary" style={{ width: '100%' }}
              >
                {copySuccess ? 'Copied to Clipboard!' : 'Copy Prompt & Close'}
              </button>
            </div>
          </div>
        )}

        {/* Global Import Modal */}
        {showImportModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}>
            <div className="glass-card" style={{ padding: '2rem', maxWidth: '600px', width: '100%' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{!isAddingNewTopic ? `Add Version: ${importTopic}` : 'Add New Test'}</h2>
              {isAddingNewTopic && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>TOPIC NAME</label>
                  <input 
                    className="input-field" 
                    placeholder="e.g., Python Basics" 
                    value={importTopic} 
                    onChange={(e) => setImportTopic(e.target.value)} 
                    autoFocus
                  />
                </div>
              )}
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>PASTE JSON CONTENT</label>
              <textarea 
                className="input-field" 
                style={{ height: '300px', fontFamily: 'monospace', fontSize: '0.875rem', resize: 'none', marginBottom: '1rem', border: importError ? '2px solid #ef4444' : '1px solid var(--border)' }} 
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='{ "topic": "...", "hardness": 5, "test": [...] }'
              />
              {importError && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 700 }}>⚠️ {importError}</div>}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setShowImportModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button onClick={handleImport} className="btn-primary" style={{ flex: 2 }}>Save Test</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (view === 'test' && currentTest) {
    const progress = (userAnswers.filter(a => a !== '').length / currentTest.test.length) * 100
    return (
      <div style={{ padding: '3rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
        <button onClick={() => setView('home')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', marginBottom: '2rem' }}>
          <ChevronLeft size={20} /> Back to Home
        </button>
        <header style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>{currentTest.topic}</h1>
              <p style={{ color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>Level {currentTest.hardness} Challenge</p>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="var(--accent)" /> {currentTime}s
            </div>
          </div>
          <div style={{ height: '0.5rem', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ height: '100%', backgroundColor: 'var(--accent)', width: `${progress}%`, transition: 'width 0.3s' }} />
          </div>
        </header>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
          {currentTest.test.map((q, qIdx) => (
            <div key={qIdx} className="animate-in">
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <span style={{ width: '2.5rem', height: '2.5rem', backgroundColor: 'var(--accent)', color: 'white', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyItems: 'center', flexShrink: 0, fontWeight: 700, justifyContent: 'center' }}>{qIdx + 1}</span>
                <h3 style={{ fontSize: '1.5rem', margin: 0, paddingTop: '0.25rem' }}>{q.question}</h3>
              </div>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {q.mutliple_choices.map((choice, cIdx) => {
                  const letter = String.fromCharCode(97 + cIdx)
                  const isSelected = userAnswers[qIdx] === letter
                  return (
                    <button
                      key={cIdx}
                      onClick={() => {
                        const newAnswers = [...userAnswers]
                        newAnswers[qIdx] = letter
                        setUserAnswers(newAnswers)
                      }}
                      style={{ textAlign: 'left', padding: '1.25rem', borderRadius: '1rem', border: '2px solid', borderColor: isSelected ? 'var(--accent)' : 'var(--border)', backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.05)' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s' }}
                    >
                      <span style={{ width: '2rem', height: '2rem', backgroundColor: isSelected ? 'var(--accent)' : 'rgba(0,0,0,0.05)', color: isSelected ? 'white' : 'inherit', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                        {letter.toUpperCase()}
                      </span>
                      <span style={{ fontWeight: 500, fontSize: '1.125rem' }}>{choice}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={submitTest} className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.25rem' }}>Finish Assessment</button>
        </div>
      </div>
    )
  }

  if (view === 'results' && currentTest && history) {
    const attempts = history.attempts || []
    const lastAttempt = attempts[attempts.length - 1]
    const scorePct = Math.round((lastAttempt?.score || 0) / (lastAttempt?.total || 1) * 100)
    const bestScore = Math.max(...attempts.map(a => a.score), 0)
    const bestTime = Math.min(...attempts.map(a => a.timeTaken), Infinity)
    const chartData = attempts.map((att, i) => ({ name: `T${i+1}`, score: att.score }))

    return (
      <div style={{ padding: '3rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Star size={14} fill="#f59e0b" color="#f59e0b" /> BEST SCORE: {bestScore}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={14} /> BEST TIME: {bestTime === Infinity ? 0 : bestTime}s</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '1rem' }}><Trophy size={32} color="#f59e0b" /></div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Assessment Results</h1>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3rem', minWidth: '300px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>{lastAttempt?.score} <span style={{ color: 'var(--text-muted)', fontSize: '1.25rem', fontWeight: 500 }}>/ {lastAttempt?.total}</span></div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '0.25rem' }}>TOTAL SCORE</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '0.75rem', fontWeight: 800, fontSize: '1.25rem' }}><Zap size={20} /> {scorePct}%</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '0.25rem' }}>ACCURACY</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
          <div className="glass-card" style={{ padding: '2rem', minHeight: '300px' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}><BarChart2 size={24} color="var(--accent)" /> Progress Analysis</h2>
            <div style={{ height: '200px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}><AlertCircle size={24} color="var(--accent)" /> Notes</h2>
            <textarea className="input-field" style={{ flex: 1, minHeight: '100px', marginBottom: '1rem' }} placeholder="What did you learn?" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <button onClick={saveNotes} style={{ alignSelf: 'flex-end', border: 'none', background: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}>Save Reflections</button>
          </div>
        </div>

        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Review Summary</h2>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button onClick={() => { setReviewTab('incorrect'); setExpandedQuestion(null); }} className={reviewTab === 'incorrect' ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1, padding: '0.75rem' }}>Incorrect ({currentTest.test.filter((_, i) => userAnswers[i] !== currentTest.test[i]?.answer).length})</button>
            <button onClick={() => { setReviewTab('correct'); setExpandedQuestion(null); }} className={reviewTab === 'correct' ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1, padding: '0.75rem' }}>Correct ({currentTest.test.filter((_, i) => userAnswers[i] === currentTest.test[i]?.answer).length})</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentTest.test.map((q, qIdx) => {
              const isCorrect = userAnswers[qIdx] === q.answer
              const shouldShow = (reviewTab === 'correct' && isCorrect) || (reviewTab === 'incorrect' && !isCorrect)
              if (!shouldShow) return null
              const isExpanded = expandedQuestion === qIdx
              return (
                <div key={qIdx} className="glass-card" style={{ overflow: 'hidden' }}>
                  <button onClick={() => setExpandedQuestion(isExpanded ? null : qIdx)} style={{ width: '100%', padding: '1.5rem 2rem', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="hover:bg-black/5">
                    <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>{qIdx + 1}. {q.question}</span>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {isExpanded && (
                    <div style={{ padding: '0 2rem 2rem 2rem' }} className="animate-in">
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                        <button onClick={() => copyQuestion(q)} style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Copy Details</button>
                      </div>
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {q.mutliple_choices.map((choice, cIdx) => {
                          const letter = String.fromCharCode(97 + cIdx)
                          const isUserAns = userAnswers[qIdx] === letter
                          const isCorrectAns = q.answer === letter
                          let bgColor = 'rgba(0,0,0,0.03)'; let borderColor = 'transparent'
                          if (isCorrectAns) { bgColor = 'rgba(16, 185, 129, 0.1)'; borderColor = '#10b981' }
                          else if (isUserAns && !isCorrect) { bgColor = 'rgba(239, 68, 68, 0.1)'; borderColor = '#ef4444' }
                          return (
                            <div key={cIdx} style={{ padding: '1rem', borderRadius: '0.75rem', border: `2px solid ${borderColor}`, backgroundColor: bgColor, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <span style={{ width: '1.75rem', height: '1.75rem', borderRadius: '0.4rem', backgroundColor: isCorrectAns ? '#10b981' : isUserAns ? '#ef4444' : 'rgba(0,0,0,0.1)', color: (isCorrectAns || isUserAns) ? 'white' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>{letter.toUpperCase()}</span>
                              <span style={{ fontWeight: (isCorrectAns || isUserAns) ? 700 : 500 }}>{choice}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
          <button onClick={() => setView('home')} className="btn-secondary" style={{ padding: '1rem 3rem' }}>Back to Dashboard</button>
          <button onClick={() => startTest(currentFilename!)} className="btn-primary" style={{ padding: '1rem 3rem' }}>Retake Test</button>
        </div>
      </div>
    )
  }
  return null
}

export default App
