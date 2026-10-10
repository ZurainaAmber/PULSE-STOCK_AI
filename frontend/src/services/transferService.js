import { apiClient } from '../api/client';

export async function fetchTransfers(direction = 'all') {
  return apiClient('/transfers', {
    params: direction !== 'all' ? { direction } : {},
  });
}

export async function fetchDonorsForSku(skuId) {
  return apiClient('/transfers/donors-for-sku', {
    params: { sku_id: skuId },
  });
}

export async function createTransferRequest({ to_store_id, sku_id, requested_quantity, notes }) {
  return apiClient('/transfers', {
    method: 'POST',
    body: {
      to_store_id,
      sku_id,
      requested_quantity: Number(requested_quantity),
      notes: notes || undefined,
    },
  });
}

export async function respondToTransfer(transferId, { action, approved_quantity, rejection_reason, notes }) {
  return apiClient(`/transfers/${transferId}/respond`, {
    method: 'POST',
    body: {
      action,
      approved_quantity: approved_quantity !== undefined ? Number(approved_quantity) : undefined,
      rejection_reason: rejection_reason || undefined,
      notes: notes || undefined,
    },
  });
}

export async function dispatchTransfer(transferId) {
  return apiClient(`/transfers/${transferId}/dispatch`, {
    method: 'POST',
    body: {},
  });
}

export async function receiveTransfer(transferId) {
  return apiClient(`/transfers/${transferId}/receive`, {
    method: 'POST',
    body: {},
  });
}
