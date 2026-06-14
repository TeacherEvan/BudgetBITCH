// components/dashboard/panels/net-worth.tsx
'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit, TrendingUp } from 'lucide-react';
import { useNetWorth } from '@/hooks/use-local-db';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/currency';
import { generateId } from '@/lib/db/local-db';

interface NetWorthProps {
  locale?: 'th' | 'en';
}

interface AssetInput {
  name: string;
  value: number;
  type: 'cash' | 'investment' | 'property' | 'vehicle' | 'gold' | 'crypto' | 'other';
}

interface LiabilityInput {
  name: string;
  value: number;
  type: 'credit_card' | 'personal_loan' | 'car_loan' | 'mortgage' | 'family' | 'other';
}

const ASSET_TYPES = [
  { value: 'cash', label: { th: 'เงินสด', en: 'Cash' }, icon: '💵' },
  { value: 'investment', label: { th: 'การลงทุน', en: 'Investment' }, icon: '📈' },
  { value: 'property', label: { th: 'อสังหาริมทรัพย์', en: 'Property' }, icon: '🏠' },
  { value: 'vehicle', label: { th: 'ยานพาหนะ', en: 'Vehicle' }, icon: '🚗' },
  { value: 'gold', label: { th: 'ทองคำ', en: 'Gold' }, icon: '🥇' },
  { value: 'crypto', label: { th: 'คริปโต', en: 'Crypto' }, icon: '₿' },
  { value: 'other', label: { th: 'อื่นๆ', en: 'Other' }, icon: '📦' },
];

const LIABILITY_TYPES = [
  { value: 'credit_card', label: { th: 'บัตรเครดิต', en: 'Credit Card' } },
  { value: 'personal_loan', label: { th: 'กู้ยืมส่วนตัว', en: 'Personal Loan' } },
  { value: 'car_loan', label: { th: 'กู้รถ', en: 'Car Loan' } },
  { value: 'mortgage', label: { th: 'กู้บ้าน/คอนโด', en: 'Mortgage' } },
  { value: 'family', label: { th: 'หนี้ครอบครัว', en: 'Family Loan' } },
  { value: 'other', label: { th: 'อื่นๆ', en: 'Other' } },
];

export function NetWorth({ locale = 'en' }: NetWorthProps) {
  const { 
    snapshot, 
    loading, 
    addAsset, 
    updateAsset, 
    removeAsset, 
    addLiability, 
    updateLiability, 
    removeLiability,
    totalAssets,
    totalLiabilities,
    netWorth
  } = useNetWorth();
  
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showLiabilityForm, setShowLiabilityForm] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editingLiabilityId, setEditingLiabilityId] = useState<string | null>(null);
  
  const [assetForm, setAssetForm] = useState<AssetInput>({ name: '', value: 0, type: 'cash' });
  const [liabilityForm, setLiabilityForm] = useState<LiabilityInput>({ name: '', value: 0, type: 'credit_card' });

  const isPositive = netWorth >= 0;

  const resetAssetForm = () => {
    setEditingAssetId(null);
    setShowAssetForm(false);
    setAssetForm({ name: '', value: 0, type: 'cash' });
  };

  const resetLiabilityForm = () => {
    setEditingLiabilityId(null);
    setShowLiabilityForm(false);
    setLiabilityForm({ name: '', value: 0, type: 'credit_card' });
  };

  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetForm.name || !assetForm.value) return;
    
    const asset = {
      ...assetForm,
      id: editingAssetId || generateId(),
    };

    if (editingAssetId) {
      await updateAsset(asset);
    } else {
      await addAsset(asset);
    }
    resetAssetForm();
  };

  const handleLiabilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liabilityForm.name || !liabilityForm.value) return;
    
    const liability = {
      ...liabilityForm,
      id: editingLiabilityId || generateId(),
    };

    if (editingLiabilityId) {
      await updateLiability(liability);
    } else {
      await addLiability(liability);
    }
    resetLiabilityForm();
  };

  const handleAssetEdit = (asset: any) => {
    setEditingAssetId(asset.id);
    setAssetForm({ name: asset.name, value: asset.value, type: asset.type });
    setShowAssetForm(true);
  };

  const handleLiabilityEdit = (liability: any) => {
    setEditingLiabilityId(liability.id);
    setLiabilityForm({ name: liability.name, value: liability.value, type: liability.type });
    setShowLiabilityForm(true);
  };

  const handleAssetDelete = async (id: string) => {
    await removeAsset(id);
  };

  const handleLiabilityDelete = async (id: string) => {
    await removeLiability(id);
  };

  const assetTypeOptions = ASSET_TYPES.map(t => ({ value: t.value, label: locale === 'th' ? t.label.th : t.label.en }));
  const liabilityTypeOptions = LIABILITY_TYPES.map(t => ({ value: t.value, label: locale === 'th' ? t.label.th : t.label.en }));

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-white/50">{locale === 'th' ? 'กำลังโหลด...' : 'Loading...'}</div>
      </div>
    );
  }

  const renderAssets = () => {
    const assets = snapshot?.assets || [];
    
    if (assets.length === 0) {
      return (
        <div className="p-3 rounded-xl bg-black/30 border border-white/10 text-center text-white/50">
          {locale === 'th' ? 'ยังไม่มีทรัพย์สิน' : 'No assets yet'}
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {assets.map(asset => {
          const typeInfo = ASSET_TYPES.find(t => t.value === asset.type);
          return (
            <div key={asset.id} className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-400/20 flex items-center justify-center text-emerald-400 text-xl">
                  {typeInfo?.icon}
                </div>
                <div>
                  <p className="font-medium text-white">{asset.name}</p>
                  <p className="text-xs text-white/60 capitalize">{typeInfo?.label[locale === 'th' ? 'th' : 'en']}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-400">{formatCurrency(asset.value, locale)}</span>
                <Button variant="ghost" size="sm" onClick={() => handleAssetEdit(asset)} aria-label="Edit"><Edit className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleAssetDelete(asset.id)} aria-label="Delete"><Trash2 className="w-4 h-4 text-rose-400" /></Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderLiabilities = () => {
    const liabilities = snapshot?.liabilities || [];
    
    if (liabilities.length === 0) {
      return (
        <div className="p-3 rounded-xl bg-black/30 border border-white/10 text-center text-white/50">
          {locale === 'th' ? 'ยังไม่มีหนี้สิน' : 'No liabilities yet'}
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {liabilities.map((liability: any) => {
          const typeInfo = LIABILITY_TYPES.find(t => t.value === liability.type);
          return (
            <div key={liability.id} className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-400/20 flex items-center justify-center text-rose-400">
                  💳
                </div>
                <div>
                  <p className="font-medium text-white">{liability.name}</p>
                  <p className="text-xs text-white/60 capitalize">{typeInfo?.label[locale === 'th' ? 'th' : 'en']}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-rose-400">{formatCurrency(liability.value, locale)}</span>
                <Button variant="ghost" size="sm" onClick={() => handleLiabilityEdit(liability)} aria-label="Edit"><Edit className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleLiabilityDelete(liability.id)} aria-label="Delete"><Trash2 className="w-4 h-4 text-rose-400" /></Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-white">💰 Net Worth</h3>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => { setShowAssetForm(true); setEditingAssetId(null); resetAssetForm(); }}>
            <Plus className="w-4 h-4 mr-1" /> {locale === 'th' ? '+ ทรัพย์สิน' : '+ Asset'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => { setShowLiabilityForm(true); setEditingLiabilityId(null); resetLiabilityForm(); }}>
            <Plus className="w-4 h-4 mr-1" /> {locale === 'th' ? '+ หนี้สิน' : '+ Liability'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className={`bg-emerald-400/10 border border-emerald-400/30 rounded-xl p-4`}>
          <p className="text-sm text-emerald-400">{locale === 'th' ? 'รวมทรัพย์สิน' : 'Total Assets'}</p>
          <p className="text-2xl font-bold font-mono text-white">{formatCurrency(totalAssets, locale)}</p>
        </div>
        <div className={`bg-rose-400/10 border border-rose-400/30 rounded-xl p-4`}>
          <p className="text-sm text-rose-400">{locale === 'th' ? 'รวมหนี้สิน' : 'Total Liabilities'}</p>
          <p className="text-2xl font-bold font-mono text-white">{formatCurrency(totalLiabilities, locale)}</p>
        </div>
        <div className={`${isPositive ? 'bg-emerald-400/10 border-emerald-400/30' : 'bg-rose-400/10 border-rose-400/30'} rounded-xl p-4`}>
          <p className="text-sm text-amber-400">{locale === 'th' ? 'มูลค่าสุทธิ' : 'Net Worth'}</p>
          <p className={`text-2xl font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? '+' : ''}{formatCurrency(netWorth, locale)}
          </p>
        </div>
      </div>

      {/* Assets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-white">{locale === 'th' ? 'ทรัพย์สิน' : 'Assets'}</h4>
          <Button variant="primary" size="sm" onClick={() => { setShowAssetForm(true); setEditingAssetId(null); resetAssetForm(); }}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        {showAssetForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-black/95 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-white mb-4">{editingAssetId ? (locale === 'th' ? 'แก้ไขทรัพย์สิน' : 'Edit Asset') : (locale === 'th' ? 'เพิ่มทรัพย์สิน' : 'Add Asset')}</h3>
              <form onSubmit={handleAssetSubmit} className="space-y-3">
                <Input label={locale === 'th' ? 'ชื่อ' : 'Name'} value={assetForm.name} onChange={e => setAssetForm({...assetForm, name: e.target.value})} required />
                <Input label={locale === 'th' ? 'มูลค่า' : 'Value'} type="number" step="0.01" min="0" value={assetForm.value} onChange={e => setAssetForm({...assetForm, value: parseFloat(e.target.value) || 0})} required />
                <Select label={locale === 'th' ? 'ประเภท' : 'Type'} value={assetForm.type} onChange={e => setAssetForm({...assetForm, type: e.target.value as any})} options={assetTypeOptions} />
                <div className="flex gap-2">
                  <Button type="button" onClick={resetAssetForm} variant="secondary">{locale === 'th' ? 'ยกเลิก' : 'Cancel'}</Button>
                  <Button type="submit" className="flex-1">{editingAssetId ? (locale === 'th' ? 'อัปเดต' : 'Update') : (locale === 'th' ? 'เพิ่ม' : 'Add')}</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {renderAssets()}
      </div>

      {/* Liabilities */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-white">{locale === 'th' ? 'หนี้สิน' : 'Liabilities'}</h4>
          <Button variant="secondary" size="sm" onClick={() => { setShowLiabilityForm(true); setEditingLiabilityId(null); resetLiabilityForm(); }}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        {showLiabilityForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-black/95 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">{editingLiabilityId ? (locale === 'th' ? 'แก้ไขหนี้สิน' : 'Edit Liability') : (locale === 'th' ? 'เพิ่มหนี้สิน' : 'Add Liability')}</h3>
              <form onSubmit={handleLiabilitySubmit} className="space-y-3">
                <Input label={locale === 'th' ? 'ชื่อ' : 'Name'} value={liabilityForm.name} onChange={e => setLiabilityForm({...liabilityForm, name: e.target.value})} required />
                <Input label={locale === 'th' ? 'จำนวนเงิน' : 'Value'} type="number" step="0.01" min="0" value={liabilityForm.value} onChange={e => setLiabilityForm({...liabilityForm, value: parseFloat(e.target.value) || 0})} required />
                <Select label={locale === 'th' ? 'ประเภท' : 'Type'} value={liabilityForm.type} onChange={e => setLiabilityForm({...liabilityForm, type: e.target.value as any})} options={liabilityTypeOptions} />
                <div className="flex gap-2">
                  <Button type="button" onClick={resetLiabilityForm} variant="secondary">{locale === 'th' ? 'ยกเลิก' : 'Cancel'}</Button>
                  <Button type="submit" className="flex-1">{editingLiabilityId ? (locale === 'th' ? 'อัปเดต' : 'Update') : (locale === 'th' ? 'เพิ่ม' : 'Add')}</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {renderLiabilities()}
      </div>
    </div>
  );
}

interface NetWorthProps {
  locale?: 'th' | 'en';
}