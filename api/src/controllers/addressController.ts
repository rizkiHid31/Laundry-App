import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const listAddresses = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: req.user.userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({ success: true, data: addresses });
  } catch (error) {
    console.error('listAddresses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch addresses' });
  }
};

export const createAddress = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { label, fullAddress, latitude, longitude } = req.body as {
      label?: string;
      fullAddress?: string;
      latitude?: number;
      longitude?: number;
    };

    if (!label || !fullAddress || latitude == null || longitude == null) {
      return res.status(400).json({ success: false, message: 'Please provide label, full address and coordinates' });
    }

    const existingPrimary = await prisma.address.findFirst({
      where: { userId: req.user.userId, isPrimary: true },
    });

    const address = await prisma.address.create({
      data: {
        userId: req.user.userId,
        label: label.trim(),
        fullAddress: fullAddress.trim(),
        latitude,
        longitude,
        isPrimary: !existingPrimary,
      },
    });

    res.status(201).json({ success: true, message: 'Address created', data: address });
  } catch (error) {
    console.error('createAddress error:', error);
    res.status(500).json({ success: false, message: 'Failed to create address' });
  }
};

export const updateAddress = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Address id is required' });
    }

    const { label, fullAddress, latitude, longitude, isPrimary } = req.body as {
      label?: string;
      fullAddress?: string;
      latitude?: number;
      longitude?: number;
      isPrimary?: boolean;
    };

    const address = await prisma.address.findFirst({ where: { id, userId: req.user.userId } });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const updateData: Record<string, string | number | boolean> = {};
    if (typeof label === 'string' && label.trim()) updateData.label = label.trim();
    if (typeof fullAddress === 'string' && fullAddress.trim()) updateData.fullAddress = fullAddress.trim();
    if (typeof latitude === 'number') updateData.latitude = latitude;
    if (typeof longitude === 'number') updateData.longitude = longitude;

    if (typeof isPrimary === 'boolean') {
      if (isPrimary) {
        await prisma.address.updateMany({
          where: { userId: req.user.userId, isPrimary: true },
          data: { isPrimary: false },
        });
        updateData.isPrimary = true;
      } else {
        updateData.isPrimary = false;
      }
    }

    const updated = await prisma.address.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, message: 'Address updated', data: updated });
  } catch (error) {
    console.error('updateAddress error:', error);
    res.status(500).json({ success: false, message: 'Failed to update address' });
  }
};

export const deleteAddress = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Address id is required' });
    }

    const address = await prisma.address.findFirst({ where: { id, userId: req.user.userId } });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    await prisma.address.delete({ where: { id } });

    if (address.isPrimary) {
      const fallback = await prisma.address.findFirst({
        where: { userId: req.user.userId },
        orderBy: { createdAt: 'desc' },
      });
      if (fallback) {
        await prisma.address.update({
          where: { id: fallback.id },
          data: { isPrimary: true },
        });
      }
    }

    res.json({ success: true, message: 'Address deleted' });
  } catch (error) {
    console.error('deleteAddress error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete address' });
  }
};
