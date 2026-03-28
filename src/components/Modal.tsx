import type { ReactNode } from 'react'

interface ModalProps {
  title: string
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

export default function Modal({ title, isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
