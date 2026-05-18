import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import usersService from "../services/usersService";


export const register = async (req: Request, res: Response) => {
  try {
    const user = await usersService.registerUser(req.body);
    console.log("Registered user:", user);
    const token = jwt.sign({ id: (user as any).id, role: (user as any).role }, process.env.JWT_SECRET as string, {
      expiresIn: "1d",
    });

    (res as any).cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    }); 
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ "Registration failed": err.message || "Failed to register user" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await usersService.authenticate(email, password);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: (user as any).id, role: (user as any).role }, process.env.JWT_SECRET as string, {
      expiresIn: "1d",
    });

    (res as any).cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({ message: "Login successful", user });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Login failed" });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const id = req.user?.id;
    if (!id) return res.status(401).json({ error: "Unauthorized" });

    const user = await usersService.getUser(id);
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch user" });
  }
};

export const list = async (_req: Request, res: Response) => {
  try {
    const users = await usersService.listUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to list users" });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const user = await usersService.getUser(req.params.id as string);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get user" });
  }
};

export const update = async (req: Request & { user?: { id?: string } }, res: Response) => {
  try {
    const updated = await usersService.updateUser(req.user?.id as string, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Update failed" });
  }
};

export const remove = async (req: Request & { user?: { id?: string } }, res: Response) => {
  try {
    const deleted = await usersService.removeUser(req.user?.id as string);
    res.json(deleted);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Delete failed" });
  }
};

export const search = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || "";
    const results = await usersService.searchUsers(q);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Search failed" });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.json({ message: "Logged out successfully" });
};