import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import Button from './Button';
import ImageUpload from './ImageUpload';

interface EditProfileFormProps {
  initialData: {
    full_name: string;
    avatar_url: string;
    industry: string;
    experience_level: string;
    business_stage: string;
    country: string;
    state_province: string;
    city: string;
  };
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  errors: string[];
  success: boolean;
}

const EditProfileForm: React.FC<EditProfileFormProps> = React.memo(({
  initialData,
  onSubmit,
  onCancel,
  loading,
  errors,
  success
}) => {
  const [formData, setFormData] = useState(initialData);

  // Update form data when initial data changes (only when modal opens)
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Profile Image */}
      <ImageUpload
        onImageUpload={(url) => setFormData(prev => ({ ...prev, avatar_url: url }))}
        currentImage={formData.avatar_url}
        uploadType="avatar"
        label="Profile Image"
        previewSize="md"
      />

      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Full Name
        </label>
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Enter your full name"
          required
        />
      </div>

      {/* Industry */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Industry
        </label>
        <select
          value={formData.industry}
          onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Select your industry</option>
          <option value="Agriculture & Agribusiness">Agriculture & Agribusiness</option>
          <option value="Technology & Digital Innovation">Technology & Digital Innovation</option>
          <option value="Financial Services & Fintech">Financial Services & Fintech</option>
          <option value="Healthcare & Pharmaceuticals">Healthcare & Pharmaceuticals</option>
          <option value="Manufacturing & Industrial">Manufacturing & Industrial</option>
          <option value="Energy & Renewable Resources">Energy & Renewable Resources</option>
          <option value="Tourism & Hospitality">Tourism & Hospitality</option>
          <option value="Education & Training">Education & Training</option>
          <option value="Real Estate & Construction">Real Estate & Construction</option>
          <option value="Transportation & Logistics">Transportation & Logistics</option>
          <option value="Retail & E-commerce">Retail & E-commerce</option>
          <option value="Media & Entertainment">Media & Entertainment</option>
          <option value="Telecommunications">Telecommunications</option>
          <option value="Mining & Natural Resources">Mining & Natural Resources</option>
          <option value="Textiles & Fashion">Textiles & Fashion</option>
          <option value="Food & Beverage">Food & Beverage</option>
          <option value="Consulting & Professional Services">Consulting & Professional Services</option>
          <option value="Non-profit & Social Enterprise">Non-profit & Social Enterprise</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Experience Level */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Experience Level
        </label>
        <select
          value={formData.experience_level}
          onChange={(e) => setFormData(prev => ({ ...prev, experience_level: e.target.value }))}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Select your experience level</option>
          <option value="Entry Level (0-2 years)">Entry Level (0-2 years)</option>
          <option value="Mid-Level (3-7 years)">Mid-Level (3-7 years)</option>
          <option value="Senior (8+ years)">Senior (8+ years)</option>
        </select>
      </div>

      {/* Business Stage */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Business Stage
        </label>
        <select
          value={formData.business_stage}
          onChange={(e) => setFormData(prev => ({ ...prev, business_stage: e.target.value }))}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Select your business stage</option>
          <option value="Idea Stage">Idea Stage</option>
          <option value="Startup">Startup</option>
          <option value="Growth Stage">Growth Stage</option>
          <option value="Established Business">Established Business</option>
        </select>
      </div>

      {/* Geographic Location */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Geographic Location
        </label>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Country
          </label>
          <select
            value={formData.country}
            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Select your country</option>
            <option value="Nigeria">Nigeria</option>
            <option value="Kenya">Kenya</option>
            <option value="South Africa">South Africa</option>
            <option value="Ghana">Ghana</option>
            <option value="Ethiopia">Ethiopia</option>
            <option value="Uganda">Uganda</option>
            <option value="Tanzania">Tanzania</option>
            <option value="Morocco">Morocco</option>
            <option value="Egypt">Egypt</option>
            <option value="Algeria">Algeria</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* State/Province */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            State/Province
          </label>
          <input
            type="text"
            value={formData.state_province}
            onChange={(e) => setFormData(prev => ({ ...prev, state_province: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Enter your state or province"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            City
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Enter your city"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="flex items-center"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </div>
          )}
        </Button>
      </div>
    </form>
  );
});

EditProfileForm.displayName = 'EditProfileForm';

export default EditProfileForm;