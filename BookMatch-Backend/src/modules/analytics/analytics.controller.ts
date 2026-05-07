import type { Request, Response } from 'express';
import { getDashboardAnalytics, getTrafficAnalytics } from './analytics.service.js';

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const data = await getDashboardAnalytics();
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ message: 'Error retrieving analytics data', error: error.message });
  }
};

export const getTraffic = async (req: Request, res: Response) => {
  try {
    const data = await getTrafficAnalytics();
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching traffic analytics:', error);
    res.status(500).json({ message: 'Error retrieving traffic analytics data', error: error.message });
  }
};
