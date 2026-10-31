import React, { useState, useRef } from 'react';
import { Gift, X, Upload, Image as ImageIcon, Plus, Trash2, Check, Sparkles } from 'lucide-react';
import { Prize } from '../types/party';
import { soundFX } from '../utils/audio';

interface PrizeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  prizeToEdit: Prize | null;
  onSave: (prize: Prize) => void;
  onDelete?: (prizeId: string) => void;
}

export const PrizeManagerModal: React.FC<PrizeManagerModalProps> = ({
  isOpen,
  onClose,
  prizeToEdit,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState(prizeToEdit?.name || '');
  const [tier, setTier] = useState(prizeToEdit?.tier || 'รางวัลพิเศษ');
  const [quantity, setQuantity] = useState(prizeToEdit?.quantity || 1);
  const [sponsor, setSponsor] = useState(prizeToEdit?.sponsor || '');
  const [description, setDescription] = useState(prizeToEdit?.description || '');
  const [imageUrl, setImageUrl] = useState(prizeToEdit?.imageUrl || '');
  const [imagePreview, setImagePreview] = useState(prizeToEdit?.imageUrl || '');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state when modal opens or prizeToEdit changes
  React.useEffect(() => {
    if (prizeToEdit) {
      setName(prizeToEdit.name);
      setTier(prizeToEdit.tier);
      setQuantity(prizeToEdit.quantity);
      setSponsor(prizeToEdit.sponsor || '');
      setDescription(prizeToEdit.description || '');
      setImageUrl(prizeToEdit.imageUrl || '');
      setImagePreview(prizeToEdit.imageUrl || '');
    } else {
      setName('');
      setTier('รางวัลพิเศษ');
      setQuantity(1);
      setSponsor('');
      setDescription('');
      setImageUrl('');
      setImagePreview('');
    }
  }, [prizeToEdit, isOpen]);

  if (!isOpen) return null;

  // Handle local image file upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const result = event.target.result as string;
          setImageUrl(result);
          setImagePreview(result);
          soundFX.playClick();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('กรุณาระบุชื่อของรางวัล');
      return;
    }

    const numQty = Math.max(1, Number(quantity) || 1);
    const remainingCount = prizeToEdit
      ? Math.max(0, numQty - (prizeToEdit.quantity - prizeToEdit.remaining))
      : numQty;

    const pastelGradients = [
      'from-rose-200 via-pink-200 to-purple-200',
      'from-amber-200 via-yellow-200 to-orange-200',
      'from-emerald-200 via-teal-200 to-cyan-200',
      'from-sky-200 via-indigo-200 to-purple-200',
      'from-violet-200 via-fuchsia-200 to-pink-200',
    ];
    const randomColor = pastelGradients[Math.floor(Math.random() * pastelGradients.length)];

    const updatedPrize: Prize = {
      id: prizeToEdit ? prizeToEdit.id : `PRIZE-${Date.now()}`,
      name: name.trim(),
      tier: tier.trim(),
      quantity: numQty,
      remaining: remainingCount,
      sponsor: sponsor.trim(),
      description: description.trim(),
      imageUrl: imagePreview.trim() || undefined,
      color: prizeToEdit?.color || randomColor,
    };

    soundFX.playClick();
    onSave(updatedPrize);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white border border-purple-100 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] absolute top-3 right-3 text-slate-400 hover:text-slate-700 flex items-center justify-center rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-200 via-purple-200 to-amber-200 flex items-center justify-center mx-auto mb-2 text-purple-700 shadow-sm">
            <Gift className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">
            {prizeToEdit ? 'แก้ไขข้อมูลของรางวัล' : 'เพิ่มของรางวัลใหม่'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            กำหนดชื่อ จำนวน และแนบรูปตัวอย่างของรางวัลสำหรับจับ Lucky Draw
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Prize Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ชื่อของรางวัล <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น iPhone 16 Pro Max, ทองคำ 1 บาท, iPad Air"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-purple-200 focus:border-purple-400 focus:bg-white text-slate-800 text-xs font-medium transition"
            />
          </div>

          {/* Tier & Quantity Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ระดับรางวัล (Tier)
              </label>
              <input
                type="text"
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                placeholder="เช่น Grand Prize, รางวัลที่ 1"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-purple-200 focus:border-purple-400 focus:bg-white text-slate-800 text-xs font-medium transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                จำนวนรางวัล (ชิ้น) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-purple-200 focus:border-purple-400 focus:bg-white text-slate-800 text-xs font-bold font-mono transition"
              />
            </div>
          </div>

          {/* Sponsor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ผู้สนับสนุน / มอบโดย
            </label>
            <input
              type="text"
              value={sponsor}
              onChange={(e) => setSponsor(e.target.value)}
              placeholder="เช่น CEO, คณะกรรมการจัดงาน, สหกรณ์"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-purple-200 focus:border-purple-400 focus:bg-white text-slate-800 text-xs font-medium transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              รายละเอียดเพิ่มเติม / สี / รุ่น
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เช่น 256GB สีไทเทเนียม, บัตรหมดอายุสิ้นปี"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-purple-200 focus:border-purple-400 focus:bg-white text-slate-800 text-xs font-medium transition"
            />
          </div>

          {/* IMAGE UPLOAD & ATTACHMENT SECTION - User Requirement */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                <span>แนบรูปตัวอย่างของรางวัล (Sample Image)</span>
              </span>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview('');
                    setImageUrl('');
                  }}
                  className="text-[11px] text-rose-500 hover:underline"
                >
                  ลบรูป
                </button>
              )}
            </label>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />

            {imagePreview ? (
              <div className="relative w-full h-36 rounded-2xl overflow-hidden border-2 border-purple-200 bg-purple-50 group flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt={name || 'ตัวอย่างของรางวัล'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[44px] px-3 py-1.5 rounded-xl bg-white/95 text-slate-800 text-xs font-bold shadow-md hover:bg-white"
                  >
                    เปลี่ยนรูปภาพ
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-purple-200 hover:border-purple-400 rounded-2xl p-4 text-center cursor-pointer bg-purple-50/50 hover:bg-purple-50 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-purple-200 flex items-center justify-center mx-auto mb-1.5 text-purple-600 shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-purple-900">
                  คลิกเพื่ออัปโหลดรูปตัวอย่างของรางวัล
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  รองรับไฟล์รูปภาพ PNG, JPG, WebP
                </p>
              </div>
            )}

            {/* Alternative: Image URL Input */}
            <div className="mt-2">
              <input
                type="url"
                value={imageUrl.startsWith('data:') ? '' : imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImagePreview(e.target.value);
                }}
                placeholder="หรือวางลิงก์รูปภาพ (Image URL)..."
                className="w-full min-h-[38px] px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-purple-300 text-[11px] text-slate-700"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center gap-2">
            {prizeToEdit && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`คุณต้องการลบรางวัล "${prizeToEdit.name}" หรือไม่?`)) {
                    onDelete(prizeToEdit.id);
                    onClose();
                  }
                }}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5"
                title="ลบรางวัลนี้"
              >
                <Trash2 className="w-4 h-4" />
                <span>ลบ</span>
              </button>
            )}

            <button
              type="submit"
              className="flex-1 min-h-[46px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 hover:from-purple-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-pink-500/20 active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกข้อมูลของรางวัล</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
