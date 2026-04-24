import type { Request, Response } from 'express';
import { getInventoryAnalytics } from './analytics.service.js';

export const getInventory = async (req: Request, res: Response) => {
  try {
    const data = await getInventoryAnalytics();
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching inventory analytics:', error);
    res.status(500).json({ message: 'Error retrieving analytics data', error: error.message });
  }
};
