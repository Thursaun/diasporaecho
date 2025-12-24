import { Link } from "react-router-dom";

function AboutUs({ onRegisterClick }) {
  return (
    <div className="bg-gray-50 min-h-screen w-full">
      <div className="bg-secondary text-white py-16 w-full">
        <div className="container mx-auto px-4 md:px-6 w-full">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 w-full">
            About Diaspora Echo
          </h1>
          <p className="text-xl md:text-2xl w-full">
            Amplifying the voices and contributions of historical Black figures
            who have shaped our world but may have been overlooked in
            traditional education.
          </p>
        </div>
      </div>

      <section className="py-16 w-full">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-12 items-center w-full">
            <div className="md:w-1/2 w-full">
              <h2 className="text-3xl font-bold mb-6 text-gray-900 w-full">
                Our Mission
              </h2>
              <p className="text-lg text-gray-700 w-full">
                Diaspora Echo is dedicated to raising awareness of historical
                Black figures and their contributions to society. We believe
                that education is the cornerstone of progress, and that
                understanding our shared history is essential for building a
                more inclusive future.
              </p>
              <p className="text-lg text-gray-700 mt-4 w-full">
                Our platform leverages the extensive collections of
                Wikipedia&apos;s information on African American History &
                Culture to bring these important stories to light, making them
                accessible to everyone.
              </p>
            </div>
            <div className="md:w-1/2 w-full bg-gray-200 rounded-lg p-6">
              <blockquote className="text-xl italic text-gray-800 border-l-4 border-black pl-4 w-full">
                &ldquo;History, despite its wrenching pain, cannot be unlived,
                but if faced with courage, need not be lived again.&ldquo;
                <footer className="text-right mt-2 text-gray-600">
                  — Maya Angelou
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 w-full">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 w-full">
            How Diaspora Echo Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            <div className="bg-white p-6 rounded-lg shadow-md w-full">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">1</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 w-full">Explore</h3>
              <p className="text-gray-700 w-full">
                Discover historical Black figures through our interactive interface powered by the 
                Wikipedia&apos;s Open Access API. Search by era, contributions, or keywords.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md w-full">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">2</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 w-full">Learn</h3>
              <p className="text-gray-700 w-full">
                Dive deep into comprehensive profiles featuring biographies, contributions, historical 
                context, and high-quality imagery from the National Museum of African American History & Culture.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md w-full">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">3</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 w-full">Save & Share</h3>
              <p className="text-gray-700 w-full">
                Create an account to save figures to your personal collection, add your own notes, 
                and share these important stories with others to spread awareness.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-secondary text-white text-center w-full">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold mb-6 w-full">Join Us in This Journey</h2>
          <p className="text-xl mb-8 w-full">
            Help us amplify the voices of historical Black figures and ensure their 
            contributions are recognized and celebrated.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
            <button className="bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-gray-200 transition" onClick={onRegisterClick}>
              Create an Account
            </button>
            <Link to='/echoes' className="border-2 border-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-black transition">
              Explore Figures
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 w-full">
        <div className="container mx-auto px-4 md:px-6">
          {/* Title Row */}
          <h2 className="text-3xl font-bold mb-8 text-gray-900 w-full">
            Acknowledgements
          </h2>
          
          {/* Two-Column Content Row */}
          <div className="flex flex-col md:flex-row gap-12 items-start w-full">
            <div className="md:w-1/2 w-full">
              <p className="text-lg text-gray-700 w-full">
                Diaspora Echo exists to combat the systematic erasure of Black history 
                and the contributions of people of color. For too long, these stories have 
                been minimized, forgotten, or deliberately removed from mainstream narratives.
              </p>
              <p className="text-lg text-gray-700 mt-4 w-full">
                We leverage Wikipedia&apos;s Open Access resources to ensure these vital 
                stories remain accessible, discoverable, and celebrated. Every figure 
                we highlight is a step toward reclaiming the full richness of our shared history.
              </p>
            </div>
            <div className="md:w-1/2 w-full bg-gray-200 rounded-lg p-6">
              <blockquote className="text-xl italic text-gray-800 border-l-4 border-secondary pl-4 w-full">
                &ldquo;We acknowledge and honor the historical figures whose stories 
                we share. We recognize our responsibility to present their contributions 
                with accuracy, respect, and the reverence they deserve—because their 
                legacies must never be erased.&rdquo;
                <footer className="text-right mt-4 text-gray-600 not-italic font-semibold">
                  — The DiasporaEcho Team
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutUs;
