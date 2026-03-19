import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Upload, X, Check, Crop as CropIcon, Save, Loader2, Calendar, Building2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface PrescriptionUploaderProps {
  onUploadComplete: () => void;
  uploadEndpoint?: string;
}

const PrescriptionUploader: React.FC<PrescriptionUploaderProps> = ({ onUploadComplete, uploadEndpoint }) => {
  const [files, setFiles] = useState<{ file: File; id: string; preview: string; cropped?: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState<{id: number, name: string}[]>([]);
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [prescriptionDate, setPrescriptionDate] = useState(getLocalDateString());
  const [isSaving, setIsSaving] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    fetch('/api/departments')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDepartments(data);
          if (data.length > 0) setDepartment(data[0].name);
        } else {
          setDepartments([]);
        }
      })
      .catch(console.error);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      preview: URL.createObjectURL(file)
    }));
    setFiles(prev => [...prev, ...newFiles]);
    if (currentIndex === null) setCurrentIndex(0);
  }, [currentIndex]);



  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true
  } as any);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        { unit: '%', width: 90 },
        1,
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
  };

  const getCroppedImg = useCallback(() => {
    if (!completedCrop || !imgRef.current) return;

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );
    }

    return canvas.toDataURL('image/jpeg');
  }, [completedCrop]);

  const handleApplyCrop = () => {
    if (currentIndex === null) return;
    const croppedDataUrl = getCroppedImg();
    if (croppedDataUrl) {
      const updatedFiles = [...files];
      updatedFiles[currentIndex].cropped = croppedDataUrl;
      setFiles(updatedFiles);
      
      // Move to next or finish
      if (currentIndex < files.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(null);
      }
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      for (const fileObj of files) {
        const imageData = fileObj.cropped || fileObj.preview;
        // If it's still a blob URL, we need to convert to base64
        let finalImageData = imageData;
        if (imageData.startsWith('blob:')) {
            const response = await fetch(imageData);
            const blob = await response.blob();
            finalImageData = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        }

        await fetch(uploadEndpoint || '/api/prescriptions/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            image_data: finalImageData,
            department,
            prescription_date: prescriptionDate
          }),
        });
      }
      setFiles([]);
      onUploadComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (currentIndex !== null && files[currentIndex]?.id === id) {
      setCurrentIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center">
            <Building2 size={16} className="mr-2 shrink-0" /> Department
          </label>
          <select 
            className="w-full px-4 py-3 bg-white border border-slate-200/80 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-lg shadow-sm"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            {Array.isArray(departments) && departments.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center">
            <Calendar size={16} className="mr-2 shrink-0" /> Prescription Date
          </label>
          <input 
            type="date" 
            className="w-full px-4 py-3 bg-white border border-slate-200/80 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-lg shadow-sm"
            value={prescriptionDate}
            onChange={(e) => setPrescriptionDate(e.target.value)}
          />
        </div>
      </div>

      <div 
        {...getRootProps()} 
        className={`mt-4 p-10 border-2 border-dashed rounded-[32px] text-center transition-all cursor-pointer ${
          isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-[#9ce0af] hover:border-[#86c897] bg-white'
        }`}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 bg-[#d4f8e0] text-[#0ea661] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Upload size={28} strokeWidth={2} />
        </div>
        <h3 className="text-[22px] font-extrabold text-slate-800 tracking-tight">Upload Prescriptions</h3>
        <p className="text-[15px] font-medium text-slate-500 mt-2">Multiple images allowed. Drag <br/>& drop or click.</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800">Selected Images ({files.length})</h4>
            <button 
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold flex items-center hover:bg-emerald-600 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
              Save All
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {files.map((f, idx) => (
              <div key={f.id} className="relative group">
                <div 
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-20 h-20 rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                    currentIndex === idx ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-100'
                  }`}
                >
                  <img src={f.cropped || f.preview} alt="preview" className="w-full h-full object-cover" />
                  {f.cropped && (
                    <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                      <Check size={20} className="text-white drop-shadow-md" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentIndex !== null && files[currentIndex] && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center">
                <CropIcon size={18} className="mr-2 text-emerald-500" />
                Crop Prescription ({currentIndex + 1} / {files.length})
              </h3>
              <button onClick={() => setCurrentIndex(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-8 bg-slate-100 flex items-center justify-center">
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                onComplete={c => setCompletedCrop(c)}
              >
                <img
                  ref={imgRef}
                  src={files[currentIndex].preview}
                  onLoad={onImageLoad}
                  alt="Crop me"
                  className="max-w-full max-h-[60vh] object-contain"
                />
              </ReactCrop>
            </div>

            <div className="p-6 border-t bg-white flex justify-end space-x-3">
              <button 
                onClick={() => {
                  if (currentIndex < files.length - 1) setCurrentIndex(currentIndex + 1);
                  else setCurrentIndex(null);
                }}
                className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all"
              >
                Skip
              </button>
              <button 
                onClick={handleApplyCrop}
                className="px-8 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center"
              >
                <Check size={18} className="mr-2" />
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionUploader;
