"use client";

import { motion } from "framer-motion";
import {
  PhoneCall,
  BarChart3,
  Clock,
  MessageSquare,
  Video,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: <PhoneCall className="w-10 h-10" />,
    title: "Smart Queue System",
    description:
      "Intelligent routing and virtual queuing system that respects your customers' time.",
  },
  {
    icon: <Video className="w-10 h-10" />,
    title: "HD Video Calls",
    description:
      "Crystal clear video and audio quality for meaningful conversations.",
  },
  {
    icon: <Clock className="w-10 h-10" />,
    title: "Real-time Updates",
    description:
      "Keep customers informed with accurate wait times and queue positions.",
  },
  {
    icon: <MessageSquare className="w-10 h-10" />,
    title: "Callback Options",
    description:
      "Let customers request callbacks instead of waiting in the queue.",
  },
  {
    icon: <BarChart3 className="w-10 h-10" />,
    title: "Analytics Dashboard",
    description:
      "Comprehensive insights into your customer service performance.",
  },
  {
    icon: <Shield className="w-10 h-10" />,
    title: "Secure & Reliable",
    description:
      "Enterprise-grade security with end-to-end encryption for all calls.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-black">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything you need
          </h2>
          <p className="text-xl text-gray-400">
            Powerful features to transform your customer service
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-8 rounded-2xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
              <div className="mb-4 text-blue-500">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 