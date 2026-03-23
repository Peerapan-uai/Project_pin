export default function MobileLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen relative overflow-hidden">
        {children}
      </div>
    </div>
  )
}
