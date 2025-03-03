'use client'

import { useEffect, useState } from 'react'
import CourseContent from '@/components/CourseContent'
import Modal from '@/components/Modal' // Adjust the import path as necessary

type JsonData = any

interface LiveCourseClientProps {
  courseId: string;
  isOpen: boolean;  // Make this required instead of optional
  onClose: () => void;  // Rename from onToggle to be more explicit
}

export default function LiveCourseClient({ 
  courseId, 
  isOpen,
  onClose
}: LiveCourseClientProps) {
  const [data, setData] = useState<JsonData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'json' | 'rendered'>('rendered')

  useEffect(() => {
    if (!courseId) return

    // Construct the SSE endpoint for this course
    const url = `/api/live-courses/${courseId}`
    const eventSource = new EventSource(url)

    // Receive each message from the server
    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data)
        setData(parsed)
        setError(null)
      } catch (err) {
        console.error('Error parsing SSE data:', err)
        setError('Failed to parse incoming data.')
      }
    }

    // If there's an error with the connection
    eventSource.onerror = (err) => {
      console.error('SSE error:', err)
      setError('Connection to live data lost.')
    }

    // Cleanup on unmount
    return () => {
      eventSource.close()
    }
  }, [courseId])

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Live Course Preview"
    >
      <section className="space-y-4 h-full flex flex-col">
        <div className="border-b border-zinc-200  sticky top-0">
          <nav className="-mb-px flex space-x-1.5">
            {(['rendered', 'json'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  py-1.5 px-2 rounded border-b-2 font-medium text-xs  border border-zinc-300
                  ${activeTab === tab
                    ? 'border-b-sky-500 text-sky-600 bg-zinc-100 hover:bg-zinc-50 font-semibold'
                    : 'border-b-zinc-300 text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'}
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} view
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-grow overflow-auto">
          {error && <p className="text-red-500">Error: {error}</p>}
          {!data && !error && <p>Loading...</p>}
          {data && (
            activeTab === 'json' ? (
              <pre className=" text-zinc-800 text-xs !rounded-md overflow-auto h-full">
                {JSON.stringify(data, null, 2)}
              </pre>
            ) : (
              <CourseContent data={data} />
            )
          )}
        </div>
      </section>
    </Modal>
  )
}