"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: 49,
    description: "Perfect for small businesses",
    features: [
      "Up to 5 representatives",
      "Basic queue management",
      "Email notifications",
      "24/7 support",
      "Basic analytics",
    ],
  },
  {
    name: "Professional",
    price: 99,
    description: "For growing teams",
    features: [
      "Up to 20 representatives",
      "Advanced queue management",
      "Real-time notifications",
      "Priority support",
      "Advanced analytics",
      "Custom branding",
      "API access",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: 249,
    description: "For large organizations",
    features: [
      "Unlimited representatives",
      "Custom queue management",
      "Multi-channel notifications",
      "Dedicated support",
      "Custom analytics",
      "White labeling",
      "API access",
      "Custom integrations",
      "SLA guarantees",
    ],
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-black">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-400">
            Choose the plan that works best for you
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative bg-gray-900 rounded-2xl p-8 ${
                plan.popular ? "ring-2 ring-blue-500" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-400 mb-4">{plan.description}</p>
                <div className="text-4xl font-bold text-white">
                  ${plan.price}
                  <span className="text-lg text-gray-400">/month</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center text-gray-300">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block">
                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-white text-black hover:bg-gray-100"
                  }`}
                >
                  Get Started
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 