'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'
import React from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
   
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50  }}
            className="sticky top-0 z-50 rounded-lgg max-w-md w-full h-screen overflow-y-scroll border border-zinc-300/80 bg-zinc-200 shadow-2xl shadow-zinc-800/5"
          >
            {/* Header */}
            <div className="flex sticky top-0 bg-zinc-300 items-center justify-between border-b border-zinc-200 px-4 py-3">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-full p-1 hover:bg-zinc-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className=" px-3 pt-2.5 pb-3">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}