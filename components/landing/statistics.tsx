"use client";

import { motion } from "framer-motion";
import CountUp from "react-countup";

const stats = [
  {
    number: 99.9,
    suffix: "%",
    label: "Uptime",
  },
  {
    number: 50000,
    suffix: "+",
    label: "Daily Calls",
  },
  {
    number: 15,
    suffix: "s",
    label: "Avg. Wait Time",
  },
  {
    number: 98,
    suffix: "%",
    label: "Customer Satisfaction",
  },
];

export function Statistics() {
  return (
    <section className="py-24 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Trusted by businesses worldwide
          </h2>
          <p className="text-xl text-gray-400">
            Industry-leading performance and reliability
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                <CountUp
                  end={stat.number}
                  duration={2.5}
                  decimals={stat.number % 1 !== 0 ? 1 : 0}
                  suffix={stat.suffix}
                />
              </div>
              <p className="text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 