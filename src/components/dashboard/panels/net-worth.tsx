// components/dashboard/panels/net-worth.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp } from 'lucide-react';
import { useNetWorth } from '@/hooks/use-local-db';
import { Button } from '@/components/ui/button';
import { NetWorthHeader } from './net-worth-header';
import { NetWorthSection } from './net-worth-section';
import { NetWorthForm } from './net-worth-form';
import { NetWorthSkeleton } from './net-worth-skeleton';
import { AssetItem } from './net-worth-asset-item';
import { LiabilityItem } from './net-worth-liability-item';
import { Asset, Liability, AssetInput, LiabilityInput } from './net-worth-types';
import { generateId } from '@/lib/db/local-db';
import { notify } from '@/lib/ui/notice';

export function NetWorth({ locale = 'en' }: { locale?: string }) {
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
    netWorth,
  } = useNetWorth();

  const isPositive = netWorth >= 0;

  // Asset form state
  const [isAssetFormOpen, setIsAssetFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Liability form state
  const [isLiabilityFormOpen, setIsLiabilityFormOpen] = useState(false);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);

  const assets = snapshot?.assets || [];
  const liabilities = snapshot?.liabilities || [];

  const handleAssetSubmit = async (data: AssetInput | LiabilityInput) => {
    const assetData = data as AssetInput;
    const assetWithId: Asset = { ...assetData, id: editingAsset?.id || generateId() };
    try {
      if (editingAsset) {
        await updateAsset(assetWithId);
      } else {
        await addAsset(assetWithId);
      }
      setEditingAsset(null);
    } catch (e) {
      console.error('Saving asset failed:', e);
      notify('Could not save that asset. Please try again.', 'error');
    }
  };

  const handleLiabilitySubmit = async (data: AssetInput | LiabilityInput) => {
    const liabilityData = data as LiabilityInput;
    const liabilityWithId: Liability = { ...liabilityData, id: editingLiability?.id || generateId() };
    try {
      if (editingLiability) {
        await updateLiability(liabilityWithId);
      } else {
        await addLiability(liabilityWithId);
      }
      setEditingLiability(null);
    } catch (e) {
      console.error('Saving liability failed:', e);
      notify('Could not save that liability. Please try again.', 'error');
    }
  };

  const openAssetForm = (asset?: Asset) => {
    if (asset) {
      setEditingAsset(asset);
      setIsAssetFormOpen(true);
    } else {
      setEditingAsset(null);
      setIsAssetFormOpen(true);
    }
  };

  const openLiabilityForm = (liability?: Liability) => {
    if (liability) {
      setEditingLiability(liability);
      setIsLiabilityFormOpen(true);
    } else {
      setEditingLiability(null);
      setIsLiabilityFormOpen(true);
    }
  };

  const assetInitialData: AssetInput = { name: '', value: 0, type: 'cash' };
  const liabilityInitialData: LiabilityInput = { name: '', value: 0, type: 'credit_card' };

  if (loading) {
    return <NetWorthSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between flex-wrap gap-2"
      >
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-400" aria-hidden="true" />
          Net Worth
        </h3>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => openAssetForm()}>
            <Plus className="w-4 h-4" />
            <span className="hidden @xs:inline ml-1">{'Asset'}</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openLiabilityForm()}>
            <Plus className="w-4 h-4" />
            <span className="hidden @xs:inline ml-1">{'Liability'}</span>
          </Button>
        </div>
      </motion.div>

      <NetWorthHeader
        locale={locale}
        totalAssets={totalAssets}
        totalLiabilities={totalLiabilities}
        netWorth={netWorth}
        isPositive={isPositive}
      />

      {/* Assets Section */}
      <NetWorthSection<Asset>
        title={'Assets'}
        addLabel={'Add'}
        items={assets}
        emptyTitle={'No assets yet'}
        emptyDescription={'Get started by adding your first asset'}
        emptyActionLabel={'Add Asset'}
        onAdd={() => openAssetForm()}
        renderItem={(asset, index) => (
          <AssetItem
            key={asset.id}
            asset={asset}
            locale={locale}
            onEdit={openAssetForm}
            onDelete={removeAsset}
            index={index}
          />
        )}
      />

      {/* Liabilities Section */}
      <div className="pt-4 border-t border-white/10">
        <NetWorthSection<Liability>
          title={'Liabilities'}
          addLabel={'Add'}
          items={liabilities}
          emptyTitle={'No liabilities yet'}
          emptyDescription={'Get started by adding your first liability'}
          emptyActionLabel={'Add Liability'}
          onAdd={() => openLiabilityForm()}
          renderItem={(liability, index) => (
            <LiabilityItem
              key={liability.id}
              liability={liability}
              locale={locale}
              onEdit={openLiabilityForm}
              onDelete={removeLiability}
              index={index}
            />
          )}
        />
      </div>

      {/* Asset Form Modal */}
      <NetWorthForm
        isOpen={isAssetFormOpen}
        onClose={() => { setIsAssetFormOpen(false); setEditingAsset(null); }}
        isEditing={!!editingAsset}
        locale={locale}
        title={editingAsset ? ('Edit Asset') : ('Add Asset')}
        initialData={editingAsset ? { name: editingAsset.name, value: editingAsset.value, type: editingAsset.type } : assetInitialData}
        onSubmit={handleAssetSubmit}
        type="asset"
      />

      {/* Liability Form Modal */}
      <NetWorthForm
        isOpen={isLiabilityFormOpen}
        onClose={() => { setIsLiabilityFormOpen(false); setEditingLiability(null); }}
        isEditing={!!editingLiability}
        locale={locale}
        title={editingLiability ? ('Edit Liability') : ('Add Liability')}
        initialData={editingLiability ? { name: editingLiability.name, value: editingLiability.value, type: editingLiability.type } : liabilityInitialData}
        onSubmit={handleLiabilitySubmit}
        type="liability"
      />
    </motion.div>
  );
}