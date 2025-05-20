
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, Text, View, Button } from 'react-native';

import loginImage from '../assets/login.png';

export default function LandingScreen() {
    const router = useRouter();
    return (
        <View>
            <Image source={loginImage}
                style={{
                    width: '100%',
                    height: 480
                }}
            />
            <View style={{
                padding: 20,
            }}>
                <Text style={{
                    fontSize: 35,
                    fontWeight: 'bold',
                    textAlign: 'center'
                }}>Welcome to the Namibia Hockey Union App</Text>

                <Text style={{
                    fontSize: 17,
                    textAlign: 'center',
                    marginTop: 10,
                    color: '#0f5b82',
                }}>The NHU is committed to developing hockey in Namibia for all athletes and hockey enthusiasts on every level</Text>

                <Button text='Get Started'
                    onPress={() => router.push('/(auth)/register')} />

                <Pressable onPress={() => router.push('/(auth)/login')}>
                    <Text style={{
                        fontSize: 16,
                        textAlign: 'center',
                        color: '#0f5b82',
                        marginTop: 7
                    }}>Already have an account? Sign In Here</Text>
                </Pressable>
            </View>
        </View>
    );
}