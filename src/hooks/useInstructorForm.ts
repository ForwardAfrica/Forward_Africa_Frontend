import { useState, useEffect, useCallback } from 'react';
import { InstructorService, InstructorFormData, InstructorValidationError, InstructorServiceError } from '../lib/instructorService';
import { Instructor } from '../types';

interface UseInstructorFormOptions {
  instructorId?: string;
  onSuccess?: (instructor: Instructor, message?: string) => void;
  onError?: (error: string, errorCode?: string) => void;
  onValidationError?: (errors: InstructorValidationError[]) => void;
}

interface UseInstructorFormReturn {
  // Form state
  formData: InstructorFormData;
  setFormData: React.Dispatch<React.SetStateAction<InstructorFormData>>;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  isEditing: boolean;

  // Validation
  validationErrors: InstructorValidationError[];

  // Form actions
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleReset: () => void;
  handleAddExpertise: (expertise: string) => void;
  handleRemoveExpertise: (expertise: string) => void;

  // Data fetching
  loadInstructorData: () => Promise<void>;

  // Utility functions
  updateField: <K extends keyof InstructorFormData>(field: K, value: InstructorFormData[K]) => void;
  updateSocialLink: (platform: keyof InstructorFormData['socialLinks'], value: string) => void;

  // Error handling
  lastError: string | null;
  lastErrorCode: string | null;
  clearErrors: () => void;

  // Success handling
  lastSuccess: string | null;
  clearSuccess: () => void;

  // Form state tracking
  hasUnsavedChanges: boolean;
  isFormValid: boolean;
}

export const useInstructorForm = (options: UseInstructorFormOptions = {}): UseInstructorFormReturn => {
  const {
    instructorId,
    onSuccess,
    onError,
    onValidationError
  } = options;

  // State management
  const [formData, setFormData] = useState<InstructorFormData>(InstructorService.getDefaultFormData());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<InstructorValidationError[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastErrorCode, setLastErrorCode] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isEditing = !!instructorId;

  // Clear errors utility
  const clearErrors = useCallback(() => {
    setValidationErrors([]);
    setLastError(null);
    setLastErrorCode(null);
  }, []);

  // Clear success utility
  const clearSuccess = useCallback(() => {
    setLastSuccess(null);
  }, []);

  // Check if form is valid
  const isFormValid = useCallback(() => {
    const errors = InstructorService.validateInstructorData(formData);
    return errors.filter(error => error.severity === 'error').length === 0;
  }, [formData]);

  // Error handler
  const handleError = useCallback((error: unknown, operation: string) => {
    let message = 'An unexpected error occurred.';
    let code = null;

    if (error instanceof InstructorServiceError) {
      message = error.message;
      code = error.code || null;
    } else if (error instanceof Error) {
      message = error.message;
    }

    setLastError(message);
    setLastErrorCode(code);

    if (onError) {
      onError(message, code || undefined);
    }
  }, [onError]);

  // Load instructor data if editing
  const loadInstructorData = useCallback(async () => {
    if (!instructorId) return;

    setIsLoading(true);
    setValidationErrors([]);
    setLastError(null);
    setLastErrorCode(null);

    try {
      const instructor = await InstructorService.fetchInstructorById(instructorId);
      const formDataFromInstructor = InstructorService.instructorToFormData(instructor);
      setFormData(formDataFromInstructor);
    } catch (error) {
      let message = 'Failed to load instructor data. Please try again.';
      let code = null;

      if (error instanceof InstructorServiceError) {
        message = error.message;
        code = error.code || null;
      } else if (error instanceof Error) {
        message = error.message;
      }

      setLastError(message);
      setLastErrorCode(code);
    } finally {
      setIsLoading(false);
    }
  }, [instructorId]);

  // Load data on mount if editing
  useEffect(() => {
    if (isEditing && instructorId) {
      loadInstructorData();
    }
  }, [isEditing, instructorId, loadInstructorData]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    clearErrors();

    // Validate form data
    const errors = InstructorService.validateInstructorData(formData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      onValidationError?.(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      let result: Instructor;
      let successMessage: string;

      if (isEditing && instructorId) {
        // Update existing instructor
        result = await InstructorService.updateInstructor(instructorId, formData);
        successMessage = `Instructor "${result.name}" has been successfully updated!`;
      } else {
        // Create new instructor
        result = await InstructorService.createInstructor(formData);
        successMessage = `Instructor "${result.name}" has been successfully created!`;
      }

      setLastSuccess(successMessage);
      setHasUnsavedChanges(false);
      onSuccess?.(result, successMessage);
    } catch (error) {
      if (error instanceof InstructorServiceError) {
        // Handle specific service errors
        if (error.code === 'VALIDATION_ERROR') {
          setValidationErrors([]);
          onValidationError?.([]);
          return;
        }
      }

      handleError(error, isEditing ? 'Updating instructor' : 'Creating instructor');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isEditing, instructorId, onSuccess, onValidationError, clearErrors, handleError]);

  // Reset form to default state
  const handleReset = useCallback(() => {
    setFormData(InstructorService.getDefaultFormData());
    clearErrors();
  }, [clearErrors]);

  // Add expertise
  const handleAddExpertise = useCallback((expertise: string) => {
    const trimmedExpertise = expertise.trim();
    if (trimmedExpertise && !formData.expertise.includes(trimmedExpertise)) {
      setFormData(prev => ({
        ...prev,
        expertise: [...prev.expertise, trimmedExpertise]
      }));
    }
  }, [formData.expertise]);

  // Remove expertise
  const handleRemoveExpertise = useCallback((expertise: string) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.filter(e => e !== expertise)
    }));
  }, []);

  // Update a specific field
  const updateField = useCallback(<K extends keyof InstructorFormData>(
    field: K,
    value: InstructorFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);

    // Clear validation error for this field if it exists
    setValidationErrors(prev => prev.filter(error => error.field !== field));

    // Clear general errors when user starts typing
    if (lastError) {
      setLastError(null);
      setLastErrorCode(null);
    }
  }, [lastError]);

  // Update social link
  const updateSocialLink = useCallback((
    platform: keyof InstructorFormData['socialLinks'],
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
    setHasUnsavedChanges(true);
  }, []);

  return {
    formData,
    setFormData,
    isLoading,
    isSubmitting,
    isEditing,
    validationErrors,
    handleSubmit,
    handleReset,
    handleAddExpertise,
    handleRemoveExpertise,
    loadInstructorData,
    updateField,
    updateSocialLink,
    lastError,
    lastErrorCode,
    clearErrors,
    lastSuccess,
    clearSuccess,
    hasUnsavedChanges,
    isFormValid: isFormValid()
  };
};