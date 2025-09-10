import React from 'react';
import { Instructor } from '../../types';
import Link from 'next/link';
import Image from 'next/image';

interface InstructorCardProps {
  instructor: Instructor;
}

const InstructorCard: React.FC<InstructorCardProps> = ({ instructor }) => {
  return (
    <Link href={`/instructor/${instructor.id}`} className="group">
      <div className="flex flex-col items-center space-y-3">
        <div className="relative w-40 h-40 overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-105">
          {instructor.image.startsWith('http') ? (
            // Use regular img tag for external URLs
            <img
              src={instructor.image}
              alt={instructor.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== '/images/placeholder-avatar.jpg') {
                  target.src = '/images/placeholder-avatar.jpg';
                }
              }}
            />
          ) : (
            // Use Next.js Image for local images
            <Image
              src={instructor.image}
              alt={instructor.name}
              width={160}
              height={160}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== '/images/placeholder-avatar.jpg') {
                  target.src = '/images/placeholder-avatar.jpg';
                }
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        <div className="text-center">
          <h3 className="text-white font-medium">{instructor.name}</h3>
          <p className="text-gray-400 text-sm">{instructor.title}</p>
          {instructor.experience && (
            <p className="text-gray-500 text-xs">{instructor.experience} years experience</p>
          )}
        </div>

        {/* Expertise Preview */}
        {instructor.expertise && instructor.expertise.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1 max-w-40">
            {instructor.expertise.slice(0, 2).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs"
              >
                {skill}
              </span>
            ))}
            {instructor.expertise.length > 2 && (
              <span className="px-2 py-1 bg-gray-600 text-gray-300 rounded text-xs">
                +{instructor.expertise.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default InstructorCard;