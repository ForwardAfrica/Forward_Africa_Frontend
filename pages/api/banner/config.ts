import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

// Banner configuration file path
const CONFIG_FILE = path.join(process.cwd(), 'data', 'banner-config.json');

// Default banner configuration
const DEFAULT_CONFIG = {
  homepage_banner_enabled: false,
  homepage_banner_type: 'course',
  homepage_banner_video_url: null,
  homepage_banner_image_url: null,
  homepage_banner_title: null,
  homepage_banner_subtitle: null,
  homepage_banner_description: null,
  homepage_banner_button_text: 'Get Started',
  homepage_banner_button_url: null,
  homepage_banner_overlay_opacity: 0.70
};

// Ensure data directory exists
const ensureDataDir = async () => {
  const dataDir = path.dirname(CONFIG_FILE);
  try {
    await fsPromises.access(dataDir);
  } catch {
    await fsPromises.mkdir(dataDir, { recursive: true });
  }
};

// Load banner configuration
const loadConfig = async () => {
  try {
    await ensureDataDir();
    const configData = await fsPromises.readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    // If file doesn't exist or is invalid, return default config
    console.log('No existing config found, using defaults');
    return DEFAULT_CONFIG;
  }
};

// Save banner configuration
const saveConfig = async (config: any) => {
  await ensureDataDir();
  await fsPromises.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Get banner configuration
      const config = await loadConfig();
      res.status(200).json(config);
    } else if (req.method === 'PUT') {
      // Update banner configuration
      const updatedConfig = req.body;

      // Validate the configuration
      if (!updatedConfig || typeof updatedConfig !== 'object') {
        return res.status(400).json({ error: 'Invalid configuration data' });
      }

      // Merge with existing config to preserve any missing fields
      const currentConfig = await loadConfig();
      const mergedConfig = { ...currentConfig, ...updatedConfig };

      // Save the updated configuration
      await saveConfig(mergedConfig);

      console.log('✅ Banner configuration updated successfully');
      res.status(200).json({
        success: true,
        message: 'Banner configuration saved successfully!',
        config: mergedConfig
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Banner config error:', error);

    let errorMessage = 'Configuration operation failed';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    res.status(500).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}