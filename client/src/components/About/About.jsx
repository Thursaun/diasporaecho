import { Link } from "react-router-dom";

function AboutUs({ onRegisterClick }) {
  return (
    <div className="bg-light min-h-screen w-full">
      {/* Hero - typographic, dark background */}
      <div className="bg-dark text-white py-20 sm:py-28 w-full">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="w-8 h-[3px] bg-gold mb-6"></div>
          <p className="text-gold text-xs font-semibold uppercase tracking-widest mb-4">About</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Amplifying voices that shaped our world
          </h1>
          <p className="text-gray-500 text-lg md:text-xl leading-relaxed max-w-2xl">
            An educational platform dedicated to historical Black figures
            overlooked in traditional narratives.
          </p>
        </div>
      </div>

      {/* Mission */}
      <section className="py-16 w-full border-b border-gray-200">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="flex items-start gap-5">
            <div className="w-1 min-h-[48px] bg-primary rounded-full flex-shrink-0 mt-1"></div>
            <div>
              <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-3">Our Mission</p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Diaspora Echo is dedicated to raising awareness of historical
                Black figures and their contributions to society. We believe
                that education is the cornerstone of progress, and that
                understanding our shared history is essential for building a
                more inclusive future.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mt-4">
                Our platform leverages the extensive collections of
                Wikipedia&apos;s information on African American History &amp;
                Culture to bring these important stories to light, making them
                accessible to everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-16 w-full">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="bg-white border-l-4 border-gold rounded-r-lg p-8 shadow-sm">
            <p className="text-xl italic text-dark leading-relaxed mb-4">
              &ldquo;History, despite its wrenching pain, cannot be unlived,
              but if faced with courage, need not be lived again.&rdquo;
            </p>
            <p className="text-sm text-gray-500 font-semibold">
              — Maya Angelou
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 w-full bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-8">How It Works</p>

          <div className="relative flex flex-col md:flex-row gap-8 md:gap-0">
            {/* Connecting line - horizontal on desktop, vertical on mobile */}
            <div className="hidden md:block absolute top-[18px] left-[calc(16.67%+14px)] right-[calc(16.67%+14px)] h-px bg-gray-200"></div>
            <div className="md:hidden absolute top-[18px] bottom-[18px] left-[18px] w-px bg-gray-200"></div>

            {[
              { title: "Explore", desc: "Discover historical Black figures through our interactive interface powered by Wikipedia's Open Access API." },
              { title: "Learn", desc: "Dive deep into comprehensive profiles featuring biographies, contributions, and historical context." },
              { title: "Save & Share", desc: "Create an account to save figures to your personal collection and share these important stories." },
            ].map((step, index) => (
              <div key={index} className="flex md:flex-col items-start md:items-center md:text-center flex-1 gap-4 md:gap-0 relative z-10">
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold border-4 border-light flex-shrink-0 md:mb-4">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-base font-bold text-dark mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-dark text-white text-center w-full">
        <div className="container mx-auto px-4 md:px-6 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">Join the Journey</h2>
          <p className="text-gray-500 mb-8">
            Help us amplify the voices of historical Black figures and ensure their
            contributions are recognized and celebrated.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition min-h-[44px]"
              onClick={onRegisterClick}
            >
              Create an Account
            </button>
            <Link
              to="/echoes"
              className="border border-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition min-h-[44px]"
            >
              Explore Figures
            </Link>
          </div>
        </div>
      </section>

      {/* Acknowledgements */}
      <section className="py-16 w-full border-t border-gray-200">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="flex items-start gap-5">
            <div className="w-1 min-h-[48px] bg-secondary rounded-full flex-shrink-0 mt-1"></div>
            <div>
              <p className="text-secondary text-xs font-semibold uppercase tracking-widest mb-3">Acknowledgements</p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Diaspora Echo exists to combat the systematic erasure of Black history
                and the contributions of people of color. For too long, these stories have
                been minimized, forgotten, or deliberately removed from mainstream narratives.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mt-4">
                We leverage Wikipedia&apos;s Open Access resources to ensure these vital
                stories remain accessible, discoverable, and celebrated. Every figure
                we highlight is a step toward reclaiming the full richness of our shared history.
              </p>
              <div className="bg-white border-l-4 border-secondary rounded-r-lg p-6 mt-6 shadow-sm">
                <p className="text-base italic text-dark leading-relaxed mb-3">
                  &ldquo;We acknowledge and honor the historical figures whose stories
                  we share. We recognize our responsibility to present their contributions
                  with accuracy, respect, and the reverence they deserve—because their
                  legacies must never be erased.&rdquo;
                </p>
                <p className="text-sm text-gray-500 font-semibold">
                  — The DiasporaEcho Team
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutUs;
