import React from 'react';
import { motion } from 'motion/react';
import { Users, Target, Award, BookOpen } from 'lucide-react';

export function AboutPage() {
  const stats = [
    { label: "Students Taught", value: "500+" },
    { label: "Projects Delivered", value: "120+" },
    { label: "Years Experience", value: "10+" },
    { label: "Global Clients", value: "50+" },
  ];

  return (
    <div className="flex-grow pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">About Modern Age Coders</h1>
          <p className="text-xl text-slate-400 leading-relaxed">
            We are a collective of passionate developers, designers, and educators dedicated to pushing the boundaries of what's possible on the web.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold text-white">Our Story</h2>
            <p className="text-slate-400 leading-relaxed">
              Founded with the vision of bridging the gap between industry demands and developer skills, Modern Age Coders started as a small coding bootcamp. Today, we've evolved into a full-service digital agency and a premier educational platform.
            </p>
            <p className="text-slate-400 leading-relaxed">
              We believe that great software is built by great teams. That's why we not only build exceptional products for our clients but also train the next generation of engineers through our intensive coding classes.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center overflow-hidden">
              <img 
                src="https://picsum.photos/seed/workspace/800/800?blur=2" 
                alt="Modern Age Coders Workspace" 
                className="w-full h-full object-cover opacity-50 mix-blend-overlay"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-slate-950/40"></div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-32">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-8 rounded-3xl bg-white/5 border border-white/10"
            >
              <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">{stat.value}</div>
              <div className="text-sm text-slate-400 uppercase tracking-wider font-semibold">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Target className="w-8 h-8 text-rose-400" />, title: "Our Mission", desc: "To deliver high-quality software solutions while empowering individuals with world-class coding education." },
            { icon: <BookOpen className="w-8 h-8 text-blue-400" />, title: "Our Approach", desc: "We combine theoretical knowledge with practical, hands-on experience to build robust applications." },
            { icon: <Award className="w-8 h-8 text-amber-400" />, title: "Our Quality", desc: "We adhere to the highest industry standards, ensuring every line of code is optimized and secure." }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-3xl bg-slate-900 border border-white/5"
            >
              <div className="mb-6">{item.icon}</div>
              <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
              <p className="text-slate-400 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
