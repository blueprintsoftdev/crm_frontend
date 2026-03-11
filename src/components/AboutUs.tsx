import React from "react";
import { Truck, ShieldCheck, Star, Heart } from "lucide-react";

interface Feature {
  icon: React.ReactElement;
  title: string;
  desc: string;
}

const features: Feature[] = [
  {
    icon: <Star size={24} />,
    title: "Premium Quality",
    desc: "Handpicked fabrics that ensure durability and elegance in every weave.",
  },
  {
    icon: <Heart size={24} />,
    title: "Authentic Designs",
    desc: "A curated collection bridging traditional artistry with modern trends.",
  },
  {
    icon: <Truck size={24} />,
    title: "Pan-India Delivery",
    desc: "Fast and secure shipping to your doorstep, wherever you are.",
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Secure Checkout",
    desc: "100% safe payment gateways for a worry-free shopping experience.",
  },
];

const AboutUs = () => {
  return (
    <div className="bg-stone-50 min-h-screen font-sans text-stone-800">
      {/* 1. Hero Section */}
      <div className="relative w-full h-[60vh] flex items-center justify-center overflow-hidden">
        <img
          src="/api/placeholder/1920/1080"
          alt="Blueprint CRM Fabric Texture"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-emerald-900/40 mix-blend-multiply"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-serif text-white mb-4 tracking-wide">
            Blueprint CRM
          </h1>
          <p className="text-lg md:text-xl text-stone-100 font-light tracking-wider uppercase">
            Weaving Tradition into Every Fold
          </p>
        </div>
      </div>

      {/* 2. Our Story Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 space-y-6">
            <h2 className="text-3xl md:text-4xl font-serif text-emerald-950">
              Rooted in Nature, <br /> Crafted for You.
            </h2>
            <div className="w-16 h-1 bg-yellow-600 mb-6"></div>
            <p className="text-stone-600 leading-relaxed text-lg">
              For us, a drape is not just a piece of cloth; it is a canvas of
              culture and a statement of grace.
            </p>
            <p className="text-stone-600 leading-relaxed">
              The name <strong>"Blueprint"</strong> is inspired by precision,
              clarity, and the foundation of great design.
            </p>
            <p className="text-stone-600 leading-relaxed">
              Founded with a mission to make authentic, high-quality fabrics
              accessible, Blueprint CRM is a celebration of the skilled
              artisans who weave magic into every thread.
            </p>
            <div className="pt-4">
              <span className="font-handwriting text-2xl text-emerald-800 block">
                The Blueprint CRM Team
              </span>
            </div>
          </div>
          <div className="order-1 md:order-2 relative">
            <div className="relative h-96 w-full rounded-tr-[4rem] rounded-bl-[4rem] overflow-hidden shadow-2xl transform md:rotate-2 hover:rotate-0 transition-transform duration-500">
              <img
                src="/api/placeholder/800/1000"
                alt="Our Story"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Values Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif text-emerald-950 mb-4">
              Why Choose Blueprint CRM?
            </h2>
            <p className="text-stone-500 max-w-2xl mx-auto">
              We don&apos;t just sell fabrics; we deliver an experience of luxury,
              comfort, and trust.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 bg-stone-50 rounded-xl text-center hover:shadow-lg transition-shadow duration-300 border border-stone-100"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-emerald-950 mb-3">
                  {feature.title}
                </h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CTA Section */}
      <section className="bg-emerald-900 py-20 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-serif">
            Join the Blueprint CRM Family
          </h2>
          <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
            Subscribe to receive updates on our latest collections, exclusive
            offers, and styling tips.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="px-6 py-3 rounded-full text-stone-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 w-full"
            />
            <button className="px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-full font-medium transition-colors duration-300">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
