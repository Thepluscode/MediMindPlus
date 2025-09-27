import { User } from '../models/User';
import { AppDataSource } from '../config/data-source';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

export const createTestUser = async (userData: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}) => {
  const userRepository = AppDataSource.getRepository(User);
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);
  
  // Create and save user
  const user = userRepository.create({
    email: userData.email,
    password: hashedPassword,
    firstName: userData.firstName || 'Test',
    lastName: userData.lastName || 'User',
    isEmailVerified: true,
  });
  
  await userRepository.save(user);
  
  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '1h' }
  );
  
  return { user, token };
};

export const getAuthToken = (userId: string, email: string) => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '1h' }
  );
};

export const clearDatabase = async () => {
  const entities = AppDataSource.entityMetadatas;
  
  for (const entity of entities) {
    const repository = AppDataSource.getRepository(entity.name);
    await repository.query(`DELETE FROM ${entity.tableName} CASCADE;`);
  }
};

export const closeTestConnection = async () => {
  await AppDataSource.destroy();
};
