import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'

export default function DesktopLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-[250px] flex flex-col min-h-screen">
        <TopBar notifPath="/admin/notifications" />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}