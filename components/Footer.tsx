export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-auto transition-all duration-300 md:ml-[var(--sidebar-width,80px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Rebuild Sri Lanka</h3>
            <p className="text-gray-300 text-sm">
              A national platform for post-disaster damage assessment and resource allocation.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-gray-300 hover:text-white">
                  Home
                </a>
              </li>
              <li>
                <a href="/map" className="text-gray-300 hover:text-white">
                  Damage Map
                </a>
              </li>
              <li>
                <a href="/report" className="text-gray-300 hover:text-white">
                  Report Damage
                </a>
              </li>
              <li>
                <a href="/support" className="text-gray-300 hover:text-white">
                  Support & Rebuild
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <p className="text-gray-300 text-sm">
              For government and NGO inquiries, please contact through the admin portal.
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Rebuild Sri Lanka. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

