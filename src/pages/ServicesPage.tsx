import React from 'react';
import { motion } from 'motion/react';
import { Code2, Smartphone, Layout, Database, Cloud, ShieldCheck } from 'lucide-react';

export function ServicesPage() {
  const services = [
    {
      icon: <Code2 className="w-8 h-8 text-emerald-400" />,
      title: "Custom Web Development",
      description: "We build fast, responsive, and scalable web applications using React, Node.js, and modern frameworks. From landing pages to complex enterprise dashboards.",
      features: ["Single Page Applications", "Progressive Web Apps", "E-commerce Solutions", "CMS Development"]
    },
    {
      icon: <Smartphone className="w-8 h-8 text-rose-400" />,
      title: "Mobile App Development",
      description: "Native and cross-platform mobile applications for iOS and Android. We ensure smooth performance and native-like feel across all devices.",
      features: ["React Native", "iOS / Swift", "Android / Kotlin", "App Store Optimization"]
    },
    {
      icon: <Layout className="w-8 h-8 text-amber-400" />,
      title: "UI/UX Design",
      description: "User-centered design that focuses on aesthetics and usability. We create intuitive interfaces that your users will love.",
      features: ["Wireframing", "Prototyping", "User Testing", "Design Systems"]
    },
    {
      icon: <Database className="w-8 h-8 text-blue-400" />,
      title: "Coding Classes & Bootcamps",
      description: "Comprehensive coding education for beginners and advanced developers. Learn from industry experts with real-world projects.",
      features: ["Full-Stack Bootcamp", "Frontend Mastery", "Backend Architecture", "1-on-1 Mentorship"]
    },
    {
      icon: <Cloud className="w-8 h-8 text-purple-400" />,
      title: "Cloud Infrastructure",
      description: "Scalable and secure cloud architecture setup and maintenance. We handle deployment, scaling, and monitoring.",
      features: ["AWS / GCP / Azure", "Docker & Kubernetes", "CI/CD Pipelines", "Serverless Architecture"]
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-cyan-400" />,
      title: "Security & Auditing",
      description: "Comprehensive security audits and implementation of best practices to keep your data and users safe.",
      features: ["Penetration Testing", "Code Reviews", "Compliance (GDPR/HIPAA)", "Data Encryption"]
    }
  ];

  return (
    <div className="flex-grow pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Our Services</h1>
          <p className="text-xl text-slate-400 leading-relaxed">
            End-to-end digital solutions designed to accelerate your growth and empower your team.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex flex-col h-full"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mb-8">
                {service.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{service.title}</h3>
              <p className="text-slate-400 leading-relaxed mb-8 flex-grow">
                {service.description}
              </p>
              <ul className="space-y-3">
                {service.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-3"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
