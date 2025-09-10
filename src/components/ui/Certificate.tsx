import React from 'react';
import { Certificate as CertificateType } from '../../types';
import { Download, Award, CheckCircle } from 'lucide-react';
import { downloadCertificate } from '../../utils/certificateGenerator';
import Button from './Button';

interface CertificateProps {
  certificate: CertificateType;
}

const Certificate: React.FC<CertificateProps> = ({ certificate }) => {
  const handleDownload = () => {
    downloadCertificate(certificate);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <Award className="h-8 w-8 text-red-500 mr-3" />
          <div>
            <h3 className="text-white font-medium text-lg">{certificate.courseTitle}</h3>
            <p className="text-gray-400 text-sm">
              Earned on {certificate.earnedDate.toLocaleDateString()}
            </p>
          </div>
        </div>
        <Button
          onClick={handleDownload}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Download</span>
        </Button>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-600">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-sm mb-1">Issued to</p>
            <p className="text-white">{certificate.studentName}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Instructor</p>
            <p className="text-white">{certificate.instructor}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
          <p className="text-gray-400 text-sm">
            Verification Code: {certificate.verificationCode}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Certificate;