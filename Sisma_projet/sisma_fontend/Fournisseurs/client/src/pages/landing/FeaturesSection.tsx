import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';

type Feature = {
  icon: any;
  title: string;
  desc: string;
};

export default memo(function FeaturesSection({ features, onCardClick }:{features: Feature[]; onCardClick?: (index:number)=>void}){
  const handleKeyDown = useCallback((e: React.KeyboardEvent, i:number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onCardClick?.(i);
    }
  }, [onCardClick]);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white" aria-labelledby="features-heading">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 id="features-heading" className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">Avantages Clés</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Tout ce dont vous avez besoin pour réussir sur ASHOP</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, ease: 'easeInOut', delay: i * 0.06 }}
              className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-[#D81918] transition-all duration-300 focus:outline-none"
              tabIndex={0}
              role="button"
              aria-label={`${feature.title} - ${feature.desc}`}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onClick={() => onCardClick?.(i)}
            >
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-[#D81918] mb-4">
                <feature.icon className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});
