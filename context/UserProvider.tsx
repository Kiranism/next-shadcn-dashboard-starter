import React, { createContext, useEffect, useState } from 'react';
import Cookies from 'universal-cookie';

import { CurrentUserContextType, IUser } from '../@types/user';

export const UserContext = createContext<CurrentUserContextType | null>(null);

function UserProvider({ children }: { children: React.ReactNode }) {
  const cookies = new Cookies();
  const [user, setUser] = useState<IUser>({
    firstName: '',
    lastName: '',
    email: '',
    userId: '',
    token: '',
    role: '',
    storeId: '',
    storeName: ''
  });
  const [reRender, setReRender] = useState<Boolean>(false);

  useEffect(() => {
    const data = cookies.get('user');
    if (data) {
      setUser(data);
    }
  }, [reRender]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export default UserProvider;
