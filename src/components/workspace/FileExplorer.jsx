import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight, ChevronDown, File, Folder, FolderOpen,
  Plus, Pencil, Trash2, X, Check, FilePlus, FolderPlus
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useProjectStore } from '@/store/projectStore'
import { deleteProjectFile, upsertProjectFile } from '@/lib/supabase'
import { getFileIcon, getLanguage, cn } from '@/lib/utils'

function sortFiles(files) {
  return [...files].sort((a, b) => {
    const aIsDir = !a.path.includes('.') || a.path.endsWith('/')
    const bIsDir = !b.path.includes('.') || b.path.endsWith('/')
    if (aIsDir && !bIsDir) return -1
    if (!aIsDir && bIsDir) return 1
    return a.path.localeCompare(b.path)
  })
}

function buildTree(files) {
  const tree = {}
  sortFiles(files).forEach((file) => {
    const parts = file.path.split('/')
    let node = tree
    parts.forEach((part, i) => {
      if (!node[part]) {
        node[part] = { _files: [], _dirs: {} }
      }
      if (i === parts.length - 1) {
        node[part]._file = file
      } else {
        node = node[part]._dirs
      }
    })
  })
  return tree
}

function TreeNode({ name, node, depth = 0, path = '' }) {
  const fullPath = path ? `${path}/${name}` : name
  const isFile = !!node._file
  const { activeFile, setActiveFile, removeFile, addFile, project } = useProjectStore()
  const [open, setOpen] = useState(depth < 2)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(name)
  const [hovering, setHovering] = useState(false)

  const isActive = activeFile?.path === fullPath
  const hasChildren = !isFile && Object.keys(node._dirs || {}).length > 0

  const handleClick = () => {
    if (isFile) {
      setActiveFile(node._file)
    } else {
      setOpen(!open)
    }
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!isFile) return
    if (!confirm(`Delete ${name}?`)) return
    const { error } = await deleteProjectFile(node._file.id)
    if (error) toast.error('Delete failed')
    else {
      removeFile(fullPath)
      toast.success('File deleted')
    }
  }

  const handleRename = async (e) => {
    e.stopPropagation()
    if (!newName || newName === name) {
      setRenaming(false)
      return
    }
    const newPath = path ? `${path}/${newName}` : newName
    const { error } = await upsertProjectFile({ ...node._file, path: newPath })
    if (error) {
      toast.error('Rename failed')
    } else {
      removeFile(fullPath)
      addFile({ ...node._file, path: newPath })
      toast.success('Renamed')
    }
    setRenaming(false)
  }

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer group transition-all text-sm',
          isActive ? 'bg-brand-600/15 text-brand-300' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
        )}
        style={{ paddingLeft: `${(depth + 1) * 12}px` }}
        onClick={handleClick}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Expand arrow for directories */}
        {!isFile && (
          <span className="w-4 flex-shrink-0">
            {hasChildren ? (
              open ? <ChevronDown size={12} /> : <ChevronRight size={12} />
            ) : null}
          </span>
        )}

        {/* Icon */}
        <span className="text-xs w-4 flex-shrink-0">
          {isFile
            ? getFileIcon(name)
            : open
            ? <FolderOpen size={14} className="text-yellow-400/70" />
            : <Folder size={14} className="text-yellow-400/70" />
          }
        </span>

        {/* Name */}
        {renaming ? (
          <form onSubmit={handleRename} className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 bg-white/10 rounded px-1.5 py-0.5 text-xs outline-none border border-brand-600/50"
              onBlur={handleRename}
            />
          </form>
        ) : (
          <span className="flex-1 truncate text-xs font-mono">{name}</span>
        )}

        {/* Actions */}
        {isFile && !renaming && (
          <div className={cn('flex items-center gap-0.5 transition-opacity', hovering || isActive ? 'opacity-100' : 'opacity-0')}>
            <button
              onClick={(e) => { e.stopPropagation(); setRenaming(true) }}
              className="p-0.5 rounded hover:bg-white/10 text-slate-500 hover:text-white"
            >
              <Pencil size={10} />
            </button>
            <button
              onClick={handleDelete}
              className="p-0.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400"
            >
              <Trash2 size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {!isFile && open && (
        <AnimatePresence>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {Object.entries(node._dirs || {}).map(([childName, childNode]) => (
              <TreeNode
                key={childName}
                name={childName}
                node={childNode}
                depth={depth + 1}
                path={fullPath}
              />
            ))}
            {node._file && (
              <TreeNode
                key={name}
                name={name}
                node={{ _file: node._file }}
                depth={depth}
                path={path}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

export default function FileExplorer() {
  const { files, project, addFile, setActiveFile } = useProjectStore()
  const [creating, setCreating] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [search, setSearch] = useState('')

  const tree = buildTree(files)

  const filteredFiles = search
    ? files.filter((f) => f.path.toLowerCase().includes(search.toLowerCase()))
    : []

  const handleCreateFile = async (e) => {
    e.preventDefault()
    if (!newFileName.trim()) return
    const file = {
      project_id: project?.id,
      path: newFileName,
      content: '',
      type: newFileName.split('.').pop() || 'txt',
    }
    const { data, error } = await upsertProjectFile(file)
    if (error) {
      toast.error('Failed to create file')
    } else {
      addFile(data || file)
      setActiveFile(data || file)
      toast.success('File created')
    }
    setCreating(false)
    setNewFileName('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-glass flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Files</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCreating(true)}
            className="p-1 rounded text-slate-500 hover:text-white hover:bg-white/8 transition-all"
            title="New file"
            id="new-file-btn"
          >
            <FilePlus size={14} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-1.5 border-b border-glass">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search files..."
          className="w-full bg-white/4 rounded-lg px-2.5 py-1 text-xs text-slate-300 placeholder-slate-600 outline-none border border-white/6 focus:border-brand-600/40"
          id="file-search"
        />
      </div>

      {/* New file form */}
      {creating && (
        <div className="px-2 py-1.5 border-b border-glass">
          <form onSubmit={handleCreateFile} className="flex items-center gap-1">
            <input
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="src/components/MyComponent.jsx"
              className="flex-1 bg-white/8 rounded px-2 py-1 text-xs outline-none border border-brand-600/50"
            />
            <button type="submit" className="p-1 text-emerald-400 hover:text-emerald-300"><Check size={12} /></button>
            <button type="button" onClick={() => setCreating(false)} className="p-1 text-slate-500 hover:text-white"><X size={12} /></button>
          </form>
        </div>
      )}

      {/* File tree or search results */}
      <div className="flex-1 overflow-y-auto py-1 scrollbar-none">
        {search ? (
          <div>
            {filteredFiles.length === 0 ? (
              <p className="text-xs text-slate-600 px-4 py-3">No files match "{search}"</p>
            ) : (
              filteredFiles.map((file) => (
                <div
                  key={file.path}
                  onClick={() => setActiveFile(file)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer rounded mx-1"
                >
                  <span>{getFileIcon(file.path)}</span>
                  <span className="truncate">{file.path}</span>
                </div>
              ))
            )}
          </div>
        ) : (
          Object.entries(tree).map(([name, node]) => (
            <TreeNode key={name} name={name} node={node} />
          ))
        )}

        {files.length === 0 && !creating && (
          <div className="text-center py-8 px-4">
            <File size={28} className="text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-600">No files yet</p>
            <button
              onClick={() => setCreating(true)}
              className="mt-2 text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              + Create a file
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
