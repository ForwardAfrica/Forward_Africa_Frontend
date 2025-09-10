import { useState, useEffect } from 'react';
import { Certificate } from '../types';

// Safe localStorage access for SSR
const getLocalStorage = (key: string) => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

const setLocalStorage = (key: string, value: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

export const useCertificates = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  // Initialize certificates from localStorage on client side only
  useEffect(() => {
    const saved = getLocalStorage('certificates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCertificates(parsed);
      } catch (error) {
        console.error('Error parsing certificates from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (certificates.length > 0) {
      setLocalStorage('certificates', JSON.stringify(certificates));
    }
  }, [certificates]);

  const addCertificate = (certificate: Certificate) => {
    setCertificates(prev => [...prev, certificate]);
  };

  const getCertificate = (courseId: string): Certificate | undefined => {
    return certificates.find(cert => cert.courseId === courseId);
  };

  const generateCertificate = (
    courseId: string,
    courseTitle: string,
    studentName: string,
    instructor: string
  ): Certificate => {
    const certificate: Certificate = {
      id: `cert_${courseId}_${Date.now()}`,
      courseId,
      courseTitle,
      earnedDate: new Date(),
      studentName,
      instructor,
      verificationCode: `VC${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`
    };

    addCertificate(certificate);
    return certificate;
  };

  return {
    certificates,
    addCertificate,
    getCertificate,
    generateCertificate
  };
};