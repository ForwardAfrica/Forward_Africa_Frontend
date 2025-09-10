import React, { useEffect } from 'react';
import { BookOpen, Users, Brain, Globe } from 'lucide-react';
import Layout from '../components/layout/Layout';

const AboutPage: React.FC = () => {
  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const features = [
    {
      icon: <BookOpen className="h-8 w-8 text-red-500" />,
      title: "Courses",
      description: "High-quality, practical, on-demand business education covering essential topics from marketing and finance to supply chain management and scaling strategies."
    },
    {
      icon: <Users className="h-8 w-8 text-red-500" />,
      title: "Community",
      description: "A vibrant and supportive network where entrepreneurs can connect, share experiences, collaborate on projects, and find peer support."
    },
    {
      icon: <Brain className="h-8 w-8 text-red-500" />,
      title: "Afrisage",
      description: "Our revolutionary AI assistant draws on critical information to provide unparalleled business insight and guidance for African entrepreneurs."
    },
    {
      icon: <Globe className="h-8 w-8 text-red-500" />,
      title: "Market Insights",
      description: "Access to crucial market data, regulatory information, and cultural insights across African markets to make informed business decisions."
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-screen-xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Empowering Africa's Entrepreneurs
            </h1>
            <div className="text-2xl md:text-3xl text-red-500 font-bold mb-8">
              We don&apos;t train entrepreneurs, We build Systems
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              At FWD App, we believe in the boundless potential of African entrepreneurs. We&apos;re bridging the gap between brilliant ideas and thriving businesses through quality education and market insights.
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div className="bg-gray-800/50 rounded-lg p-6 text-center backdrop-blur-sm border border-gray-700">
              <div className="text-3xl font-bold text-red-500 mb-2">90%+</div>
              <div className="text-gray-300">of African Businesses are SMEs</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-6 text-center backdrop-blur-sm border border-gray-700">
              <div className="text-3xl font-bold text-red-500 mb-2">50%+</div>
              <div className="text-gray-300">GDP Contribution</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-6 text-center backdrop-blur-sm border border-gray-700">
              <div className="text-3xl font-bold text-red-500 mb-2">63%</div>
              <div className="text-gray-300">Employment Rate</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-6 text-center backdrop-blur-sm border border-gray-700">
              <div className="text-3xl font-bold text-red-500 mb-2">54</div>
              <div className="text-gray-300">Countries Covered</div>
            </div>
          </div>

          {/* Mission Section */}
          <div className="bg-gradient-to-r from-red-900/20 to-gray-800/20 rounded-2xl p-8 mb-16 backdrop-blur-sm border border-gray-700">
            <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              To democratize business education and unlock the full economic potential of Africa by providing entrepreneurs with accessible knowledge, expert mentorship, a supportive community, and cutting-edge AI-powered insights.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <div className="bg-red-500/10 rounded-lg p-3 inline-block mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-white text-xl font-semibold mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Join Us in Shaping Africa's Future
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Be part of a movement that&apos;s empowering entrepreneurs to build thriving, sustainable businesses that contribute to a prosperous African future.
            </p>
            <button className="bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 transition-colors text-lg font-medium">
              Start Learning Today
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;