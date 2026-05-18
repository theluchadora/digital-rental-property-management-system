
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { User as DbUser } from "@prisma/client";
import * as usersRepo from "../repositories/usersRepository";

const SALT_ROUNDS = 10;

type SafeUser = Omit<DbUser, "passwordHash">;

const sanitize = (user: DbUser): SafeUser => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { passwordHash, ...rest } = user as any;
	return rest as SafeUser;
};

export const registerUser = async (
	input: Prisma.UserCreateInput
): Promise<SafeUser> => {
	const { password, ...userData } = input as any;
	const existing = await usersRepo.getUserByEmail(userData.email);
	if (existing) throw new Error("Email already in use");

	const plain = password as string;
	const hash = await bcrypt.hash(plain, SALT_ROUNDS);

	const user = await usersRepo.createUser({
		...userData,
		passwordHash: hash,
	} as Prisma.UserCreateInput);

	return sanitize(user);
};

export const authenticate = async (
	email: string,
	password: string
): Promise<SafeUser | null> => {
	const user = await usersRepo.getUserByEmail(email);
	if (!user) return null;

	const ok = await bcrypt.compare(password, user.passwordHash);
	if (!ok) return null;

	return sanitize(user);
};

export const getUser = async (id: string): Promise<SafeUser | null> => {
	const user = await usersRepo.getUserById(id);
	return user ? sanitize(user) : null;
};

export const listUsers = async (): Promise<SafeUser[]> => {
	const users = await usersRepo.getAllUsers();
	return users.map(sanitize);
};

export const updateUser = async (
	id: string,
	data: Prisma.UserUpdateInput
): Promise<SafeUser> => {
	// prevent updating password via this method (use dedicated flow)
	if ((data as any).password) delete (data as any).password;

	const updated = await usersRepo.updateUser(id, data);
	return sanitize(updated);
};

export const removeUser = async (id: string): Promise<SafeUser> => {
	const deleted = await usersRepo.deleteUser(id);
	return sanitize(deleted);
};

export const searchUsers = async (query: string): Promise<SafeUser[]> => {
	const users = await usersRepo.searchUsers(query);
	return users.map(sanitize);
};

export default {
	registerUser,
	authenticate,
	getUser,
	listUsers,
	updateUser,
	removeUser,
	searchUsers,
};

