import React, { useState, useEffect } from 'react';
import { Platform, TouchableOpacity, ScrollView, Alert, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { useNavigation, useRoute } from '@react-navigation/native';
import { ProductNavigationProps } from '../../@types/navigation';

import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

import { ButtonBack } from '@components/ButtonBack';
import { Photo } from '@components/Photo';
import { InputPrice } from '@components/InputPrice';
import { Input } from '@components/Input';
import { Button } from '@components/Button';
import { ProductProps } from '@components/ProductCard';

import { 
    Container,
    Header, 
    Title, 
    DeleteLabel,
    Upload,
    PickImageButton,
    Form,
    Label,
    InputGroup,
    InputGroupHeader,
    MaxCharacters
} from './styles';

type PizzaResponse = ProductProps & {
    photo_path: string;
    prices_sizes: {
        p: string;
        m: string;
        g: string;
    }
}

export function Product() {
    const [image, setImage] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [priceSizeP, setPriceSizeP] = useState('');
    const [priceSizeM, setPriceSizeM] = useState('');
    const [priceSizeG, setPriceSizeG] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [photoPath, setPhotoPath] = useState('');
    
    const navigation = useNavigation();
    const route = useRoute();
    const { id } = route.params as ProductNavigationProps;

    useEffect(() => {
        if (id) {
            firestore()
            .collection('pizzas')
            .doc(id)
            .get()
            .then(response => {
                const product = response.data() as PizzaResponse;

                setName(product.name);
                setImage(product.photo_url)
                setDescription(product.description);
                setPriceSizeP(product.prices_sizes.p)
                setPriceSizeM(product.prices_sizes.m)
                setPriceSizeG(product.prices_sizes.g)
                setPhotoPath(product.photo_path);
            })
            .catch(() => {

            })
        }
    }, [id]);

    async function handlePickerImage() {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if(status === 'granted') {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                aspect: [4, 4]
            });

            if(!result.cancelled) {
                setImage(result.uri);
            }
        }
    }

    async function handleAdd() {
        if (!name.trim()){
            return Alert.alert('Cadastro', 'Informe o nome da pizza.');
        }

        if (!description.trim()){
            return Alert.alert('Cadastro', 'Informe a descri????o da pizza.');
        }

        if(!image){
            return Alert.alert('Cadastro', 'Selecione a imagem da pizza.');
        }

        if (!priceSizeP || !priceSizeM || !priceSizeG){
            return Alert.alert('Cadastro', 'Informe o pre??o de todos os tamanhos da pizza');
        }
        
        setIsLoading(true);

        const fileName = new Date().getTime();
        const reference = storage().ref(`/pizzas/${fileName}.png`);
        
        await reference.putFile(image);
        const photo_url = await reference.getDownloadURL();

        firestore()
        .collection('pizzas')
        .add({
            name,
            name_insensitive: name.toLowerCase().trim(),
            description,
            prices_sizes: {
                p: priceSizeP,
                m: priceSizeM,
                g: priceSizeG
            },
            photo_url,
            photo_path: reference.fullPath
        })
        .then(() => navigation.navigate('home'))
        .catch(() => {
            setIsLoading(false);
            Alert.alert('Cadastro', 'N??o foi poss??vel cadastrar a pizza.');
        });     
    }

    function handleGoBack() {
        navigation.goBack();
    }

    function handleDelete() {
        firestore()
        .collection('pizzas')
        .doc(id)
        .delete()
        .then(() => {
            storage()
            .ref(photoPath)
            .delete()
            .then(() => navigation.navigate('home'))
            .catch(() => Alert.alert('Cadastro', 'N??o foi poss??vel deletar a foto da pizza.'))
        })
        .catch(() => Alert.alert('Cadastro', 'N??o foi poss??vel deletar a pizza.'))
    }

    return (
        <Container behavior={Platform.OS == 'ios' ? 'padding' : undefined}>
            <ScrollView showsVerticalScrollIndicator={false} >
                <Header>
                    <ButtonBack onPress={handleGoBack}/>
                    <Title>Cadastrar</Title>
                    {
                        id ? 
                        <TouchableOpacity onPress={handleDelete}>
                            <DeleteLabel>Deletar</DeleteLabel>
                        </TouchableOpacity>
                        : <View style={{ width: 20 }}/>
                    }

                </Header>
                
                <Upload>
                    <Photo uri={image} />

                    {
                        !id &&
                        <PickImageButton 
                            title="Carregar" 
                            type="secondary"
                            onPress={handlePickerImage}
                        />
                    }

                </Upload>

                <Form>
                    <InputGroup>
                        <Label>Nome</Label>
                        <Input 
                            onChangeText={setName}
                            value={name}
                        />
                    </InputGroup>

                    <InputGroup>
                        <InputGroupHeader>
                            <Label>Descri????o</Label>
                            <MaxCharacters>0 de 60 caracteres</MaxCharacters>
                        </InputGroupHeader>

                        <Input 
                            multiline
                            maxLength={60}
                            style={{ height: 80 }}
                            onChangeText={setDescription}
                            value={description}
                        />
                    </InputGroup>

                    <InputGroup>
                        <Label>Tamanhos e pre??os</Label>

                        <InputPrice 
                            size="P"
                            onChangeText={setPriceSizeP}
                            value={priceSizeP}
                        />

                        <InputPrice 
                            size="M"
                            onChangeText={setPriceSizeM}
                            value={priceSizeM}
                        />

                        <InputPrice 
                            size="G"
                            onChangeText={setPriceSizeG}
                            value={priceSizeG}
                        />
                    </InputGroup>

                    {   
                        !id &&
                        <Button 
                            title="Cadastrar Pizza"
                            isLoading={isLoading}
                            onPress={handleAdd}
                        />
                    }
                </Form>
            </ScrollView>
        </Container>
    );
}