import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect
} from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

type AuthContextData = {
    signIn: (email: string, password: string) => Promise<void>;
    isLogging: boolean;
    user: User | null;
    singOut: () => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;

}

type AuthProviderProps = {
    children: ReactNode;
}

type User = {
    id: string;
    name: string;
    isAdmin: boolean;
}

const USER_COLLECTION = '@gopizza:users';

export const AuthContext = createContext({} as AuthContextData);

function AuthProvider({ children }: AuthProviderProps) {
    const [isLogging, setIsLogging] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        loadUserStorageData();
    }, [])

    async function forgotPassword(email: string) {
        if(!email) {
            return Alert.alert('Redefinir senha', 'Informe o e-mail!');
        }

        auth()
        .sendPasswordResetEmail(email)
        .then(() => {
            Alert.alert('Redefinir senha', 'Enviamos um link para seu e-mail para redefinir sua senha!');
        })
        .catch(() => {
            Alert.alert('Redefinir senha', 'Nao foi possivel enviar o email para redefinir a senha!');
        })
    }

    async function singOut() {
        await auth().signOut();
        await AsyncStorage.removeItem(USER_COLLECTION);
        setUser(null);
    }

    async function loadUserStorageData() {
        setIsLogging(true);

        const storedUser = await AsyncStorage.getItem(USER_COLLECTION);

        if (storedUser) {
            const userData = JSON.parse(storedUser) as User;
            setUser(userData);
        }

        setIsLogging(false);
    }

    async function signIn(email: string, password: string) {
        if (!email || !password) {
            return Alert.alert('Login', 'Informe o e-mail e a senha.');
        }

        setIsLogging(true);

        auth()
        .signInWithEmailAndPassword(email, password)
        .then(account => {
            firestore()
            .collection('users')
            .doc(account.user.uid)
            .get()
            .then(async (profile) => {
                const { name, isAdmin } = profile.data() as User;

                if(profile.exists) {
                    const userData = {
                        id: account.user.uid,
                        name,
                        isAdmin
                    };

                    await AsyncStorage.setItem(USER_COLLECTION, JSON.stringify(userData));
                    setUser(userData);
                }
            })
            .catch(() => {
                Alert.alert('Login', 'Nao foi possivel buscar os dados de perfil do usuario.');
            })
        })
        .catch(error => {
            const { code } = error;

            if (code == 'auth/user-not-found' || code == 'auth/wrong-password') {
                return Alert.alert('Login', 'E-mail ou senha invalida!');
            } else {
                return Alert.alert('Login', 'Nao foi possivel realizar o login.');
            }
        })
        .finally(() => {
            setIsLogging(false);
        })

    }

    return (
        <AuthContext.Provider value={{
            signIn,
            singOut,
            isLogging,
            forgotPassword,
            user,
        }}>
            { children }
        </AuthContext.Provider>
    );
}

function useAuth() {
    const context = useContext(AuthContext);

    return context;
}

export { AuthProvider, useAuth }
