import { jsPDF } from 'jspdf';
import { Certificate } from '../types';

export const generateCertificatePDF = (certificate: Certificate): string => {
  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Set background
  doc.setFillColor(17, 24, 39); // bg-gray-900
  doc.rect(0, 0, 297, 210, 'F');

  // Add decorative border
  doc.setDrawColor(239, 68, 68); // text-red-500
  doc.setLineWidth(2);
  doc.rect(10, 10, 277, 190);

  // Add inner border
  doc.setLineWidth(0.5);
  doc.rect(15, 15, 267, 180);

  // Add logo/header
  doc.setTextColor(239, 68, 68); // text-red-500
  doc.setFontSize(40);
  doc.setFont('helvetica', 'bold');
  doc.text('MASTERSTREAM', 148.5, 40, { align: 'center' });

  // Add certificate title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(30);
  doc.text('Certificate of Completion', 148.5, 60, { align: 'center' });

  // Add main text
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('This is to certify that', 148.5, 80, { align: 'center' });

  // Add student name
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(certificate.studentName, 148.5, 95, { align: 'center' });

  // Add course completion text
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('has successfully completed the course', 148.5, 110, { align: 'center' });

  // Add course title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(certificate.courseTitle, 148.5, 125, { align: 'center' });

  // Add completion date
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Completed on ${certificate.earnedDate.toLocaleDateString()}`,
    148.5,
    145,
    { align: 'center' }
  );

  // Add instructor signature
  doc.setFontSize(18);
  doc.text(certificate.instructor, 148.5, 165, { align: 'center' });
  doc.setFontSize(14);
  doc.text('Instructor', 148.5, 172, { align: 'center' });

  // Add verification code
  doc.setFontSize(10);
  doc.setTextColor(156, 163, 175); // text-gray-400
  doc.text(
    `Verification Code: ${certificate.verificationCode}`,
    148.5,
    190,
    { align: 'center' }
  );

  return doc.output('dataurlstring');
};

export const downloadCertificate = async (certificate: Certificate) => {
  try {
    const pdfDataUrl = generateCertificatePDF(certificate);
    
    // Create a link element and trigger download
    const link = document.createElement('a');
    link.href = pdfDataUrl;
    link.download = `${certificate.courseTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Certificate.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw new Error('Failed to generate certificate');
  }
};