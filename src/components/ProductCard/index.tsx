import React from 'react';
import { TouchableOpacityProps } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';

import {
    Container,
    Content,
    Identification,
    Description,
    Details,
    Image,
    Line,
    Name,
} from './styles';

export type ProductProps = {
    id: string;
    photo_url: string;
    name: string;
    description: string;
}

type Props = TouchableOpacityProps & {
    data: ProductProps;
}

export function ProductCard({data, ...rest}: Props) {
    const { COLORS } = useTheme();

    return (
        <Container>
            <Content {...rest}>
                <Image source={{ uri: data.photo_url }} />

                <Details>
                    <Identification>
                        <Name>{data.name}</Name>
                        <Feather name="chevron-right" size={18} color={COLORS.SHAPE} />
                    </Identification>

                    <Description>{data.description}</Description>
                </Details>
            </Content>

            <Line />
        </Container>
    );
}