import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileUp, Trash2, Plus, Check, AlertCircle } from 'lucide-react';
import SignaturePad, { SignaturePadRef } from './SignaturePad';
import { getFormData, submitForm } from '../api';
import type { FormData, MaterialItem, UploadConfig } from '../types';

export default function FieldForm() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();

  const gcSignatureRef = useRef<SignaturePadRef>(null);
  const techSignatureRef = useRef<SignaturePadRef>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    customer_name: '',
    customer_address: '',
    account_number: '',
    date_of_call: new Date().toISOString().split('T')[0],
    person_to_see: '',
    terms: '',
    special_instructions: '',
    time_in: '',
    time_out: '',
    materials: [],
    gc_signature: '',
    tech_signature: '',
    subtotal: 0,
    tax: 0,
    total: 0,
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [uploadConfig, setUploadConfig] = useState<UploadConfig>({
    upload_to_projectsight: false,
    send_email: true,
    email_to: '',
  });

  useEffect(() => {
    loadFormData();
  }, [shareToken]);

  const loadFormData = async () => {
    if (!shareToken) return;

    try {
      setLoading(true);
      const data = await getFormData(shareToken);
      setFormData((prev) => ({ ...prev, ...data }));
    } catch (err) {
      setError('Failed to load form. Link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const addMaterialRow = () => {
    setFormData((prev) => ({
      ...prev,
      materials: [
        ...prev.materials,
        { quantity: '', weight: '', description: '', unit_price: '', total: '' },
      ],
    }));
  };

  const updateMaterial = (index: number, field: keyof MaterialItem, value: string) => {
    const newMaterials = [...formData.materials];
    newMaterials[index] = { ...newMaterials[index], [field]: value };

    // Auto-calculate total if quantity and unit_price are provided
    if (field === 'quantity' || field === 'unit_price') {
      const qty = parseFloat(field === 'quantity' ? value : newMaterials[index].quantity) || 0;
      const price = parseFloat(field === 'unit_price' ? value : newMaterials[index].unit_price) || 0;
      newMaterials[index].total = (qty * price).toFixed(2);
    }

    setFormData((prev) => ({ ...prev, materials: newMaterials }));
    calculateTotals(newMaterials);
  };

  const removeMaterial = (index: number) => {
    const newMaterials = formData.materials.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, materials: newMaterials }));
    calculateTotals(newMaterials);
  };

  const calculateTotals = (materials: MaterialItem[]) => {
    const subtotal = materials.reduce(
      (sum, item) => sum + (parseFloat(item.total) || 0),
      0
    );
    const tax = subtotal * 0.07; // 7% tax rate - adjust as needed
    const total = subtotal + tax;

    setFormData((prev) => ({
      ...prev,
      subtotal,
      tax,
      total,
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shareToken) {
      setError('Invalid form link');
      return;
    }

    // Validate signatures
    if (gcSignatureRef.current?.isEmpty()) {
      setError('Please provide GC signature');
      return;
    }

    if (techSignatureRef.current?.isEmpty()) {
      setError('Please provide Technician signature');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Get signature data
      const gcSig = gcSignatureRef.current?.toDataURL() || '';
      const techSig = techSignatureRef.current?.toDataURL() || '';

      const submissionData = {
        ...formData,
        gc_signature: gcSig,
        tech_signature: techSig,
      };

      await submitForm(shareToken, submissionData, uploadConfig, photos);

      setSuccess(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/success');
      }, 3000);
    } catch (err) {
      setError('Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-green-50">
        <div className="text-center p-8">
          <Check className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
          <p className="text-gray-600">Your form has been submitted successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Service Order Form</h1>
          <p className="text-gray-600">Complete all fields and submit when finished</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customer_name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.customer_address}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customer_address: e.target.value }))
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, account_number: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Call *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date_of_call}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, date_of_call: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Person to See
                  </label>
                  <input
                    type="text"
                    value={formData.person_to_see}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, person_to_see: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Terms
                  </label>
                  <input
                    type="text"
                    value={formData.terms}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, terms: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Work Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Work Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Instructions / Work Performed *
                </label>
                <textarea
                  required
                  value={formData.special_instructions}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, special_instructions: e.target.value }))
                  }
                  rows={4}
                  placeholder="Describe the work performed..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time In
                  </label>
                  <input
                    type="time"
                    value={formData.time_in}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, time_in: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Out
                  </label>
                  <input
                    type="time"
                    value={formData.time_out}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, time_out: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Materials */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Materials / Services</h2>
              <button
                type="button"
                onClick={addMaterialRow}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {formData.materials.map((material, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-md"
                >
                  <input
                    type="text"
                    placeholder="Qty"
                    value={material.quantity}
                    onChange={(e) => updateMaterial(index, 'quantity', e.target.value)}
                    className="col-span-2 px-2 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Weight"
                    value={material.weight}
                    onChange={(e) => updateMaterial(index, 'weight', e.target.value)}
                    className="col-span-2 px-2 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={material.description}
                    onChange={(e) => updateMaterial(index, 'description', e.target.value)}
                    className="col-span-4 px-2 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Price"
                    value={material.unit_price}
                    onChange={(e) => updateMaterial(index, 'unit_price', e.target.value)}
                    className="col-span-2 px-2 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Total"
                    value={material.total}
                    readOnly
                    className="col-span-1 px-2 py-2 border border-gray-300 rounded text-sm bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => removeMaterial(index)}
                    className="col-span-1 p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-end space-y-2">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Subtotal:</span>
                    <span>${formData.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Tax (7%):</span>
                    <span>${formData.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                    <span>Total:</span>
                    <span>${formData.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Photos (Optional)</h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                  <div className="text-center">
                    <FileUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-600">Click to upload photos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>
                </label>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-gray-600 mt-1 truncate">{photo.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Signatures */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Signatures *</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    GC / Customer Signature
                  </label>
                  <button
                    type="button"
                    onClick={() => gcSignatureRef.current?.clear()}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear
                  </button>
                </div>
                <SignaturePad ref={gcSignatureRef} height={150} />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Technician Signature
                  </label>
                  <button
                    type="button"
                    onClick={() => techSignatureRef.current?.clear()}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear
                  </button>
                </div>
                <SignaturePad ref={techSignatureRef} height={150} />
              </div>
            </div>
          </div>

          {/* Upload Configuration */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Delivery Options</h2>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={uploadConfig.upload_to_projectsight}
                  onChange={(e) =>
                    setUploadConfig((prev) => ({
                      ...prev,
                      upload_to_projectsight: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Upload to ProjectSight
                </span>
              </label>

              <div>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={uploadConfig.send_email}
                    onChange={(e) =>
                      setUploadConfig((prev) => ({
                        ...prev,
                        send_email: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Send via Email</span>
                </label>

                {uploadConfig.send_email && (
                  <input
                    type="email"
                    placeholder="Email address (optional)"
                    value={uploadConfig.email_to}
                    onChange={(e) =>
                      setUploadConfig((prev) => ({ ...prev, email_to: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pb-8">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-lg"
            >
              {submitting ? 'Submitting...' : 'Submit Service Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
