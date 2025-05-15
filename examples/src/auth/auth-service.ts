// Mock authentication service for example purposes

interface User {
  userId: string;
  email: string;
  name: string;
  password: string;
}

interface RegisterUserParams {
  email: string;
  password: string;
  name: string;
}

interface LoginUserParams {
  email: string;
  password: string;
}

interface LoginResult {
  token: string;
  userId: string;
}

// In-memory user database for example
const users: User[] = [];

/**
 * Registers a new user
 */
export async function registerUser(params: RegisterUserParams): Promise<Omit<User, 'password'>> {
  // Check if user already exists
  if (users.some(user => user.email === params.email)) {
    throw new Error('User with this email already exists');
  }
  
  // Validate email
  if (!validateEmail(params.email)) {
    throw new Error('Invalid email format');
  }
  
  // Create new user
  const newUser: User = {
    userId: `user-${Date.now()}`,
    email: params.email,
    name: params.name,
    password: params.password // In a real implementation, this would be hashed
  };
  
  users.push(newUser);
  
  // Return user data without password
  const { password, ...userData } = newUser;
  return userData;
}

/**
 * Validates an email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Authenticates a user
 */
export async function loginUser(params: LoginUserParams): Promise<LoginResult> {
  // Find user
  const user = users.find(u => u.email === params.email);
  
  // Check if user exists and password is correct
  if (!user || user.password !== params.password) {
    throw new Error('Invalid credentials');
  }
  
  // Generate a token (just a mock for example purposes)
  const token = `token-${Date.now()}`;
  
  return {
    token,
    userId: user.userId
  };
}