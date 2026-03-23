import Sidebar from '../components/Sidebar'

export default function DesktopLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-[250px] p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
