import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Database, Table2, Eye, Link2 } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'

const DEFAULT_TYPES = ['UUID', 'TEXT', 'INTEGER', 'BIGINT', 'BOOLEAN', 'TIMESTAMPTZ', 'JSONB', 'DECIMAL', 'VARCHAR', 'DATE']

function parseSqlToTables(files) {
  const sqlFile = files.find((f) => f.path.endsWith('.sql') || f.path.includes('schema'))
  if (!sqlFile) return []

  const tables = []
  const tableRegex = /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)\s*\(([\s\S]*?)\);/gi
  let match

  while ((match = tableRegex.exec(sqlFile.content)) !== null) {
    const tableName = match[1]
    const columnDefs = match[2]
    const columns = []

    const lines = columnDefs.split('\n').filter((l) => l.trim())
    lines.forEach((line) => {
      const col = line.trim().replace(/,$/, '')
      if (col.startsWith('PRIMARY KEY') || col.startsWith('UNIQUE') || col.startsWith('INDEX') || col.startsWith('CONSTRAINT') || col.startsWith('FOREIGN')) return
      const parts = col.split(/\s+/)
      if (parts.length >= 2 && !parts[0].startsWith('--')) {
        columns.push({
          name: parts[0],
          type: parts[1]?.replace(/[^A-Z0-9]/gi, '').toUpperCase() || 'TEXT',
          nullable: !col.includes('NOT NULL'),
          pk: col.toLowerCase().includes('primary key'),
        })
      }
    })

    if (columns.length > 0) {
      tables.push({ name: tableName, columns })
    }
  }

  return tables
}

export default function SchemaDesigner() {
  const { files } = useProjectStore()
  const [tables, setTables] = useState(() => {
    const parsed = parseSqlToTables(files)
    return parsed.length > 0 ? parsed : [
      {
        name: 'users',
        columns: [
          { name: 'id', type: 'UUID', nullable: false, pk: true },
          { name: 'email', type: 'TEXT', nullable: false, pk: false },
          { name: 'name', type: 'TEXT', nullable: false, pk: false },
          { name: 'role', type: 'TEXT', nullable: true, pk: false },
          { name: 'created_at', type: 'TIMESTAMPTZ', nullable: true, pk: false },
        ],
      },
    ]
  })
  const [activeTable, setActiveTable] = useState(tables[0]?.name || null)
  const [activeTab, setActiveTab] = useState('tables') // tables | sql | diagram

  const addTable = () => {
    const newTable = {
      name: `table_${tables.length + 1}`,
      columns: [{ name: 'id', type: 'UUID', nullable: false, pk: true }],
    }
    setTables([...tables, newTable])
    setActiveTable(newTable.name)
  }

  const addColumn = (tableName) => {
    setTables((prev) =>
      prev.map((t) =>
        t.name === tableName
          ? { ...t, columns: [...t.columns, { name: 'new_column', type: 'TEXT', nullable: true, pk: false }] }
          : t
      )
    )
  }

  const updateColumn = (tableName, colIdx, field, value) => {
    setTables((prev) =>
      prev.map((t) =>
        t.name === tableName
          ? { ...t, columns: t.columns.map((c, i) => i === colIdx ? { ...c, [field]: value } : c) }
          : t
      )
    )
  }

  const deleteColumn = (tableName, colIdx) => {
    setTables((prev) =>
      prev.map((t) =>
        t.name === tableName
          ? { ...t, columns: t.columns.filter((_, i) => i !== colIdx) }
          : t
      )
    )
  }

  const deleteTable = (name) => {
    setTables((prev) => prev.filter((t) => t.name !== name))
    if (activeTable === name) setActiveTable(tables[0]?.name || null)
  }

  const generateSql = () => {
    return tables.map((t) => {
      const cols = t.columns.map((c) => {
        let def = `  ${c.name} ${c.type}`
        if (c.pk) def += ' DEFAULT gen_random_uuid() PRIMARY KEY'
        if (!c.nullable && !c.pk) def += ' NOT NULL'
        return def
      }).join(',\n')
      return `CREATE TABLE IF NOT EXISTS ${t.name} (\n${cols}\n);`
    }).join('\n\n')
  }

  const currentTable = tables.find((t) => t.name === activeTable)

  return (
    <div className="flex h-full overflow-hidden">
      {/* Table list sidebar */}
      <div className="w-56 flex-shrink-0 border-r border-glass bg-surface-100 flex flex-col">
        <div className="px-3 py-2.5 border-b border-glass flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Database size={12} /> Tables
          </div>
          <button onClick={addTable} className="p-0.5 rounded text-slate-500 hover:text-white hover:bg-white/8 transition-all">
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {tables.map((t) => (
            <div
              key={t.name}
              onClick={() => setActiveTable(t.name)}
              className={`flex items-center justify-between px-3 py-2 cursor-pointer text-sm group transition-all ${
                activeTable === t.name ? 'bg-brand-600/15 text-brand-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Table2 size={13} />
                <span className="truncate font-mono text-xs">{t.name}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteTable(t.name) }}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-600 hover:text-red-400 transition-all"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-glass bg-surface-300">
          {[
            { id: 'tables', label: '📋 Columns' },
            { id: 'sql', label: '🗄️ SQL' },
            { id: 'diagram', label: '🔗 Diagram' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                activeTab === tab.id ? 'bg-brand-600/20 text-brand-300' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Columns view */}
        {activeTab === 'tables' && currentTable && (
          <div className="flex-1 overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Table2 size={18} className="text-brand-400" />
                <span className="font-mono">{currentTable.name}</span>
              </h2>
              <button onClick={() => addColumn(currentTable.name)} className="btn-ghost text-xs py-1.5 px-3">
                <Plus size={14} /> Add Column
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-glass">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-100 border-b border-glass">
                    {['Column Name', 'Type', 'Nullable', 'Primary Key', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentTable.columns.map((col, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-glass hover:bg-white/3 transition-colors group"
                    >
                      <td className="px-4 py-2.5">
                        <input
                          value={col.name}
                          onChange={(e) => updateColumn(currentTable.name, i, 'name', e.target.value)}
                          className="bg-transparent font-mono text-xs text-slate-200 outline-none border-b border-transparent focus:border-brand-600/50 w-full"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <select
                          value={col.type}
                          onChange={(e) => updateColumn(currentTable.name, i, 'type', e.target.value)}
                          className="bg-transparent text-xs text-slate-400 outline-none font-mono"
                          style={{ background: 'transparent' }}
                        >
                          {DEFAULT_TYPES.map((t) => <option key={t} value={t} style={{ background: '#1a1a26' }}>{t}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={col.nullable}
                          onChange={(e) => updateColumn(currentTable.name, i, 'nullable', e.target.checked)}
                          className="accent-brand-600"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        {col.pk ? (
                          <span className="badge badge-purple text-xs">PK</span>
                        ) : (
                          <span className="text-slate-700 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => deleteColumn(currentTable.name, i)}
                          className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SQL view */}
        {activeTab === 'sql' && (
          <div className="flex-1 overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Generated SQL</h2>
              <button
                onClick={() => { navigator.clipboard.writeText(generateSql()); }}
                className="btn-ghost text-xs py-1.5 px-3"
              >
                Copy SQL
              </button>
            </div>
            <pre className="bg-surface-300 rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-auto border border-glass leading-relaxed">
              {generateSql()}
            </pre>
          </div>
        )}

        {/* Diagram view */}
        {activeTab === 'diagram' && (
          <div className="flex-1 overflow-auto p-6">
            <h2 className="font-bold mb-6">Entity Relationship Diagram</h2>
            <div className="flex flex-wrap gap-6">
              {tables.map((t) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card min-w-[180px]"
                >
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-glass">
                    <Table2 size={14} className="text-brand-400" />
                    <span className="font-bold text-sm font-mono">{t.name}</span>
                  </div>
                  {t.columns.map((c) => (
                    <div key={c.name} className="flex items-center gap-2 py-0.5">
                      {c.pk && <span className="text-yellow-400 text-xs">🔑</span>}
                      <span className="font-mono text-xs text-slate-400">{c.name}</span>
                      <span className="ml-auto text-xs text-slate-600">{c.type}</span>
                    </div>
                  ))}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
