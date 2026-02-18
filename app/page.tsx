import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-white font-display text-slate-900 antialiased selection:bg-primary/20">
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* Header - Solid background, no blur */}
        <header className="px-6 lg:px-12 xl:px-20 py-5 flex items-center justify-between z-10 sticky top-0 bg-white border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Edu<span className="text-primary">Tracker</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button className="hidden lg:block text-sm font-medium text-slate-500 hover:text-primary transition-colors">
              How it works
            </button>
            <Link
              href="/auth"
              className="text-sm font-medium bg-primary hover:bg-primary/90 text-white transition-colors px-5 py-2.5 rounded-lg shadow-sm"
            >
              Sign In
            </Link>
          </div>
        </header>

        <main className="flex-grow flex flex-col">
          {/* Hero Section */}
          <section className="px-6 lg:px-12 xl:px-20 pt-16 lg:pt-25 pb-20 flex flex-col lg:flex-row items-center gap-16 lg:gap-24 max-w-7xl mx-auto w-full">
            {/* Left Content */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left lg:w-1/2 z-10">

              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 text-slate-900 leading-[1.1]">
                Never Miss an <br />
                <span className="text-primary">Assignment</span> Again
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed mb-10 max-w-md lg:max-w-xl">
                The ultimate productivity tool for students. Automatically sort
                tasks, track grades, and crush your deadlines without the
                stress.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link
                  href="/auth"
                  className="flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-primary text-slate-900 font-medium py-3.5 px-6 rounded-xl transition-colors w-full sm:w-auto shadow-sm"
                >
                  <img
                    alt="Google Logo"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1KPx8dzVFUKlWOaZhTjQ8qIkzLsFmyCeMUuBpoYsBFNw8QwfEBrdbpEB-L3cThnbz2nlH7DxVxVysa3NnNdivVF0qZ9_V_0l9onBaKmYS2sYIzucg8mK7BsG-exio_ZPar2xZmazity9CS7J8cA78vuoc3333ucOjokYnCdTe3CN_I3-wCOiOemWlEMwHDygtNOiMgNv_Gm3V3HL3xzuQfBKW-JfIfTRX3lCvHcAX6vlITXsJlT89EbRHyL1mMTOBSEiRLChVWgU"
                  />
                  <span>Sign in with Google</span>
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-2 text-sm text-slate-400">
                <span className="material-icons-outlined text-base text-primary">
                  check_circle
                </span>
                <span>Free for students forever</span>
              </div>
            </div>

            {/* Right Content - Clean Flat Mockup */}
            <div className="lg:w-1/2 w-full">
              <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Upcoming Tasks
                    </h3>
                    <p className="text-sm text-slate-500">October 24, 2023</p>
                  </div>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                    3 Due
                  </div>
                </div>

                {/* List */}
                <div className="space-y-4">
                  {/* Item 1 */}
                  <div className="bg-white p-5 rounded-xl border-l-4 border-primary shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-900">
                        Calculus II Midterm
                      </span>
                      <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">
                        2 Days
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: "85%" }}
                      ></div>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-slate-700">
                        History Essay
                      </span>
                      <span className="text-xs font-bold text-orange-400">
                        5 Days
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
                      <div
                        className="bg-orange-400 h-2 rounded-full"
                        style={{ width: "40%" }}
                      ></div>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="bg-slate-100 p-5 rounded-xl border border-transparent opacity-60">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-500 line-through">
                        Lab Report
                      </span>
                      <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                        <span className="material-icons-outlined text-sm">
                          check
                        </span>
                        Done
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section - Solid Background */}
          <section className="bg-slate-50 py-24 border-y border-slate-100">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {[
                  {
                    icon: "notifications",
                    title: "Smart Reminders",
                    desc: "Get notified strictly when it matters.",
                  },
                  {
                    icon: "sort",
                    title: "Auto-Sorting",
                    desc: "We rank your tasks by deadline.",
                  },
                  {
                    icon: "offline_bolt",
                    title: "Offline Mode",
                    desc: "Works perfectly without internet.",
                  },
                ].map((feature, i) => (
                  <div key={i} className="flex flex-col items-start group">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary mb-6 shadow-sm group-hover:border-primary transition-colors">
                      <span className="material-icons-outlined text-2xl">
                        {feature.icon}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-500 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Simple CTA - Solid Brand Color */}
          <section className="px-6 py-24 text-center bg-white">
            <h2 className="text-4xl font-bold text-slate-900 mb-8">
              Ready to verify?
            </h2>
            <button className="bg-primary hover:bg-blue-600 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-lg shadow-primary/30">
              Get Started Free
            </button>
            <p className="mt-6 text-sm text-slate-400">
              No credit card required.
            </p>
          </section>
        </main>

        <footer className="border-t border-slate-100 py-10 bg-white">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="material-icons-outlined text-slate-400">
                school
              </span>
              <span className="text-sm text-slate-500">
                © {new Date().getFullYear()} EduTracker
              </span>
            </div>
            <div className="flex gap-8 text-sm font-medium text-slate-500">
              <a href="#" className="hover:text-primary transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Contact
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
