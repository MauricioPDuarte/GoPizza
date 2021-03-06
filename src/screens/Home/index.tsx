import React, { useState, useCallback } from 'react';
import { Alert, TouchableOpacity, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import happyEmoji from '@assets/happy.png';
import { useTheme } from 'styled-components/native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { useAuth } from '@hooks/auth';

import firestore from '@react-native-firebase/firestore';

import { Search } from '@components/Search';
import { ProductCard, ProductProps } from '@components/ProductCard';

import { 
    Container, 
    Header,
    Greeting,
    GreetingEmoji,
    GreetingText,
    Title,
    MenuHeader,
    MenuItemsNumber,
    NewProductButton
} from './styles';

export function Home() {
    const [pizzas, setPizzas] = useState<ProductProps[]>([]);
    const [search, setSearch] = useState('');

    const { singOut, user } = useAuth();
    const { COLORS } = useTheme();
    const navigation = useNavigation();

    useFocusEffect(
        useCallback(() => {
            fetchPizzas('');
    }, []));

    function handleSignOut() {
        singOut();
    }

    function fetchPizzas(value: string) {
        const formattedValue = value.toLocaleLowerCase().trim();

        firestore()
        .collection('pizzas')
        .orderBy('name_insensitive')
        .startAt(formattedValue)
        .endAt(`${formattedValue}\uf8ff`)
        .get()
        .then(response => {
            const data = response.docs.map(doc => {
                return {
                    id: doc.id,
                    ...doc.data()
                }
            }) as ProductProps[];

            setPizzas(data);
        })
        .catch(() => Alert.alert('Consulta', 'Não foi possível realizar a consulta.'));
    }

    function handleSearch() {
        fetchPizzas(search);
    }

    function handleSearchClear() {
        setSearch('');
        fetchPizzas('');
    }

    function handleOpen(id: string) {
        const route = user?.isAdmin ? 'product' : 'order';
        navigation.navigate(route, { id });
    }

    function handleAdd() {
        navigation.navigate('product', {});
    }



    return (
        <Container>
            <Header>
                <Greeting>
                    <GreetingEmoji source={happyEmoji} />
                    <GreetingText>Olá, {user?.name}</GreetingText>
                </Greeting>

                <TouchableOpacity onPress={handleSignOut}>
                    <MaterialIcons name="logout" color={COLORS.TITLE} size={24} />
                </TouchableOpacity>
            </Header>

            <Search 
                onChangeText={setSearch}
                value={search}
                onSearch={handleSearch} 
                onClear={handleSearchClear}
            />

            <MenuHeader>
                <Title>Cardápio</Title>
                <MenuItemsNumber>{ pizzas.length } pizzas</MenuItemsNumber>
            </MenuHeader>

            <FlatList 
                data={pizzas}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <ProductCard 
                        data={item}
                        onPress={() => handleOpen(item.id)}
                    />
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop: 20,
                    paddingBottom: 125,
                    marginHorizontal: 24,
                }}
            />

                {
                    user?.isAdmin && (
                        <NewProductButton
                            title="Cadastrar Pizza"
                            type="secondary"
                            onPress={handleAdd}
                        />
                    )
                }


        </Container>
    );
}

