import Link from 'next/link'
import { ArrowRight, Map } from 'lucide-react'
import Logo from '@/components/Logo'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Rebuild Sri Lanka
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              National Post-Disaster Damage Assessment & Resource Allocation Platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/report"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors inline-flex items-center justify-center"
              >
                Report Damage
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/map"
                className="bg-primary-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-400 transition-colors inline-flex items-center justify-center"
              >
                View Damage Map
                <Map className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Project Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why This Project Was Built
            </h2>
          </div>
          <div className="prose prose-lg max-w-none">
            <div className="bg-gray-50 rounded-lg p-8 mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                The Recent Flood Crisis
              </h3>
              <p className="text-gray-700 mb-4">
                Sri Lanka has recently experienced devastating floods that have affected thousands
                of families across multiple districts. These floods have caused significant damage
                to homes, infrastructure, and livelihoods, leaving many communities in urgent need
                of assistance and rebuilding support.
              </p>
              <p className="text-gray-700 mb-4">
                The scale of the disaster has overwhelmed traditional damage assessment methods,
                creating delays in resource allocation and rebuilding efforts. Without accurate,
                real-time data on the extent and distribution of damage, it becomes extremely
                challenging for government agencies and NGOs to make informed decisions about where
                to allocate limited resources most effectively.
              </p>
            </div>

            <div className="bg-primary-50 rounded-lg p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                How This Platform Helps
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    Accelerated Damage Assessment
                  </h4>
                  <p className="text-gray-700">
                    By enabling citizens to directly report damage with location data and photos,
                    we can rapidly build a comprehensive picture of affected areas. This real-time
                    data collection eliminates weeks of manual survey work.
                  </p>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    Data-Driven Funding Allocation
                  </h4>
                  <p className="text-gray-700">
                    The platform aggregates damage data by GND (Grama Niladhari Division), allowing
                    decision-makers to see exactly where resources are needed most. This ensures
                    equitable distribution based on actual damage levels rather than estimates.
                  </p>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    Faster Rebuilding Decisions
                  </h4>
                  <p className="text-gray-700">
                    With clear visualizations and aggregated statistics, government and NGO leaders
                    can quickly identify priority areas and allocate resources accordingly. This
                    accelerates the entire rebuilding process.
                  </p>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    Community Collaboration
                  </h4>
                  <p className="text-gray-700">
                    The Support & Rebuild section connects NGOs, volunteers, and communities,
                    enabling coordinated relief efforts and ensuring that help reaches those who
                    need it most.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team & Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built by MetroMinds
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              This platform was developed by our team to support disaster recovery efforts in Sri Lanka
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="mb-8">
              <Logo />
            </div>
            <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl text-center">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                About Our Team
              </h3>
              <p className="text-gray-700 mb-6">
                MetroMinds is committed to leveraging technology for social good. We built this platform 
                to help accelerate post-disaster damage assessment and ensure equitable resource allocation 
                for affected communities in Sri Lanka.
              </p>
              <p className="text-gray-700 mb-8">
                Our team combines expertise in geospatial technology, data analytics, and web development 
                to create solutions that make a real difference in disaster recovery efforts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:info@alphagrid.com"
                  className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors inline-flex items-center justify-center"
                >
                  Contact Us
                </a>
                <a
                  href="mailto:support@alphagrid.com?subject=Rebuild Sri Lanka - Support Request"
                  className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors inline-flex items-center justify-center"
                >
                  Request Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Help Rebuild Sri Lanka
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Every report helps us better understand the damage and allocate resources where they&apos;re needed most.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/report"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Submit Damage Report
            </Link>
            <Link
              href="/support"
              className="bg-primary-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-400 transition-colors"
            >
              Offer Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

