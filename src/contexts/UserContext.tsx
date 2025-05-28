import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'viewer' | 'editor';
  permissions: {
    canExport: boolean;
    canViewSensitiveData: boolean;
    canEditData: boolean;
  };
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: keyof User['permissions']) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      // Check localStorage for mock session
      const savedUser = localStorage.getItem('retail_insights_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    // Mock authentication - in production, this would call an API
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock user based on email
    let mockUser: User;
    
    if (email === 'admin@retailinsights.ph') {
      mockUser = {
        id: '1',
        email,
        name: 'Admin User',
        role: 'admin',
        permissions: {
          canExport: true,
          canViewSensitiveData: true,
          canEditData: true,
        },
      };
    } else if (email === 'editor@retailinsights.ph') {
      mockUser = {
        id: '2',
        email,
        name: 'Editor User',
        role: 'editor',
        permissions: {
          canExport: true,
          canViewSensitiveData: true,
          canEditData: true,
        },
      };
    } else {
      mockUser = {
        id: '3',
        email,
        name: 'Viewer User',
        role: 'viewer',
        permissions: {
          canExport: false,
          canViewSensitiveData: false,
          canEditData: false,
        },
      };
    }

    // Save to localStorage and state
    localStorage.setItem('retail_insights_user', JSON.stringify(mockUser));
    setUser(mockUser);
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('retail_insights_user');
    setUser(null);
  };

  const hasPermission = (permission: keyof User['permissions']): boolean => {
    return user?.permissions[permission] ?? false;
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    hasPermission,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}