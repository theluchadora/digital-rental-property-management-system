import { Request, Response } from "express";
import * as photosService from "../services/photosService";
import * as propertiesService from "../services/propertiesService";

export const uploadPhoto = async (req: Request & { user?: { id: string, role: string } }, res: Response) => {
  try {
    const { propertyId, url } = req.body;
    
    if (!propertyId || !url) {
      return res.status(400).json({ error: "propertyId and url are required" });
    }
    
    const property = await propertiesService.getPropertyById(propertyId);
    if (!property) return res.status(404).json({ error: "Property not found" });
    
    if (req.user?.role !== "OWNER" || property.ownerId !== req.user?.id) {
      return res.status(403).json({ error: "Unauthorized to add photos to this property" });
    }
    
    const photo = await photosService.uploadPhoto(propertyId, url);
    res.status(201).json(photo);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getPropertyPhotos = async (req: Request, res: Response) => {
  try {
    const propertyId = req.params.propertyId as string;
    const photos = await photosService.getPhotosByProperty(propertyId);
    res.json(photos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePhoto = async (req: Request & { user?: { id: string, role: string } }, res: Response) => {
  try {
    const photoId = req.params.photoId as string;
    const photo = await photosService.getPhotoById(photoId);
    if (!photo) return res.status(404).json({ error: "Photo not found" });
    
    const property = await propertiesService.getPropertyById(photo.propertyId);
    if (req.user?.role !== "OWNER" || property?.ownerId !== req.user?.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    await photosService.deletePhoto(photoId);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePhoto = async (req: Request & { user?: { id: string, role: string } }, res: Response) => {
  try {
    const photoId = req.params.photoId as string;
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    
    const photo = await photosService.getPhotoById(photoId);
    if (!photo) return res.status(404).json({ error: "Photo not found" });
    
    const property = await propertiesService.getPropertyById(photo.propertyId);
    if (req.user?.role !== "OWNER" || property?.ownerId !== req.user?.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    const updated = await photosService.updatePhoto(photoId, url);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};