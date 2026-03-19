import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

type Testimonial = {
  name: string;
  role: string;
  avatar: string;
  text: string;
};

export default memo(function TestimonialsSection({ testimonials }:{testimonials: Testimonial[]}){
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white" aria-labelledby="testimonials-heading">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 id="testimonials-heading" className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">Ce que disent nos fournisseurs</h2>
          <p className="text-lg text-gray-600">Rejoignez des centaines de vendeurs satisfaits</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="p-8 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="flex gap-1 mb-4" aria-hidden="true">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-[#F7941D]" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-6 leading-relaxed italic">"{t.text}"</blockquote>
              <div className="flex items-center gap-3">
                <div className="text-3xl" aria-hidden>{t.avatar}</div>
                <div>
                  <p className="font-bold text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-600">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});
