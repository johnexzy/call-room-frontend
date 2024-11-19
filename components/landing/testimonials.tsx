"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const testimonials = [
  {
    quote:
      "Callroom has transformed how we handle customer support. The queue management is seamless, and our customers love the transparency.",
    author: "Sarah Johnson",
    role: "Customer Service Director",
    company: "TechCorp Inc.",
    image: "/testimonials/sarah.jpg",
  },
  {
    quote:
      "The real-time updates and callback feature have significantly improved our customer satisfaction scores.",
    author: "Michael Chen",
    role: "Operations Manager",
    company: "Global Solutions",
    image: "/testimonials/michael.jpg",
  },
  {
    quote:
      "Implementation was smooth, and the analytics provide invaluable insights into our customer service performance.",
    author: "Emma Williams",
    role: "Head of Support",
    company: "Innovate Ltd",
    image: "/testimonials/emma.jpg",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-black">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            What our customers say
          </h2>
          <p className="text-xl text-gray-400">
            Join thousands of satisfied businesses
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-900 p-8 rounded-2xl"
            >
              <div className="flex items-center mb-6">
                <div className="relative w-12 h-12 mr-4">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.author}
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-white font-semibold">
                    {testimonial.author}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
              <blockquote className="text-gray-300">
                &quot;{testimonial.quote}&quot;
              </blockquote>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
